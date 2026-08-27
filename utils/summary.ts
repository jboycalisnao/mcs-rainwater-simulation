import { MONTH_NAMES } from '../constants';
import { MonthlySummary, RainfallDataRow, SummaryData } from '../types';

export const getSimulationYearCount = (data: RainfallDataRow[]): number => {
  const years = new Set(data.map(entry => entry.synthetic_year));
  return Math.max(1, years.size);
};

export const summarizeRainfallSeries = (
  rainfallData: (RainfallDataRow & { inflow_liters?: number })[],
): SummaryData => {
  const simulationYears = getSimulationYearCount(rainfallData);
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: MONTH_NAMES[index],
    rain: 0,
    inflow: 0,
    wetDays: 0,
    count: 0,
  }));
  const weekly = new Map<number, { rain: number; inflow: number; count: number }>();

  rainfallData.forEach(day => {
    const monthBucket = monthly[day.month - 1];
    monthBucket.rain += day.rain_mm;
    monthBucket.inflow += day.inflow_liters ?? 0;
    monthBucket.count += 1;
    if (day.wet) monthBucket.wetDays += 1;

    const weekOfYear = Math.ceil(day.day_of_year / 7);
    const weekBucket = weekly.get(weekOfYear) ?? { rain: 0, inflow: 0, count: 0 };
    weekBucket.rain += day.rain_mm;
    weekBucket.inflow += day.inflow_liters ?? 0;
    weekBucket.count += 1;
    weekly.set(weekOfYear, weekBucket);
  });

  const monthlySummary: MonthlySummary[] = monthly.map(bucket => ({
    month: bucket.month,
    avgRain: Number((bucket.rain / simulationYears).toFixed(2)),
    avgInflow: Number((bucket.inflow / simulationYears).toFixed(2)),
    wetFrequency: bucket.count > 0 ? Number(((bucket.wetDays / bucket.count) * 100).toFixed(1)) : 0,
    count: bucket.count,
  }));

  return {
    monthly: monthlySummary,
    weekly: Array.from(weekly.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, bucket]) => ({
        week: week.toString(),
        avgRain: Number((bucket.rain / simulationYears).toFixed(2)),
        avgInflow: Number((bucket.inflow / simulationYears).toFixed(2)),
      })),
    annualInflow: Number((monthlySummary.reduce((sum, month) => sum + month.avgInflow, 0)).toFixed(2)),
    annualRain: Number((monthlySummary.reduce((sum, month) => sum + (month.avgRain ?? 0), 0)).toFixed(2)),
    simulationYears,
  };
};
