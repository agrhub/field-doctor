import { describe, expect, it } from 'vitest';
import { assessQuality, brightnessStats, laplacianVariance, toGrayscale } from './quality';

function image(width: number, height: number, fn: (x: number, y: number) => number): Float32Array {
  const g = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) g[y * width + x] = fn(x, y);
  return g;
}

describe('image quality', () => {
  it('converts RGBA to luma', () => {
    const gray = toGrayscale(new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]));
    expect(gray[0]).toBeCloseTo(255, 0);
    expect(gray[1]).toBe(0);
  });

  it('gives a flat image zero sharpness and flags it as blurry', () => {
    const flat = image(64, 64, () => 128);
    expect(laplacianVariance(flat, 64, 64)).toBe(0);
    expect(assessQuality(flat, 64, 64).verdict).toBe('blurry');
  });

  it('accepts a detailed, well-lit image', () => {
    const checker = image(64, 64, (x, y) => ((x + y) % 2 === 0 ? 60 : 200));
    const report = assessQuality(checker, 64, 64);
    expect(report.sharpness).toBeGreaterThan(1000);
    expect(report.verdict).toBe('ok');
  });

  it('flags dark and overexposed photos', () => {
    const dark = image(64, 64, (x, y) => ((x + y) % 2 === 0 ? 5 : 40));
    expect(assessQuality(dark, 64, 64).verdict).toBe('too_dark');
    const bright = image(64, 64, (x) => (x % 2 === 0 ? 250 : 255));
    expect(brightnessStats(bright).overexposedRatio).toBe(1);
    expect(assessQuality(bright, 64, 64).verdict).toBe('overexposed');
  });
});
