import { useCallback, useEffect, useState } from 'react';
import { RainfallDataRow, ReliabilityIntervalResult, WaterBalanceConfig, InflowConfig } from '../types';
import { runEnsembleWaterBalance } from '../features/reliability/ensembleAnalysis';

interface AnalysisOptions {
  rainfallEnsemble: RainfallDataRow[][];
  inflowConfig: InflowConfig;
  demandConfig: Omit<WaterBalanceConfig, 'tankCapacity' | 'totalDailyDemand'>;
  scopedDailyDemand: number;
}

export const useRainwaterAnalysis = ({
  rainfallEnsemble,
  inflowConfig,
  demandConfig,
  scopedDailyDemand,
}: AnalysisOptions) => {
  const [simulationResults, setSimulationResults] = useState<ReliabilityIntervalResult[]>([]);
  const [brandReliabilityMap, setBrandReliabilityMap] = useState<Record<number, ReliabilityIntervalResult>>({});

  const runAnalysis = useCallback(() => {
    if (rainfallEnsemble.length === 0) return;
    const output = runEnsembleWaterBalance({
      rainfallEnsemble,
      inflowConfig,
      demandConfig,
      scopedDailyDemand,
    });
    setSimulationResults(output.results);
    setBrandReliabilityMap(output.brandReliabilityMap);
  }, [demandConfig, inflowConfig, rainfallEnsemble, scopedDailyDemand]);

  useEffect(() => {
    if (rainfallEnsemble.length === 0) return;
    runAnalysis();
  }, [rainfallEnsemble, inflowConfig, demandConfig, scopedDailyDemand, runAnalysis]);

  const resetAnalysis = useCallback(() => {
    setSimulationResults([]);
    setBrandReliabilityMap({});
  }, []);

  return {
    simulationResults,
    brandReliabilityMap,
    runAnalysis,
    resetAnalysis,
  };
};
