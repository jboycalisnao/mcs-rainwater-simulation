import React from 'react';
import { BarChart3 } from 'lucide-react';

const interpretationGroups = [
  {
    title: 'Reliability percentage',
    points: [
      'Reliability shows the percentage of simulated days when the tank can fully supply the daily water need.',
      'A value of 90% means the tank met demand on about 90 out of every 100 simulated days.',
      'Higher reliability is better, but very high reliability may require a much larger and more expensive tank.',
    ],
  },
  {
    title: 'Cautious, typical, and best-case results',
    points: [
      'Cautious reliability is the safer planning value because it represents a less favorable rainfall outcome.',
      'Typical reliability represents the middle result from the simulation runs.',
      'Best-case reliability shows what may happen when rainfall timing is more favorable.',
      'For research recommendations, the cautious value should receive more weight than the best-case value.',
    ],
  },
  {
    title: 'Tank size comparison',
    points: [
      'If reliability rises sharply when tank size increases, storage capacity is a major limitation.',
      'If reliability barely improves after a larger tank, rainfall supply or roof catchment may be the stronger limitation.',
      'The recommended tank is not always the biggest tank; it should balance reliability, cost, and practicality.',
    ],
  },
  {
    title: 'Sensitivity analysis',
    points: [
      'Sensitivity analysis changes one input at a time to see which assumption affects the result most.',
      'A large reliability change means the model is sensitive to that input.',
      'If daily demand is most sensitive, water-saving practices may be as important as tank size.',
      'If roof area or runoff efficiency is most sensitive, catchment design and gutter quality may strongly affect performance.',
    ],
  },
];

const GuideInterpretResultsSection: React.FC = () => (
  <section id="guide-interpretation" className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#0053DF]">
        <BarChart3 size={20} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">How to interpret results</h3>
        <p className="text-sm text-slate-500">Use these notes when turning simulation outputs into a research conclusion.</p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      {interpretationGroups.map(group => (
        <article key={group.title} className="border border-slate-200 bg-slate-50 p-4 rounded-md">
          <h4 className="text-sm font-black text-slate-900">{group.title}</h4>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
            {group.points.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export default GuideInterpretResultsSection;
