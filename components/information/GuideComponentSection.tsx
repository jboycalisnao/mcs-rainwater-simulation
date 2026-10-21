import React from 'react';
import { BarChart3, Building2, CloudRain, Droplets, Layers3, ShieldCheck } from 'lucide-react';

const components = [
  {
    icon: <BarChart3 size={18} />,
    title: 'Rain Records',
    points: [
      'Acts as the climate input for the simulation.',
      'Reads rainfall behavior by month, including rainy-day frequency, wet and dry spell length, and average rain amount.',
      'Prepares the parameters that describe the local rainfall pattern.',
    ],
  },
  {
    icon: <CloudRain size={18} />,
    title: 'Rain Forecast Test',
    points: [
      'Runs the stochastic rainfall model. Stochastic means it uses controlled randomness.',
      'Creates daily rain values for the selected number of years.',
      'Keeps the generated rainfall guided by the monthly pattern from the rain records.',
    ],
  },
  {
    icon: <Building2 size={18} />,
    title: 'Buildings & Roofs',
    points: [
      'Defines the catchment area. A catchment is the surface that collects rain.',
      'Multiplies classrooms by roof area per classroom to estimate total roof area.',
      'Shows why more roof area usually gives more possible water inflow.',
    ],
  },
  {
    icon: <Droplets size={18} />,
    title: 'Daily Water Use',
    points: [
      'Estimates demand, which means the water needed per day.',
      'Combines handwashing stations and comfort room (toilet flush/cleaning) water needs.',
      'Calibrated against campus population using DepEd WinS Order 10 s.2016 and WHO/UNICEF WASH guidelines (~2.2 L/person/day).',
      'Provides the daily withdrawal used in the water balance calculation.',
    ],
  },
  {
    icon: <Layers3 size={18} />,
    title: 'Tank Choices',
    points: [
      'Compares several storage capacities.',
      'Repeats the daily water balance for each tank size.',
      'Records how often demand is met so users can compare reliability.',
    ],
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Results & Reports',
    points: [
      'Summarizes the evidence from the simulation.',
      'Displays monthly collected water, annual inflow, daily usage, reliability ranges, and recommended tank options.',
      'Keeps the assumptions and results available for review when exported.',
    ],
  },
];

const GuideComponentSection: React.FC = () => (
  <section id="guide-components" className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        <Layers3 size={20} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">How each component works</h3>
        <p className="text-sm text-slate-500">Each part represents one scientific step in the harvesting system.</p>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {components.map(component => (
        <article key={component.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[#0053DF]">
            {component.icon}
            <h4 className="text-sm font-black text-slate-900">{component.title}</h4>
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-5 text-slate-600">
            {component.points.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export default GuideComponentSection;
