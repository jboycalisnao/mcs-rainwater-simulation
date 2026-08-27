import * as assert from 'node:assert/strict';
import { DEFAULT_MONTHLY_PARAMS } from '../constants.js';
import { RainfallEngine } from '../services/rainfallEngine.js';

const first = RainfallEngine.generate(DEFAULT_MONTHLY_PARAMS, 2, 42);
const second = RainfallEngine.generate(DEFAULT_MONTHLY_PARAMS, 2, 42);

assert.deepEqual(second, first);

const generatedLeapSet = RainfallEngine.generate(DEFAULT_MONTHLY_PARAMS, 4, 7);
assert.equal(generatedLeapSet.length, 1461);
assert.equal(generatedLeapSet.filter(day => day.synthetic_year === 4).length, 366);

const generatedSingleYear = RainfallEngine.generate(DEFAULT_MONTHLY_PARAMS, 1, 99);
assert.ok(generatedSingleYear.every(day => day.wet === (day.rain_mm >= 0.1)));
assert.ok(generatedSingleYear.every(day => day.month >= 1 && day.month <= 12));

console.log('rainfallEngine.test.ts passed');
