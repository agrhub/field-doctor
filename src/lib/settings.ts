/**
 * Routing knobs for the hybrid cascade. They live in Remote Config so an
 * agronomist can tune them per season without shipping a new build.
 */
export interface Settings {
  /** Self-consistency votes for the on-device classifier. */
  tier1Runs: number;
  /** Max photos sent to the small on-device model (token budget). */
  tier1MaxImages: number;
  /** Escalate to the expert tier when combined confidence is below this. */
  escalateConfidenceBelow: number;
  /** Escalate when the top-2 candidates are closer than this. */
  escalateMarginBelow: number;
  /** Always get a second opinion for fast-spreading, high-severity conditions. */
  escalateHighSeverity: boolean;
  /** Cloud model used when no on-device model exists (hybrid fallback). */
  triageCloudModel: string;
  /** Cloud model for the expert diagnosis tier. */
  expertCloudModel: string;
  /** Fetch current advisories with Grounding with Google Search. */
  enableGrounding: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tier1Runs: 3,
  tier1MaxImages: 2,
  escalateConfidenceBelow: 0.7,
  escalateMarginBelow: 0.2,
  escalateHighSeverity: true,
  triageCloudModel: 'gemini-3.5-flash-lite',
  expertCloudModel: 'gemini-3.8-flash',
  enableGrounding: true,
};
