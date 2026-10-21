import React from 'react';
import { FlaskConical } from 'lucide-react';

const equations = [
  {
    label: 'Daily water demand (usage)',
    formula: '(handwashing areas x faucets x L/faucet) + (comfort rooms x toilets x L/toilet)',
    explanation: 'Combines handwashing hygiene with comfort room (toilet flushing & cleaning) water needs. For a 450-person school wing, (4 x 5 x 25 L) + (4 x 2 x 62.5 L) = 1,000 L/day (~2.22 L/person/day).',
    citation: 'DepEd Order No. 10 s.2016; WHO/UNICEF WASH Guidelines (1.5-5.0 L/person/day); Thomas & Martinson (2007) / UNEP.',
  },
  {
    label: 'Roof catchment area',
    formula: 'classrooms x roof area per classroom',
    explanation: 'Estimates the total impervious surface collecting rainfall runoff for downspout gutters.',
  },
  {
    label: 'Collectable rain',
    formula: 'max(0, rainfall - first flush loss)',
    explanation: 'The first dirty portion (typically 1.0 mm) is diverted. If rainfall is too small, collectable rain becomes zero.',
  },
  {
    label: 'Daily inflow',
    formula: 'collectable rain x roof area x runoff x gutter efficiency',
    explanation: 'Because 1 mm of rain on 1 m2 equals exactly 1 liter, this yields the daily liters routed to the storage tank.',
  },
  {
    label: 'Tank water balance',
    formula: 'min(tank capacity, previous storage + inflow) - daily demand',
    explanation: 'Stores incoming rainwater up to maximum tank capacity, then satisfies daily handwashing and comfort room demand.',
  },
  {
    label: 'System reliability',
    formula: '(days with 100% demand met / total simulated days) x 100',
    explanation: 'Evaluates the percentage of school operating days where rainwater reserves fully met facility water demand.',
  },
];

const GuideFormulaSection: React.FC = () => (
  <section id="guide-formulas" className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <FlaskConical size={20} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">Scientific formulas in simple terms</h3>
        <p className="text-sm text-slate-500">Facility-based water balance calculations and global WASH literature benchmarks.</p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
      {equations.map(equation => (
        <article key={equation.label} className="rounded-md border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">{equation.label}</div>
            <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-bold text-[#0053DF]">
              {equation.formula}
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {equation.explanation}
            </p>
          </div>
          {equation.citation && (
            <div className="mt-3 rounded-md bg-blue-50/70 border border-blue-200/60 px-3 py-1.5 text-[11px] text-blue-900 font-medium">
              <span className="font-bold">Sources:</span> {equation.citation}
            </div>
          )}
        </article>
      ))}
    </div>
  </section>
);

export default GuideFormulaSection;
