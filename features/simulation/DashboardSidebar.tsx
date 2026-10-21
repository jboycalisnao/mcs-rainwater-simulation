import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRightLeft,
  Building2,
  CloudRain,
  Droplets,
  Info,
  Lock,
  Play,
  RefreshCw,
  Ruler,
  Waves,
  X,
} from 'lucide-react';
import ModuleCard from '../../components/ModuleCard';
import HistoricalAnalysisModule from '../../components/analysis/HistoricalAnalysisModule';
import ClimateComparisonModule from '../../components/analysis/ClimateComparisonModule';
import BuildingVisualizationPanel from '../../components/infrastructure/BuildingVisualizationPanel';
import InfrastructureConfigPanel from '../../components/infrastructure/InfrastructureConfigPanel';
import { DemandConfig } from '../simulation/useDashboardController';
import { CalibrationResult, InflowConfig } from '../../types';

interface Props {
  sidebarTab: 'calibrate' | 'compare';
  setSidebarTab: React.Dispatch<React.SetStateAction<'calibrate' | 'compare'>>;
  onCalibrationComplete: (result: CalibrationResult) => void;
  genYears: number;
  onGenerationYearsChange: (value: string) => void;
  genSeed: number;
  isGenerating: boolean;
  onGenerateRainfall: () => void;
  defaultEnsembleRuns: number;
  inflowConfig: InflowConfig;
  setInflowConfig: React.Dispatch<React.SetStateAction<InflowConfig>>;
  totalRoofArea: number;
  totalClassrooms: number;
  demandConfig: DemandConfig;
  setDemandConfig: React.Dispatch<React.SetStateAction<DemandConfig>>;
  aggregateDailyDemand: number;
  onRunAnalysis: () => void;
  disableRunAnalysis: boolean;
}

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

