import React from 'react';

const measurementSteps = [
  'Rainfall depth is measured in millimeters.',
  'Roof area is measured in square meters.',
  '1 mm of rain on 1 m2 of roof is about 1 liter of water.',
  'First-flush loss is subtracted from rainfall depth.',
  'Runoff and gutter efficiency reduce the collectable water.',
  'Daily demand is removed from the tank after rainwater is added.',
];

const GuideOverview: React.FC = () => (
  <section id="guide-overview" className="scroll-mt-24 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-l-4 border-[#010e5b] pl-3 text-xs font-black uppercase tracking-widest text-slate-500">
        Main scientific idea
      </div>
      <h3 className="mt-4 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
        The dashboard is a daily mass balance model for a rainwater harvesting system.
      </h3>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 sm:text-base">
        <li>A mass balance follows how much material enters, stays, and leaves a system.</li>
        <li>Here, the material is water: rainfall adds water, the tank stores water, and handwashing removes water.</li>
        <li>The model checks this process one day at a time so the school can compare practical tank sizes.</li>
        <li>In simple terms, the tank works like a savings account: rainy days make deposits and daily use makes withdrawals.</li>
        <li>Reliability tells us how often that water account has enough supply for the school day.</li>
      </ul>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Measurement logic</h3>
      <ol className="mt-4 space-y-3">
        {measurementSteps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ca080b] text-[11px] font-black text-white">
              {index + 1}
            </div>
            <p className="text-sm leading-5 text-slate-600">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default GuideOverview;
