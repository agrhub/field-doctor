import {
  LESION_COLORS,
  LESION_SHAPES,
  ORGANS,
  PATTERNS,
  SIGNS,
  UNKNOWN_ID,
  type CropModule,
  type ImageQuality,
  type Observation,
} from '../knowledge';
import type { Vote } from './types';

/** Parses model JSON, tolerating stray Markdown fences from small models. */
export function parseJson<T = Record<string, unknown>>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

function pick<T extends string>(values: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is T => allowed.includes(v as T)))];
}

const QUALITIES: ImageQuality[] = ['ok', 'blurry', 'too_dark', 'too_far', 'not_a_plant'];

export function toObservation(raw: Record<string, unknown>): Observation {
  const quality = QUALITIES.includes(raw.image_quality as ImageQuality) ? (raw.image_quality as ImageQuality) : 'ok';
  return {
    organs: pick(raw.organs, ORGANS),
    lesionColors: pick(raw.lesion_colors, LESION_COLORS),
    lesionShapes: pick(raw.lesion_shapes, LESION_SHAPES),
    patterns: pick(raw.patterns, PATTERNS),
    signs: pick(raw.signs, SIGNS),
    imageQuality: quality,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 200) : '',
  };
}

export function toVote(crop: CropModule, raw: Record<string, unknown>): Vote {
  const valid = (id: unknown) =>
    typeof id === 'string' && (id === UNKNOWN_ID || crop.conditions.some((c) => c.id === id)) ? id : UNKNOWN_ID;
  const confidence = Number(raw.confidence);
  return {
    conditionId: valid(raw.condition),
    // Some models answer in percent; normalise to 0..1.
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence > 1 ? confidence / 100 : confidence)) : 0,
    secondChoiceId: valid(raw.second_choice),
  };
}
