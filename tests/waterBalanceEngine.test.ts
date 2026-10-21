import * as assert from 'node:assert/strict';
import { WaterBalanceEngine } from '../services/waterBalanceEngine.js';
import { InflowConfig, WaterBalanceConfig } from '../types.js';

const inflowConfig: InflowConfig = {
  buildings: [
    { id: '1', name: 'Main Wing', numberOfClassrooms: 2, roofAreaPerClassroom: 50 },
  ],
  runoffCoefficient: 0.8,
  gutterEfficiency: 0.9,
  firstFlushLoss: 1,
};

const inflow = WaterBalanceEngine.calculateInflow(
  [
    { synthetic_year: 1, day_of_year: 1, month: 1, rain_mm: 10, wet: true },
    { synthetic_year: 1, day_of_year: 2, month: 1, rain_mm: 0.5, wet: false },
  ],
  inflowConfig,
);

assert.equal(inflow[0].inflow_liters, 648);
assert.equal(inflow[1].inflow_liters, 0);

const config: WaterBalanceConfig = {
  handWashingAreas: 1,
  faucetsPerArea: 1,
  litersPerFaucetDay: 20,
  totalDailyDemand: 20,
  tankCapacity: 1000,
  initialStorageMode: 'empty',
};

const emptyResult = WaterBalanceEngine.runSimulation([], config);
assert.equal(emptyResult.reliability, 0);
assert.equal(emptyResult.totalInflow, 0);
assert.equal(emptyResult.totalDemand, 0);

const scan = WaterBalanceEngine.scanTankSizes(
  WaterBalanceEngine.calculateInflow(
    [{ synthetic_year: 1, day_of_year: 1, month: 1, rain_mm: 10, wet: true }],
    inflowConfig,
  ),
  {
    handWashingAreas: 1,
    faucetsPerArea: 1,
    litersPerFaucetDay: 20,
    totalDailyDemand: 20,
    initialStorageMode: 'empty',
  },
  1000,
  5000,
  4,
);

assert.deepEqual(scan.map(entry => entry.tankSize), [1000, 2000, 3000, 4000, 5000]);

const shortInflow = WaterBalanceEngine.calculateInflow(
  [
    { synthetic_year: 1, day_of_year: 1, month: 1, rain_mm: 0, wet: false },
    { synthetic_year: 1, day_of_year: 2, month: 1, rain_mm: 0, wet: false },
    { synthetic_year: 1, day_of_year: 3, month: 1, rain_mm: 30, wet: true },
  ],
  inflowConfig,
);
const emptyStart = WaterBalanceEngine.runSimulation(shortInflow, { ...config, initialStorageMode: 'empty' });
const burnIn = WaterBalanceEngine.runSimulation(shortInflow, { ...config, initialStorageMode: 'burn_in', burnInCycles: 1 });
assert.ok(burnIn.reliability >= emptyStart.reliability);

// Multi-facility demand configuration test
const multiFacilityConfig: WaterBalanceConfig = {
  handWashingAreas: 4,
  faucetsPerArea: 5,
  litersPerFaucetDay: 25,
  comfortRooms: 4,
  toiletsPerRoom: 2,
  litersPerToiletDay: 62.5,
  populationServed: 450,
  totalDailyDemand: (4 * 5 * 25) + (4 * 2 * 62.5), // 500 + 500 = 1000 L/day
  tankCapacity: 26500,
  initialStorageMode: 'empty',
};

assert.equal(multiFacilityConfig.totalDailyDemand, 1000);
const multiResult = WaterBalanceEngine.runSimulation(shortInflow, multiFacilityConfig);
assert.equal(multiResult.totalDemand, 3000); // 3 days x 1000 L/day

console.log('waterBalanceEngine.test.ts passed');

