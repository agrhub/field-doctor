import { describe, expect, it } from 'vitest';
import { labelFromPath, summarize, toCsv, type EvalRow } from './metrics';

const ids = ['rice_blast', 'brown_spot', 'healthy'];

const row = (over: Partial<EvalRow>): EvalRow => ({
  file: 'a.jpg',
  label: 'rice_blast',
  config: 'cascade',
  predicted: 'rice_blast',
  top3: ['rice_blast'],
  answeredBy: 'on_device',
  escalated: false,
  cloudCalls: 0,
  ms: 1000,
  error: '',
  ...over,
});

describe('evaluation metrics', () => {
  it('reads labels from folders or filename prefixes', () => {
    expect(labelFromPath('dataset/rice_blast/IMG_01.jpg', ids)).toBe('rice_blast');
    expect(labelFromPath('Brown_Spot__003.png', ids)).toBe('brown_spot');
    expect(labelFromPath('photos/random.jpg', ids)).toBeNull();
  });

  it('computes accuracy, on-device share and cloud calls per config', () => {
    const rows = [
      row({}),
      row({ predicted: 'brown_spot', top3: ['brown_spot', 'rice_blast'], answeredBy: 'expert', escalated: true, cloudCalls: 1 }),
      row({ answeredBy: 'error', error: 'boom' }),
      row({ config: 'cloud', answeredBy: 'expert', cloudCalls: 1 }),
    ];
    const [cascade, cloud] = summarize(rows);
    expect(cascade).toMatchObject({ config: 'cascade', n: 3, errors: 1, top1: 0.5, top3: 1, resolvedOnDevice: 0.5, cloudCallsPer100: 50 });
    expect(cloud).toMatchObject({ config: 'cloud', n: 1, top1: 1, resolvedOnDevice: 0, cloudCallsPer100: 100 });
  });

  it('escapes CSV cells', () => {
    const csv = toCsv([row({ file: 'a,"b".jpg' })]);
    expect(csv.split('\n')[1].startsWith('"a,""b"".jpg"')).toBe(true);
  });
});
