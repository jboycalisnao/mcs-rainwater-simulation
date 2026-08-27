import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CalibrationResult } from '../../types';

interface Props {
  calibrationResult: CalibrationResult | null;
  ensembleRuns: number;
}

const ModelConfidencePanel: React.FC<Props> = ({ calibrationResult, ensembleRuns }) => {
  if (!calibrationResult) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        No rain record has been uploaded yet. The dashboard is using built-in local rain assumptions for now.
      </div>
    );
  }

  const severeWarnings = calibrationResult.warnings.filter(entry => entry.code === 'LOW_CONFIDENCE' || entry.code === 'MISSING_DAYS');
  const getPlainWarning = (code: string) => {
    switch (code) {
      case 'LOW_CONFIDENCE':
        return 'The uploaded rain record does not match the test very closely, so treat the tank result as a guide.';
      case 'MISSING_DAYS':
        return 'Some dates are missing from the rain record. More complete data will improve the result.';
      case 'DUPLICATE_DATE':
        return 'A repeated date was found and one copy was ignored.';
      case 'INVALID_RAIN_VALUE':
        return 'A rain value could not be read and was treated as 0 mm.';
      case 'SPARSE_MONTH':
      case 'FALLBACK_DEFAULT':
      case 'FALLBACK_SMOOTHED':
      case 'PARTIAL_MONTH':
        return 'One month had limited rain records, so the dashboard filled the gap using safer assumptions.';
      default:
        return 'Please review the uploaded rain record for possible data issues.';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Model Confidence</h3>
          <p className="text-xs text-slate-500">How much trust to place in the current tank result.</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${calibrationResult.fit.overallScore >= 80 ? 'bg-green-100 text-green-700' : calibrationResult.fit.overallScore >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          Data Match {calibrationResult.fit.overallScore.toFixed(1)}/100
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Rain Days Read</div>
          <div className="text-lg font-black text-slate-800">{calibrationResult.coverage.totalObservedDays.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{calibrationResult.coverage.dateRange?.start} to {calibrationResult.coverage.dateRange?.end}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Missing Days</div>
          <div className="text-lg font-black text-slate-800">{calibrationResult.coverage.totalMissingDays.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Fewer gaps means a stronger result.</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Rain Tests</div>
          <div className="text-lg font-black text-slate-800">{ensembleRuns}</div>
          <div className="text-[10px] text-slate-500">More tests help avoid overconfident sizing.</div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {severeWarnings.length === 0 ? (
          <div className="flex items-start gap-2 text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>No major data problems were found. The tank result is still shown as a range because weather can vary.</span>
          </div>
        ) : severeWarnings.map((warning, index) => (
          <div key={`${warning.code}-${index}`} className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{getPlainWarning(warning.code)}</span>
          </div>
        ))}

        {calibrationResult.warnings.slice(0, 4).map((warning, index) => (
          <div key={`${warning.code}-detail-${index}`} className="flex items-start gap-2 text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-slate-400" />
            <span>{getPlainWarning(warning.code)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelConfidencePanel;
