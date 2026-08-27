import { DEFAULT_MONTHLY_PARAMS, MIN_TRANSITIONS_FOR_CALIBRATION, MIN_WET_DAYS_FOR_CALIBRATION, WET_DAY_THRESHOLD_MM } from '../../constants';
import { IntensityAnalyzer } from '../../services/analysis/IntensityAnalyzer';
import { TransitionAnalyzer } from '../../services/analysis/TransitionAnalyzer';
import {
  CalibrationMonthlyDiagnostic,
  CalibrationResult,
  CalibrationWarning,
  MonthlyCoverageStats,
  MonthlyParameters,
  ParsedHistoricalRecord,
  RainfallDataRow,
} from '../../types';
import { parseHistoricalCsv } from './csv';
import { RainfallEngine } from '../../services/rainfallEngine';

const getMonth = (isoDate: string) => Number.parseInt(isoDate.slice(5, 7), 10);

const daysBetween = (left: number, right: number) => Math.round((right - left) / 86400000);

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
};

const buildCoverage = (records: ParsedHistoricalRecord[]): { monthly: MonthlyCoverageStats[]; missingDays: number; } => {
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    observedDays: 0,
    expectedDays: 0,
    missingDays: 0,
    wetDays: 0,
    dryDays: 0,
  }));

  const monthMap = new Map<number, MonthlyCoverageStats>(monthly.map(entry => [entry.month, entry]));
  let missingDays = 0;

  records.forEach(record => {
    const month = getMonth(record.isoDate);
    const bucket = monthMap.get(month)!;
    bucket.observedDays += 1;
    if (record.rain_mm >= WET_DAY_THRESHOLD_MM) bucket.wetDays += 1;
    else bucket.dryDays += 1;
  });

  for (let index = 0; index < records.length; index += 1) {
    const current = records[index];
    const month = getMonth(current.isoDate);
    const bucket = monthMap.get(month)!;
    bucket.expectedDays += 1;

    if (index === records.length - 1) continue;
    const next = records[index + 1];
    const gap = daysBetween(current.timestamp, next.timestamp);
    if (gap > 1) {
      missingDays += gap - 1;
      bucket.missingDays += gap - 1;
      bucket.expectedDays += gap - 1;
    }
  }

  return { monthly, missingDays };
};

const average = (values: number[]) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const getGeneratedDayIndex = (record: RainfallDataRow) => (
  (record.synthetic_year * 400) + record.day_of_year
);

export const buildMonthlySpellMeans = (
  records: { month: number; wet: boolean; order: number }[],
) => {
  const spells = Array.from({ length: 12 }, () => ({ wet: [] as number[], dry: [] as number[] }));
  if (records.length === 0) return spells.map(entry => ({ wet: 0, dry: 0 }));

  const sorted = [...records].sort((a, b) => a.order - b.order);
  let currentWet = sorted[0].wet;
  let currentLength = 1;
  let currentMonths = new Set<number>([sorted[0].month]);

  const commitSpell = () => {
    currentMonths.forEach(month => {
      const bucket = spells[month - 1];
      if (currentWet) bucket.wet.push(currentLength);
      else bucket.dry.push(currentLength);
    });
  };

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const contiguous = next.order - current.order === 1;

    if (contiguous && next.wet === currentWet) {
      currentLength += 1;
      currentMonths.add(next.month);
      continue;
    }

    commitSpell();
    currentWet = next.wet;
    currentLength = 1;
    currentMonths = new Set<number>([next.month]);
  }

  commitSpell();

  return spells.map(entry => ({
    wet: average(entry.wet),
    dry: average(entry.dry),
  }));
};

const smoothParameter = (month: number, source: Partial<MonthlyParameters>[], key: keyof MonthlyParameters): number | undefined => {
  const prev = source.find(entry => entry.month === (month === 1 ? 12 : month - 1))?.[key];
  const next = source.find(entry => entry.month === (month === 12 ? 1 : month + 1))?.[key];
  const neighbors = [prev, next].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return neighbors.length > 0 ? average(neighbors) : undefined;
};

