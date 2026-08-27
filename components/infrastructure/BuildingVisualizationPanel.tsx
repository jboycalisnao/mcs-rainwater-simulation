import React from 'react';
import { Building2, HandMetal } from 'lucide-react';
import { InflowConfig } from '../../types';

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

interface Props {
  buildings: InflowConfig['buildings'];
  handWashingAreas: number;
  faucetsPerArea: number;
  totalRoofArea: number;
  aggregateDailyDemand: number;
}

const BuildingVisualizationPanel: React.FC<Props> = ({
  buildings,
  handWashingAreas,
  faucetsPerArea,
  totalRoofArea,
  aggregateDailyDemand,
}) => {
  const totalWashPoints = Math.max(1, handWashingAreas * faucetsPerArea);
  const maxClassrooms = Math.max(1, ...buildings.map(building => building.numberOfClassrooms));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Preview</div>
          <div className="text-sm font-bold text-slate-800">Buildings and handwashing areas</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faucets</div>
          <div className="text-sm font-bold text-primary">{formatNumber(totalWashPoints)} points</div>
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-slate-50 p-5 text-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Building layout</div>
              <p className="mt-1 text-xs text-slate-500">Larger blocks mean more classrooms.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Roof area</div>
              <div className="text-lg font-black text-slate-900">{formatNumber(totalRoofArea)} m2</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {buildings.map((building, index) => {
              const area = building.numberOfClassrooms * building.roofAreaPerClassroom;
              const scale = Math.max(0.28, building.numberOfClassrooms / maxClassrooms);

              return (
                <div key={building.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800 truncate">{building.name}</div>
                      <div className="mt-1 text-[10px] font-medium text-slate-500">{formatNumber(building.numberOfClassrooms)} classrooms</div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">
                      B{index + 1}
                    </div>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                      style={{ width: `${Math.max(20, scale * 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Roof area</span>
                    <span className="font-bold text-slate-800">{formatNumber(area)} m2</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Summary</div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Buildings</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(buildings.length)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Classrooms</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(buildings.reduce((sum, building) => sum + building.numberOfClassrooms, 0))}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Roof area</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(totalRoofArea)} m2</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Daily use</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(aggregateDailyDemand)} L</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Handwashing layout</div>
              <p className="mt-1 text-xs text-slate-500">Based on your handwashing areas and faucet count.</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <HandMetal size={18} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {Array.from({ length: Math.max(1, handWashingAreas) }, (_, areaIndex) => (
              <div key={`wash-area-${areaIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">Wash Area {areaIndex + 1}</div>
                  <div className="text-[10px] font-black uppercase text-primary">{formatNumber(faucetsPerArea)} faucets</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: Math.max(1, faucetsPerArea) }, (_, faucetIndex) => (
                    <div
                      key={`faucet-${areaIndex}-${faucetIndex}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-sm"
                    >
                      {faucetIndex + 1}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Water use match</div>
            <div className="mt-2 text-sm font-bold">Roof collection is compared with daily handwashing use.</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-xl bg-white p-3 border border-slate-100">
                <div className="text-slate-500 uppercase font-bold">Wash areas</div>
                <div className="mt-1 text-xl font-black text-slate-900">{formatNumber(handWashingAreas)}</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-100">
                <div className="text-slate-500 uppercase font-bold">Faucets</div>
                <div className="mt-1 text-xl font-black text-slate-900">{formatNumber(totalWashPoints)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingVisualizationPanel;


