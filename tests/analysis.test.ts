import * as assert from 'node:assert/strict';
import { IntensityAnalyzer } from '../services/analysis/IntensityAnalyzer.js';
import { TransitionAnalyzer } from '../services/analysis/TransitionAnalyzer.js';

const historicalData = [
  { date: '2024-01-01', rain_mm: 0 },
  { date: '2024-01-02', rain_mm: 4 },
  { date: '2024-01-03', rain_mm: 3 },
  { date: '2024-01-04', rain_mm: 0 },
  { date: '2024-02-01', rain_mm: 6 },
  { date: '2024-02-02', rain_mm: 0 },
  { date: '2024-02-03', rain_mm: 5 },
];

assert.deepEqual(TransitionAnalyzer.analyze([]), []);

const transitionResult = TransitionAnalyzer.analyze(historicalData);
const januaryTransition = transitionResult.find(entry => entry.month === 1);

assert.ok(januaryTransition);
assert.equal(typeof januaryTransition?.p01, 'number');
assert.equal(typeof januaryTransition?.p11, 'number');

const intensityResult = IntensityAnalyzer.analyze(historicalData);
const januaryIntensity = intensityResult.find(entry => entry.month === 1);

assert.ok(januaryIntensity);
assert.equal(januaryIntensity?.meanRain, 3.5);
assert.ok((januaryIntensity?.gamma_k ?? 0) > 0);
assert.ok((januaryIntensity?.gamma_theta ?? 0) > 0);

console.log('analysis.test.ts passed');
