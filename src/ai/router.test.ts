import { describe, expect, it } from 'vitest';
import { getCrop, type Observation } from '../knowledge';
import { scoreObservation } from '../knowledge/scoring';
import { DEFAULT_SETTINGS } from '../lib/settings';
import { aggregateVotes, route } from './router';
import type { Tier1Result, Vote } from './types';

const rice = getCrop('rice');

const leafFolderObs: Observation = {
  organs: ['leaf'],
  lesionColors: ['white_straw'],
  lesionShapes: ['folded_or_rolled_leaf', 'longitudinal_white_streaks'],
  patterns: ['scattered_spots'],
  signs: ['insects'],
  imageQuality: 'ok',
  notes: '',
};

const blastObs: Observation = {
  organs: ['leaf'],
  lesionColors: ['grey_white_center'],
  lesionShapes: ['diamond_spindle'],
  patterns: ['scattered_spots'],
  signs: [],
  imageQuality: 'ok',
  notes: '',
};

function tier1(observation: Observation, votes: Vote[], where: Tier1Result['where'] = 'on_device'): Tier1Result {
  return { where, observation, votes, durationMs: 0 };
}

const vote = (conditionId: string, confidence: number, secondChoiceId = 'unknown'): Vote => ({
  conditionId,
  confidence,
  secondChoiceId,
});

describe('aggregateVotes', () => {
  it('rewards agreement between runs', () => {
    const agree = aggregateVotes([vote('a', 0.9), vote('a', 0.9), vote('a', 0.9)]);
    const disagree = aggregateVotes([vote('a', 0.9), vote('b', 0.9), vote('c', 0.9)]);
    expect(agree.get('a')).toBeCloseTo(0.9);
    expect(disagree.get('a')).toBeCloseTo(0.3);
  });
});

describe('route', () => {
  const settings = DEFAULT_SETTINGS;

  it('accepts a confident, consistent, low-severity on-device answer', () => {
    const t1 = tier1(leafFolderObs, [
      vote('rice_leaf_folder', 0.95),
      vote('rice_leaf_folder', 0.9),
      vote('rice_leaf_folder', 0.92),
    ]);
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, leafFolderObs), settings });
    expect(d.action).toBe('accept');
    expect(d.topConditionId).toBe('rice_leaf_folder');
    expect(d.reasons).toEqual([]);
  });

  it('escalates high-severity conditions even when confident', () => {
    const t1 = tier1(blastObs, [vote('rice_blast', 0.95), vote('rice_blast', 0.95), vote('rice_blast', 0.95)]);
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, blastObs), settings });
    expect(d.action).toBe('escalate');
    expect(d.reasons).toEqual(['high_severity']);
  });

  it('escalates when runs disagree', () => {
    const t1 = tier1(leafFolderObs, [
      vote('rice_leaf_folder', 0.8),
      vote('brown_spot', 0.8),
      vote('golden_apple_snail', 0.8),
    ]);
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, leafFolderObs), settings });
    expect(d.action).toBe('escalate');
    expect(d.reasons).toContain('low_confidence');
    expect(d.reasons).toContain('close_margin');
  });

  it('escalates when the model contradicts the symptom rules', () => {
    const t1 = tier1(leafFolderObs, [
      vote('golden_apple_snail', 0.95),
      vote('golden_apple_snail', 0.95),
      vote('golden_apple_snail', 0.95),
    ]);
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, leafFolderObs), settings });
    expect(d.reasons).toContain('rule_disagrees');
  });

  it('escalates poor images and unknown answers', () => {
    const t1 = tier1({ ...leafFolderObs, imageQuality: 'blurry' }, [vote('unknown', 0.9)]);
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, leafFolderObs), settings });
    expect(d.reasons).toEqual(expect.arrayContaining(['poor_image', 'unknown']));
  });

  it('ranks the offline checklist by rules and always asks for a second opinion', () => {
    const t1 = tier1(blastObs, [], 'manual');
    const d = route({ crop: rice, tier1: t1, rules: scoreObservation(rice, blastObs), settings });
    expect(d.topConditionId).toBe('rice_blast');
    expect(d.reasons).toContain('manual_checklist');
    expect(d.action).toBe('escalate');
  });
});
