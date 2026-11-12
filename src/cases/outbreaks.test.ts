import { describe, expect, it } from 'vitest';
import type { RoutingDecision } from '../ai/types';
import { finalConditionId, hotspots } from './outbreaks';

const decision = (topConditionId: string): RoutingDecision => ({
  action: 'accept',
  reasons: [],
  topConditionId,
  confidence: 0.9,
  margin: 0.5,
  ranking: [],
});

describe('outbreak hotspots', () => {
  it('prefers the officer review over the expert and the first look', () => {
    expect(finalConditionId({ decision: decision('brown_spot'), expert: null })).toBe('brown_spot');
    expect(
      finalConditionId({
        decision: decision('brown_spot'),
        expert: { conditionId: 'rice_blast' } as never,
        review: { conditionId: 'sheath_blight' } as never,
      }),
    ).toBe('sheath_blight');
  });

  it('groups cases by area cell, skips healthy and unlocated ones, and keeps the worst severity', () => {
    const spots = hotspots([
      { cropId: 'rice', area: { lat: 10.03, lng: 105.78 }, decision: decision('rice_leaf_folder'), expert: null },
      { cropId: 'rice', area: { lat: 10.03, lng: 105.78 }, decision: decision('rice_blast'), expert: null },
      { cropId: 'rice', area: { lat: 10.03, lng: 105.78 }, decision: decision('rice_blast'), expert: null },
      { cropId: 'rice', area: { lat: 10.25, lng: 105.97 }, decision: decision('healthy'), expert: null },
      { cropId: 'rice', area: null, decision: decision('rice_blast'), expert: null },
    ]);
    expect(spots).toHaveLength(1);
    expect(spots[0].total).toBe(3);
    expect(spots[0].severity).toBe('high');
    expect(spots[0].entries[0]).toMatchObject({ conditionId: 'rice_blast', count: 2 });
  });
});
