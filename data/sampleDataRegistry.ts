export interface SampleDataset {
  id: string;
  name: string;
  location: string;
  type: 'csv';
  filename: string;
  fileSize: string;
  badge: string;
  category: 'rainfall';
  description: string;
  keyStats: { label: string; value: string }[];
  csvUrl: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'iloilo-rainfall-csv',
    name: 'Iloilo Historical Daily Rainfall',
    location: 'PAGASA Iloilo Station (Western Visayas)',
    type: 'csv',
    filename: 'Iloilo_Cleaned.csv',
    fileSize: '111 KB',
    badge: 'Empirical Rainfall Records',
    category: 'rainfall',
    description: '20-year empirical daily rainfall observations (1990–2010, 7,300+ records) ready for Markov chain calibration and synthetic weather generation.',
    keyStats: [
      { label: 'Record Period', value: '20 Years' },
      { label: 'Daily Rows', value: '7,307 Days' },
      { label: 'Columns', value: 'date, rain, flag' },
      { label: 'Primary Season', value: 'Type I / Type III Monsoon' },
    ],
    csvUrl: '/data/Iloilo_Cleaned.csv',
  },
  {
    id: 'roxas-rainfall-csv',
    name: 'Roxas City Historical Daily Rainfall',
    location: 'PAGASA Roxas City Station (Capiz)',
    type: 'csv',
    filename: 'Roxas_Cleaned.csv',
    fileSize: '200 KB',
    badge: 'Empirical Rainfall Records',
    category: 'rainfall',
    description: '36-year continuous daily rainfall measurements (1984–2020, 13,000+ records) for calibrating coastal Panay weather dynamics.',
    keyStats: [
      { label: 'Record Period', value: '36 Years' },
      { label: 'Daily Rows', value: '13,000+ Days' },
      { label: 'Columns', value: 'date, rain, flag' },
      { label: 'Primary Season', value: 'Type III (Weak dry period)' },
    ],
    csvUrl: '/data/Roxas_Cleaned.csv',
  },
];

export const triggerFileDownload = (filename: string, content: string | object) => {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: 'text/csv;charset=utf-8;' })
    : new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const fetchSampleFileText = async (filename: string): Promise<string> => {
  const response = await fetch(`/data/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename} from server (HTTP ${response.status})`);
  }
  return response.text();
};
