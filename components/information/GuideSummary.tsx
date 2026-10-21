import React from 'react';

const GuideSummary: React.FC = () => (
  <section id="guide-summary" className="rounded-md border border-blue-100 bg-blue-50 p-5 sm:p-6">
    <h3 className="text-base font-black text-slate-900">Complete process summary</h3>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
      <li>The app creates possible rainy and dry days.</li>
      <li>It converts roof rainfall into liters of harvested water.</li>
      <li>It applies realistic collection losses such as first flush, runoff loss, and gutter loss.</li>
      <li>It stores water in a limited-size tank and subtracts daily school use.</li>
      <li>It calculates how often each tank size can meet the demand.</li>
    </ul>
  </section>
);

export default GuideSummary;
