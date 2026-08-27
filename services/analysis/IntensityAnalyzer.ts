import * as ss from 'simple-statistics';
import { WET_DAY_THRESHOLD_MM } from '../../constants';
import { HistoricalRecord, MonthlyParameters } from '../../types';

const monthFromDate = (value: string) => Number.parseInt(value.slice(5, 7), 10);

export class IntensityAnalyzer {
  static analyze(data: HistoricalRecord[]): Partial<MonthlyParameters>[] {
    const monthData: Record<number, number[]> = {};

    data.forEach(record => {
      if (record.rain_mm >= WET_DAY_THRESHOLD_MM) {
        const month = monthFromDate(record.date);
        if (!monthData[month]) {
          monthData[month] = [];
        }
        monthData[month].push(record.rain_mm);
      }
    });

    return Object.entries(monthData).map(([monthValue, amounts]) => {
      const mean = ss.mean(amounts);
      const variance = amounts.length > 1 ? ss.variance(amounts) : 0;
      const stdDev = amounts.length > 1 ? ss.standardDeviation(amounts) : 0;
      const safeVariance = Math.max(variance, 0.01);
      const k = (mean * mean) / safeVariance;
      const theta = safeVariance / Math.max(mean, 0.01);

      return {
        month: Number.parseInt(monthValue, 10),
        meanRain: Number(mean.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        gamma_k: Number(k.toFixed(3)),
        gamma_theta: Number(theta.toFixed(3)),
      };
    });
  }
}
