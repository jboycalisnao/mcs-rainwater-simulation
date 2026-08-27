import React from 'react';
import {
  BookOpen,
  Calculator,
  FlaskConical,
  HelpCircle,
  Layers3,
  ListChecks,
} from 'lucide-react';

const topics = [
  { href: '#guide-overview', label: 'Overview', icon: <BookOpen size={16} /> },
  { href: '#guide-method', label: 'Method', icon: <ListChecks size={16} /> },
  { href: '#guide-formulas', label: 'Formulas', icon: <FlaskConical size={16} /> },
  { href: '#guide-components', label: 'Components', icon: <Layers3 size={16} /> },
  { href: '#guide-terms', label: 'Key Terms', icon: <HelpCircle size={16} /> },
  { href: '#guide-summary', label: 'Summary', icon: <Calculator size={16} /> },
];

const GuideNavigation: React.FC = () => (
  <aside className="lg:sticky lg:top-24 lg:self-start">
    <nav aria-label="Scientific guide topics" className="border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Guide Topics</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {topics.map(topic => (
          <a
            key={topic.href}
            href={topic.href}
            className="flex items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-[#010e5b] hover:bg-slate-50 hover:text-[#010e5b] focus:border-[#010e5b] focus:bg-slate-50 focus:outline-none"
          >
            <span className="text-slate-400">{topic.icon}</span>
            {topic.label}
          </a>
        ))}
      </div>
    </nav>
  </aside>
);

export default GuideNavigation;
