import React, { useMemo } from 'react';
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Gauge } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WaterBalanceEngine } from '../../services/waterBalanceEngine';
import { InflowConfig, RainfallDataRow, WaterBalanceConfig } from '../../types';
import { DemandConfig } from '../../features/simulation/useDashboardController';

interface SensitivityAnalysisModuleProps {
  rainfallEnsemble: RainfallDataRow[][];
  inflowConfig: InflowConfig;
  demandConfig: DemandConfig;
  scopedDailyDemand: number;
  selectedTankSize: number;
}

interface SensitivityScenario {
  variable: string;
  scenario: string;
  explanation: string;
  inflowConfig: InflowConfig;
  dailyDemand: number;
}

interface SensitivityResult {
  variable: string;
  scenario: string;
  explanation: string;
  reliability: number;
  medianReliability: number;
  droughtDays: number;
  delta: number;
  impact: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const percentile = (values: number[], ratio: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
};

const scaleRoofArea = (config: InflowConfig, factor: number): InflowConfig => ({
  ...config,
  buildings: config.buildings.map(building => ({
    ...building,
    roofAreaPerClassroom: building.roofAreaPerClassroom * factor,
  })),
});

const evaluateScenario = (
  rainfallEnsemble: RainfallDataRow[][],
  inflowConfig: InflowConfig,
  demandConfig: DemandConfig,
  dailyDemand: number,
  tankSize: number,
) => {
  const runs = rainfallEnsemble.map(rainfallData => {
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const baseConfig: Omit<WaterBalanceConfig, 'tankCapacity'> = {
      ...demandConfig,
      totalDailyDemand: dailyDemand,
    };
    const empty = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: tankSize, initialStorageMode: 'empty' });
    const burnIn = WaterBalanceEngine.runSimulation(inflowData, { ...baseConfig, tankCapacity: tankSize, initialStorageMode: 'burn_in', burnInCycles: 1 });

    return empty.reliability <= burnIn.reliability ? empty : burnIn;
  });

  return {
    reliability: Number(percentile(runs.map(run => run.reliability), 0.1).toFixed(2)),
    medianReliability: Number(percentile(runs.map(run => run.reliability), 0.5).toFixed(2)),
    droughtDays: Number(percentile(runs.map(run => run.droughtDays ?? 0), 0.5).toFixed(0)),
  };
};

