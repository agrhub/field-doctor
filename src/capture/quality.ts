/**
 * Classic (non-AI) photo checks that run instantly and offline before any
 * model sees the image. A blurry or dark photo is the most common cause of a
 * wrong diagnosis, so we ask for a retake on the spot.
 */

export type QualityVerdict = 'ok' | 'blurry' | 'too_dark' | 'overexposed';

export interface QualityReport {
  verdict: QualityVerdict;
  sharpness: number;
  brightness: number;
  overexposedRatio: number;
}

/** Thresholds for a grayscale image downscaled to ~256 px on the long side. */
export const QUALITY_THRESHOLDS = {
  minSharpness: 40,
  minBrightness: 45,
  maxOverexposedRatio: 0.25,
};

/** Rec. 601 luma from RGBA pixels. */
export function toGrayscale(rgba: Uint8ClampedArray): Float32Array {
  const gray = new Float32Array(rgba.length / 4);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    gray[p] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return gray;
}

/** Variance of the 4-neighbour Laplacian: low values mean a blurry image. */
export function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export function brightnessStats(gray: Float32Array): { mean: number; overexposedRatio: number } {
  let sum = 0;
  let over = 0;
  for (const v of gray) {
    sum += v;
    if (v > 245) over++;
  }
  return { mean: sum / gray.length, overexposedRatio: over / gray.length };
}

export function assessQuality(gray: Float32Array, width: number, height: number): QualityReport {
  const sharpness = laplacianVariance(gray, width, height);
  const { mean, overexposedRatio } = brightnessStats(gray);
  let verdict: QualityVerdict = 'ok';
  if (mean < QUALITY_THRESHOLDS.minBrightness) verdict = 'too_dark';
  else if (overexposedRatio > QUALITY_THRESHOLDS.maxOverexposedRatio) verdict = 'overexposed';
  else if (sharpness < QUALITY_THRESHOLDS.minSharpness) verdict = 'blurry';
  return { verdict, sharpness, brightness: mean, overexposedRatio };
}
