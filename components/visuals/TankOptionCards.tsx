import React from 'react';
import { Building2, Droplets, ShieldCheck, Target, Wallet } from 'lucide-react';
import { Building, ReliabilityIntervalResult } from '../../types';

interface Props {
  results: ReliabilityIntervalResult[];
  onSelect: (size: number) => void;
  currentSelected: number;
  buildings: Building[];
  hideBreakdown?: boolean;
}

const TankOptionCards: React.FC<Props> = ({ results, onSelect, currentSelected, buildings, hideBreakdown = false }) => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(option => {
          const isSelected = currentSelected === option.data.tankSize;
          return (
            <button
              key={option.title}
              onClick={() => onSelect(option.data.tankSize)}
              className={`text-left bg-white border-2 rounded-xl p-4 transition-all hover:scale-[1.02] ${option.color} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${option.recommended ? 'bg-primary/10' : 'bg-slate-100'}`}>
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

      {!hideBreakdown && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-slate-400" />
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggested Share by Building</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map(building => {
              const area = building.numberOfClassrooms * building.roofAreaPerClassroom;
              const share = totalArea > 0 ? area / totalArea : 0;
              const buildingShareLiters = optimal.tankSize * share;
              return (
                <div key={building.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-slate-800 text-[11px] truncate pr-2">{building.name}</div>
                    <div className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded">{formatNumber(share * 100, 1)}% roof share</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Roof area</span>
                      <span className="font-bold text-slate-600">{formatNumber(area)} m2</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Tank</span>
                      <div className="text-right"><span className="text-sm font-black text-primary">{formatNumber(buildingShareLiters / 1000, 1)} kL</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2 text-[9px] text-slate-400 italic bg-white/50 p-2 rounded">
            <Droplets size={12} className="shrink-0 mt-0.5" />
            <span>This share is based on roof area. Final tank performance is still checked for the selected school or building.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankOptionCards;

