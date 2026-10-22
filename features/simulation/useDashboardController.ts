import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { DEFAULT_BUILDINGS, DEFAULT_ENSEMBLE_RUNS, DEFAULT_MONTHLY_PARAMS, MONTH_NAMES } from '../../constants';
import { useRainwaterAnalysis } from '../../hooks/useRainwaterAnalysis';
import { useSimulationPlayback } from '../../hooks/useSimulationPlayback';
import { RainfallEngine } from '../../services/rainfallEngine';
import { WaterBalanceEngine } from '../../services/waterBalanceEngine';
import { buildSimulationReport, downloadPdfReport } from '../../utils/reporting';
import { summarizeRainfallSeries } from '../../utils/summary';
import { parseDecimalInput, parseIntegerInput } from '../../utils/input';
import {
  CalibrationResult,
  InflowConfig,
  MonthlyParameters,
  RainfallDataRow,
  ReliabilityIntervalResult,
  ReportCoverDetails,
  SimulationReportJSON,
  SummaryData,
} from '../../types';

export interface DemandConfig {
  handWashingAreas: number;
  faucetsPerArea: number;
  litersPerFaucetDay: number;
  comfortRooms: number;
  toiletsPerRoom: number;
  litersPerToiletDay: number;
  populationServed: number;
}

