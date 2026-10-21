import { CONSERVATIVE_RELIABILITY_PERCENTILE } from '../constants';
import { CalibrationResult, InflowConfig, RainfallDataRow, ReliabilityIntervalResult, ReportCoverDetails, SimulationReportJSON, SummaryData } from '../types';
import { ResearchSummary } from './researchSummary';
import { summarizeRainfallSeries } from './summary';
import { selectRecommendedTank } from './tankSizing';

export const buildSimulationReport = ({
  inflowConfig,
  rainfallData,
  reliabilityData,
  totalDailyDemand,
  calibrationResult,
  summary,
  ensembleRuns,
  demandConfig,
}: {
  inflowConfig: InflowConfig;
  rainfallData: (RainfallDataRow & { inflow_liters?: number })[];
  reliabilityData: ReliabilityIntervalResult[];
  totalDailyDemand: number;
  calibrationResult: CalibrationResult | null;
  summary?: SummaryData;
  ensembleRuns: number;
  demandConfig?: {
    handWashingAreas?: number;
    faucetsPerArea?: number;
    comfortRooms?: number;
    toiletsPerRoom?: number;
    populationServed?: number;
  };
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
      hand_washing_areas: demandConfig?.handWashingAreas,
      faucets_per_area: demandConfig?.faucetsPerArea,
      comfort_rooms: demandConfig?.comfortRooms,
      toilets_per_room: demandConfig?.toiletsPerRoom,
      population_served: demandConfig?.populationServed,
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

const openPrintReportWindow = (html: string, filename: string) => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  let reportWindow: Window | null = null;
  try {
    reportWindow = window.open(blobUrl, '_blank', 'width=1100,height=850,menubar=yes,toolbar=yes');
  } catch (err) {
    console.warn('window.open encountered error:', err);
  }

  if (!reportWindow || reportWindow.closed || typeof reportWindow.closed === 'undefined') {
    // 1. Invisible print iframe fallback to trigger native print dialog directly
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.opacity = '0';
    printFrame.src = blobUrl;
    document.body.appendChild(printFrame);

    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        }
      }, 350);
    };

    // 2. In-page toast notification with direct link in case popups were blocked
    const existingNotice = document.getElementById('report-popup-notice');
    existingNotice?.remove();

    const notice = document.createElement('div');
    notice.id = 'report-popup-notice';
    notice.style.position = 'fixed';
    notice.style.bottom = '24px';
    notice.style.right = '24px';
    notice.style.zIndex = '999999';
    notice.style.backgroundColor = '#0053DF';
    notice.style.color = 'white';
    notice.style.padding = '16px 20px';
    notice.style.borderRadius = '8px';
    notice.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25)';
    notice.style.fontFamily = 'Inter, Arial, sans-serif';
    notice.style.fontSize = '13px';
    notice.style.maxWidth = '420px';
    notice.style.display = 'flex';
    notice.style.flexDirection = 'column';
    notice.style.gap = '8px';
    notice.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:14px;display:flex;align-items:center;gap:6px;">
          <span>📄</span> Report Generated Successfully
        </strong>
        <button id="close-report-notice" style="background:transparent;border:0;color:white;cursor:pointer;font-size:18px;line-height:1;">&times;</button>
      </div>
      <p style="margin:0;opacity:0.9;line-height:1.4;">
        If your browser blocked opening a new window, click below to open your report:
      </p>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <a href="${blobUrl}" target="_blank" style="background:#ca080b;color:white;padding:8px 14px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;text-align:center;">
          Open Report Tab
        </a>
      </div>
    `;

    document.body.appendChild(notice);
    document.getElementById('close-report-notice')?.addEventListener('click', () => notice.remove());
    setTimeout(() => notice.remove(), 15000);
  }
};

export const downloadPdfReport = (
  report: SimulationReportJSON,
  cover: ReportCoverDetails,
  filename: string,
  demandConfig?: {
    handWashingAreas?: number;
    faucetsPerArea?: number;
    comfortRooms?: number;
    toiletsPerRoom?: number;
    populationServed?: number;
  },
) => {
  const reliabilityRows = getReliabilityRows(report);
  const reliabilityIntervals: ReliabilityIntervalResult[] = reliabilityRows.map(row => ({
    tankSize: row.tank,
    reliability: row.cautious,
    conservativeReliability: row.cautious,
    medianReliability: row.typical,
    optimisticReliability: row.best,
    reliabilitySpread: [row.cautious, row.best],
    droughtDaysRange: [0, 0],
    totalInflowRange: [0, 0],
    droughtDays: 0,
    totalInflow: 0,
    totalDemand: report.metadata.total_daily_demand_L,
    sampleCount: report.uncertainty?.runs ?? 1,
  }));
  const optimalTank = selectRecommendedTank(reliabilityIntervals);
  const recommended = optimalTank
    ? { tank: optimalTank.tankSize, cautious: optimalTank.conservativeReliability, typical: optimalTank.medianReliability, best: optimalTank.optimisticReliability }
    : reliabilityRows[0];
  const monthlyRows = Object.entries(report.harvest_summary.monthly_L)
    .slice(0, 12)
    .map(([month, liters]) => ({ month, liters }));
  const safeFilename = filename.replace(/\.pdf$/i, '');
  const assumptions = report.assumptions ?? [];
  const visibleReliabilityRows = reliabilityRows.slice(0, 18);
  const washAreas = demandConfig?.handWashingAreas ?? report.metadata.hand_washing_areas ?? 4;
  const washFaucets = demandConfig?.faucetsPerArea ?? report.metadata.faucets_per_area ?? 5;
  const crRooms = demandConfig?.comfortRooms ?? report.metadata.comfort_rooms ?? 4;
  const crToilets = demandConfig?.toiletsPerRoom ?? report.metadata.toilets_per_room ?? 2;
  const population = demandConfig?.populationServed ?? report.metadata.population_served ?? 450;
  const perPersonDaily = population > 0 ? (report.metadata.total_daily_demand_L / population) : 0;

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
      background: #0053DF;
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
      color: #0053DF;
      font-size: 44px;
      line-height: 1.04;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 18px;
      color: #0053DF;
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
      background: #0053DF;
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
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-weight:900;font-size:15px;">MCS Rainwater Harvesting</span>
      <span style="opacity:0.8;font-size:12px;">| Print Preview (Select <strong>"Save as PDF"</strong> in print dialog destination)</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button onclick="window.print()" style="background:#ca080b;color:white;border:0;padding:8px 16px;border-radius:6px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:rgba(255,255,255,0.18);color:white;border:0;padding:8px 12px;border-radius:6px;font-weight:600;cursor:pointer;">
        Close
      </button>
    </div>
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

      <div class="card" style="margin-top:14px;">
        <h3>Water Facilities & Campus Population</h3>
        <div class="grid three">
          <div class="card soft compact-card">
            <div class="metric-label">Handwashing</div>
            <div class="metric-value" style="font-size:16px;">${washAreas * washFaucets} faucets</div>
            <p class="muted" style="font-size:10px;margin-top:4px;">${washAreas} stations · 500 L/day</p>
          </div>
          <div class="card soft compact-card">
            <div class="metric-label">Comfort Rooms (CRs)</div>
            <div class="metric-value" style="font-size:16px;">${crRooms * crToilets} toilets</div>
            <p class="muted" style="font-size:10px;margin-top:4px;">${crRooms} CR blocks · 500 L/day</p>
          </div>
          <div class="card soft compact-card">
            <div class="metric-label">Population Served</div>
            <div class="metric-value" style="font-size:16px;">${population} people</div>
            <p class="muted" style="font-size:10px;margin-top:4px;">~${perPersonDaily.toFixed(2)} L/person/day</p>
          </div>
        </div>
        <div class="note" style="margin-top:10px;font-size:11px;">
          <strong>Institutional Benchmarks:</strong> Grounded in DepEd WinS Order No. 10 s.2016 and WHO/UNICEF WASH in Schools Guidelines (1.5–5.0 L/person/day for day schools).
        </div>
      </div>

      <div class="grid two" style="margin-top:14px;">
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

      <div class="card" style="margin-top:14px;">
        <h3>Monthly Water Collected</h3>
        <div class="grid three">
          ${monthlyRows.map(row => `
            <div class="card soft compact-card">
              <div class="metric-label">Month ${sanitizeHtml(row.month)}</div>
              <div class="metric-value" style="font-size:15px;">${formatNumber(row.liters)} L</div>
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
    function triggerPrintDialog() {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Auto print deferred:', err);
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerPrintDialog, 400);
    } else {
      window.addEventListener('DOMContentLoaded', () => setTimeout(triggerPrintDialog, 400));
      window.addEventListener('load', () => setTimeout(triggerPrintDialog, 400));
      setTimeout(triggerPrintDialog, 800);
    }
  </script>
