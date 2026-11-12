import type { Json } from './fakes.ts';

/** Model answers for the synthetic photos in e2e/fixtures. */

export const leafFolderObservation: Json = {
  organs: ['leaf'],
  lesion_colors: ['white_straw'],
  lesion_shapes: ['folded_or_rolled_leaf', 'longitudinal_white_streaks'],
  patterns: ['scattered_spots'],
  signs: ['insects'],
  image_quality: 'ok',
  notes: 'Folded leaves with white streaks.',
};

export const blastObservation: Json = {
  organs: ['leaf'],
  lesion_colors: ['grey_white_center', 'brown'],
  lesion_shapes: ['diamond_spindle'],
  patterns: ['scattered_spots'],
  signs: [],
  image_quality: 'ok',
  notes: 'Spindle lesions with grey centres.',
};

export const phytophthoraObservation: Json = {
  organs: ['stem'],
  lesion_colors: ['dark_purple_black'],
  lesion_shapes: ['irregular_blotch'],
  patterns: ['on_trunk_or_branch'],
  signs: ['sap_ooze'],
  image_quality: 'ok',
  notes: 'Dark patch on trunk with oozing sap.',
};

export const vote = (condition: string, confidence: number, second = 'unknown'): Json => ({
  condition,
  confidence,
  second_choice: second,
  evidence: 'Synthetic test vote.',
});

export function expertAnswer(condition: string, extra: Json = {}): Json {
  return {
    condition,
    other_name: '',
    confidence: 0.91,
    severity: 'high',
    summary: 'Typical spindle-shaped lesions with grey centres: rice blast.',
    differential: [{ condition: 'brown_spot', why_not: 'Brown spot lesions are small and round without grey centres.' }],
    evidence: [
      { image_index: 0, description: 'Spindle lesion with a grey centre', box: [470, 200, 560, 330] },
      { image_index: 0, description: 'Second lesion on the same leaf', box: [420, 430, 510, 560] },
    ],
    actions_now: ['Stop nitrogen fertiliser.', 'Keep the field flooded.'],
    ipm: {
      cultural: ['Use resistant varieties next season.'],
      biological: ['Protect natural enemies; avoid broad-spectrum sprays.'],
      chemical_guidance: 'If needed, use a registered fungicide group per the label and the local station.',
    },
    follow_up: ['Check again in 3 days.'],
    see_extension_officer: true,
    ...extra,
  };
}
