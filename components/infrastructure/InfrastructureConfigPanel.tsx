import React from 'react';
import {
  BookOpen,
  Building2,
  Droplets,
  ExternalLink,
  HandMetal,
  Users,
} from 'lucide-react';
import BuildingManager from '../calibration/BuildingManager';
import { parseDecimalInput, parseIntegerInput } from '../../utils/input';
import type { InflowConfig } from '../../types';
import type { DemandConfig } from '../../features/simulation/useDashboardController';

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

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
  const handwashingSubtotal = demandConfig.handWashingAreas * demandConfig.faucetsPerArea * demandConfig.litersPerFaucetDay;
  const comfortRoomSubtotal = demandConfig.comfortRooms * demandConfig.toiletsPerRoom * demandConfig.litersPerToiletDay;
  const perPersonDaily = demandConfig.populationServed > 0 ? (aggregateDailyDemand / demandConfig.populationServed) : 0;

  return (
    <div className="space-y-6">
      {/* School Buildings & Catchment */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
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

        <div className="mt-4 bg-slate-50 p-3 rounded-md border border-slate-100 flex items-center justify-between">
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

      {/* Water Facilities & Usage Config */}
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#0053DF]" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Water Facilities & Daily Demand
            </h4>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
            WHO / DepEd WinS Basis
          </span>
        </div>

        {/* 1. Handwashing Facilities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandMetal size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">1. Handwashing Facilities</span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Subtotal: {formatNumber(handwashingSubtotal)} L / day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Handwash Areas</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                value={demandConfig.handWashingAreas}
                onChange={event => setDemandConfig({ ...demandConfig, handWashingAreas: parseIntegerInput(event.target.value, demandConfig.handWashingAreas, 0) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Faucets / Area</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                value={demandConfig.faucetsPerArea}
                onChange={event => setDemandConfig({ ...demandConfig, faucetsPerArea: parseIntegerInput(event.target.value, demandConfig.faucetsPerArea, 0) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Liters / Faucet / Day</label>
              <input
                type="number"
                step="0.5"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                value={demandConfig.litersPerFaucetDay}
                onChange={event => setDemandConfig({ ...demandConfig, litersPerFaucetDay: parseDecimalInput(event.target.value, demandConfig.litersPerFaucetDay, 0) })}
              />
            </div>
          </div>
        </div>

        {/* 2. Comfort Rooms & Sanitation */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">🚽</span>
              <span className="text-xs font-bold text-slate-800">2. Comfort Rooms & Sanitation</span>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Subtotal: {formatNumber(comfortRoomSubtotal)} L / day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Comfort Rooms (CRs)</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                value={demandConfig.comfortRooms}
                onChange={event => setDemandConfig({ ...demandConfig, comfortRooms: parseIntegerInput(event.target.value, demandConfig.comfortRooms, 0) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Toilets / Room</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                value={demandConfig.toiletsPerRoom}
                onChange={event => setDemandConfig({ ...demandConfig, toiletsPerRoom: parseIntegerInput(event.target.value, demandConfig.toiletsPerRoom, 0) })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Liters / Toilet / Day</label>
              <input
                type="number"
                step="0.5"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                value={demandConfig.litersPerToiletDay}
                onChange={event => setDemandConfig({ ...demandConfig, litersPerToiletDay: parseDecimalInput(event.target.value, demandConfig.litersPerToiletDay, 0) })}
              />
            </div>
          </div>
        </div>

        {/* 3. Population & Per-Capita Rate */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-800">3. Population Served (Students & Staff)</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {formatNumber(perPersonDaily, 2)} L / person / day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Total People (Students + Teachers)</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                value={demandConfig.populationServed}
                onChange={event => setDemandConfig({ ...demandConfig, populationServed: parseIntegerInput(event.target.value, demandConfig.populationServed, 1) })}
              />
            </div>
            <div className="bg-slate-50 rounded-md p-2.5 border border-slate-100 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">WHO/UNICEF Standard Check</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {perPersonDaily >= 1.5 && perPersonDaily <= 5.0 ? (
                  <span className="text-emerald-700 font-bold">✓ Within typical day school standard (1.5 - 5.0 L/person/day)</span>
                ) : (
                  <span className="text-amber-700 font-semibold">Outside typical day-school range (1.5 - 5.0 L/person/day)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Combined Water Demand</span>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatNumber(handwashingSubtotal)} L (Handwash) + {formatNumber(comfortRoomSubtotal)} L (Sanitation)
            </div>
          </div>
          <span className="text-base font-black text-secondary">{formatNumber(aggregateDailyDemand)} L / Day</span>
        </div>

        {/* Published Studies Citations */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <BookOpen size={12} className="text-[#0053DF]" />
            <span>Published Study & Global Standards Reference:</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[10.5px] leading-relaxed">
            <li>
              <strong>DepEd Order No. 10, s. 2016 (WinS Policy):</strong> Mandates group handwashing facility ratios and gender-segregated comfort room maintenance for Philippine schools.
            </li>
            <li>
              <strong>WHO / UNICEF JMP WASH in Schools (2018):</strong> Establishes basic day school benchmarks of 1.5–3.0 L/person for hand hygiene and 2.0–5.0 L/person for sanitation/toilet flushing.
            </li>
            <li>
              <strong>Thomas & Martinson (2007) / UNEP:</strong> Guidelines for institutional rainwater harvesting segregating non-potable sanitation and washing loads.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureConfigPanel;