</body>
</html>`;

  openPrintReportWindow(html, filename);
};

export const downloadResearchPdfReport = (
  report: SimulationReportJSON,
  cover: ReportCoverDetails,
  research: ResearchSummary,
  filename: string,
) => {
  const reliabilityRows = getReliabilityRows(report);
  const visibleReliabilityRows = reliabilityRows.slice(0, 18);
  const monthlyRows = Object.entries(report.harvest_summary.monthly_L)
    .slice(0, 12)
    .map(([month, liters]) => ({ month, liters }));
  const maxMonthly = Math.max(...monthlyRows.map(row => row.liters), 1);
  const maxReliability = Math.max(...visibleReliabilityRows.map(row => row.cautious), 1);
  const safeFilename = filename.replace(/\.pdf$/i, '');

  const renderList = (items: string[]) => `<ul>${items.map(item => `<li>${sanitizeHtml(item)}</li>`).join('')}</ul>`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${sanitizeHtml(cover.title || 'Rainwater Harvesting Research Report')}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: Inter, Arial, sans-serif;
      line-height: 1.5;
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
      background: #0053DF;
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
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin-bottom: 24px;
      padding: 16mm;
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
    h1 {
      margin: 14px 0 10px;
      color: #0053DF;
      font-size: 38px;
      line-height: 1.08;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 16px;
      color: #0053DF;
      font-size: 23px;
    }
    h3 {
      margin: 0 0 8px;
      color: #334155;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    ul, ol {
      margin: 8px 0 0;
      padding-left: 18px;
    }
    li {
      margin: 5px 0;
      font-size: 12.5px;
    }
    .muted { color: #64748b; }
    .grid {
      display: grid;
      gap: 12px;
    }
    .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      padding: 14px;
      break-inside: avoid;
    }
    .soft { background: #f8fafc; }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    .cover-main {
      min-height: 226mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .eyebrow {
      color: #ca080b;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .meta {
      width: min(100%, 680px);
      margin-top: 28px;
      text-align: left;
      border-top: 5px solid #0053DF;
    }
    .metric-label {
      color: #64748b;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .metric-value {
      margin-top: 5px;
      color: #0f172a;
      font-size: 19px;
      font-weight: 900;
    }
    .formula {
      margin-top: 8px;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: #0053DF;
      font-family: Consolas, Monaco, monospace;
      font-size: 11.5px;
      font-weight: 800;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 72px 1fr 84px;
      gap: 8px;
      align-items: center;
      margin: 8px 0;
      font-size: 11px;
    }
    .bar-track {
      height: 12px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      background: #0053DF;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      padding: 7px 9px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      background: #0053DF;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .quote {
      border-left: 4px solid #ca080b;
      background: #f8fafc;
    }
    .footer {
      color: #64748b;
      font-size: 11px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
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
        padding: 13mm;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      h1 { font-size: 34px; }
      h2 { font-size: 20px; margin-bottom: 12px; }
      .card, table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-weight:900;font-size:15px;">MCS Rainwater Research</span>
      <span style="opacity:0.8;font-size:12px;">| Print Preview (Select <strong>"Save as PDF"</strong> in print dialog destination)</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button onclick="window.print()" style="background:#ca080b;color:white;border:0;padding:8px 16px;border-radius:6px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:rgba(255,255,255,0.18);color:white;border:0;padding:8px 12px;border-radius:6px;font-weight:600;cursor:pointer;">
        Close
      </button>
    </div>
  </div>

  <main class="report">
    <section class="page cover">
      <div class="cover-main">
        <div class="eyebrow">Mathematical and Computational Science Research Output</div>
        <h1>${sanitizeHtml(cover.title || 'Rainwater Harvesting Research Report')}</h1>
        <p class="muted">${sanitizeHtml(cover.schoolName || 'School / Office not specified')}</p>
        <p class="muted">${sanitizeHtml(cover.location || 'Location not specified')}</p>
        <div class="grid two card soft meta">
          <div>
            <div class="metric-label">Prepared By</div>
            <div class="metric-value">${sanitizeHtml(cover.preparedBy || 'Not specified')}</div>
          </div>
          <div>
            <div class="metric-label">Report Date</div>
            <div class="metric-value">${sanitizeHtml(formatDate(cover.reportDate))}</div>
          </div>
        </div>
        <div class="card" style="width:min(100%,680px);margin-top:16px;text-align:left;">
          <h3>Report Notes</h3>
          <p>${sanitizeHtml(cover.notes || 'This report summarizes the model objective, simulation method, results, recommendation, assumptions, equations, and interpretation.')}</p>
        </div>
      </div>
      <div class="footer">Generated from the MCS Rainwater Harvesting Dashboard on ${sanitizeHtml(formatDate(report.generated_at))}</div>
    </section>

    <section class="page">
      <h2>Research Summary</h2>
      <div class="grid two">
        <div class="card"><h3>Problem Statement</h3>${renderList(research.problemStatement)}</div>
        <div class="card"><h3>Objective</h3>${renderList(research.objective)}</div>
        <div class="card"><h3>Method</h3>${renderList(research.method)}</div>
        <div class="card"><h3>Simulation Design</h3>${renderList(research.simulationDesign)}</div>
        <div class="card"><h3>Results</h3>${renderList(research.results)}</div>
        <div class="card"><h3>Recommendation</h3>${renderList(research.recommendation)}</div>
      </div>
      <div class="card" style="margin-top:12px;"><h3>Conclusion</h3>${renderList(research.conclusion)}</div>
    </section>

    <section class="page">
      <h2>Equations, Assumptions, and Interpretation</h2>
      <div class="grid">
        ${research.equations.map(equation => `
          <div class="card">
            <h3>${sanitizeHtml(equation.label)}</h3>
            <div class="formula">${sanitizeHtml(equation.formula)}</div>
            <ul><li>${sanitizeHtml(equation.explanation)}</li></ul>
          </div>
        `).join('')}
      </div>
      <div class="grid two" style="margin-top:12px;">
        <div class="card"><h3>Assumptions</h3>${renderList(research.assumptions)}</div>
        <div class="card"><h3>Simple Interpretation</h3>
          <ul>
            <li>Cautious reliability is the safer planning value because it represents less favorable rainfall timing.</li>
            <li>Typical reliability is the middle result across rainfall runs.</li>
            <li>Best-case reliability shows performance when rainfall timing is more favorable.</li>
            <li>Tank recommendations should consider reliability, cost, installation space, and maintenance.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="page">
      <h2>Graphs and Reliability Table</h2>
      <div class="card">
        <h3>Monthly Harvested Water Graph</h3>
        ${monthlyRows.map(row => `
          <div class="bar-row">
            <div>Month ${sanitizeHtml(row.month)}</div>
            <div class="bar-track"><div class="bar" style="width:${Math.max(2, (row.liters / maxMonthly) * 100).toFixed(1)}%;"></div></div>
            <div>${formatNumber(row.liters)} L</div>
          </div>
        `).join('')}
      </div>
      <div class="card" style="margin-top:12px;">
        <h3>Cautious Reliability Graph</h3>
        ${visibleReliabilityRows.map(row => `
          <div class="bar-row">
            <div>${formatNumber(row.tank)} L</div>
            <div class="bar-track"><div class="bar" style="width:${Math.max(2, (row.cautious / maxReliability) * 100).toFixed(1)}%;"></div></div>
            <div>${row.cautious.toFixed(1)}%</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="page">
      <h2>Reliability Table and Citation Outputs</h2>
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
      ${reliabilityRows.length > visibleReliabilityRows.length ? `<p class="muted" style="font-size:11px;">Showing the first ${visibleReliabilityRows.length} tank sizes to keep the A4 report readable.</p>` : ''}

      <div class="card quote" style="margin-top:16px;">
        <h3>Citation-Ready Outputs</h3>
        ${renderList(research.citationOutputs)}
      </div>
    </section>
  </main>

  <script>
    document.title = ${JSON.stringify(safeFilename)};
    function triggerPrintDialog() {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Auto print deferred:', err);
      }
    }
    if (document.readyState === 'complete') {
      setTimeout(triggerPrintDialog, 400);
    } else {
      window.addEventListener('DOMContentLoaded', () => setTimeout(triggerPrintDialog, 400));
      window.addEventListener('load', () => setTimeout(triggerPrintDialog, 400));
      setTimeout(triggerPrintDialog, 800);
    }
  </script>
</body>
</html>`;

  openPrintReportWindow(html, filename);
};
