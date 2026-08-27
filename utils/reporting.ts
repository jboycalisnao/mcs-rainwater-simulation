import { CONSERVATIVE_RELIABILITY_PERCENTILE } from '../constants';
import { CalibrationResult, InflowConfig, RainfallDataRow, ReliabilityIntervalResult, ReportCoverDetails, SimulationReportJSON, SummaryData } from '../types';
import { summarizeRainfallSeries } from './summary';

export const buildSimulationReport = ({
  inflowConfig,
  rainfallData,
  reliabilityData,
  totalDailyDemand,
  calibrationResult,
  summary,
  ensembleRuns,
}: {
  inflowConfig: InflowConfig;
  rainfallData: (RainfallDataRow & { inflow_liters?: number })[];
  reliabilityData: ReliabilityIntervalResult[];
  totalDailyDemand: number;
  calibrationResult: CalibrationResult | null;
  summary?: SummaryData;
  ensembleRuns: number;
}): SimulationReportJSON => {
  const totalClassrooms = inflowConfig.buildings.reduce((sum, building) => sum + building.numberOfClassrooms, 0);
  const totalRoofArea = inflowConfig.buildings.reduce(
    (sum, building) => sum + (building.numberOfClassrooms * building.roofAreaPerClassroom),
    0,
  );
  const resolvedSummary = summary ?? summarizeRainfallSeries(rainfallData);

  const reliabilityTable = reliabilityData.reduce<SimulationReportJSON['reliability_table']>((acc, item, index) => {
    const key = index.toString();
    acc.tank_L[key] = item.tankSize;
    acc.reliability_pct[key] = Number(item.conservativeReliability.toFixed(2));
    acc.median_reliability_pct![key] = Number(item.medianReliability.toFixed(2));
    acc.optimistic_reliability_pct![key] = Number(item.optimisticReliability.toFixed(2));
    return acc;
  }, {
    tank_L: {},
    reliability_pct: {},
    median_reliability_pct: {},
    optimistic_reliability_pct: {},
  });

  return {
    metadata: {
      roof_area_per_class_m2: totalClassrooms > 0 ? Number((totalRoofArea / totalClassrooms).toFixed(2)) : 0,
      number_of_classrooms: totalClassrooms,
      total_daily_demand_L: Number(totalDailyDemand.toFixed(2)),
      simulation_years: resolvedSummary.simulationYears,
    },
    harvest_summary: {
      annual_L: Number(resolvedSummary.annualInflow.toFixed(2)),
      monthly_L: resolvedSummary.monthly.reduce<Record<string, number>>((acc, month, index) => {
        acc[(index + 1).toString()] = Number(month.avgInflow.toFixed(2));
        return acc;
      }, {}),
      weekly_L: resolvedSummary.weekly.reduce<Record<string, number>>((acc, week) => {
        acc[week.week] = Number(week.avgInflow.toFixed(2));
        return acc;
      }, {}),
    },
    reliability_table: reliabilityTable,
    calibration: calibrationResult ? {
      fit_score: calibrationResult.fit.overallScore,
      warnings: calibrationResult.warnings.map(entry => entry.message),
      total_missing_days: calibrationResult.coverage.totalMissingDays,
      monthly_sources: calibrationResult.monthlyDiagnostics.reduce<Record<string, string>>((acc, entry) => {
        acc[entry.month.toString()] = entry.source;
        return acc;
      }, {}),
    } : undefined,
    uncertainty: {
      conservative_percentile: CONSERVATIVE_RELIABILITY_PERCENTILE,
      runs: ensembleRuns,
    },
    assumptions: [
      'Reliability uses the more conservative result of empty-start and burn-in evaluations.',
      'Weekly values are average inflow by week-of-year across the simulated years.',
      'Calibration uses a wet-day threshold of 0.1 mm and falls back to defaults when support is weak.',
    ],
    generated_at: new Date().toISOString(),
  };
};