const compareHistoricalToGenerated = (records: ParsedHistoricalRecord[], params: MonthlyParameters[]) => {
  const generated = RainfallEngine.generate(params, Math.max(3, Math.ceil(records.length / 365)), 9173);
  const historicalMonthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, rain: [] as number[], wet: 0, total: 0 }));
  const generatedMonthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, rain: [] as number[], wet: 0, total: 0 }));

  records.forEach(record => {
    const bucket = historicalMonthly[getMonth(record.isoDate) - 1];
    bucket.total += 1;
    if (record.rain_mm >= WET_DAY_THRESHOLD_MM) {
      bucket.wet += 1;
      bucket.rain.push(record.rain_mm);
    }
  });

  generated.forEach(record => {
    const bucket = generatedMonthly[record.month - 1];
    bucket.total += 1;
    if (record.rain_mm >= WET_DAY_THRESHOLD_MM) {
      bucket.wet += 1;
      bucket.rain.push(record.rain_mm);
    }
  });

  const meanRainMae = average(historicalMonthly.map((bucket, index) => {
    const left = bucket.rain.length > 0 ? average(bucket.rain) : 0;
    const right = generatedMonthly[index].rain.length > 0 ? average(generatedMonthly[index].rain) : 0;
    return Math.abs(left - right);
  }));

  const wetFrequencyMae = average(historicalMonthly.map((bucket, index) => {
    const left = bucket.total > 0 ? bucket.wet / bucket.total : 0;
    const right = generatedMonthly[index].total > 0 ? generatedMonthly[index].wet / generatedMonthly[index].total : 0;
    return Math.abs(left - right) * 100;
  }));

  const historicalSpellMeans = buildMonthlySpellMeans(records.map(record => ({
    month: getMonth(record.isoDate),
    wet: record.rain_mm >= WET_DAY_THRESHOLD_MM,
    order: Math.floor(record.timestamp / 86400000),
  })));
  const generatedSpellMeans = buildMonthlySpellMeans(generated.map(record => ({
    month: record.month,
    wet: record.wet,
    order: getGeneratedDayIndex(record),
  })));
  const spellLengthMae = average(historicalSpellMeans.map((historical, index) => {
    const generatedMonth = generatedSpellMeans[index];
    const errors = [
      historical.wet > 0 ? Math.abs(historical.wet - generatedMonth.wet) : undefined,
      historical.dry > 0 ? Math.abs(historical.dry - generatedMonth.dry) : undefined,
    ].filter((value): value is number => typeof value === 'number');
    return errors.length > 0 ? average(errors) : 0;
  }));

  const normalized = Math.max(0, 100 - (meanRainMae * 3 + wetFrequencyMae * 1.5 + spellLengthMae * 8));
  return {
    meanRainMae: Number(meanRainMae.toFixed(2)),
    wetFrequencyMae: Number(wetFrequencyMae.toFixed(2)),
    spellLengthMae: Number(spellLengthMae.toFixed(2)),
    overallScore: Number(normalized.toFixed(1)),
  };
};

