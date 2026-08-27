import { RainfallDataRow, InflowConfig, WaterBalanceConfig, ReliabilityResult } from '../types';

const getInitialStorage = (config: WaterBalanceConfig): number => {
  switch (config.initialStorageMode) {
    case 'empty':
      return 0;
    case 'burn_in':
      return 0;
    case 'half':
    default:
      return config.tankCapacity * 0.5;
  }
};

export class WaterBalanceEngine {
  static calculateInflow(rainData: RainfallDataRow[], config: InflowConfig): (RainfallDataRow & { inflow_liters: number })[] {
    const totalRoofArea = config.buildings.reduce(
      (sum, building) => sum + (building.numberOfClassrooms * building.roofAreaPerClassroom),
      0,
    );

    return rainData.map(day => {
      const effectiveRain = Math.max(0, day.rain_mm - config.firstFlushLoss);
      const inflow = effectiveRain * totalRoofArea * config.runoffCoefficient * config.gutterEfficiency;
      return {
        ...day,
        inflow_liters: Number(inflow.toFixed(2)),
      };
    });
  }

  static runSimulation(
    inflowData: (RainfallDataRow & { inflow_liters: number })[],
    wbConfig: WaterBalanceConfig,
  ): ReliabilityResult {
    if (inflowData.length === 0) {
      return {
        tankSize: wbConfig.tankCapacity,
        reliability: 0,
        droughtDays: 0,
        totalInflow: 0,
        totalDemand: 0,
      };
    }

    const dailyDemand = wbConfig.totalDailyDemand;
    const runWindow = wbConfig.initialStorageMode === 'burn_in'
      ? [...inflowData, ...inflowData.slice(0, Math.min(inflowData.length, 365 * (wbConfig.burnInCycles ?? 1)))]
      : inflowData;
    let storage = getInitialStorage(wbConfig);
    let daysMet = 0;
    let totalInflow = 0;
    let totalDemand = 0;
    let droughtDays = 0;
    const evaluationStart = wbConfig.initialStorageMode === 'burn_in' ? runWindow.length - inflowData.length : 0;

    runWindow.forEach((day, index) => {
      storage = Math.min(wbConfig.tankCapacity, storage + day.inflow_liters);
      if (index >= evaluationStart) {
        totalInflow += day.inflow_liters;
        totalDemand += dailyDemand;
        if (storage >= dailyDemand) {
          storage -= dailyDemand;
          daysMet += 1;
        } else {
          droughtDays += 1;
          storage = 0;
        }
      } else if (storage >= dailyDemand) {
        storage -= dailyDemand;
      } else {
        storage = 0;
      }
    });

    return {
      tankSize: wbConfig.tankCapacity,
      reliability: (daysMet / inflowData.length) * 100,
      droughtDays,
      totalInflow: Number(totalInflow.toFixed(2)),
      totalDemand: Number(totalDemand.toFixed(2)),
    };
  }

  static scanTankSizes(
    inflowData: (RainfallDataRow & { inflow_liters: number })[],
    wbConfig: Omit<WaterBalanceConfig, 'tankCapacity'>,
    minSize = 1000,
    maxSize = 50000,
    steps = 20,
  ): ReliabilityResult[] {
    const results: ReliabilityResult[] = [];
    const stepSize = (maxSize - minSize) / steps;

    for (let index = 0; index <= steps; index += 1) {
      const capacity = Math.round(minSize + (index * stepSize));
      results.push(this.runSimulation(inflowData, { ...wbConfig, tankCapacity: capacity }));
    }

    return results;
  }
}
