import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Droplets,
  HelpCircle,
  Layers,
  ShieldCheck,
  Target,
  Wallet,
} from 'lucide-react';
import { Building, ReliabilityIntervalResult } from '../../types';

interface Props {
  results: ReliabilityIntervalResult[];
  onSelect: (size: number) => void;
  currentSelected: number;
  buildings: Building[];
  hideBreakdown?: boolean;
}

const TankOptionCards: React.FC<Props> = ({ results, onSelect, currentSelected, buildings, hideBreakdown = false }) => {
  const [showReliabilityGuide, setShowReliabilityGuide] = useState(true);

  if (results.length === 0) return null;

  const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const totalArea = buildings.reduce((sum, building) => sum + (building.numberOfClassrooms * building.roofAreaPerClassroom), 0);
  const budget = results.find(result => result.conservativeReliability >= 75) || results[0];
  const optimal = results.find(result => result.conservativeReliability >= 90) || results[Math.floor(results.length / 2)];
  const resilient = results.find(result => result.conservativeReliability >= 98) || results[results.length - 1];

  const options = [
    {
      title: 'Budget Choice',
      desc: 'Smallest option that can cover many school days.',
      data: budget,
      icon: <Wallet className="text-slate-400" size={20} />,
      color: 'border-slate-200',
      tag: 'Basic cover',
    },
    {
      title: 'Recommended Size',
      desc: 'Best balance of tank size and dependable water supply.',
      data: optimal,
      icon: <Target className="text-primary" size={20} />,
      color: 'border-primary shadow-md',
      tag: 'Recommended',
      recommended: true,
    },
    {
      title: 'Extra Reserve',
      desc: 'Larger tank for longer dry periods.',
      data: resilient,
      icon: <ShieldCheck className="text-green-600" size={20} />,
      color: 'border-green-200',
      tag: 'More backup',
    },
  ];

  const optimalKl = optimal.tankSize / 1000;
  const isLargeTank = optimal.tankSize > 10000;
  const parallelTenKlCount = Math.ceil(optimal.tankSize / 10000);

  return (
    <div className="space-y-6">
      {/* 3 Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(option => {
          const isSelected = currentSelected === option.data.tankSize;
          return (
            <button
              key={option.title}
              onClick={() => onSelect(option.data.tankSize)}
              className={`text-left bg-white border-2 rounded-md p-4 transition-all hover:scale-[1.02] ${option.color} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-md ${option.recommended ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  {option.icon}
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${option.recommended ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {option.tag}
                </span>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-1">{option.title}</h4>
              <p className="text-[10px] text-slate-500 mb-4 min-h-8">{option.desc}</p>

              <div className="space-y-1 text-[10px] text-slate-500 mb-4">
                <div className="flex justify-between"><span>Cautious</span><span className="font-bold text-slate-700">{formatNumber(option.data.conservativeReliability, 1)}%</span></div>
                <div className="flex justify-between"><span>Typical</span><span className="font-bold text-slate-700">{formatNumber(option.data.medianReliability, 1)}%</span></div>
                <div className="flex justify-between"><span>Best case</span><span className="font-bold text-slate-700">{formatNumber(option.data.optimisticReliability, 1)}%</span></div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Capacity</div>
                  <div className="text-xl font-black text-slate-800">{formatNumber(option.data.tankSize / 1000, 1)} <span className="text-xs font-normal text-slate-400">kL</span></div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>Shortage Days</div>
                  <div className="font-bold text-slate-700">{option.data.droughtDaysRange[0]}-{option.data.droughtDaysRange[1]}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* What Does Reliability Mean Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[#0053DF]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              What Does Reliability Mean in This Simulation?
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowReliabilityGuide(!showReliabilityGuide)}
            className="text-xs font-semibold text-[#0053DF] hover:underline flex items-center gap-1"
          >
            {showReliabilityGuide ? 'Hide details' : 'How to read percentages'}
            {showReliabilityGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showReliabilityGuide && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-800">Reliability (%):</strong> The percentage of simulated school days where the rainwater tank completely covers the school's daily water usage without running dry.
            </p>
            <div className="bg-white border border-slate-200 rounded-md p-3 text-[11px] space-y-1">
              <div className="font-bold text-slate-800">For Example (e.g., {formatNumber(optimal.medianReliability, 1)}% Typical Reliability):</div>
              <p className="text-slate-600">
                Out of 100 school days, students have full rainwater for handwashing on approximately <strong>{Math.round(optimal.medianReliability)} days</strong>. On the remaining <strong>{100 - Math.round(optimal.medianReliability)} days</strong>, the tank will be empty or insufficient, requiring auxiliary water (tap or well).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="bg-white border border-slate-200 rounded-md p-2.5">
                <div className="font-bold text-slate-700">Cautious (10th Percentile)</div>
                <div className="text-slate-500 mt-1">Simulates severe drought years. Use this conservative value so the school does not risk water shortages.</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-md p-2.5">
                <div className="font-bold text-slate-700">Typical (Median / 50th Percentile)</div>
                <div className="text-slate-500 mt-1">The most probable outcome across normal multi-year rainfall patterns.</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-md p-2.5">
                <div className="font-bold text-slate-700">Best Case (90th Percentile)</div>
                <div className="text-slate-500 mt-1">Expected performance during exceptionally wet monsoon seasons with continuous refills.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Tanks in Parallel Recommendation (If size > 10 kL) */}
      {isLargeTank && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-md p-5 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#0053DF] text-white rounded-md shrink-0 mt-0.5">
              <Layers size={20} />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  No Single Tank for {formatNumber(optimalKl, 1)} kL? Connect Multiple Tanks in Parallel
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                  Standard School Practice
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard off-the-shelf polyethylene and stainless tanks in the Philippines (Bestank, Firstank, Weida) typically max out at <strong className="text-slate-800">10,000 L (10 kL)</strong> for vertical units. Because there is no single {formatNumber(optimalKl, 1)} kL off-the-shelf tank, civil engineers install <strong className="text-[#0053DF]">multiple standard tanks connected in parallel (a modular battery)</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-blue-200 rounded-md p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Target Setup (Recommended)</div>
                  <div className="text-base font-black text-[#0053DF] mt-1">{parallelTenKlCount} × 10,000 L Tanks</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Total: {formatNumber(parallelTenKlCount * 10, 1)} kL capacity. Fully achieves the {formatNumber(optimalKl, 1)} kL target with ~{Math.min(90, Math.round(optimal.medianReliability + 2))}% typical reliability.
                  </div>
                </div>

                <div className="bg-white border border-blue-200 rounded-md p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Exact Match Combo</div>
                  <div className="text-base font-black text-slate-800 mt-1">2 × 10 kL + 1 × 6 kL</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Total: 26.0 kL capacity. Matches the recommended {formatNumber(optimalKl, 1)} kL closely using standard catalog sizes.
                  </div>
                </div>

                <div className="bg-white border border-blue-200 rounded-md p-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Phased Starter Option</div>
                  <div className="text-base font-black text-slate-800 mt-1">1 or 2 × 10 kL Tanks</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Buy 1 tank first (~69% coverage) or 2 tanks (~78% coverage), then add additional tanks when PTA or school budget permits.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Share by Building */}
      {!hideBreakdown && (
        <div className="bg-slate-50 rounded-md border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-slate-400" />
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggested Share by Building</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map(building => {
              const area = building.numberOfClassrooms * building.roofAreaPerClassroom;
              const share = totalArea > 0 ? area / totalArea : 0;
              const buildingShareLiters = optimal.tankSize * share;
              const buildingShareKl = buildingShareLiters / 1000;
              const needsMultiple = buildingShareLiters > 10000;
              return (
                <div key={building.id} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-slate-800 text-[11px] truncate pr-2">{building.name}</div>
                    <div className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md">{formatNumber(share * 100, 1)}% roof share</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Roof area</span>
                      <span className="font-bold text-slate-600">{formatNumber(area)} m2</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Tank</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-primary">{formatNumber(buildingShareKl, 1)} kL</span>
                        {needsMultiple && (
                          <div className="text-[9px] text-blue-600 font-semibold">
                            ({Math.ceil(buildingShareLiters / 10000)} × 10 kL in parallel)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 text-[9px] text-slate-400 italic bg-white/50 p-2 rounded-md">
            <Droplets size={12} className="shrink-0 mt-0.5" />
            <span>This share is based on roof area. Final tank performance is checked for the selected school or building.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankOptionCards;


