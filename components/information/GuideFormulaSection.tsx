import React from 'react';
import { FlaskConical } from 'lucide-react';

const equations = [
  {
    label: 'Roof area',
    formula: 'classrooms x roof area per classroom',
    explanation: 'This estimates the total surface that can catch rain.',
  },
  {
    label: 'Collectable rain',
    formula: 'max(0, rainfall - first flush loss)',
    explanation: 'The first dirty portion is removed. If rainfall is too small, collectable rain becomes zero.',
  },
  {
    label: 'Daily inflow',
    formula: 'collectable rain x roof area x runoff x gutter efficiency',
    explanation: 'Because mm x m2 is liters, this gives the approximate liters entering the tank.',
  },
  {
    label: 'Tank storage',
    formula: 'min(tank size, old storage + inflow) - daily demand',
    explanation: 'The tank fills from rain, cannot exceed its capacity, then supplies daily use.',
  },
  {
    label: 'Reliability',
    formula: '(days supplied / total simulated days) x 100',
    explanation: 'This converts the number of successful days into a percent.',
  },
];

const GuideFormulaSection: React.FC = () => (
  <section id="guide-formulas" className="mt-6 scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <FlaskConical size={20} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">Scientific formulas in simple terms</h3>
        <p className="text-sm text-slate-500">These are the calculations behind the dashboard, written as classroom-friendly rules.</p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
      {equations.map(equation => (
        <article key={equation.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">{equation.label}</div>
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold text-[#010e5b]">
            {equation.formula}
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm leading-5 text-slate-600">
            <li>{equation.explanation}</li>
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export default GuideFormulaSection;