export const useDashboardController = () => {
  const [viewMode, setViewMode] = useState<'live' | 'report'>('live');
  const [sidebarTab, setSidebarTab] = useState<'calibrate' | 'compare'>('calibrate');
  const [reportData, setReportData] = useState<SimulationReportJSON | null>(null);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [activeParams, setActiveParams] = useState<MonthlyParameters[]>(DEFAULT_MONTHLY_PARAMS);
  const [genYears, setGenYears] = useState(10);
  const [genSeed, setGenSeed] = useState(() => Math.floor(Math.random() * 900000) + 100000);
  const [rainfallEnsemble, setRainfallEnsemble] = useState<RainfallDataRow[][]>([]);
  const [rainfallData, setRainfallData] = useState<RainfallDataRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inflowConfig, setInflowConfig] = useState<InflowConfig>({
    buildings: DEFAULT_BUILDINGS,
    runoffCoefficient: 0.85,
    gutterEfficiency: 0.9,
    firstFlushLoss: 0.5,
  });
  const [analysisScope, setAnalysisScope] = useState<'school' | string>('school');
  const [demandConfig, setDemandConfig] = useState<DemandConfig>({
    handWashingAreas: 4,
    faucetsPerArea: 5,
    litersPerFaucetDay: 25,
    comfortRooms: 4,
    toiletsPerRoom: 2,
    litersPerToiletDay: 62.5,
    populationServed: 450,
  });
  const [selectedTankSize, setSelectedTankSize] = useState(10000);

  const totalClassrooms = useMemo(
    () => inflowConfig.buildings.reduce((sum, building) => sum + building.numberOfClassrooms, 0),
    [inflowConfig.buildings],
  );

  const filteredInflowConfig = useMemo(
    () => analysisScope === 'school'
      ? inflowConfig
      : { ...inflowConfig, buildings: inflowConfig.buildings.filter(building => building.id === analysisScope) },
    [analysisScope, inflowConfig],
  );

  const totalRoofArea = useMemo(
    () => filteredInflowConfig.buildings.reduce((sum, building) => sum + (building.numberOfClassrooms * building.roofAreaPerClassroom), 0),
    [filteredInflowConfig],
  );

  const aggregateDailyDemand = useMemo(
    () => (demandConfig.handWashingAreas * demandConfig.faucetsPerArea * demandConfig.litersPerFaucetDay) +
          (demandConfig.comfortRooms * demandConfig.toiletsPerRoom * demandConfig.litersPerToiletDay),
    [demandConfig],
  );

  const scopedDailyDemand = useMemo(() => {
    if (analysisScope === 'school') return aggregateDailyDemand;
    const building = inflowConfig.buildings.find(entry => entry.id === analysisScope);
    if (!building || totalClassrooms === 0) return aggregateDailyDemand;
    return (building.numberOfClassrooms / totalClassrooms) * aggregateDailyDemand;
  }, [aggregateDailyDemand, analysisScope, inflowConfig.buildings, totalClassrooms]);

  const playback = useSimulationPlayback(rainfallData.length);
  const analysis = useRainwaterAnalysis({
    rainfallEnsemble,
    inflowConfig: filteredInflowConfig,
    demandConfig,
    scopedDailyDemand,
  });

  const inflowSeries = useMemo(
    () => WaterBalanceEngine.calculateInflow(rainfallData, filteredInflowConfig),
    [filteredInflowConfig, rainfallData],
  );

  const liveSummary = useMemo(() => summarizeRainfallSeries(inflowSeries), [inflowSeries]);

  const reportSummary = useMemo<SummaryData | null>(() => {
    if (!reportData) return null;
    return {
      monthly: Object.entries(reportData.harvest_summary.monthly_L).map(([key, value]) => ({
        month: MONTH_NAMES[Number.parseInt(key, 10) - 1],
        avgInflow: value as number,
      })),
      weekly: Object.entries(reportData.harvest_summary.weekly_L).map(([week, value]) => ({
        week,
        avgInflow: value as number,
        avgRain: 0,
      })),
      annualInflow: reportData.harvest_summary.annual_L,
      annualRain: 0,
      simulationYears: reportData.metadata.simulation_years,
    };
  }, [reportData]);

  const processedReportReliability = useMemo<ReliabilityIntervalResult[]>(() => {
    if (!reportData) return [];
    return Object.keys(reportData.reliability_table.tank_L)
      .map(key => {
        const conservative = reportData.reliability_table.reliability_pct[key] as number;
        const median = reportData.reliability_table.median_reliability_pct?.[key] as number | undefined;
        const optimistic = reportData.reliability_table.optimistic_reliability_pct?.[key] as number | undefined;
        return {
          tankSize: reportData.reliability_table.tank_L[key] as number,
          reliability: conservative,
          conservativeReliability: conservative,
          medianReliability: median ?? conservative,
          optimisticReliability: optimistic ?? conservative,
          reliabilitySpread: [conservative, optimistic ?? conservative],
          droughtDaysRange: [0, 0],
          totalInflowRange: [0, 0],
          droughtDays: 0,
          totalInflow: 0,
          totalDemand: reportData.metadata.total_daily_demand_L,
          sampleCount: reportData.uncertainty?.runs ?? 1,
        };
      })
      .sort((a, b) => a.tankSize - b.tankSize);
  }, [reportData]);

  const reportBrandReliabilityMap = useMemo<Record<number, ReliabilityIntervalResult>>(() => {
    const map: Record<number, ReliabilityIntervalResult> = {};
    processedReportReliability.forEach(entry => {
      map[entry.tankSize] = entry;
    });
    return map;
  }, [processedReportReliability]);

  const visibleSummary = viewMode === 'report' ? reportSummary : liveSummary;
  const visibleResults = viewMode === 'report' ? processedReportReliability : analysis.simulationResults;
  const visibleBrandMap = viewMode === 'report' ? reportBrandReliabilityMap : analysis.brandReliabilityMap;
  const currentDayData = rainfallData[playback.currentDayIndex] ?? null;

  const currentReliability = useMemo(() => {
    if (visibleResults.length === 0) return null;
    return visibleResults.reduce((closest, current) => (
      Math.abs(current.tankSize - selectedTankSize) < Math.abs(closest.tankSize - selectedTankSize)
        ? current
        : closest
    ));
  }, [selectedTankSize, visibleResults]);

  const handleGenerateRainfall = () => {
    setViewMode('live');
    setIsGenerating(true);
    playback.setIsPlaying(false);

    window.setTimeout(() => {
      const nextSeed = Math.floor(Math.random() * 900000) + 100000;
      setGenSeed(nextSeed);
      const ensemble = RainfallEngine.generateEnsemble(activeParams, genYears, nextSeed, DEFAULT_ENSEMBLE_RUNS);
      setRainfallEnsemble(ensemble);
      setRainfallData(ensemble[0] ?? []);
      analysis.resetAnalysis();
      playback.setCurrentDayIndex(0);
      setIsGenerating(false);
    }, 300);
  };

  const handleExportReport = (coverDetails: ReportCoverDetails) => {
    const report = viewMode === 'report' && reportData
      ? reportData
      : buildSimulationReport({
          inflowConfig: filteredInflowConfig,
          rainfallData: inflowSeries,
          reliabilityData: analysis.simulationResults,
          totalDailyDemand: scopedDailyDemand,
          calibrationResult,
          summary: liveSummary,
          ensembleRuns: rainfallEnsemble.length || DEFAULT_ENSEMBLE_RUNS,
          demandConfig,
        });

    downloadPdfReport(report, coverDetails, `rainwater-harvesting-report-${Date.now()}.pdf`, demandConfig);
  };

  const handleReportUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const parsed = JSON.parse(loadEvent.target?.result as string) as SimulationReportJSON;
        if (!parsed.metadata || !parsed.harvest_summary || !parsed.reliability_table) {
          throw new Error('Invalid JSON structure.');
        }
        setReportData(parsed);
        setViewMode('report');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCalibrationComplete = (result: CalibrationResult) => {
    setCalibrationResult(result);
    setActiveParams(result.parameters);
  };

  const loadReportData = (report: SimulationReportJSON) => {
    setReportData(report);
    setViewMode('report');
  };

  return {
    viewMode,
    setViewMode,
    sidebarTab,
    setSidebarTab,
    reportData,
    calibrationResult,
    genYears,
    setGenYears: (value: string) => setGenYears(parseIntegerInput(value, genYears, 1, 1000)),
    genSeed,
    rainfallData,
    rainfallEnsemble,
    isGenerating,
    inflowConfig,
    setInflowConfig,
    analysisScope,
    setAnalysisScope,
    demandConfig,
    setDemandConfig,
    selectedTankSize,
    setSelectedTankSize,
    totalClassrooms,
    totalRoofArea,
    aggregateDailyDemand,
    scopedDailyDemand,
    filteredInflowConfig,
    liveSummary,
    visibleSummary,
    visibleResults,
    visibleBrandMap,
    currentDayData,
    currentReliability,
    handleGenerateRainfall,
    handleExportReport,
    handleReportUpload,
    handleCalibrationComplete,
    loadReportData,
    runAnalysis: analysis.runAnalysis,
    simulationResults: analysis.simulationResults,
    playback,
    defaultEnsembleRuns: DEFAULT_ENSEMBLE_RUNS,
  };
};

