import React from 'react';
import { Calendar, Cloud, CloudRain, ShieldCheck, Sun } from 'lucide-react';
import { RainfallDataRow, SummaryData } from '../../types';

interface Props {
  data: RainfallDataRow[];
  summary: SummaryData;
}

const SynthesisSummary: React.FC<Props> = ({ data, summary }) => {
  if (data.length === 0) return null;

  const wetFrequency = summary.monthly.reduce((sum, month) => sum + (month.wetFrequency ?? 0), 0) / Math.max(1, summary.monthly.length);
  const maxIntensity = Math.max(...data.map(day => day.rain_mm));
  let drySpells: number[] = [];
  let currentDry = 0;

  data.forEach(day => {
    if (!day.wet) currentDry += 1;
    else if (currentDry > 0) {
      drySpells.push(currentDry);
      currentDry = 0;
    }
  });
  if (currentDry > 0) drySpells.push(currentDry);
  const avgDrySpell = drySpells.length > 0 ? drySpells.reduce((sum, value) => sum + value, 0) / drySpells.length : 0;

  const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className="bg-white rounded-md border border-slate-200 p-5 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={18} className="text-emerald-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Rain Test Summary</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase">Years Tested</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(summary.simulationYears)} Years</div>
          <div className="text-[9px] text-slate-400">Length of each rain test</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <CloudRain size={14} />
            <span className="text-[10px] font-bold uppercase">Yearly Rain</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(summary.annualRain, 1)} mm</div>
          <div className="text-[9px] text-slate-400">Average rain per tested year</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Cloud size={14} />
            <span className="text-[10px] font-bold uppercase">Rainy Days</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(wetFrequency, 1)}%</div>
          <div className="text-[9px] text-slate-400">Share of days with rain</div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Sun size={14} />
            <span className="text-[10px] font-bold uppercase">Usual Dry Stretch</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(avgDrySpell, 1)} d</div>
          <div className="text-[9px] text-slate-400">Average dry days in a row</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px]">
        <div className="text-slate-500 italic">
          Biggest rain day in this test: <span className="font-bold text-slate-700">{formatNumber(maxIntensity, 1)} mm</span>
        </div>
        <div className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase border border-emerald-100">
          Cautious result shown
        </div>
      </div>
    </div>
  );
};

export default SynthesisSummary;
