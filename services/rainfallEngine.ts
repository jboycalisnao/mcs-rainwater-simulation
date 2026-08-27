import { DEFAULT_ENSEMBLE_RUNS, WET_DAY_THRESHOLD_MM } from '../constants';
import { MonthlyParameters, RainfallDataRow } from '../types';

export class RainfallEngine {
  static generate(params: MonthlyParameters[], years: number, seed: number): RainfallDataRow[] {
    const data: RainfallDataRow[] = [];
    const random = this.seedableRandom(seed);
    const january = this.getParamsForMonth(params, 1);
    const denominator = Math.max(0.05, 1 - january.p11 + january.p01);
    let isWet = random() < Math.min(0.98, Math.max(0.02, january.p01 / denominator));
    let currentYear = 1;
    let currentDayOfYear = 1;

    while (currentYear <= years) {
      const month = this.getMonthFromDay(currentDayOfYear, currentYear);
      const monthParams = this.getParamsForMonth(params, month);
      const mean = Math.max(1, isWet
        ? (monthParams.meanWetSpell ?? monthParams.avgWetSpell ?? (1 / Math.max(0.02, 1 - monthParams.p11)))
        : (monthParams.meanDrySpell ?? monthParams.avgDrySpell ?? (1 / Math.max(0.02, monthParams.p01))));
      const variance = isWet ? monthParams.varWetSpell : monthParams.varDrySpell;
      let spellLength = 1;

      if (typeof variance === 'number' && variance > mean) {
        spellLength = this.sampleNegativeBinomial(mean, variance, random);
      } else {
        const p = 1 / Math.max(1, mean);
        spellLength = this.sampleGeometric(p, random);
      }

      spellLength = Math.max(1, Math.min(365, spellLength));

      for (let i = 0; i < spellLength; i += 1) {
        if (currentYear > years) break;
        const dayMonth = this.getMonthFromDay(currentDayOfYear, currentYear);
        const dayParams = this.getParamsForMonth(params, dayMonth);
        const latentWet = isWet;
        let rain = 0;

        if (latentWet) {
          if ((dayParams.gamma_k ?? 0) > 0 && (dayParams.gamma_theta ?? 0) > 0) {
            rain = this.sampleGamma(dayParams.gamma_k!, dayParams.gamma_theta!, random);
          } else {
            rain = -Math.max(dayParams.meanRain, WET_DAY_THRESHOLD_MM) * Math.log(random() || 0.0001);
          }
          if (rain < WET_DAY_THRESHOLD_MM) rain = 0;
        }

        const observedWet = rain >= WET_DAY_THRESHOLD_MM;
        data.push({
          synthetic_year: currentYear,
          day_of_year: currentDayOfYear,
          month: dayMonth,
          rain_mm: Number(rain.toFixed(2)),
          wet: observedWet,
          observed_wet: observedWet,
          latent_wet: latentWet,
        });

        currentDayOfYear += 1;
        if (currentDayOfYear > this.getDaysInYear(currentYear)) {
          currentDayOfYear = 1;
          currentYear += 1;
        }
      }

      isWet = !isWet;
    }

    return data;
  }

  static generateEnsemble(
    params: MonthlyParameters[],
    years: number,
    seed: number,
    runs: number = DEFAULT_ENSEMBLE_RUNS,
  ): RainfallDataRow[][] {
    return Array.from({ length: runs }, (_, index) => this.generate(params, years, seed + (index * 97)));
  }

  private static getParamsForMonth(params: MonthlyParameters[], month: number): MonthlyParameters {
    return params.find(entry => entry.month === month) ?? params[(month - 1) % params.length];
  }

  private static sampleNegativeBinomial(mean: number, variance: number, rand: () => number): number {
    const mu = Math.max(0.1, mean - 1);
    const sigmaSq = Math.max(mu + 0.1, variance);
    const beta = (sigmaSq - mu) / mu;
    const alpha = mu / beta;
    const lambda = this.sampleGamma(alpha, beta, rand);
    return this.samplePoisson(lambda, rand) + 1;
  }

  private static samplePoisson(lambda: number, rand: () => number): number {
    if (lambda < 30) {
      const limit = Math.exp(-lambda);
      let product = 1;
      let count = 0;
      do {
        count += 1;
        product *= rand();
      } while (product > limit);
      return count - 1;
    }
    const standardNormal = this.boxMuller(rand);
    return Math.max(0, Math.floor(lambda + Math.sqrt(lambda) * standardNormal + 0.5));
  }

  private static sampleGeometric(p: number, rand: () => number): number {
    const safeP = Math.max(0.0001, Math.min(0.9999, p));
    return Math.max(1, Math.ceil(Math.log(rand()) / Math.log(1 - safeP)));
  }

  private static sampleGamma(k: number, theta: number, rand: () => number): number {
    if (k < 1) {
      return this.sampleGamma(1 + k, theta, rand) * Math.pow(rand(), 1 / k);
    }
    const d = k - (1 / 3);
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x = 0;
      let v = 0;
      do {
        x = this.boxMuller(rand);
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = rand();
      if (u < 1 - 0.0331 * x ** 4) return d * v * theta;
      if (Math.log(u) < (0.5 * x * x) + d * (1 - v + Math.log(v))) return d * v * theta;
    }
  }

  private static boxMuller(rand: () => number): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  private static seedableRandom(seed: number) {
    let state = Math.max(1, seed);
    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  private static getMonthFromDay(doy: number, year: number): number {
    const monthLengths = this.getMonthLengths(year);
    let remaining = Math.max(1, Math.min(monthLengths.reduce((sum, days) => sum + days, 0), doy));
    for (let month = 1; month <= 12; month += 1) {
      remaining -= monthLengths[month - 1];
      if (remaining <= 0) return month;
    }
    return 12;
  }

  private static getDaysInYear(year: number): number {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  }

  private static getMonthLengths(year: number): number[] {
    return [31, this.getDaysInYear(year) === 366 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  }
}
