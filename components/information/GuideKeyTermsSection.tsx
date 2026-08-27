import React from 'react';
import { HelpCircle } from 'lucide-react';

const keyTerms = [
  {
    term: 'Wet day',
    meaning: 'A day with enough rain to be counted as rainy in the model.',
  },
  {
    term: 'Dry spell',
    meaning: 'Several dry days in a row. Long dry spells are the main stress test for a tank.',
  },
  {
    term: 'Runoff coefficient',
    meaning: 'The share of roof rain that can flow toward collection instead of being lost.',
  },
  {
    term: 'Gutter efficiency',
    meaning: 'The share of flowing roof water that successfully reaches the tank.',
  },
  {
    term: 'Overflow',
    meaning: 'Water that cannot fit because the tank is already full.',
  },
  {
    term: 'Shortage',
    meaning: 'A day when the tank does not have enough water for the full daily demand.',
  },
];

const GuideKeyTermsSection: React.FC = () => (
  <section id="guide-terms" className="mt-6 scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
        <HelpCircle size={20} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">Key terms</h3>
        <p className="text-sm text-slate-500">Short definitions for the scientific words used in the dashboard.</p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {keyTerms.map(item => (
        <article key={item.term} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-black text-slate-900">{item.term}</h4>
          <ul className="mt-2 list-disc pl-5 text-sm leading-5 text-slate-600">
            <li>{item.meaning}</li>
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export default GuideKeyTermsSection;
