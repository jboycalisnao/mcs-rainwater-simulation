import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  FileUp,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calibrateHistoricalRainfall } from '../../features/calibration/calibration';
import { CalibrationResult } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface ComparisonResult {
  month: string;
  rainA: number;
  rainB: number;
  rainyChanceA: number;
  rainyChanceB: number;
}

const ClimateComparisonModule: React.FC = () => {
  const [dataA, setDataA] = useState<CalibrationResult | null>(null);
  const [dataB, setDataB] = useState<CalibrationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<'A' | 'B' | null>(null);

  const processFile = async (file: File, target: 'A' | 'B') => {
    setIsAnalyzing(target);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const result = calibrateHistoricalRainfall(event.target?.result as string);
        if (target === 'A') setDataA(result);
        else setDataB(result);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error parsing file.');
      } finally {
        setIsAnalyzing(null);
      }
    };
    reader.readAsText(file);
  };

  const chartData: ComparisonResult[] = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthA = dataA?.parameters.find(entry => entry.month === month);
    const monthB = dataB?.parameters.find(entry => entry.month === month);
    return {
      month: MONTH_NAMES[index].slice(0, 3),
      rainA: monthA?.meanRain ?? 0,
      rainB: monthB?.meanRain ?? 0,
      rainyChanceA: monthA?.p01 ?? 0,
      rainyChanceB: monthB?.p01 ?? 0,
    };
  });

  const annualA = dataA?.parameters.reduce((sum, month) => sum + (month.meanRain * 30), 0) ?? 0;
  const annualB = dataB?.parameters.reduce((sum, month) => sum + (month.meanRain * 30), 0) ?? 0;
  const delta = annualA > 0 ? ((annualB - annualA) / annualA) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {(['A', 'B'] as const).map(label => {
          const active = label === 'A' ? dataA : dataB;
          const isBusy = isAnalyzing === label;
          return (
            <div key={label} className={`p-4 rounded-xl border-2 border-dashed transition-all ${active ? label === 'A' ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${label === 'A' ? 'text-blue-600' : 'text-red-600'}`}>Dataset {label}</span>
                {active && <CheckCircle2 size={14} className={label === 'A' ? 'text-blue-500' : 'text-red-500'} />}
              </div>
              <label className="cursor-pointer block text-xs font-medium text-slate-600">
                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0], label)} />
                <div className="flex items-center gap-2">
                  <FileUp size={16} />
                  {isBusy ? 'Processing...' : active ? 'Change File' : 'Upload CSV'}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {dataA && dataB ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-primary" />
              <h4 className="text-sm font-bold text-slate-800">Rain Record Comparison</h4>
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              <Zap size={10} />
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% Rain Change
            </div>
          </div>

          <div className="h-48 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar name="Usual Rain A" dataKey="rainA" fill="#010e5b" radius={[2, 2, 0, 0]} />
                <Bar name="Usual Rain B" dataKey="rainB" fill="#ca080b" radius={[2, 2, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
            <div className="bg-slate-50 p-2 rounded">
              <div className="text-slate-400 font-bold uppercase mb-1">Rainy Day Chance</div>
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold">A: {(dataA.parameters.reduce((sum, item) => sum + item.p01, 0) / 12).toFixed(3)}</span>
                <span className="text-slate-300">to</span>
                <span className="text-secondary font-bold">B: {(dataB.parameters.reduce((sum, item) => sum + item.p01, 0) / 12).toFixed(3)}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <div className="text-slate-400 font-bold uppercase mb-1">Data Match Score</div>
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold">A: {dataA.fit.overallScore.toFixed(1)}</span>
                <span className="text-slate-300">to</span>
                <span className="text-secondary font-bold">B: {dataB.fit.overallScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ArrowRightLeft size={32} className="opacity-20 mb-2" />
          <p className="text-xs">Upload two rain records to compare them</p>
        </div>
      )}
    </div>
  );
};

export default ClimateComparisonModule;
