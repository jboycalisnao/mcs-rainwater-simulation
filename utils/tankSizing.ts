import { ReliabilityIntervalResult } from '../types';

export interface TankRecommendationSet {
  budget: ReliabilityIntervalResult;
  optimal: ReliabilityIntervalResult;
  resilient: ReliabilityIntervalResult;
}

/**
 * Hydrologically sound multi-tier tank selection based on:
 * 1. Practical target reliability (WHO/UNEP standards for school WASH: 80–85% typical reliability).
 * 2. Conservative drought resilience (10th percentile year).
 * 3. Diminishing marginal returns ("knee of the curve" / Pareto optimum).
 * 4. Adaptive ceiling (if roof or rainfall limits maximum achievable coverage).
 */
export const selectTankRecommendations = (
  results: ReliabilityIntervalResult[]
): TankRecommendationSet | null => {
  if (!results || results.length === 0) return null;

  const maxMedian = Math.max(...results.map(r => r.medianReliability));
  const maxConservative = Math.max(...results.map(r => r.conservativeReliability));

  // Knee of curve detection (point of sharpest decline in marginal gain per 1,000 L)
  let kneeResult = results[0];
  let maxCurvature = -Infinity;
  for (let i = 1; i < results.length - 1; i++) {
    const prev = results[i - 1];
    const curr = results[i];
    const next = results[i + 1];
    const slope1 = (curr.medianReliability - prev.medianReliability) / (curr.tankSize - prev.tankSize);
    const slope2 = (next.medianReliability - curr.medianReliability) / (next.tankSize - curr.tankSize);
    const drop = slope1 - slope2;
    // Knee must achieve at least 75% of maximum achievable ceiling
    if (drop > maxCurvature && curr.medianReliability >= maxMedian * 0.75) {
      maxCurvature = drop;
      kneeResult = curr;
    }
  }

  // 1. Optimal / Recommended Size:
  // Best balance of tank capacity and dependable water coverage.
  // Prioritizes:
  // - Reaching conservative target >= 80% (drought resilience)
  // - Reaching typical target >= 85% or >= 80%
  // - If max ceiling is lower (e.g. during severe dry climate or high demand),
  //   identifies the knee of diminishing returns or >= 90% of max achievable ceiling.
  const optimal: ReliabilityIntervalResult = (
    (maxConservative >= 80 && results.find(r => r.conservativeReliability >= 80)) ||
    (maxMedian >= 85 && results.find(r => r.medianReliability >= 85)) ||
    (maxMedian >= 80 && results.find(r => r.medianReliability >= 80)) ||
    kneeResult ||
    results.find(r => r.medianReliability >= maxMedian * 0.9) ||
    results[0]
  );

  // 2. Budget Choice (Starter Tank):
  // Smallest practical tank reaching >= 70% typical reliability (or ~75% of max ceiling),
  // strictly bounded by optimal size.
  const budgetCandidates = results.filter(r => r.tankSize <= optimal.tankSize);
  const budget: ReliabilityIntervalResult = (
    budgetCandidates.find(r => r.medianReliability >= 70) ||
    budgetCandidates.find(r => r.medianReliability >= maxMedian * 0.75) ||
    budgetCandidates[0] ||
    results[0]
  );

  // 3. Extra Reserve (Resilient Choice):
  // Higher capacity for dry season resilience (>= 90% typical reliability or >= 95% of ceiling),
  // at least equal to optimal size.
  const resilientCandidates = results.filter(r => r.tankSize >= optimal.tankSize);
  const resilient: ReliabilityIntervalResult = (
    resilientCandidates.find(r => r.medianReliability >= 90) ||
    resilientCandidates.find(r => r.medianReliability >= maxMedian * 0.95) ||
    resilientCandidates[resilientCandidates.length - 1] ||
    results[results.length - 1]
  );

  return { budget, optimal, resilient };
};

/**
 * Returns the single recommended tank from tested results.
 */
export const selectRecommendedTank = (
  results: ReliabilityIntervalResult[]
): ReliabilityIntervalResult | null => {
  const recommendations = selectTankRecommendations(results);
  return recommendations?.optimal ?? null;
};

export interface CommercialTankCombination {
  text: string;
  totalKl: number;
  parallelCount: number;
  primaryUnitSize: number;
}

/**
 * Decomposes any recommended tank capacity into standard Philippine commercial sizes
 * (Bestank, Firstank, Weida: 10 kL, 8 kL, 6 kL, 5 kL, 4 kL, 3 kL, 2 kL, 1 kL).
 */
export const getCommercialCombo = (tankSizeLiters: number): CommercialTankCombination => {
  const standardSizes = [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1000];
  let remaining = Math.max(1000, Math.round(tankSizeLiters / 1000) * 1000);
  const parts: { count: number; size: number; label: string }[] = [];
  let total = 0;
  let totalTanks = 0;

  for (const size of standardSizes) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / size);
    if (count > 0) {
      parts.push({
        count,
        size,
        label: size >= 1000 ? `${size / 1000} kL` : `${size} L`,
      });
      remaining -= count * size;
      total += count * size;
      totalTanks += count;
    }
  }

  const text = parts.length > 0
    ? parts.map(p => `${p.count} × ${p.label}`).join(' + ')
    : `${(tankSizeLiters / 1000).toFixed(1)} kL`;

  return {
    text,
    totalKl: total / 1000,
    parallelCount: Math.max(1, totalTanks),
    primaryUnitSize: parts[0]?.size ?? Math.min(10000, tankSizeLiters),
  };
};
