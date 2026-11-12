import { describe, expect, it } from 'vitest';
import { getCrop } from '../knowledge';
import { parseJson, toObservation, toVote } from './parse';

const rice = getCrop('rice');

describe('model output parsing', () => {
  it('strips Markdown fences', () => {
    expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('drops values outside the vocabulary', () => {
    const obs = toObservation({
      organs: ['leaf', 'wing'],
      lesion_colors: ['brown', 'brown'],
      lesion_shapes: 'diamond_spindle',
      patterns: [],
      signs: ['insects'],
      image_quality: 'excellent',
      notes: 42,
    });
    expect(obs.organs).toEqual(['leaf']);
    expect(obs.lesionColors).toEqual(['brown']);
    expect(obs.lesionShapes).toEqual([]);
    expect(obs.imageQuality).toBe('ok');
    expect(obs.notes).toBe('');
  });

  it('maps unknown ids to "unknown" and normalises percent confidence', () => {
    const v = toVote(rice, { condition: 'dragon_rot', confidence: 85, second_choice: 'rice_blast' });
    expect(v).toEqual({ conditionId: 'unknown', confidence: 0.85, secondChoiceId: 'rice_blast' });
  });
});
