import React, { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { ReportCoverDetails } from '../../types';

type ReportMode = 'dashboard' | 'research';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (details: ReportCoverDetails) => void;
  mode?: ReportMode;
}

const defaultDetails = (mode: ReportMode): ReportCoverDetails => ({
  title: mode === 'research' ? 'Rainwater Harvesting Research Report' : 'Rainwater Harvesting Results',
  preparedBy: '',
  schoolName: 'MCS',
  location: '',
  reportDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

const ExportReportModal: React.FC<Props> = ({ isOpen, onClose, onGenerate, mode }) => {
  const resolvedMode: ReportMode = mode ?? 'dashboard';
  const [details, setDetails] = useState<ReportCoverDetails>(() => defaultDetails(resolvedMode));

  useEffect(() => {
    if (isOpen) setDetails(defaultDetails(resolvedMode));
  }, [isOpen, resolvedMode]);

  if (!isOpen) return null;

  const updateField = (field: keyof ReportCoverDetails, value: string) => {
    setDetails(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onGenerate({
      ...details,
      title: details.title.trim() || (resolvedMode === 'research' ? 'Rainwater Harvesting Research Report' : 'Rainwater Harvesting Results'),
      reportDate: details.reportDate || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-950/60 px-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{resolvedMode === 'research' ? 'Export Research Report' : 'Export PDF Report'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {resolvedMode === 'research'
                  ? 'Add cover details before generating the research-format PDF.'
                  : 'Add details for the cover page before downloading the report.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="Close export form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Report Title</span>
            <input
              value={details.title}
              onChange={event => updateField('title', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder={resolvedMode === 'research' ? 'Rainwater Harvesting Research Report' : 'Rainwater Harvesting Results'}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Prepared By</span>
            <input
              value={details.preparedBy}
              onChange={event => updateField('preparedBy', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Name or office"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">School / Office</span>
            <input
              value={details.schoolName}
              onChange={event => updateField('schoolName', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="School name"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Location</span>
            <input
              value={details.location}
              onChange={event => updateField('location', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Barangay, city, province"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Report Date</span>
            <input
              type="date"
              value={details.reportDate}
              onChange={event => updateField('reportDate', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Cover Notes</span>
            <textarea
              value={details.notes}
              onChange={event => updateField('notes', event.target.value)}
              rows={4}
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder={resolvedMode === 'research' ? 'Optional research context, adviser, section, or study scope' : 'Optional purpose, audience, or reminder for readers'}
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            {resolvedMode === 'research' ? 'Generate Research PDF' : 'Generate PDF'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExportReportModal;
