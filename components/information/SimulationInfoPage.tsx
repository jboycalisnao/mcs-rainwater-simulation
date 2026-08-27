import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import GuideComponentSection from './GuideComponentSection';
import GuideFormulaSection from './GuideFormulaSection';
import GuideKeyTermsSection from './GuideKeyTermsSection';
import GuideMethodSections from './GuideMethodSections';
import GuideNavigation from './GuideNavigation';
import GuideOverview from './GuideOverview';
import GuideSummary from './GuideSummary';

interface SimulationInfoPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimulationInfoPage: React.FC<SimulationInfoPageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/45 px-4 py-4 sm:py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-info-title"
        className="mx-auto min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:min-h-0"
        onClick={event => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#010e5b] text-white">
                <HelpCircle size={20} />
              </div>
              <div className="min-w-0">
                <h2 id="simulation-info-title" className="truncate text-lg font-black text-slate-900 sm:text-2xl">
                  Scientific Guide to the Simulation
                </h2>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Detailed, simple explanations of the rain model, water balance, and dashboard components.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close information page"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-6 sm:px-7 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
            <GuideNavigation />
            <div className="min-w-0 scroll-smooth">
              <GuideOverview />
              <GuideMethodSections />
              <GuideFormulaSection />
              <GuideComponentSection />
              <GuideKeyTermsSection />
              <GuideSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationInfoPage;