const DashboardSidebar: React.FC<Props> = ({
  sidebarTab,
  setSidebarTab,
  onCalibrationComplete,
  genYears,
  onGenerationYearsChange,
  genSeed,
  isGenerating,
  onGenerateRainfall,
  defaultEnsembleRuns,
  inflowConfig,
  setInflowConfig,
  totalRoofArea,
  totalClassrooms,
  demandConfig,
  setDemandConfig,
  aggregateDailyDemand,
  onRunAnalysis,
  disableRunAnalysis,
}) => {
  const [isRainfallHelpOpen, setIsRainfallHelpOpen] = useState(false);
  const [isInfrastructureOpen, setIsInfrastructureOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ModuleCard title="Rain Records" icon={<RefreshCw size={20} />} step={1}>
        <div className="flex p-1 bg-slate-100 rounded-md mb-4">
          <button onClick={() => setSidebarTab('calibrate')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${sidebarTab === 'calibrate' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <RefreshCw size={12} /> Use Data
          </button>
          <button onClick={() => setSidebarTab('compare')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${sidebarTab === 'compare' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
            <ArrowRightLeft size={12} /> Compare
          </button>
        </div>
        {sidebarTab === 'calibrate' ? <HistoricalAnalysisModule onCalibrationComplete={onCalibrationComplete} /> : <ClimateComparisonModule />}
      </ModuleCard>

      <ModuleCard title="Rain Forecast Test" icon={<CloudRain size={20} />} step={2}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test setup</div>
              <p className="text-[11px] text-slate-500">Choose how many years of possible rain to test.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRainfallHelpOpen(true)}
              className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
              aria-label="Open rain test help"
            >
              <Info size={16} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration (Years)</label>
            <input type="number" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={genYears} onChange={event => onGenerationYearsChange(event.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Run ID</label>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 italic">
                <Lock size={10} className="text-slate-400" /> Auto-generated
              </span>
            </div>
            <div className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-400 font-mono select-none cursor-not-allowed flex items-center justify-between">
              <span>{genSeed}</span>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">Auto</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">How results are checked</div>
            <div>The dashboard tests {defaultEnsembleRuns} possible rain patterns and shows the safer tank result.</div>
          </div>

          <button onClick={onGenerateRainfall} disabled={isGenerating} className="w-full text-white py-2 rounded-md transition-all flex items-center justify-center gap-2 font-medium bg-blue-600 hover:bg-blue-700">
            {isGenerating ? 'Preparing rain test...' : <><Play size={16} /> Start Rain Test</>}
          </button>
        </div>
      </ModuleCard>

      {isRainfallHelpOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
          style={{ zIndex: 99999 }}
          onClick={() => setIsRainfallHelpOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rainfall-help-title"
            className="w-full max-w-lg rounded-md bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="rainfall-help-title" className="text-base font-bold text-slate-800">Rain Test Help</h3>
                <p className="text-xs text-slate-500">Simple notes for the rain test controls.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRainfallHelpOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close rainfall generation help"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-slate-600">
              <div>
                <div className="font-semibold text-slate-800">Duration (Years)</div>
                <p>How long the rainfall simulation should run.</p>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Run ID</div>
                <p>A number that lets the same rain test be repeated later (auto-generated for each simulation run).</p>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Possible Rain Patterns</div>
                <p>The dashboard checks several possible rainy and dry years.</p>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Safer Tank Result</div>
                <p>The tank suggestion uses the cautious result, not the most hopeful one.</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsRainfallHelpOpen(false)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ModuleCard title="Buildings & Daily Water Use" icon={<Droplets size={20} />} step={3}>
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School setup</div>
                <p className="mt-1 text-sm text-slate-600">Configure buildings, catchment roofs, handwash faucets, and comfort rooms.</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Building2 size={18} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-white border border-slate-200 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Buildings & Roof</div>
                <div className="mt-1 text-lg font-black text-slate-800">{formatNumber(inflowConfig.buildings.length)} bldgs · {formatNumber(totalRoofArea)} m²</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{formatNumber(totalClassrooms)} classrooms</div>
              </div>
              <div className="rounded-md bg-white border border-slate-200 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Water Facilities</div>
                <div className="mt-1 text-lg font-black text-slate-800">
                  {demandConfig.handWashingAreas * demandConfig.faucetsPerArea} faucets · {(demandConfig.comfortRooms ?? 4) * (demandConfig.toiletsPerRoom ?? 2)} toilets
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{demandConfig.populationServed ?? 450} students & staff</div>
              </div>
              <div className="rounded-md bg-white border border-slate-200 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Handwash Demand</div>
                <div className="mt-1 text-lg font-black text-blue-600">
                  {formatNumber(demandConfig.handWashingAreas * demandConfig.faucetsPerArea * demandConfig.litersPerFaucetDay)} L/day
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{demandConfig.handWashingAreas} stations × {demandConfig.faucetsPerArea} taps</div>
              </div>
              <div className="rounded-md bg-white border border-slate-200 p-3">
                <div className="text-[10px] font-bold uppercase text-slate-400">Comfort Room Demand</div>
                <div className="mt-1 text-lg font-black text-emerald-600">
                  {formatNumber((demandConfig.comfortRooms ?? 4) * (demandConfig.toiletsPerRoom ?? 2) * (demandConfig.litersPerToiletDay ?? 62.5))} L/day
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{demandConfig.comfortRooms ?? 4} CRs × {demandConfig.toiletsPerRoom ?? 2} cubicles</div>
              </div>
            </div>

            <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">Total Campus Daily Demand:</span>
              <span className="font-black text-[#0053DF] text-sm">
                {formatNumber(aggregateDailyDemand)} L/day ({((aggregateDailyDemand) / (demandConfig.populationServed || 450)).toFixed(2)} L/person)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsInfrastructureOpen(true)}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Ruler size={16} />
              Edit School Setup & Formulas
            </button>
          </div>

          <button onClick={onRunAnalysis} disabled={disableRunAnalysis} className="w-full bg-blue-600 text-white py-2.5 rounded-md font-bold shadow-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2">
            <Waves size={18} /> Update Tank Results
          </button>
        </div>
      </ModuleCard>

      {isInfrastructureOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
          style={{ zIndex: 99999 }}
          onClick={() => setIsInfrastructureOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="infrastructure-overlay-title"
            className="min-h-screen w-full bg-white overflow-hidden rounded-none"
            onClick={event => event.stopPropagation()}
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
              <div>
                <h3 id="infrastructure-overlay-title" className="text-xl font-black text-slate-800">Buildings, Facilities & Daily Water Demand</h3>
                <p className="text-sm text-slate-500">Configure buildings, handwashing stations, comfort rooms, and campus population based on global WASH standards.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInfrastructureOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close infrastructure overlay"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6 bg-slate-50">
              <BuildingVisualizationPanel
                buildings={inflowConfig.buildings}
                handWashingAreas={demandConfig.handWashingAreas}
                faucetsPerArea={demandConfig.faucetsPerArea}
                totalRoofArea={totalRoofArea}
                aggregateDailyDemand={aggregateDailyDemand}
                demandConfig={demandConfig}
              />

              <div className="mt-6">
                <InfrastructureConfigPanel
                  inflowConfig={inflowConfig}
                  setInflowConfig={setInflowConfig}
                  demandConfig={demandConfig}
                  setDemandConfig={setDemandConfig}
                  totalRoofArea={totalRoofArea}
                  totalClassrooms={totalClassrooms}
                  aggregateDailyDemand={aggregateDailyDemand}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DashboardSidebar;
