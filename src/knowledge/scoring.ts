import type { CropModule, Observation, SymptomProfile } from './types';

export interface RuleScore {
  conditionId: string;
  /** 0..1 — share of weighted symptom dimensions that match the profile. */
  score: number;
}

type Dimension = keyof SymptomProfile;

const WEIGHTS: Record<Dimension, number> = {
  organs: 1,
  lesionColors: 2,
  lesionShapes: 2.5,
  patterns: 1.5,
  signs: 2,
};

function intersects<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.some((x) => b.includes(x));
}

/**
 * Deterministic, explainable scoring of an observation against every
 * condition of a crop. Used to cross-check the small model: when the model
 * and the rules disagree, the case is escalated.
 */
export function scoreObservation(crop: CropModule, obs: Observation): RuleScore[] {
  const scores = crop.conditions.map((condition) => {
    let total = 0;
    let matched = 0;
    for (const dim of Object.keys(WEIGHTS) as Dimension[]) {
      const expected = condition.profile[dim] as readonly string[];
      const seen = obs[dim] as readonly string[];
      if (dim === 'signs') {
        // Signs only count when the profile expects one or the photo shows one.
        if (expected.length === 0 && seen.length === 0) continue;
        total += WEIGHTS.signs;
        if (expected.length > 0 && intersects(expected, seen)) matched += WEIGHTS.signs;
        continue;
      }
      if (expected.length === 0 || seen.length === 0) continue;
      total += WEIGHTS[dim];
      if (intersects(expected, seen)) matched += WEIGHTS[dim];
    }
    return { conditionId: condition.id, score: total === 0 ? 0 : matched / total };
  });
  return scores.sort((a, b) => b.score - a.score);
}
