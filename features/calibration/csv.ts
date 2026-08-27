import { CalibrationWarning, ParsedHistoricalRecord } from '../../types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const toIsoDate = (value: string): string | null => {
  const isoMatch = value.match(ISO_DATE);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  const slashMatch = value.match(SLASH_DATE);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
};

const toTimestamp = (isoDate: string): number => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const isValidIsoDate = (isoDate: string): boolean => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export interface ParsedCsvResult {
  records: ParsedHistoricalRecord[];
  warnings: CalibrationWarning[];
}

export const parseHistoricalCsv = (text: string): ParsedCsvResult => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.');
  }

  const headers = splitCsvLine(lines[0]).map(header => header.toLowerCase());
  const dateIndex = headers.findIndex(header => header === 'date');
  const rainIndex = headers.findIndex(header => header === 'rain' || header === 'rain_mm');

  if (dateIndex === -1 || rainIndex === -1) {
    throw new Error('CSV must contain Date and Rain columns.');
  }

  const warnings: CalibrationWarning[] = [];
  const seenDates = new Set<string>();
  const records: ParsedHistoricalRecord[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const columns = splitCsvLine(line);
    const rawDate = (columns[dateIndex] ?? '').trim();
    const isoDate = toIsoDate(rawDate);

    if (!isoDate) {
      throw new Error(`Row ${rowNumber} uses an unsupported date format. Use YYYY-MM-DD or MM/DD/YYYY.`);
    }

    if (!isValidIsoDate(isoDate)) {
      throw new Error(`Row ${rowNumber} has an invalid date value.`);
    }

    const timestamp = toTimestamp(isoDate);
    if (Number.isNaN(timestamp)) {
      throw new Error(`Row ${rowNumber} has an invalid date value.`);
    }

    if (seenDates.has(isoDate)) {
      warnings.push({
        code: 'DUPLICATE_DATE',
        message: `Duplicate daily record found for ${isoDate}; the latest row was ignored.`,
        rowNumber,
      });
      return;
    }

    seenDates.add(isoDate);
    const rainValue = Number.parseFloat((columns[rainIndex] ?? '').replace(/\s+/g, ''));
    if (!Number.isFinite(rainValue)) {
      warnings.push({
        code: 'INVALID_RAIN_VALUE',
        message: `Invalid rainfall value on row ${rowNumber}; treated as 0 mm.`,
        rowNumber,
      });
    }

    records.push({
      date: isoDate,
      isoDate,
      timestamp,
      rowNumber,
      rain_mm: Number.isFinite(rainValue) ? rainValue : 0,
    });
  });

  records.sort((a, b) => a.timestamp - b.timestamp);

  return { records, warnings };
};