export const calibrateHistoricalRainfall = (csvText: string): CalibrationResult => {
  const parsed = parseHistoricalCsv(csvText);
  const records = parsed.records;

  if (records.length === 0) {
    throw new Error('CSV does not contain valid historical records.');
  }

  const warnings: CalibrationWarning[] = [...parsed.warnings];
  const transitions = TransitionAnalyzer.analyze(records);
  const intensities = IntensityAnalyzer.analyze(records);
  const coverageResult = buildCoverage(records);

  if (coverageResult.missingDays > 0) {
    warnings.push({
      code: 'MISSING_DAYS',
      message: `${coverageResult.missingDays} missing daily records were detected. Transition calibration used only contiguous days.`,
    });
  }

  const parameters: MonthlyParameters[] = DEFAULT_MONTHLY_PARAMS.map(defaultMonth => {
    const month = defaultMonth.month;
    const transition = transitions.find(entry => entry.month === month) ?? {};
    const intensity = intensities.find(entry => entry.month === month) ?? {};
    const coverage = coverageResult.monthly.find(entry => entry.month === month)!;
    const observedTransitions = ((transition.p01 ?? 0) > 0 || (transition.p11 ?? 0) > 0)
      ? coverage.observedDays - 1 - coverage.missingDays
      : 0;

    let source: CalibrationMonthlyDiagnostic['source'] = 'historical';
    const smoothed: Partial<MonthlyParameters> = {};

    if (coverage.wetDays < MIN_WET_DAYS_FOR_CALIBRATION) {
      source = 'default';
      warnings.push({
        code: 'SPARSE_MONTH',
        month,
        message: `Month ${month} had only ${coverage.wetDays} wet day(s); intensity fell back to conservative defaults.`,
      });
    }

    if (coverage.observedDays < 20 || observedTransitions < MIN_TRANSITIONS_FOR_CALIBRATION) {
      source = 'default';
      warnings.push({
        code: 'FALLBACK_DEFAULT',
        month,
        message: `Month ${month} had weak transition support; default transition parameters were retained.`,
      });
    }

    if (source === 'historical' && coverage.missingDays > 0) {
      source = 'smoothed';
      smoothed.p01 = smoothParameter(month, transitions, 'p01') ?? transition.p01;
      smoothed.p11 = smoothParameter(month, transitions, 'p11') ?? transition.p11;
      smoothed.meanRain = smoothParameter(month, intensities, 'meanRain') ?? intensity.meanRain;
      smoothed.stdDev = smoothParameter(month, intensities, 'stdDev') ?? intensity.stdDev;
      smoothed.meanDrySpell = smoothParameter(month, transitions, 'meanDrySpell') ?? transition.meanDrySpell;
      smoothed.meanWetSpell = smoothParameter(month, transitions, 'meanWetSpell') ?? transition.meanWetSpell;
      warnings.push({
        code: 'FALLBACK_SMOOTHED',
        month,
        message: `Month ${month} crossed missing-data gaps; neighboring months were blended to keep estimates conservative.`,
      });
    }

    const selected = source === 'default'
      ? defaultMonth
      : {
          ...defaultMonth,
          ...transition,
          ...intensity,
          ...smoothed,
        };

    const p01 = Number(Math.min(0.98, Math.max(0.02, selected.p01 ?? defaultMonth.p01)).toFixed(3));
    const p11 = Number(Math.min(0.98, Math.max(0.02, selected.p11 ?? defaultMonth.p11)).toFixed(3));
    const meanWetSpell = Number(Math.max(1, selected.meanWetSpell ?? selected.avgWetSpell ?? defaultMonth.meanWetSpell ?? 1).toFixed(2));
    const meanDrySpell = Number(Math.max(1, selected.meanDrySpell ?? selected.avgDrySpell ?? defaultMonth.meanDrySpell ?? 1).toFixed(2));
    const stdDev = Number(Math.max(0.1, selected.stdDev ?? defaultMonth.stdDev).toFixed(2));
    const meanRain = Number(Math.max(0.1, selected.meanRain ?? defaultMonth.meanRain).toFixed(2));
    const gammaTheta = Number(Math.max(0.05, selected.gamma_theta ?? defaultMonth.gamma_theta ?? (stdDev ** 2 / Math.max(meanRain, 0.1))).toFixed(3));
    const gammaK = Number(Math.max(0.1, selected.gamma_k ?? defaultMonth.gamma_k ?? ((meanRain * meanRain) / Math.max(stdDev ** 2, 0.05))).toFixed(3));

    return {
      month,
      p01,
      p11,
      meanRain,
      stdDev,
      gamma_k: gammaK,
      gamma_theta: gammaTheta,
      meanDrySpell,
      varDrySpell: Number(Math.max(1, selected.varDrySpell ?? defaultMonth.varDrySpell ?? meanDrySpell).toFixed(2)),
      meanWetSpell,
      varWetSpell: Number(Math.max(1, selected.varWetSpell ?? defaultMonth.varWetSpell ?? meanWetSpell).toFixed(2)),
      avgDrySpell: meanDrySpell,
      avgWetSpell: meanWetSpell,
    };
  });

  const fit = compareHistoricalToGenerated(records, parameters);
  if (fit.overallScore < 70) {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      message: `Validation fit is ${fit.overallScore.toFixed(1)}/100. The generated ensemble should be treated as conservative guidance, not a precise forecast.`,
    });
  }

  const monthlyDiagnostics: CalibrationMonthlyDiagnostic[] = parameters.map(parameter => {
    const coverage = coverageResult.monthly.find(entry => entry.month === parameter.month)!;
    const fallbackWarning = warnings.find(entry => entry.month === parameter.month && (entry.code === 'FALLBACK_DEFAULT' || entry.code === 'FALLBACK_SMOOTHED'));
    return {
      month: parameter.month,
      source: fallbackWarning?.code === 'FALLBACK_DEFAULT' ? 'default' : fallbackWarning?.code === 'FALLBACK_SMOOTHED' ? 'smoothed' : 'historical',
      observedWetDays: coverage.wetDays,
      observedTransitions: Math.max(0, coverage.observedDays - 1 - coverage.missingDays),
      observedDays: coverage.observedDays,
      expectedDays: coverage.expectedDays,
      missingDays: coverage.missingDays,
      fitScore: Math.max(0, Number((fit.overallScore - percentile([coverage.wetDays, coverage.observedDays, 100], 0.2) * 0.2).toFixed(1))),
    };
  });

  return {
    parameters,
    warnings,
    coverage: {
      totalObservedDays: records.length,
      totalMissingDays: coverageResult.missingDays,
      duplicateDays: parsed.warnings.filter(entry => entry.code === 'DUPLICATE_DATE').length,
      dateRange: records.length > 0 ? { start: records[0].isoDate, end: records[records.length - 1].isoDate } : null,
      monthly: coverageResult.monthly,
    },
    fit,
    monthlyDiagnostics,
    sourceRecordCount: records.length,
  };
};