const SensitivityAnalysisModule: React.FC<SensitivityAnalysisModuleProps> = ({
  rainfallEnsemble,
  inflowConfig,
  demandConfig,
  scopedDailyDemand,
  selectedTankSize,
}) => {
  const analysis = useMemo(() => {
    if (rainfallEnsemble.length === 0) return null;

    const base = evaluateScenario(
      rainfallEnsemble,
      inflowConfig,
      demandConfig,
      scopedDailyDemand,
      selectedTankSize,
    );

    const scenarios: SensitivityScenario[] = [
      {
        variable: 'Roof Area',
        scenario: '-20%',
        explanation: 'Less roof catchment means less rainwater can enter the system.',
        inflowConfig: scaleRoofArea(inflowConfig, 0.8),
        dailyDemand: scopedDailyDemand,
      },
      {
        variable: 'Roof Area',
        scenario: '+20%',
        explanation: 'More roof catchment means more rainfall can be converted to inflow.',
        inflowConfig: scaleRoofArea(inflowConfig, 1.2),
        dailyDemand: scopedDailyDemand,
      },
      {
        variable: 'Daily Demand',
        scenario: '-20%',
        explanation: 'Lower daily use gives the tank more time before it empties.',
        inflowConfig,
        dailyDemand: scopedDailyDemand * 0.8,
      },
      {
        variable: 'Daily Demand',
        scenario: '+20%',
        explanation: 'Higher daily use drains the tank faster during dry days.',
        inflowConfig,
        dailyDemand: scopedDailyDemand * 1.2,
      },
      {
        variable: 'Runoff Efficiency',
        scenario: '-10%',
        explanation: 'Lower runoff means more roof water is lost before collection.',
        inflowConfig: {
          ...inflowConfig,
          runoffCoefficient: clamp(inflowConfig.runoffCoefficient * 0.9, 0, 1),
        },
        dailyDemand: scopedDailyDemand,
      },
      {
        variable: 'Runoff Efficiency',
        scenario: '+10%',
        explanation: 'Higher runoff means more roof water flows toward the tank.',
        inflowConfig: {
          ...inflowConfig,
          runoffCoefficient: clamp(inflowConfig.runoffCoefficient * 1.1, 0, 1),
        },
        dailyDemand: scopedDailyDemand,
      },
      {
        variable: 'First Flush Loss',
        scenario: '-0.5 mm',
        explanation: 'A smaller first-flush loss leaves more rainfall available for storage.',
        inflowConfig: {
          ...inflowConfig,
          firstFlushLoss: Math.max(0, inflowConfig.firstFlushLoss - 0.5),
        },
        dailyDemand: scopedDailyDemand,
      },
      {
        variable: 'First Flush Loss',
        scenario: '+0.5 mm',
        explanation: 'A larger first-flush loss removes more rainfall before collection.',
        inflowConfig: {
          ...inflowConfig,
          firstFlushLoss: inflowConfig.firstFlushLoss + 0.5,
        },
        dailyDemand: scopedDailyDemand,
      },
    ];

    const results: SensitivityResult[] = scenarios.map(scenario => {
      const evaluated = evaluateScenario(
        rainfallEnsemble,
        scenario.inflowConfig,
        demandConfig,
        scenario.dailyDemand,
        selectedTankSize,
      );
      const delta = Number((evaluated.reliability - base.reliability).toFixed(2));

      return {
        variable: scenario.variable,
        scenario: scenario.scenario,
        explanation: scenario.explanation,
        reliability: evaluated.reliability,
        medianReliability: evaluated.medianReliability,
        droughtDays: evaluated.droughtDays,
        delta,
        impact: Math.abs(delta),
      };
    });

    const impactByVariable = Array.from(new Set(results.map(result => result.variable))).map(variable => {
      const matching = results.filter(result => result.variable === variable);
      const impact = Math.max(...matching.map(result => result.impact));
      return {
        variable,
        impact: Number(impact.toFixed(2)),
      };
    }).sort((a, b) => b.impact - a.impact);

    return {
      base,
      results,
      impactByVariable,
      mostSensitive: impactByVariable[0] ?? null,
    };
  }, [demandConfig, inflowConfig, rainfallEnsemble, scopedDailyDemand, selectedTankSize]);

  const formatNumber = (value: number, decimals = 1) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (!analysis) return null;

  return (
    <section className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-primary">
            <Activity size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Sensitivity Analysis</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Tests how the selected tank responds when one input changes at a time. This helps identify which assumption has the strongest effect on reliability.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Tank</div>
          <div className="mt-1 font-black text-slate-900">{formatNumber(selectedTankSize / 1000, 1)} kL</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-h-[260px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-600">Largest Reliability Changes</h4>
              <p className="text-xs text-slate-500">Absolute change in cautious reliability, in percentage points.</p>
            </div>
            <Gauge size={18} className="text-slate-400" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.impactByVariable} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="variable" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => [`${formatNumber(value, 2)} points`, 'Reliability change']} />
                <Bar dataKey="impact" fill="#0053DF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 text-[#ca080b]" />
            <div>
              <h4 className="text-sm font-black text-slate-900">Most Sensitive Input</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {analysis.mostSensitive
                  ? `${analysis.mostSensitive.variable} caused the largest reliability movement for the selected tank.`
                  : 'No sensitivity result is available yet.'}
              </p>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base cautious reliability</div>
                <div className="mt-1 text-2xl font-black text-primary">{formatNumber(analysis.base.reliability, 1)}%</div>
                <div className="text-xs text-slate-500">Typical result: {formatNumber(analysis.base.medianReliability, 1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Input Tested</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Change</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Cautious Reliability</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Effect</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {analysis.results.map(result => (
              <tr key={`${result.variable}-${result.scenario}`}>
                <td className="px-4 py-3 font-bold text-slate-800">{result.variable}</td>
                <td className="px-4 py-3 text-slate-600">{result.scenario}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{formatNumber(result.reliability, 1)}%</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 font-bold ${result.delta >= 0 ? 'text-emerald-700' : 'text-[#ca080b]'}`}>
                    {result.delta >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {result.delta >= 0 ? '+' : ''}{formatNumber(result.delta, 2)} pts
                  </span>
                </td>
                <td className="min-w-[260px] px-4 py-3 text-slate-600">{result.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SensitivityAnalysisModule;
