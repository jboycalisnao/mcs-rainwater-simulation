import React from 'react';
import { BookOpen, ClipboardList, FileText, Lightbulb, Quote, Target } from 'lucide-react';
import { InflowConfig, ReliabilityIntervalResult, SummaryData } from '../../types';
import { buildResearchSummary } from '../../utils/researchSummary';

interface ResearchSummaryPageProps {
  inflowConfig: InflowConfig;
  totalRoofArea: number;
  scopedDailyDemand: number;
  simulationYears: number;
  ensembleRuns: number;
  summary: SummaryData | null;
  results: ReliabilityIntervalResult[];
}

const ResearchBlock: React.FC<{
  title: string;
  icon: React.ReactNode;
  points: string[];
}> = ({ title, icon, points }) => (
  <section className="border border-slate-200 bg-white p-5 shadow-sm rounded-md">
    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-primary">
        {icon}
      </div>
      <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">{title}</h4>
    </div>
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
      {points.map(point => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  </section>
);

const ResearchSummaryPage: React.FC<ResearchSummaryPageProps> = ({
  inflowConfig,
  totalRoofArea,
  scopedDailyDemand,
  simulationYears,
  ensembleRuns,
  summary,
  results,
}) => {
  if (results.length === 0 || !summary) return null;

  const research = buildResearchSummary({
    inflowConfig,
    totalRoofArea,
    scopedDailyDemand,
    simulationYears,
    ensembleRuns,
    summary,
    results,
  });

  return (
    <section className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Research Summary</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              A citation-ready research outline for presenting the rainwater harvesting model as a Mathematical and Computational Science output.
            </p>
          </div>
        </div>
        {research.recommendedTank && (
          <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm rounded-md">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recommended Tank</div>
            <div className="mt-1 font-black text-slate-900">{research.recommendedTank.tankSize.toLocaleString()} L</div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResearchBlock title="Problem Statement" icon={<FileText size={18} />} points={research.problemStatement} />
        <ResearchBlock title="Objective" icon={<Target size={18} />} points={research.objective} />
        <ResearchBlock title="Method" icon={<ClipboardList size={18} />} points={research.method} />
        <ResearchBlock title="Simulation Design" icon={<ClipboardList size={18} />} points={research.simulationDesign} />
        <ResearchBlock title="Results" icon={<Lightbulb size={18} />} points={research.results} />
        <ResearchBlock title="Recommendation" icon={<Lightbulb size={18} />} points={research.recommendation} />
      </div>

      <div className="mt-4">
        <ResearchBlock title="Conclusion" icon={<BookOpen size={18} />} points={research.conclusion} />
      </div>

      <section className="mt-4 border border-slate-200 bg-slate-50 p-5 rounded-md">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-primary">
            <Quote size={18} />
          </div>
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Citation-Ready Outputs</h4>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {research.citationOutputs.map(statement => (
            <li key={statement}>{statement}</li>
          ))}
        </ul>
      </section>
    </section>
  );
};

export default ResearchSummaryPage;
