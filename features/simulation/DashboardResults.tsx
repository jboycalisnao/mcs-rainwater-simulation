import React from 'react';
import {
  AlertCircle,
  ChevronDown,
  Droplets,
  Filter,
  Lightbulb,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ModelConfidencePanel from '../../components/analysis/ModelConfidencePanel';
import SensitivityAnalysisModule from '../../components/analysis/SensitivityAnalysisModule';
import ResearchSummaryPage from '../../components/research/ResearchSummaryPage';
import HarvestingAnalogies from '../../components/visuals/HarvestingAnalogies';
import BrandMarketComparison from '../../components/visuals/BrandMarketComparison';
import SynthesisSummary from '../../components/visuals/SynthesisSummary';
import TankOptionCards from '../../components/visuals/TankOptionCards';
import {
  CalibrationResult,
  InflowConfig,
  RainfallDataRow,
  ReliabilityIntervalResult,
  SummaryData,
} from '../../types';
import { selectRecommendedTank } from '../../utils/tankSizing';
import { DemandConfig } from './useDashboardController';

interface PlaybackState {
  currentDayIndex: number;
  isPlaying: boolean;
  setCurrentDayIndex: React.Dispatch<React.SetStateAction<number>>;
  togglePlayback: () => void;
}

interface Props {
  calibrationResult: CalibrationResult | null;
  ensembleRuns: number;
  analysisScope: 'school' | string;
  setAnalysisScope: React.Dispatch<React.SetStateAction<'school' | string>>;
  inflowConfig: InflowConfig;
  filteredInflowConfig: InflowConfig;
  rainfallData: RainfallDataRow[];
  rainfallEnsemble: RainfallDataRow[][];
  visibleSummary: SummaryData | null;
  scopedDailyDemand: number;
  demandConfig: DemandConfig;
  playback: PlaybackState;
  currentDayData: RainfallDataRow | null;
  selectedTankSize: number;
  setSelectedTankSize: React.Dispatch<React.SetStateAction<number>>;
  visibleResults: ReliabilityIntervalResult[];
  visibleBrandMap: Record<number, ReliabilityIntervalResult>;
  currentReliability: ReliabilityIntervalResult | null;
  viewMode: 'live' | 'report';
  onExportResearchPdf?: () => void;
}

const DashboardResults: React.FC<Props> = ({
  calibrationResult,
  ensembleRuns,
  analysisScope,
  setAnalysisScope,
  inflowConfig,
  filteredInflowConfig,
  rainfallData,
  rainfallEnsemble,
  visibleSummary,
  scopedDailyDemand,
  demandConfig,
  playback,
  currentDayData,
  selectedTankSize,
  setSelectedTankSize,
  visibleResults,
  visibleBrandMap,
  currentReliability,
  viewMode,
  onExportResearchPdf,
}) => {
  const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className="space-y-6">
      <ModelConfidencePanel calibrationResult={calibrationResult} ensembleRuns={ensembleRuns} />

      <div className="bg-white border border-slate-200 rounded-md px-4 py-3 flex items-center justify-between shadow-sm sticky top-[72px] z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-md text-primary"><Filter size={18} /></div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Show Results For</h4>
            <p className="text-[11px] text-slate-600 font-medium">Choose the whole school or one building.</p>
          </div>
        </div>
        <div className="relative min-w-[200px]">
          <select value={analysisScope} onChange={event => setAnalysisScope(event.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2.5 pl-4 pr-10 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer">
            <option value="school">Whole School</option>
            <optgroup label="Individual Buildings">
              {inflowConfig.buildings.map(building => <option key={building.id} value={building.id}>{building.name}</option>)}
            </optgroup>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
        </div>
      </div>

      {rainfallData.length > 0 && visibleSummary && (
        <>
          <SynthesisSummary data={rainfallData} summary={visibleSummary} />
          <HarvestingAnalogies rainfallData={rainfallData} inflowConfig={filteredInflowConfig} dailyDemand={scopedDailyDemand} />
        </>
      )}

      {visibleResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={18} className="text-primary" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{analysisScope === 'school' ? 'Recommended Tank Choices' : 'Tank Choices for This Building'}</h3>
          </div>
          <TankOptionCards results={visibleResults} currentSelected={selectedTankSize} onSelect={setSelectedTankSize} buildings={inflowConfig.buildings} hideBreakdown={analysisScope !== 'school'} />
          {(() => {
            const optimalResult = selectRecommendedTank(visibleResults);
            return (
              <BrandMarketComparison
                reliabilityMap={visibleBrandMap}
                onSelect={setSelectedTankSize}
                selectedSize={selectedTankSize}
                recommendedSize={optimalResult?.tankSize}
                recommendedReliability={optimalResult ?? undefined}
                dailyDemand={scopedDailyDemand}
              />
            );
          })()}
          {viewMode === 'live' && (
            <>
              <SensitivityAnalysisModule
                rainfallEnsemble={rainfallEnsemble}
                inflowConfig={filteredInflowConfig}
                demandConfig={demandConfig}
                scopedDailyDemand={scopedDailyDemand}
                selectedTankSize={selectedTankSize}
              />
              <ResearchSummaryPage
                inflowConfig={filteredInflowConfig}
                totalRoofArea={filteredInflowConfig.buildings.reduce((sum, building) => sum + (building.numberOfClassrooms * building.roofAreaPerClassroom), 0)}
                scopedDailyDemand={scopedDailyDemand}
                simulationYears={visibleSummary?.simulationYears ?? 0}
                ensembleRuns={ensembleRuns}
                summary={visibleSummary}
                results={visibleResults}
                onExportResearchPdf={onExportResearchPdf}
              />
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{viewMode === 'report' ? 'Saved Report' : 'Monthly Water Collected'}</h3>
            <p className="text-xs text-slate-500">Shows how much rainwater the selected roofs can collect.</p>
          </div>
          {currentReliability && (
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase">Days Covered</div>
              <div className="text-2xl font-black text-secondary">{formatNumber(currentReliability.conservativeReliability, 1)}%</div>
              <div className="text-[10px] text-slate-400">typical {formatNumber(currentReliability.medianReliability, 1)}%, best case {formatNumber(currentReliability.optimisticReliability, 1)}%</div>
            </div>
          )}
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleSummary?.monthly ?? []}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0053DF" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0053DF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="avgInflow" name="Water collected (L)" stroke="#0053DF" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {visibleResults.length > 0 && (
          <div className="h-64 mt-10 pt-10 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Tank size vs days covered for {analysisScope === 'school' ? 'school' : 'selected building'}</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleResults}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tankSize" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="conservativeReliability" stroke="#ca080b" strokeWidth={2} dot={false} name="Cautious result" />
                <Line type="monotone" dataKey="medianReliability" stroke="#0053DF" strokeWidth={2} dot={false} name="Typical result" />
                <Line type="monotone" dataKey="optimisticReliability" stroke="#16a34a" strokeWidth={2} dot={false} name="Best-case result" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center text-primary"><Droplets size={20} /></div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Yearly Water Collected</div>
            <div className="text-lg font-bold">{formatNumber((visibleSummary?.annualInflow ?? 0) / 1000, 1)} m3</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center text-secondary"><AlertCircle size={20} /></div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Daily Usage</div>
            <div className="text-lg font-bold">{formatNumber(scopedDailyDemand)} L</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Selected Tank</div>
          <div className="text-lg font-bold text-primary">{currentReliability ? `${formatNumber(currentReliability.tankSize / 1000, 1)} kL selected` : 'Select a tank size'}</div>
          <div className="text-[10px] text-slate-400 mt-1">Results are shown as a range because rainfall changes each year.</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardResults;


