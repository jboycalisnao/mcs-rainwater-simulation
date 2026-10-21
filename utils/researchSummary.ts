import { InflowConfig, ReliabilityIntervalResult, SummaryData } from '../types';

export interface ResearchSummary {
  problemStatement: string[];
  objective: string[];
  method: string[];
  simulationDesign: string[];
  results: string[];
  recommendation: string[];
  conclusion: string[];
  equations: { label: string; formula: string; explanation: string }[];
  assumptions: string[];
  citationOutputs: string[];
  recommendedTank: ReliabilityIntervalResult | null;
}

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

export const selectRecommendedTank = (results: ReliabilityIntervalResult[]) => (
  results.find(result => result.conservativeReliability >= 90)
  ?? results.find(result => result.conservativeReliability >= 80)
  ?? results[Math.floor(results.length / 2)]
  ?? results[0]
  ?? null
);

export const buildResearchSummary = ({
  inflowConfig,
  totalRoofArea,
  scopedDailyDemand,
  simulationYears,
  ensembleRuns,
  summary,
  results,
}: {
  inflowConfig: InflowConfig;
  totalRoofArea: number;
  scopedDailyDemand: number;
  simulationYears: number;
  ensembleRuns: number;
  summary: SummaryData | null;
  results: ReliabilityIntervalResult[];
}): ResearchSummary => {
  const recommendedTank = selectRecommendedTank(results);
  const annualInflow = summary?.annualInflow ?? 0;
  const conservativeReliability = recommendedTank?.conservativeReliability ?? 0;
  const medianReliability = recommendedTank?.medianReliability ?? 0;
  const optimisticReliability = recommendedTank?.optimisticReliability ?? 0;

  return {
    problemStatement: [
      'Schools need a reliable water source for daily handwashing, comfort room sanitation, and campus hygiene facilities, especially during periods when piped or stored water is limited.',
      'Rainwater harvesting can help, but the correct tank size depends on rainfall timing, roof area, collection losses, and daily demand.',
      'A simple average rainfall value is not enough because long dry spells can empty the tank even in years with high total rainfall.',
    ],
    objective: [
      'Estimate how much rainwater can be harvested from the selected school roofs.',
      'Test whether different tank sizes can meet the school daily water demand.',
      'Identify which input assumptions most strongly affect system reliability.',
    ],
    method: [
      'Generate possible day-by-day rainfall using monthly wet and dry behavior.',
      'Convert rainfall depth into liters of roof runoff using catchment area and collection efficiency factors.',
      'Run a daily water balance that adds inflow, limits storage by tank capacity, subtracts demand, and counts shortage days.',
      'Repeat the calculation across an ensemble of rainfall runs to show cautious, typical, and best-case reliability.',
    ],
    simulationDesign: [
      `Simulation length: ${formatNumber(simulationYears)} synthetic rainfall years.`,
      `Ensemble size: ${formatNumber(ensembleRuns)} rainfall runs.`,
      `Catchment area tested: ${formatNumber(totalRoofArea, 1)} m2.`,
      `Daily demand tested: ${formatNumber(scopedDailyDemand, 1)} L/day.`,
      `Collection factors: runoff coefficient ${formatNumber(inflowConfig.runoffCoefficient, 2)}, gutter efficiency ${formatNumber(inflowConfig.gutterEfficiency, 2)}, first-flush loss ${formatNumber(inflowConfig.firstFlushLoss, 1)} mm.`,
    ],
    results: [
      `Estimated annual harvested water: ${formatNumber(annualInflow, 1)} L/year.`,
      recommendedTank
        ? `Recommended tank from tested options: ${formatNumber(recommendedTank.tankSize)} L.`
        : 'Recommended tank is not available until tank results are generated.',
      recommendedTank
        ? `Reliability for the recommended tank: cautious ${formatNumber(conservativeReliability, 1)}%, typical ${formatNumber(medianReliability, 1)}%, best case ${formatNumber(optimisticReliability, 1)}%.`
        : 'Reliability values are not available until the water balance analysis is run.',
    ],
    recommendation: [
      recommendedTank
        ? `Use the ${formatNumber(recommendedTank.tankSize)} L tank option as the primary planning reference because it is the first practical option in the tested set that reaches the target range or the closest available alternative.`
        : 'Run the rainfall test and tank analysis before selecting a final tank size.',
      'Use cautious reliability when presenting the research recommendation because it better represents less favorable rainfall timing.',
      'Review sensitivity results before final implementation because changes in demand, roof area, and collection efficiency can shift the best tank choice.',
    ],
    conclusion: [
      'The application demonstrates how mathematical modeling and computational simulation can support rainwater harvesting decisions.',
      'The results should be interpreted as planning estimates, not exact weather predictions.',
      'The strongest research value is the comparison of scenarios, uncertainty, and sensitivity rather than a single fixed answer.',
    ],
    equations: [
      {
        label: 'Daily water demand',
        formula: 'Demand = (Handwash Areas x Faucets x L/Faucet) + (Comfort Rooms x Toilets x L/Toilet)',
        explanation: 'Combines handwashing hygiene and comfort room sanitation (toilet flushing and cleaning) benchmarked against DepEd WinS Order 10 s.2016 and WHO/UNICEF WASH guidelines (~2.2 L/person/day for campus population).',
      },
      {
        label: 'Daily inflow',
        formula: 'Inflow = max(0, Rainfall - First Flush Loss) x Roof Area x Runoff Coefficient x Gutter Efficiency',
        explanation: 'Converts roof rainfall into estimated liters entering the tank.',
      },
      {
        label: 'Tank storage',
        formula: 'Storage = min(Tank Capacity, Previous Storage + Inflow) - Daily Demand',
        explanation: 'Tracks the water remaining after collection and use each day.',
      },
      {
        label: 'Reliability',
        formula: 'Reliability = (Days with Enough Water / Total Simulated Days) x 100',
        explanation: 'Measures how often the tank meets the full daily demand.',
      },
    ],
    assumptions: [
      'Rainfall simulation represents possible rainfall behavior, not an exact forecast.',
      'Daily water demand is treated as constant during the simulation.',
      'Roof area, runoff coefficient, gutter efficiency, and first-flush loss are assumed to stay constant.',
      'Tank water is used only for the modeled demand.',
      'Water quality, leakage, maintenance, installation cost, and site constraints are outside the current model.',
    ],
    citationOutputs: [
      `Simulation used ${formatNumber(ensembleRuns)} ensemble runs over ${formatNumber(simulationYears)} synthetic rainfall years.`,
      'Reliability was evaluated as the percentage of days where daily demand was fully met.',
      'Rainwater inflow was estimated using roof catchment area and collection efficiency factors.',
      `The modeled system used ${formatNumber(totalRoofArea, 1)} m2 of catchment area and ${formatNumber(scopedDailyDemand, 1)} L/day demand.`,
      'Facility water usage rates are grounded in DepEd WinS Order 10 s.2016 and WHO/UNICEF WASH guidelines (1.5–5.0 L/person/day for day schools).',
    ],
    recommendedTank,
  };
};
