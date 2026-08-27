import * as assert from 'node:assert/strict';
import { buildSimulationReport } from '../utils/reporting.js';
import { summarizeRainfallSeries } from '../utils/summary.js';
import { ReliabilityIntervalResult } from '../types.js';

const rainfallData = [
  { synthetic_year: 1, day_of_year: 1, month: 1, rain_mm: 10, wet: true, inflow_liters: 100 },
  { synthetic_year: 1, day_of_year: 8, month: 1, rain_mm: 0, wet: false, inflow_liters: 0 },
  { synthetic_year: 2, day_of_year: 1, month: 1, rain_mm: 20, wet: true, inflow_liters: 200 },
  { synthetic_year: 2, day_of_year: 8, month: 1, rain_mm: 0, wet: false, inflow_liters: 0 },
];

const summary = summarizeRainfallSeries(rainfallData);
assert.equal(summary.simulationYears, 2);
assert.equal(summary.monthly[0].avgInflow, 150);
assert.equal(summary.weekly[0].avgInflow, 150);

const reliabilityData: ReliabilityIntervalResult[] = [{
  tankSize: 1000,
  reliability: 80,
  conservativeReliability: 80,
  medianReliability: 85,
  optimisticReliability: 90,
  reliabilitySpread: [80, 90],
  droughtDaysRange: [10, 20],
  totalInflowRange: [100, 200],
  droughtDays: 15,
  totalInflow: 150,
  totalDemand: 40,
  sampleCount: 24,
}];

const report = buildSimulationReport({
  inflowConfig: {
    buildings: [{ id: '1', name: 'Main', numberOfClassrooms: 2, roofAreaPerClassroom: 50 }],
    runoffCoefficient: 0.8,
    gutterEfficiency: 0.9,
    firstFlushLoss: 1,
  },
  rainfallData,
  reliabilityData,
  totalDailyDemand: 20,
  calibrationResult: null,
  summary,
  ensembleRuns: 24,
});

assert.equal(report.harvest_summary.annual_L, 150);
assert.equal(report.reliability_table.median_reliability_pct?.['0'], 85);
assert.equal(report.uncertainty?.runs, 24);

console.log('reporting.test.ts passed');
