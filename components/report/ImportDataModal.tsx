import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileUp,
  FolderArchive,
  Info,
  MapPin,
  Upload,
  X,
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset, triggerFileDownload, fetchSampleFileText } from '../../data/sampleDataRegistry';
import { calibrateHistoricalRainfall } from '../../features/calibration/calibration';
import { CalibrationResult, SimulationReportJSON } from '../../types';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReport: (report: SimulationReportJSON) => void;
  onLoadCalibration: (result: CalibrationResult) => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onLoadReport,
  onLoadCalibration,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'upload'>('samples');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUseSample = async (sample: SampleDataset) => {
    setLoadingId(sample.id);
    try {
      const text = await fetchSampleFileText(sample.filename);
      const result = calibrateHistoricalRainfall(text);
      onLoadCalibration(result);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load sample dataset.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownloadSample = async (sample: SampleDataset) => {
    try {
      const text = await fetchSampleFileText(sample.filename);
      triggerFileDownload(sample.filename, text);
    } catch {
      // Fallback to browser direct link
      const a = document.createElement('a');
      a.href = sample.csvUrl;
      a.download = sample.filename;
      a.click();
    }
  };

  const processUploadedFile = (file: File) => {
    setUploadError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as SimulationReportJSON;
          if (!parsed.metadata || !parsed.harvest_summary || !parsed.reliability_table) {
            throw new Error('Invalid JSON structure. Missing metadata, harvest_summary, or reliability_table.');
          }
          onLoadReport(parsed);
          onClose();
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          const result = calibrateHistoricalRainfall(text);
          onLoadCalibration(result);
          onClose();
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Failed to calibrate rainfall CSV.');
        }
      };
      reader.readAsText(file);
    } else {
      setUploadError('Unsupported file type. Please upload a .csv rainfall dataset or a previously exported .json report.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        className="w-full max-w-4xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#0053DF] text-white shadow-md shadow-[#0053DF]/20">
              <FolderArchive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="import-modal-title" className="text-xl font-black text-slate-900">
                  Import Historical Rainfall Records
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#0053DF] border border-blue-100">
                  2 Datasets Available
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Calibrate the simulator using empirical daily rainfall records, or upload your own weather observations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-bold transition-all ${
              activeTab === 'samples'
                ? 'border-[#0053DF] text-[#0053DF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database size={16} />
            Sample Rainfall Records (CSV)
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-[#0053DF]">
              {SAMPLE_DATASETS.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-bold transition-all ${
              activeTab === 'upload'
                ? 'border-[#0053DF] text-[#0053DF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={16} />
            Upload Custom File
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'samples' && (
            <div className="space-y-4">
              {/* Category Subtitle */}
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Historical Weather Stations</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Empirical daily rainfall observations ready for Markov chain calibration.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {SAMPLE_DATASETS.length} Station Datasets Available
                </span>
              </div>

              {/* Sample Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_DATASETS.map(sample => {
                  const isCurrentLoading = loadingId === sample.id;

                  return (
                    <div
                      key={sample.id}
                      className="flex flex-col justify-between rounded-md border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Header Badge & Format */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <FileSpreadsheet size={12} />
                            CSV • {sample.fileSize}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                            {sample.badge}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#0053DF] transition-colors">
                          {sample.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{sample.location}</span>
                        </div>

                        {/* Description */}
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                          {sample.description}
                        </p>

                        {/* Key Stats Chips */}
                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2.5 border border-slate-100 text-[10px]">
                          {sample.keyStats.map(stat => (
                            <div key={stat.label}>
                              <span className="block text-slate-400 font-medium uppercase text-[9px]">{stat.label}</span>
                              <span className="font-bold text-slate-700">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadSample(sample)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                          title={`Download ${sample.filename} to your computer`}
                        >
                          <Download size={14} className="text-slate-500" />
                          Download CSV
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUseSample(sample)}
                          disabled={isCurrentLoading}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#0053DF] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
                        >
                          {isCurrentLoading ? (
                            <span>Calibrating...</span>
                          ) : (
                            <>
                              <CloudRain size={14} />
                              Calibrate & Simulate
                            </>
                          )}
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Information Banner */}
              <div className="rounded-md border border-blue-100 bg-blue-50/70 p-4 text-xs text-slate-700 flex items-start gap-3 mt-4">
                <Info size={18} className="text-[#0053DF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#0053DF]">How Calibration Works</h4>
                  <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                    Clicking <strong>Calibrate & Simulate</strong> passes the empirical rainfall records through the two-state Semi-Markov fitting engine. The dashboard calculates monthly wet-dry transition rates and rain depth distributions, allowing you to generate realistic stochastic weather forecasts for campus water-balance evaluation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.csv"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) processUploadedFile(file);
                }}
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#0053DF] bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-blue-50 text-[#0053DF] mb-3">
                  <FileUp size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Drop your file here, or <span className="text-[#0053DF] underline">browse</span>
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Accepts <span className="font-semibold text-slate-700">.CSV</span> daily rainfall records or <span className="font-semibold text-slate-700">.JSON</span> previously saved project files
                </p>
              </div>

              {uploadError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2">
                  <X size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error importing file: </span>
                    {uploadError}
                  </div>
                </div>
              )}

              {/* Format Reference Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 mb-1">
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    Rainfall Dataset (.CSV)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Raw empirical weather observations containing at least <code className="font-mono text-[10px]">Date</code> and <code className="font-mono text-[10px]">Rain</code> (in mm) columns. Trains the Markov generator to simulate regional weather patterns.
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 mb-1">
                    <FileJson size={16} className="text-[#0053DF]" />
                    Previously Saved Report (.JSON)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    A report previously exported from this dashboard containing saved school building dimensions, daily demand, and simulation curves. Restores your completed analysis session.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Meteorological calibration runs entirely client-side</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
