import React from 'react';
import { Building2, HandMetal } from 'lucide-react';
import BuildingManager from '../calibration/BuildingManager';
import { parseDecimalInput, parseIntegerInput } from '../../utils/input';
import type { InflowConfig } from '../../types';

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

interface DemandConfig {
  handWashingAreas: number;
  faucetsPerArea: number;
  litersPerFaucetDay: number;
}

interface Props {
  inflowConfig: InflowConfig;
  setInflowConfig: React.Dispatch<React.SetStateAction<InflowConfig>>;
  demandConfig: DemandConfig;
  setDemandConfig: React.Dispatch<React.SetStateAction<DemandConfig>>;
  totalRoofArea: number;
  totalClassrooms: number;
  aggregateDailyDemand: number;
}

const InfrastructureConfigPanel: React.FC<Props> = ({
  inflowConfig,
  setInflowConfig,
  demandConfig,
  setDemandConfig,
  totalRoofArea,
  totalClassrooms,
  aggregateDailyDemand,
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">School Buildings</h4>
        </div>
        <BuildingManager config={inflowConfig} onChange={setInflowConfig} />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Roof Collection Rate</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={inflowConfig.runoffCoefficient}
              onChange={event => setInflowConfig({ ...inflowConfig, runoffCoefficient: parseDecimalInput(event.target.value, inflowConfig.runoffCoefficient, 0, 1) })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gutter Collection Rate</label>
            <input
              type="number"
              step="0.01"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={inflowConfig.gutterEfficiency}
              onChange={event => setInflowConfig({ ...inflowConfig, gutterEfficiency: parseDecimalInput(event.target.value, inflowConfig.gutterEfficiency, 0, 1) })}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">First Rain Discarded (mm)</label>
          <input
            type="number"
            step="0.1"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            value={inflowConfig.firstFlushLoss}
            onChange={event => setInflowConfig({ ...inflowConfig, firstFlushLoss: parseDecimalInput(event.target.value, inflowConfig.firstFlushLoss, 0, 50) })}
          />
        </div>

        <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Roof Area</div>
            <div className="text-sm font-black text-primary">{formatNumber(totalRoofArea)} m2</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Classrooms</div>
            <div className="text-sm font-black text-primary">{formatNumber(totalClassrooms)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <HandMetal size={14} className="text-secondary opacity-50" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Water Use</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Handwashing Areas</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
              value={demandConfig.handWashingAreas}
              onChange={event => setDemandConfig({ ...demandConfig, handWashingAreas: parseIntegerInput(event.target.value, demandConfig.handWashingAreas, 0) })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Faucets per Area</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
              value={demandConfig.faucetsPerArea}
              onChange={event => setDemandConfig({ ...demandConfig, faucetsPerArea: parseIntegerInput(event.target.value, demandConfig.faucetsPerArea, 0) })}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Liters per Faucet Daily</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            value={demandConfig.litersPerFaucetDay}
            onChange={event => setDemandConfig({ ...demandConfig, litersPerFaucetDay: parseIntegerInput(event.target.value, demandConfig.litersPerFaucetDay, 0) })}
          />
        </div>

        <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase">School Daily Total</span>
          <span className="text-sm font-black text-secondary">{formatNumber(aggregateDailyDemand)} L / Day</span>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureConfigPanel;
