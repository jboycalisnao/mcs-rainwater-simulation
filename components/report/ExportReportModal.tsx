import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { ReportCoverDetails } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (details: ReportCoverDetails) => void;
}

const defaultDetails = (): ReportCoverDetails => ({
  title: 'Rainwater Harvesting Results',
  preparedBy: '',
  schoolName: 'MCS',
  location: '',
  reportDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

const ExportReportModal: React.FC<Props> = ({ isOpen, onClose, onGenerate }) => {
  const [details, setDetails] = useState<ReportCoverDetails>(() => defaultDetails());

  if (!isOpen) return null;

  const updateField = (field: keyof ReportCoverDetails, value: string) => {
    setDetails(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onGenerate({
      ...details,
      title: details.title.trim() || 'Rainwater Harvesting Results',
      reportDate: details.reportDate || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Export PDF Report</h2>
              <p className="mt-1 text-sm text-slate-500">Add details for the cover page before downloading the report.</p>
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Rainwater Harvesting Results"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Prepared By</span>
            <input
              value={details.preparedBy}
              onChange={event => updateField('preparedBy', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Name or office"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">School / Office</span>
            <input
              value={details.schoolName}
              onChange={event => updateField('schoolName', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="School name"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Location</span>
            <input
              value={details.location}
              onChange={event => updateField('location', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Barangay, city, province"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Report Date</span>
            <input
              type="date"
              value={details.reportDate}
              onChange={event => updateField('reportDate', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Cover Notes</span>
            <textarea
              value={details.notes}
              onChange={event => updateField('notes', event.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="Optional purpose, audience, or reminder for readers"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Generate PDF
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExportReportModal;
