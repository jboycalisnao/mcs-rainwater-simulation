import React from 'react';
import { CloudRain, Gauge, Repeat2, Waves } from 'lucide-react';

const sections = [
  {
    icon: <CloudRain size={20} />,
    title: '1. Rainfall simulation',
    body: [
      'The rainfall model creates a possible daily rainfall record. It does not predict the exact future. Instead, it builds realistic "what if" weather years from monthly rain patterns.',
      'For each month, the app uses two simple climate behaviors: the chance that a dry day becomes rainy, and the chance that a rainy day stays rainy. These chances create wet spells and dry spells, which are groups of rainy or dry days in a row.',
      'When a simulated day is rainy, the model gives it a rainfall depth in millimeters. Light rain, average rain, and heavy rain can all occur, but the values stay guided by the monthly rainfall pattern.',
      'The Run ID controls the random sequence. This is useful in science because a test should be repeatable. The same settings and same Run ID recreate the same simulated rainfall series.',
    ],
  },
  {
    icon: <Repeat2 size={20} />,
    title: '2. Ensemble testing',
    body: [
      'An ensemble means many simulations are run instead of only one. Each run is a different possible version of future rain.',
      'This matters because rainwater harvesting depends strongly on timing. Two years can have the same total rainfall, but one may have long dry gaps while another has regular rain. The long dry gaps are harder for a tank.',
      'The dashboard compares the ensemble and shows cautious, typical, and best-case reliability. The cautious value is useful for planning because it is closer to a dry or unlucky condition, not just an average condition.',
    ],
  },
  {
    icon: <Waves size={20} />,
    title: '3. Water balance',
    body: [
      'Water balance is the daily accounting of the tank. In simple terms, it is storage today equals storage yesterday, plus collected rainwater, minus water used.',
      'The app first estimates rainwater inflow. Because 1 millimeter of rain over 1 square meter equals 1 liter, rainfall depth can be directly converted into liters when roof area is known.',
      'The app then subtracts losses. First-flush loss removes the first part of rain because it may wash dust from the roof. Runoff coefficient and gutter efficiency reduce the total because not every drop reaches the tank.',
      'After inflow is added, storage cannot go above tank capacity. Extra water is treated as overflow. Then daily water demand is removed. If storage is not enough, the day is counted as a shortage day.',
    ],
  },
  {
    icon: <Gauge size={20} />,
    title: '4. Reliability and shortage days',
    body: [
      'Reliability is the percent of simulated days when the tank supplies the required water. A reliability of 90% means the system met demand on about 90 out of 100 days.',
      'Shortage days are the opposite: days when the tank could not fully supply the demand. These usually happen after dry stretches or when the tank is too small for the daily use.',
      'Testing many tank sizes shows the storage tradeoff. A small tank is cheaper but empties faster. A bigger tank stores more water from rainy days, but after a certain point the improvement may become smaller.',
    ],
  },
];

const GuideMethodSections: React.FC = () => (
  <section id="guide-method" className="mt-6 scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="border-b border-slate-200 pb-4">
      <h3 className="text-lg font-black text-slate-900">Scientific method used by the simulation</h3>
      <p className="mt-1 text-sm text-slate-500">Each topic below explains one part of the model in scientific but simple terms.</p>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      {sections.map(section => (
        <article key={section.title} className="border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#010e5b]">
              {section.icon}
            </div>
            <h4 className="text-base font-black text-slate-900">{section.title}</h4>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            {section.body.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export default GuideMethodSections;
