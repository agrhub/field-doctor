/**
 * Shared symptom vocabulary. The on-device model must describe photos using
 * only these values, which keeps its output constrained and lets the
 * deterministic rule scorer compare it with each condition's profile.
 */
export const ORGANS = ['leaf', 'leaf_sheath', 'stem', 'panicle_grain', 'fruit', 'root', 'whole_plant'] as const;
export const LESION_COLORS = [
  'none',
  'brown',
  'grey_white_center',
  'yellow_orange',
  'white_straw',
  'dark_purple_black',
  'water_soaked_green_grey',
] as const;
export const LESION_SHAPES = [
  'none',
  'diamond_spindle',
  'small_round_oval',
  'stripe_from_tip_or_margin',
  'irregular_blotch',
  'longitudinal_white_streaks',
  'folded_or_rolled_leaf',
  'twisted_or_ragged_leaf',
  'cut_or_missing_tissue',
] as const;
export const PATTERNS = [
  'scattered_spots',
  'from_leaf_tip_or_edge',
  'near_water_line_or_base',
  'circular_patches_in_field',
  'whole_plant_discolored_or_stunted',
  'uniform_healthy',
] as const;
export const SIGNS = ['insects', 'egg_masses', 'snails', 'webbing_or_frass', 'fungal_growth'] as const;

export type Organ = (typeof ORGANS)[number];
export type LesionColor = (typeof LESION_COLORS)[number];
export type LesionShape = (typeof LESION_SHAPES)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Sign = (typeof SIGNS)[number];

export type ImageQuality = 'ok' | 'blurry' | 'too_dark' | 'too_far' | 'not_a_plant';

/** What the small model (or a farmer, via the offline checklist) observed. */
export interface Observation {
  organs: Organ[];
  lesionColors: LesionColor[];
  lesionShapes: LesionShape[];
  patterns: Pattern[];
  signs: Sign[];
  imageQuality: ImageQuality;
  /** Short English free text from the model; empty for the manual checklist. */
  notes: string;
}

export interface Localized<T = string> {
  vi: T;
  en: T;
}

export type Severity = 'low' | 'medium' | 'high';
export type ConditionKind = 'disease' | 'pest' | 'virus' | 'abiotic' | 'healthy';

export interface SymptomProfile {
  organs: Organ[];
  lesionColors: LesionColor[];
  lesionShapes: LesionShape[];
  patterns: Pattern[];
  signs: Sign[];
}

export interface Condition {
  id: string;
  kind: ConditionKind;
  names: Localized;
  scientificName?: string;
  /** One-line English description given to the models as a candidate. */
  promptHint: string;
  profile: SymptomProfile;
  severity: Severity;
  spreadsFast: boolean;
  /** Should be reported to the local plant protection station. */
  reportToStation: boolean;
  /** Safe, non-chemical first steps. Curated, never model-generated. */
  immediateActions: Localized<string[]>;
  lookalikes: string[];
}

export interface CaptureShot {
  id: string;
  label: Localized;
  hint: Localized;
}

export interface Choice {
  id: string;
  label: Localized;
}

/** A crop (or later: livestock / aquaculture) plugs in as one module. */
export interface CropModule {
  id: string;
  names: Localized;
  /** English name used in prompts. */
  promptName: string;
  shots: CaptureShot[];
  growthStages: Choice[];
  conditions: Condition[];
}
