import React from 'react';
import {
  BarChart3,
  BookOpen,
  Calculator,
  FlaskConical,
  HelpCircle,
  Layers3,
  ListChecks,
} from 'lucide-react';

export type GuideTopicId =
  | 'overview'
  | 'method'
  | 'formulas'
  | 'components'
  | 'interpretation'
  | 'terms'
  | 'summary';

const topics = [
  { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
  { id: 'method', label: 'Method', icon: <ListChecks size={16} /> },
  { id: 'formulas', label: 'Formulas', icon: <FlaskConical size={16} /> },
  { id: 'components', label: 'Components', icon: <Layers3 size={16} /> },
  { id: 'interpretation', label: 'Interpret Results', icon: <BarChart3 size={16} /> },
  { id: 'terms', label: 'Key Terms', icon: <HelpCircle size={16} /> },
  { id: 'summary', label: 'Summary', icon: <Calculator size={16} /> },
] satisfies { id: GuideTopicId; label: string; icon: React.ReactNode }[];

interface GuideNavigationProps {
  activeTopic: GuideTopicId;
  onSelectTopic: (topic: GuideTopicId) => void;
}

const GuideNavigation: React.FC<GuideNavigationProps> = ({ activeTopic, onSelectTopic }) => (
  <aside className="lg:sticky lg:top-24 lg:self-start">
    <nav aria-label="Scientific guide topics" className="border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Guide Topics</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {topics.map(topic => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelectTopic(topic.id)}
            className={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left text-sm font-bold transition-colors focus:outline-none ${
              activeTopic === topic.id
                ? 'border-[#0053DF] bg-slate-100 text-[#0053DF]'
                : 'border-transparent text-slate-600 hover:border-[#0053DF] hover:bg-slate-50 hover:text-[#0053DF] focus:border-[#0053DF] focus:bg-slate-50'
            }`}
            aria-current={activeTopic === topic.id ? 'page' : undefined}
          >
            <span className="text-slate-400">{topic.icon}</span>
            {topic.label}
          </button>
        ))}
      </div>
    </nav>
  </aside>
);

export default GuideNavigation;
