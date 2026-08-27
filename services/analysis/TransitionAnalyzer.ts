import { WET_DAY_THRESHOLD_MM } from '../../constants';
import { HistoricalRecord, MonthlyParameters } from '../../types';

interface Spell {
  wet: boolean;
  months: Set<number>;
  length: number;
}

const monthFromDate = (value: string) => Number.parseInt(value.slice(5, 7), 10);
const dayDiff = (left: string, right: string) => {
  const a = Date.parse(`${left}T00:00:00Z`);
  const b = Date.parse(`${right}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
};

export class TransitionAnalyzer {
  static analyze(data: HistoricalRecord[]): Partial<MonthlyParameters>[] {
    if (data.length === 0) {
      return [];
    }

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const counts: Record<number, { d_to_w: number; d_to_d: number; w_to_w: number; w_to_d: number; observations: number }> = {};
    const spells: Record<number, { dry: number[]; wet: number[] }> = {};

    for (let month = 1; month <= 12; month += 1) {
      counts[month] = { d_to_w: 0, d_to_d: 0, w_to_w: 0, w_to_d: 0, observations: 0 };
      spells[month] = { dry: [], wet: [] };
    }

    const commitSpell = (spell: Spell) => {
      spell.months.forEach(month => {
        if (spell.wet) {
          spells[month].wet.push(spell.length);
        } else {
          spells[month].dry.push(spell.length);
        }
      });
    };

    let currentWet = sorted[0].rain_mm >= WET_DAY_THRESHOLD_MM;
    let currentSpell: Spell = {
      wet: currentWet,
      months: new Set([monthFromDate(sorted[0].date)]),
      length: 1,
    };

    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      const month = monthFromDate(current.date);
      const contiguous = dayDiff(current.date, next.date) === 1;
      const nextWet = next.rain_mm >= WET_DAY_THRESHOLD_MM;

      if (contiguous) {
        counts[month].observations += 1;
        if (!currentWet) {
          if (nextWet) counts[month].d_to_w += 1;
          else counts[month].d_to_d += 1;
        } else if (nextWet) {
          counts[month].w_to_w += 1;
        } else {
          counts[month].w_to_d += 1;
        }
      }

      if (contiguous && nextWet === currentWet) {
        currentSpell.length += 1;
        currentSpell.months.add(monthFromDate(next.date));
      } else {
        commitSpell(currentSpell);
        currentWet = nextWet;
        currentSpell = {
          wet: nextWet,
          months: new Set([monthFromDate(next.date)]),
          length: 1,
        };
      }
    }

    commitSpell(currentSpell);

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const c = counts[month];
      const s = spells[month];
      const dryTransitions = c.d_to_w + c.d_to_d;
      const wetTransitions = c.w_to_w + c.w_to_d;
      const avgDry = s.dry.length > 0 ? s.dry.reduce((sum, value) => sum + value, 0) / s.dry.length : undefined;
      const avgWet = s.wet.length > 0 ? s.wet.reduce((sum, value) => sum + value, 0) / s.wet.length : undefined;
      const dryVariance = s.dry.length > 1
        ? s.dry.reduce((sum, value) => sum + (value - (avgDry ?? 0)) ** 2, 0) / (s.dry.length - 1)
        : undefined;
      const wetVariance = s.wet.length > 1
        ? s.wet.reduce((sum, value) => sum + (value - (avgWet ?? 0)) ** 2, 0) / (s.wet.length - 1)
        : undefined;

      return {
        month,
        p01: dryTransitions > 0 ? c.d_to_w / dryTransitions : 0,
        p11: wetTransitions > 0 ? c.w_to_w / wetTransitions : 0,
        meanDrySpell: avgDry ? Number(avgDry.toFixed(2)) : undefined,
        varDrySpell: dryVariance ? Number(dryVariance.toFixed(2)) : undefined,
        meanWetSpell: avgWet ? Number(avgWet.toFixed(2)) : undefined,
        varWetSpell: wetVariance ? Number(wetVariance.toFixed(2)) : undefined,
        avgDrySpell: avgDry ? Number(avgDry.toFixed(2)) : undefined,
        avgWetSpell: avgWet ? Number(avgWet.toFixed(2)) : undefined,
      };
    });
  }
}
