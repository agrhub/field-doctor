import { describe, expect, it } from 'vitest';
import { getCrop } from './index';
import { scoreObservation } from './scoring';
import type { Observation } from './types';

const rice = getCrop('rice');

const base: Observation = {
  organs: [],
  lesionColors: [],
  lesionShapes: [],
  patterns: [],
  signs: [],
  imageQuality: 'ok',
  notes: '',
};

describe('scoreObservation', () => {
  it('ranks rice blast first for spindle lesions with grey centres', () => {
    const ranked = scoreObservation(rice, {
      ...base,
      organs: ['leaf'],
      lesionColors: ['grey_white_center', 'brown'],
      lesionShapes: ['diamond_spindle'],
      patterns: ['scattered_spots'],
    });
    expect(ranked[0].conditionId).toBe('rice_blast');
    expect(ranked[0].score).toBe(1);
  });

  it('ranks brown planthopper first when insects are seen at the base', () => {
    const ranked = scoreObservation(rice, {
      ...base,
      organs: ['stem'],
      lesionColors: ['yellow_orange'],
      lesionShapes: ['none'],
      patterns: ['near_water_line_or_base'],
      signs: ['insects'],
    });
    expect(ranked[0].conditionId).toBe('brown_planthopper');
  });

  it('separates leaf blight stripes from blast spots', () => {
    const ranked = scoreObservation(rice, {
      ...base,
      organs: ['leaf'],
      lesionColors: ['yellow_orange'],
      lesionShapes: ['stripe_from_tip_or_margin'],
      patterns: ['from_leaf_tip_or_edge'],
    });
    expect(ranked[0].conditionId).toBe('bacterial_leaf_blight');
    const blast = ranked.find((r) => r.conditionId === 'rice_blast')!;
    expect(blast.score).toBeLessThan(0.3);
  });

  it('identifies snail damage from egg masses', () => {
    const ranked = scoreObservation(rice, {
      ...base,
      organs: ['stem'],
      lesionShapes: ['cut_or_missing_tissue'],
      signs: ['egg_masses'],
    });
    expect(ranked[0].conditionId).toBe('golden_apple_snail');
  });

  it('returns every condition with a score in [0, 1]', () => {
    const ranked = scoreObservation(rice, base);
    expect(ranked).toHaveLength(rice.conditions.length);
    for (const r of ranked) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});

describe('durian module', () => {
  const durian = getCrop('durian');

  it('ranks Phytophthora first for oozing trunk lesions', () => {
    const ranked = scoreObservation(durian, {
      ...base,
      organs: ['stem'],
      lesionColors: ['dark_purple_black'],
      lesionShapes: ['irregular_blotch'],
      patterns: ['on_trunk_or_branch'],
      signs: ['sap_ooze'],
    });
    expect(ranked[0].conditionId).toBe('phytophthora');
  });

  it('separates psyllids on flushes from mealybugs on fruit', () => {
    const psyllid = scoreObservation(durian, {
      ...base,
      organs: ['leaf'],
      lesionShapes: ['folded_or_rolled_leaf'],
      patterns: ['young_shoots_or_flush'],
      signs: ['insects', 'white_waxy_coating'],
    });
    expect(psyllid[0].conditionId).toBe('durian_psyllid');
    const mealy = scoreObservation(durian, {
      ...base,
      organs: ['fruit'],
      lesionColors: ['white_straw'],
      lesionShapes: ['none'],
      signs: ['insects', 'white_waxy_coating'],
    });
    expect(mealy[0].conditionId).toBe('mealybug');
  });
});

describe('every crop module', () => {
  it('has unique ids, a healthy entry and only known lookalikes', async () => {
    const { CROPS } = await import('./index');
    for (const crop of CROPS) {
      const ids = crop.conditions.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain('healthy');
      for (const c of crop.conditions) {
        for (const l of c.lookalikes) expect(ids).toContain(l);
        expect(c.immediateActions.vi.length).toBe(c.immediateActions.en.length);
      }
    }
  });
});
