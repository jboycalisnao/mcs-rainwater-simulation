import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
  Droplets,
  ExternalLink,
  HandMetal,
  Users,
} from 'lucide-react';
import { InflowConfig } from '../../types';
import type { DemandConfig } from '../../features/simulation/useDashboardController';

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
  demandConfig?: DemandConfig;
}

const BuildingVisualizationPanel: React.FC<Props> = ({
  buildings,
  handWashingAreas,
  faucetsPerArea,
  totalRoofArea,
  aggregateDailyDemand,
  demandConfig,
}) => {
  const [showLiterature, setShowLiterature] = useState(false);

  // Facility counts
  const washAreas = demandConfig?.handWashingAreas ?? handWashingAreas;
  const washFaucets = demandConfig?.faucetsPerArea ?? faucetsPerArea;
  const litersPerFaucet = demandConfig?.litersPerFaucetDay ?? 25;
  const totalFaucets = Math.max(1, washAreas * washFaucets);
  const handwashingLiters = washAreas * washFaucets * litersPerFaucet;

  const comfortRooms = demandConfig?.comfortRooms ?? 4;
  const toiletsPerRoom = demandConfig?.toiletsPerRoom ?? 2;
  const litersPerToilet = demandConfig?.litersPerToiletDay ?? 62.5;
  const totalToilets = Math.max(1, comfortRooms * toiletsPerRoom);
  const comfortRoomLiters = comfortRooms * toiletsPerRoom * litersPerToilet;

  const population = demandConfig?.populationServed ?? 450;
  const perPersonDaily = population > 0 ? (aggregateDailyDemand / population) : 0;

  const maxClassrooms = Math.max(1, ...buildings.map(building => building.numberOfClassrooms));

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Preview & Water Facilities</div>
          <div className="text-base font-bold text-slate-800">Buildings, Handwashing Stations & Comfort Rooms</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            <HandMetal size={12} /> {formatNumber(totalFaucets)} Faucets
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            🚽 {formatNumber(totalToilets)} Toilets
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <Users size={12} /> {formatNumber(population)} People
          </span>
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Buildings & Catchment Layout */}
        <div className="bg-slate-50 p-5 text-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0053DF]">Building layout</div>
              <p className="mt-0.5 text-xs text-slate-500">Larger blocks mean more classrooms and roof catchment.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Roof Area</div>
              <div className="text-lg font-black text-slate-900">{formatNumber(totalRoofArea)} m2</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {buildings.map((building, index) => {
              const area = building.numberOfClassrooms * building.roofAreaPerClassroom;
              const scale = Math.max(0.28, building.numberOfClassrooms / maxClassrooms);

              return (
                <div key={building.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800 truncate">{building.name}</div>
                      <div className="mt-1 text-[10px] font-medium text-slate-500">{formatNumber(building.numberOfClassrooms)} classrooms</div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-[#0053DF]">
                      B{index + 1}
                    </div>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
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

          {/* Infrastructure Summary */}
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0053DF]">Summary</div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Buildings</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(buildings.length)}</div>
              </div>
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Classrooms</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(buildings.reduce((sum, building) => sum + building.numberOfClassrooms, 0))}</div>
              </div>
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Roof area</div>
                <div className="mt-1 text-lg font-black text-slate-900">{formatNumber(totalRoofArea)} m2</div>
              </div>
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-500">Daily use</div>
                <div className="mt-1 text-lg font-black text-secondary">{formatNumber(aggregateDailyDemand)} L</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Water Facilities (Handwashing + Comfort Rooms) & Studies Citations */}
        <div className="bg-white p-5 space-y-4">
          {/* Facility 1: Handwashing Stations */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">1. Handwashing Facilities</div>
                <p className="mt-0.5 text-xs text-slate-500">Group hygiene stations across school grounds.</p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {formatNumber(handwashingLiters)} L / day
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {Array.from({ length: Math.max(1, washAreas) }, (_, areaIndex) => (
                <div key={`wash-area-${areaIndex}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Station {areaIndex + 1}</span>
                    <span className="text-[10px] font-bold uppercase text-blue-600">{formatNumber(washFaucets)} faucets ({formatNumber(washFaucets * litersPerFaucet)} L/day)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Array.from({ length: Math.max(1, washFaucets) }, (_, faucetIndex) => (
                      <div
                        key={`faucet-${areaIndex}-${faucetIndex}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0053DF] text-[10px] font-bold text-white shadow-sm"
                        title={`Faucet ${faucetIndex + 1} (${litersPerFaucet} L/day)`}
                      >
                        {faucetIndex + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facility 2: Comfort Rooms (CRs) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">2. Comfort Rooms & Sanitation</div>
                <p className="mt-0.5 text-xs text-slate-500">Restroom blocks, toilet cubicles, and sanitation flushing.</p>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {formatNumber(comfortRoomLiters)} L / day
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: Math.max(1, comfortRooms) }, (_, crIndex) => (
                <div key={`cr-${crIndex}`} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">CR Block {crIndex + 1}</span>
                    <span className="text-[10px] font-bold text-slate-500">{formatNumber(toiletsPerRoom)} units</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                    {Array.from({ length: Math.max(1, toiletsPerRoom) }, (_, tIndex) => (
                      <span
                        key={`toilet-${crIndex}-${tIndex}`}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium"
                      >
                        🚽 T{tIndex + 1}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {formatNumber(toiletsPerRoom * litersPerToilet)} L/day
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facility 3: Population Equivalent Rate */}
          <div className="pt-3 border-t border-slate-100">
            <div className="rounded-md bg-emerald-50/70 border border-emerald-200 p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Campus Population Served</div>
                <div className="text-xs text-emerald-900 mt-0.5 font-medium">
                  {formatNumber(population)} students and teachers
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-emerald-800">{formatNumber(perPersonDaily, 2)} L / person / day</div>
                <div className="text-[9px] text-emerald-700">WHO School Benchmark: 1.5 - 5.0 L</div>
              </div>
            </div>
          </div>

          {/* Interactive Formula Card */}
          <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3.5 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Droplets size={14} className="text-[#0053DF]" />
              <span>Scientific Daily Water Usage Formula</span>
            </div>
            <div className="bg-white border border-blue-200 rounded px-3 py-2 font-mono text-[11px] text-slate-800 space-y-1">
              <div>Total Daily Demand = Handwash Usage + Comfort Room Sanitation</div>
              <div className="text-[#0053DF] font-bold">
                = ({washAreas} areas × {washFaucets} faucets × {litersPerFaucet} L) + ({comfortRooms} CRs × {toiletsPerRoom} toilets × {litersPerToilet} L)
              </div>
              <div className="text-secondary font-bold">
                = {formatNumber(handwashingLiters)} L + {formatNumber(comfortRoomLiters)} L = {formatNumber(aggregateDailyDemand)} L / Day
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Equates to <strong>{formatNumber(perPersonDaily, 2)} L per person daily</strong> across the {formatNumber(population)} students and teachers in the school.
            </p>
          </div>

          {/* Published Studies & Global Citations Accordion */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <BookOpen size={14} className="text-[#0053DF]" />
                <span>Published Studies & Standards (Where this comes from)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiterature(!showLiterature)}
                className="text-[11px] font-semibold text-[#0053DF] hover:underline flex items-center gap-0.5"
              >
                {showLiterature ? 'Hide citations' : 'View references'}
                {showLiterature ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showLiterature && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2 text-[10.5px] text-slate-600 leading-relaxed">
                <div>
                  <strong className="text-slate-800">1. DepEd Order No. 10, series of 2016 (DepEd WinS Policy):</strong>
                  <p>National Policy and Guidelines for the Comprehensive Water, Sanitation, and Hygiene in Schools (WinS) Program. Mandates group handwashing facilities (with continuous water access) and gender-segregated comfort room sanitation norms across Philippine schools.</p>
                </div>
                <div>
                  <strong className="text-slate-800">2. WHO / UNICEF JMP WASH in Schools Global Framework (2018 / 2020):</strong>
                  <p>Establishes standard day school water demand benchmarks of 1.5 to 3.0 L/person/day for hand hygiene and 2.0 to 5.0 L/person/day for sanitation and toilet flushing.</p>
                </div>
                <div>
                  <strong className="text-slate-800">3. Thomas, T. H. & Martinson, D. B. (2007) / UNEP:</strong>
                  <p><em>Roofwater Harvesting: A Handbook for Practitioners</em>. Technical guidelines defining institutional non-potable demand allocation (toilets and handwashing) as the primary target for untreated rainwater harvesting.</p>
                </div>
                <div>
                  <strong className="text-slate-800">4. Campisano et al. (2017), Elsevier Water Research:</strong>
                  <p><em>Urban rainwater harvesting systems: Research, implementation, and future perspectives</em>. Validated institutional fixture flow and flush frequency models for rainwater harvesting reliability sizing.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingVisualizationPanel;


