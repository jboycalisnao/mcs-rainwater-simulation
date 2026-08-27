import * as assert from 'node:assert/strict';
import { buildMonthlySpellMeans, calibrateHistoricalRainfall } from '../features/calibration/calibration.js';
import { parseHistoricalCsv } from '../features/calibration/csv.js';

const csv = [
  'Date,Rain',
  '2024-01-30,0',
  '2024-01-31,5',
  '2024-02-01,4',
  '2024-02-03,0',
  '2024-02-04,0',
].join('\n');

const result = calibrateHistoricalRainfall(csv);
assert.equal(result.coverage.totalMissingDays, 1);
assert.ok(result.warnings.some(entry => entry.code === 'MISSING_DAYS'));
assert.equal(result.parameters.length, 12);
assert.ok(result.monthlyDiagnostics.some(entry => entry.month === 2));
assert.ok(result.parameters.find(entry => entry.month === 1)?.meanWetSpell);

assert.throws(
  () => parseHistoricalCsv(['Date,Rain', '2024-02-31,7'].join('\n')),
  /invalid date value/,
);

const spellMeans = buildMonthlySpellMeans([
  { month: 1, wet: true, order: 1 },
  { month: 1, wet: true, order: 2 },
  { month: 1, wet: true, order: 4 },
  { month: 1, wet: false, order: 5 },
  { month: 1, wet: false, order: 6 },
]);

assert.equal(spellMeans[0].wet, 1.5);
assert.equal(spellMeans[0].dry, 2);

console.log('calibrationPipeline.test.ts passed');
