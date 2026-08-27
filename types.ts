export type WetDayClassification = 'wet' | 'dry';

export interface MonthlyParameters {
  month: number;
  p01: number;
  p11: number;
  meanRain: number;
  stdDev: number;
  gamma_k?: number;
  gamma_theta?: number;
  meanDrySpell?: number;
  varDrySpell?: number;
  meanWetSpell?: number;
  varWetSpell?: number;
  avgDrySpell?: number;
  avgWetSpell?: number;
}

export interface HistoricalRecord {
  date: string;
  rain_mm: number;
}

export interface ParsedHistoricalRecord extends HistoricalRecord {
  isoDate: string;
  timestamp: number;
  rowNumber: number;
}

export interface CalibrationWarning {
  code:
    | 'UNSUPPORTED_DATE'
    | 'INVALID_RAIN_VALUE'
    | 'DUPLICATE_DATE'
    | 'MISSING_DAYS'
    | 'SPARSE_MONTH'
    | 'FALLBACK_DEFAULT'
    | 'FALLBACK_SMOOTHED'
    | 'PARTIAL_MONTH'
    | 'LOW_CONFIDENCE';
  message: string;
  month?: number;
  rowNumber?: number;
}

export interface MonthlyCoverageStats {
  month: number;
  observedDays: number;
  expectedDays: number;
  missingDays: number;
  wetDays: number;
  dryDays: number;
}

export interface FitMetrics {
  meanRainMae: number;
  wetFrequencyMae: number;
  spellLengthMae: number;
  overallScore: number;
}

export interface CalibrationMonthlyDiagnostic {
  month: number;
  source: 'historical' | 'smoothed' | 'default';
  observedWetDays: number;
  observedTransitions: number;
  observedDays: number;
  expectedDays: number;
  missingDays: number;
  fitScore: number;
}

export interface CalibrationResult {
  parameters: MonthlyParameters[];
  warnings: CalibrationWarning[];
  coverage: {
    totalObservedDays: number;
    totalMissingDays: number;
    duplicateDays: number;
    dateRange: { start: string; end: string } | null;
    monthly: MonthlyCoverageStats[];
  };
  fit: FitMetrics;
  monthlyDiagnostics: CalibrationMonthlyDiagnostic[];
  sourceRecordCount: number;
}

export interface RainfallDataRow {
  synthetic_year: number;
  day_of_year: number;
  month: number;
  rain_mm: number;
  wet: boolean;
  observed_wet?: boolean;
  latent_wet?: boolean;
}

export interface Building {
  id: string;
  name: string;
  numberOfClassrooms: number;
  roofAreaPerClassroom: number;
}

export interface InflowConfig {
  buildings: Building[];
  runoffCoefficient: number;
  gutterEfficiency: number;
  firstFlushLoss: number;
}

export interface WaterBalanceConfig {
  handWashingAreas: number;
  faucetsPerArea: number;
  litersPerFaucetDay: number;
  totalDailyDemand: number;
  tankCapacity: number;
  initialStorageMode?: 'empty' | 'half' | 'burn_in';
  burnInCycles?: number;
}

export interface ReliabilityResult {
  tankSize: number;
  reliability: number;
  droughtDays?: number;
  totalInflow?: number;
  totalDemand?: number;
}

export interface ReliabilityIntervalResult extends ReliabilityResult {
  medianReliability: number;
  conservativeReliability: number;
  optimisticReliability: number;
  reliabilitySpread: [number, number];
  droughtDaysRange: [number, number];
  totalInflowRange: [number, number];
  sampleCount: number;
}

export interface EnsembleSettings {
  runs: number;
  baseSeed: number;
  generatedYears: number;
  conservativePercentile: number;
}

export interface MonthlySummary {
  month: string;
  avgRain?: number;
  avgInflow: number;
  wetFrequency?: number;
  count?: number;
}

export interface SummaryData {
  monthly: MonthlySummary[];
  weekly: { week: string; avgInflow: number; avgRain: number }[];
  annualInflow: number;
  annualRain: number;
  simulationYears: number;
}

export interface ReportCoverDetails {
  title: string;
  preparedBy: string;
  schoolName: string;
  location: string;
  reportDate: string;
  notes: string;
}

export interface SimulationReportJSON {
  metadata: {
    roof_area_per_class_m2: number;
    number_of_classrooms: number;
    total_daily_demand_L: number;
    simulation_years: number;
    hand_washing_areas?: number;
    faucets_per_area?: number;
  };
  harvest_summary: {
    annual_L: number;
    monthly_L: Record<string, number>;
    weekly_L: Record<string, number>;
  };
  reliability_table: {
    tank_L: Record<string, number>;
    reliability_pct: Record<string, number>;
    median_reliability_pct?: Record<string, number>;
    optimistic_reliability_pct?: Record<string, number>;
  };
  calibration?: {
    fit_score: number;
    warnings: string[];
    total_missing_days: number;
    monthly_sources: Record<string, string>;
  };
  uncertainty?: {
    conservative_percentile: number;
    runs: number;
  };
  assumptions?: string[];
  generated_at: string;
}
