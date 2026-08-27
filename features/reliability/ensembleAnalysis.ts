import { ALL_BRAND_CAPACITIES, CONSERVATIVE_RELIABILITY_PERCENTILE } from '../../constants';
import { WaterBalanceEngine } from '../../services/waterBalanceEngine';
import { InflowConfig, RainfallDataRow, ReliabilityIntervalResult, ReliabilityResult, WaterBalanceConfig } from '../../types';

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
};

const aggregateRunResults = (tankSize: number, runs: ReliabilityResult[]): ReliabilityIntervalResult => {
  const reliability = runs.map(run => run.reliability);
  const droughtDays = runs.map(run => run.droughtDays ?? 0);
  const totalInflow = runs.map(run => run.totalInflow ?? 0);

  const conservativeReliability = Number(percentile(reliability, CONSERVATIVE_RELIABILITY_PERCENTILE).toFixed(2));
  const medianReliability = Number(percentile(reliability, 0.5).toFixed(2));
  const optimisticReliability = Number(percentile(reliability, 0.9).toFixed(2));

  return {
    tankSize,
    reliability: conservativeReliability,
    medianReliability,
    conservativeReliability,
    optimisticReliability,
    reliabilitySpread: [conservativeReliability, optimisticReliability],
    droughtDaysRange: [Math.min(...droughtDays), Math.max(...droughtDays)],
    totalInflowRange: [Number(Math.min(...totalInflow).toFixed(2)), Number(Math.max(...totalInflow).toFixed(2))],
    droughtDays: Number(percentile(droughtDays, 0.5).toFixed(0)),
    totalInflow: Number(percentile(totalInflow, 0.5).toFixed(2)),
    totalDemand: runs[0]?.totalDemand ?? 0,
    sampleCount: runs.length,
  };
};

export const runEnsembleWaterBalance = ({
  rainfallEnsemble,
  inflowConfig,
  demandConfig,
  scopedDailyDemand,
}: {
  rainfallEnsemble: RainfallDataRow[][];
  inflowConfig: InflowConfig;
  demandConfig: Omit<WaterBalanceConfig, 'tankCapacity' | 'totalDailyDemand'>;
  scopedDailyDemand: number;
}) => {
  const capacities = Array.from({ length: 26 }, (_, index) => 1000 + index * 1960);
  const simulationsByTank = new Map<number, ReliabilityResult[]>();
  const brandRuns = new Map<number, ReliabilityResult[]>();

  rainfallEnsemble.forEach(rainfallData => {
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const baseConfig: Omit<WaterBalanceConfig, 'tankCapacity'> = {
      ...demandConfig,
      totalDailyDemand: scopedDailyDemand,
    };

    capacities.forEach(capacity => {
      const empty = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: capacity, initialStorageMode: 'empty' });
      const burnIn = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: capacity, initialStorageMode: 'burn_in', burnInCycles: 1 });
      const conservative = empty.reliability <= burnIn.reliability ? empty : burnIn;
      const list = simulationsByTank.get(capacity) ?? [];
      list.push(conservative);
      simulationsByTank.set(capacity, list);
    });

    ALL_BRAND_CAPACITIES.forEach(capacity => {
      const empty = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: capacity, initialStorageMode: 'empty' });
      const burnIn = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: capacity, initialStorageMode: 'burn_in', burnInCycles: 1 });
      const list = brandRuns.get(capacity) ?? [];
      list.push(empty.reliability <= burnIn.reliability ? empty : burnIn);
      brandRuns.set(capacity, list);
    });
  });

  const results = Array.from(simulationsByTank.entries())
    .map(([tankSize, runs]) => aggregateRunResults(tankSize, runs))
    .sort((a, b) => a.tankSize - b.tankSize);

  const brandReliabilityMap: Record<number, ReliabilityIntervalResult> = {};
  Array.from(brandRuns.entries()).forEach(([tankSize, runs]) => {
    brandReliabilityMap[tankSize] = aggregateRunResults(tankSize, runs);
  });

  return { results, brandReliabilityMap };
};
