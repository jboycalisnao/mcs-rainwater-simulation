import React, { useRef, useState } from 'react';
import { Calculator, FileJson, HelpCircle, MapPin, TrendingUp, Upload } from 'lucide-react';
import SimulationInfoPage from './components/information/SimulationInfoPage';
import ExportReportModal from './components/report/ExportReportModal';
import DashboardResults from './features/simulation/DashboardResults';
import DashboardSidebar from './features/simulation/DashboardSidebar';
import { useDashboardController } from './features/simulation/useDashboardController';

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInfoPageOpen, setIsInfoPageOpen] = useState(false);
  const dashboard = useDashboardController();

  const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-[#010e5b] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Calculator className="h-8 w-8 shrink-0 text-white" />
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">MCS <span className="font-light opacity-80">| Rainwater Harvesting Dashboard</span></h1>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium md:gap-4">
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={dashboard.handleReportUpload} />
            <button
              type="button"
              onClick={() => setIsInfoPageOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Open information page"
              title="How the simulation works"
            >
              <HelpCircle size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="hidden items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition-colors md:flex">
              <Upload size={16} /> Import JSON
            </button>
            <button onClick={() => setIsExportModalOpen(true)} disabled={dashboard.viewMode !== 'report' && (dashboard.rainfallData.length === 0 || dashboard.simulationResults.length === 0)} className="hidden bg-[#ca080b] px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm font-semibold disabled:bg-slate-400 disabled:cursor-not-allowed md:block">
              Export PDF
            </button>
          </nav>
        </div>
      </header>

      <SimulationInfoPage
        isOpen={isInfoPageOpen}
        onClose={() => setIsInfoPageOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onGenerate={dashboard.handleExportReport}
      />

      {dashboard.viewMode === 'report' && dashboard.reportData && (
        <div className="bg-white border-b border-slate-200 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 pr-6">
                <FileJson size={14} className="text-blue-600" />
                Report: {new Date(dashboard.reportData.generated_at).toLocaleDateString()}
              </div>
              <div className="flex gap-6 text-sm text-slate-600">
                <span><MapPin size={14} className="inline opacity-40 mr-1" /> {formatNumber(dashboard.reportData.metadata.number_of_classrooms)} classrooms</span>
                <span><TrendingUp size={14} className="inline opacity-40 mr-1" /> {formatNumber(dashboard.reportData.metadata.roof_area_per_class_m2)} m2/class</span>
                <span className="font-medium text-primary">Daily Use: {formatNumber(dashboard.reportData.metadata.total_daily_demand_L)} L</span>
              </div>
            </div>
            <button onClick={() => dashboard.setViewMode('live')} className="text-xs font-bold text-secondary hover:underline">Back to Simulation</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <DashboardSidebar
            sidebarTab={dashboard.sidebarTab}
            setSidebarTab={dashboard.setSidebarTab}
            onCalibrationComplete={dashboard.handleCalibrationComplete}
            genYears={dashboard.genYears}
            onGenerationYearsChange={dashboard.setGenYears}
            genSeed={dashboard.genSeed}
            isGenerating={dashboard.isGenerating}
            onGenerateRainfall={dashboard.handleGenerateRainfall}
            defaultEnsembleRuns={dashboard.defaultEnsembleRuns}
            inflowConfig={dashboard.inflowConfig}
            setInflowConfig={dashboard.setInflowConfig}
            totalRoofArea={dashboard.totalRoofArea}
            totalClassrooms={dashboard.totalClassrooms}
            demandConfig={dashboard.demandConfig}
            setDemandConfig={dashboard.setDemandConfig}
            aggregateDailyDemand={dashboard.aggregateDailyDemand}
            onRunAnalysis={dashboard.runAnalysis}
            disableRunAnalysis={dashboard.viewMode === 'report' || dashboard.rainfallEnsemble.length === 0}
          />
        </div>

        <div className="lg:col-span-8">
          <DashboardResults
            calibrationResult={dashboard.calibrationResult}
            ensembleRuns={dashboard.rainfallEnsemble.length || dashboard.defaultEnsembleRuns}
            analysisScope={dashboard.analysisScope}
            setAnalysisScope={dashboard.setAnalysisScope}
            inflowConfig={dashboard.inflowConfig}
            filteredInflowConfig={dashboard.filteredInflowConfig}
            rainfallData={dashboard.rainfallData}
            visibleSummary={dashboard.visibleSummary}
            scopedDailyDemand={dashboard.scopedDailyDemand}
            playback={dashboard.playback}
            currentDayData={dashboard.currentDayData}
            selectedTankSize={dashboard.selectedTankSize}
            setSelectedTankSize={dashboard.setSelectedTankSize}
            visibleResults={dashboard.visibleResults}
            visibleBrandMap={dashboard.visibleBrandMap}
            currentReliability={dashboard.currentReliability}
            viewMode={dashboard.viewMode}
          />
        </div>
      </main>
    </div>
  );
};

export default App;


