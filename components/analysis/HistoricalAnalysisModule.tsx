import React, { useState } from 'react';
import { Database, CheckCircle2, FileUp, Info, Wind } from 'lucide-react';
import { calibrateHistoricalRainfall } from '../../features/calibration/calibration';
import { CalibrationResult } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface Props {
  onCalibrationComplete: (result: CalibrationResult) => void;
}

const HistoricalAnalysisModule: React.FC<Props> = ({ onCalibrationComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const text = loadEvent.target?.result as string;
        const result = calibrateHistoricalRainfall(text);
        setCalibrationResult(result);
        onCalibrationComplete(result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to analyze historical data.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
      <div className="flex items-center gap-3">
        <Database className="text-primary w-5 h-5" />
        <h3 className="font-bold text-slate-800 text-sm">Upload Past Rain Records</h3>
      </div>

      {!calibrationResult ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-lg bg-white">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
            <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span className="text-xs font-medium text-slate-600">
              {isAnalyzing ? 'Reading rain records...' : 'Upload Daily CSV (Date, Rain)'}
            </span>
          </label>
          <p className="text-[10px] text-slate-400 mt-2 px-4">Use one row per day. Dates can be YYYY-MM-DD or MM/DD/YYYY.</p>
          {errorMessage && <p className="text-[10px] text-red-600 mt-3 px-4">{errorMessage}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
            <div className="flex items-center gap-1 font-bold">
              <CheckCircle2 size={14} /> Rain Records Loaded
            </div>
            <button onClick={() => setCalibrationResult(null)} className="text-[10px] underline">Reset</button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {calibrationResult.parameters.map(parameter => {
              const diagnostic = calibrationResult.monthlyDiagnostics.find(entry => entry.month === parameter.month);
              return (
                <div key={parameter.month} className="bg-white p-2 rounded border border-slate-200 text-[10px]">
                  <div className="font-bold text-slate-700 border-b border-slate-100 mb-1 flex justify-between">
                    <span>{MONTH_NAMES[parameter.month - 1]}</span>
                    <Wind size={10} className="text-slate-300" />
                  </div>
                  <div className="flex justify-between"><span>Dry days:</span> <span className="font-mono">{parameter.meanDrySpell}d</span></div>
                  <div className="flex justify-between"><span>Rainy days:</span> <span className="font-mono">{parameter.meanWetSpell}d</span></div>
                  <div className="flex justify-between text-primary font-bold"><span>Usual rain:</span> <span className="font-mono">{parameter.meanRain}mm</span></div>
                  <div className="flex justify-between text-slate-500"><span>Based on:</span> <span className="font-mono uppercase">{diagnostic?.source === 'default' ? 'built-in' : diagnostic?.source === 'smoothed' ? 'filled gap' : 'records'}</span></div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 p-2 rounded text-[9px] text-blue-700 flex gap-2">
            <Info size={14} className="shrink-0" />
            <span>Data match is {calibrationResult.fit.overallScore.toFixed(1)}/100. {calibrationResult.coverage.totalMissingDays} missing day(s) were found, so the dashboard keeps results cautious.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysisModule;