export const downloadJsonReport = (report: SimulationReportJSON, filename: string) => {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const sanitizeHtml = (value: string | number | undefined | null) => (
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
);

const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const getReliabilityRows = (report: SimulationReportJSON) => Object.keys(report.reliability_table.tank_L)
  .map(key => ({
    tank: report.reliability_table.tank_L[key],
    cautious: report.reliability_table.reliability_pct[key],
    typical: report.reliability_table.median_reliability_pct?.[key] ?? report.reliability_table.reliability_pct[key],
    best: report.reliability_table.optimistic_reliability_pct?.[key] ?? report.reliability_table.reliability_pct[key],
  }))
  .sort((a, b) => a.tank - b.tank);

export const downloadPdfReport = (
  report: SimulationReportJSON,
  cover: ReportCoverDetails,
  filename: string,
) => {
  const reliabilityRows = getReliabilityRows(report);
  const recommended = reliabilityRows.find(row => row.cautious >= 90) ?? reliabilityRows[Math.floor(reliabilityRows.length / 2)] ?? reliabilityRows[0];
  const monthlyRows = Object.entries(report.harvest_summary.monthly_L)
    .slice(0, 12)
    .map(([month, liters]) => ({ month, liters }));
  const safeFilename = filename.replace(/\.pdf$/i, '');
  const reportWindow = window.open('', '_blank', 'width=1100,height=850');

  if (!reportWindow) {
    alert('The report window was blocked. Please allow pop-ups for this site, then export again.');
    return;
  }

  const assumptions = report.assumptions ?? [];
  const visibleReliabilityRows = reliabilityRows.slice(0, 18);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${sanitizeHtml(cover.title || 'Rainwater Harvesting Report')}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: Inter, Arial, sans-serif;
      line-height: 1.45;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 24px;
      background: #010e5b;
      color: white;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
    }
    .toolbar button {
      border: 0;
      border-radius: 6px;
      background: #ca080b;
      color: white;
      padding: 10px 16px;
      font-weight: 800;
      cursor: pointer;
    }
    .report {
      max-width: 210mm;
      margin: 24px auto 48px;
      padding: 0;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin-bottom: 24px;
      padding: 18mm;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
      break-after: page;
      page-break-after: always;
    }
    .page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .cover-main {
      display: flex;
      min-height: 210mm;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .eyebrow {
      color: #ca080b;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 760px;
      margin: 18px 0 16px;
      color: #010e5b;
      font-size: 44px;
      line-height: 1.04;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 18px;
      color: #010e5b;
      font-size: 24px;
    }
    h3 {
      margin: 0 0 10px;
      color: #334155;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .muted { color: #64748b; }
    .grid {
      display: grid;
      gap: 10px;
    }
    .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      padding: 18px;
    }
    .compact-card { padding: 12px; }
    .soft {
      background: #f8fafc;
    }
    .metric-label {
      color: #64748b;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .metric-value {
      margin-top: 6px;
      color: #0f172a;
      font-size: 24px;
      font-weight: 900;
    }
    .hero-card {
      margin-top: 34px;
      border-left: 6px solid #ca080b;
    }
    .cover .hero-card {
      width: min(100%, 640px);
      border-left: 0;
      border-top: 6px solid #ca080b;
      text-align: left;
    }
    .cover-note {
      width: min(100%, 680px);
      margin-top: 18px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 11px;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      background: #010e5b;
      color: white;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    tr:last-child td { border-bottom: 0; }
    .note {
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1e3a8a;
      padding: 16px;
      font-size: 13px;
    }
    .footer {
      color: #64748b;
      font-size: 11px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    @page { size: A4; margin: 0; }
    @media print {
      html, body { width: 210mm; }
      body { background: white; }
      .toolbar { display: none; }
      .report { max-width: none; margin: 0; padding: 0; }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: 14mm;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }
      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      h1 { font-size: 36px; }
      .cover-main { min-height: 235mm; }
      h2 { font-size: 21px; margin-bottom: 12px; }
      h3 { font-size: 12px; margin-bottom: 8px; }
      .card { padding: 12px; }
      .metric-value { font-size: 20px; }
      .card, table, .note { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>PDF Preview</strong>
      <span style="opacity:.75;margin-left:8px;">Review the layout, then download as PDF.</span>
    </div>
    <button onclick="window.print()">Download as PDF</button>
  </div>

  <main class="report">
    <section class="page cover">
      <div class="cover-main">
        <div class="eyebrow">Rainwater Harvesting Report</div>
        <h1>${sanitizeHtml(cover.title || 'Rainwater Harvesting Results')}</h1>
        <p class="muted">${sanitizeHtml(cover.schoolName || 'School / Office not specified')}</p>
        <p class="muted">${sanitizeHtml(cover.location || 'Location not specified')}</p>
        <div class="grid two hero-card card soft">
          <div>
            <div class="metric-label">Prepared By</div>
            <div class="metric-value" style="font-size:18px;">${sanitizeHtml(cover.preparedBy || 'Not specified')}</div>
          </div>
          <div>
            <div class="metric-label">Report Date</div>
            <div class="metric-value" style="font-size:18px;">${sanitizeHtml(formatDate(cover.reportDate))}</div>
          </div>
        </div>
        <div class="card cover-note">
          <h3>Cover Notes</h3>
          <p>${sanitizeHtml(cover.notes || 'No cover notes provided.')}</p>
        </div>
      </div>
      <div class="footer">Generated from the MCS Rainwater Harvesting Dashboard on ${sanitizeHtml(formatDate(report.generated_at))}</div>
    </section>

    <section class="page">
      <h2>Dashboard Results Summary</h2>
      <div class="grid three">
        <div class="card soft">
          <div class="metric-label">Classrooms</div>
          <div class="metric-value">${formatNumber(report.metadata.number_of_classrooms)}</div>
        </div>
        <div class="card soft">
          <div class="metric-label">Daily Water Use</div>
          <div class="metric-value">${formatNumber(report.metadata.total_daily_demand_L)} L</div>
        </div>
        <div class="card soft">
          <div class="metric-label">Years Tested</div>
          <div class="metric-value">${formatNumber(report.metadata.simulation_years)}</div>
        </div>
      </div>

      <div class="grid two" style="margin-top:16px;">
        <div class="card">
          <h3>Water Collected</h3>
          <div class="metric-value">${formatNumber(report.harvest_summary.annual_L)} L</div>
          <p class="muted">Average yearly rainwater collected by the selected roof area.</p>
        </div>
        <div class="card">
          <h3>Suggested Tank</h3>
          <div class="metric-value">${recommended ? `${formatNumber(recommended.tank)} L` : 'Not available'}</div>
          <p class="muted">${recommended ? `Days covered: cautious ${recommended.cautious.toFixed(1)}%, typical ${recommended.typical.toFixed(1)}%, best case ${recommended.best.toFixed(1)}%.` : 'Run tank results first to show this value.'}</p>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <h3>Monthly Water Collected</h3>
        <div class="grid three">
          ${monthlyRows.map(row => `
            <div class="card soft compact-card">
              <div class="metric-label">Month ${sanitizeHtml(row.month)}</div>
              <div class="metric-value" style="font-size:16px;">${formatNumber(row.liters)} L</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="page">
      <h2>Tank Result Table</h2>
      <table>
        <thead>
          <tr>
            <th>Tank Size</th>
            <th>Cautious</th>
            <th>Typical</th>
            <th>Best Case</th>
          </tr>
        </thead>
        <tbody>
          ${visibleReliabilityRows.map(row => `
            <tr>
              <td>${formatNumber(row.tank)} L</td>
              <td>${row.cautious.toFixed(1)}%</td>
              <td>${row.typical.toFixed(1)}%</td>
              <td>${row.best.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="note" style="margin-top:18px;">
        The percentages estimate how often daily water needs can be met in the rain tests. Cautious is the safer estimate, typical is the middle result, and best case is the more hopeful result.
      </div>
      ${reliabilityRows.length > visibleReliabilityRows.length ? `<p class="muted" style="font-size:11px;">Showing the first ${visibleReliabilityRows.length} tank sizes to keep the A4 report readable.</p>` : ''}

      <div class="card" style="margin-top:18px;">
        <h3>Dashboard Assumptions</h3>
        <ol>
          ${assumptions.map(assumption => `<li>${sanitizeHtml(assumption)}</li>`).join('')}
        </ol>
      </div>
    </section>
  </main>

  <script>
    document.title = ${JSON.stringify(safeFilename)};
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 350);
    });
  </script>
</body>
</html>`;

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
};
