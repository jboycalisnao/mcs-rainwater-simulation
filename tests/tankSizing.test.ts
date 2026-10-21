import * as assert from 'node:assert/strict';
import { DEFAULT_MONTHLY_PARAMS, DEFAULT_BUILDINGS } from '../constants.js';
import { runEnsembleWaterBalance } from '../features/reliability/ensembleAnalysis.js';
import { RainfallEngine } from '../services/rainfallEngine.js';
import { getCommercialCombo, selectRecommendedTank, selectTankRecommendations } from '../utils/tankSizing.js';

const ensemble = RainfallEngine.generateEnsemble(DEFAULT_MONTHLY_PARAMS, 10, 543210, 5);

// Test 1: Sizing scales dynamically across different demands
const inflowConfig = {
  buildings: DEFAULT_BUILDINGS,
  runoffCoefficient: 0.85,
  gutterEfficiency: 0.9,
  firstFlushLoss: 0.5,
};

const demandLow = {
  handWashingAreas: 2,
  faucetsPerArea: 3,
  litersPerFaucetDay: 25,
  comfortRooms: 2,
  toiletsPerRoom: 2,
  litersPerToiletDay: 50,
  populationServed: 200,
};

const demandHigh = {
  handWashingAreas: 6,
  faucetsPerArea: 6,
  litersPerFaucetDay: 30,
  comfortRooms: 6,
  toiletsPerRoom: 3,
  litersPerToiletDay: 70,
  populationServed: 600,
};

const resultsLow = runEnsembleWaterBalance({
  rainfallEnsemble: ensemble,
  inflowConfig,
  demandConfig: demandLow,
  scopedDailyDemand: 350,
}).results;

const resultsHigh = runEnsembleWaterBalance({
  rainfallEnsemble: ensemble,
  inflowConfig,
  demandConfig: demandHigh,
  scopedDailyDemand: 2340,
}).results;

const recLow = selectTankRecommendations(resultsLow);
const recHigh = selectTankRecommendations(resultsHigh);

assert(recLow !== null, 'recLow should not be null');
assert(recHigh !== null, 'recHigh should not be null');

assert(
  recLow.budget.tankSize <= recLow.optimal.tankSize,
  'budget should be <= optimal for low demand',
);
assert(
  recLow.optimal.tankSize <= recLow.resilient.tankSize,
  'optimal should be <= resilient for low demand',
);

// Recommended tank should NOT be frozen at 26,480 / 26.5 kL across different setups
assert(
  recLow.optimal.tankSize < 15000,
  `Low demand optimal tank (${recLow.optimal.tankSize} L) should be compact (< 15 kL), not frozen at 26.5 kL`,
);

// Test 2: Individual building scope sizing vs whole school
const resultsBuildingOnly = runEnsembleWaterBalance({
  rainfallEnsemble: ensemble,
  inflowConfig: { ...inflowConfig, buildings: [DEFAULT_BUILDINGS[1]] }, // 4 classrooms (40% share)
  demandConfig: demandLow,
  scopedDailyDemand: 400,
}).results;

const recBuilding = selectRecommendedTank(resultsBuildingOnly);
assert(recBuilding !== null, 'Building recommendation should exist');
assert(recBuilding.tankSize < 15000, 'Building-level tank should be smaller than whole campus');

// Test 3: Commercial combo decomposition
const combo26k = getCommercialCombo(26480);
assert.strictEqual(combo26k.text, '2 × 10 kL + 1 × 6 kL');
assert.strictEqual(combo26k.totalKl, 26);
assert.strictEqual(combo26k.parallelCount, 3);

const combo15k = getCommercialCombo(14720);
assert.strictEqual(combo15k.text, '1 × 10 kL + 1 × 5 kL');
assert.strictEqual(combo15k.totalKl, 15);

const combo9k = getCommercialCombo(8840);
assert.strictEqual(combo9k.text, '1 × 8 kL + 1 × 1 kL');

console.log('tankSizing.test.ts passed');
