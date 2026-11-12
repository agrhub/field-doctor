import { fetchAndActivate, getRemoteConfig, getValue } from 'firebase/remote-config';
import { app } from './firebase';
import { DEFAULT_SETTINGS, type Settings } from './settings';

export { DEFAULT_SETTINGS, type Settings };

const KEYS: Record<keyof Settings, string> = {
  tier1Runs: 'tier1_runs',
  tier1MaxImages: 'tier1_max_images',
  escalateConfidenceBelow: 'escalate_confidence_below',
  escalateMarginBelow: 'escalate_margin_below',
  escalateHighSeverity: 'escalate_high_severity',
  triageCloudModel: 'triage_cloud_model',
  expertCloudModel: 'expert_cloud_model',
  enableGrounding: 'enable_grounding',
};

let current: Settings = { ...DEFAULT_SETTINGS };

export function getSettings(): Settings {
  return current;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 0 : 60 * 60 * 1000;
    rc.defaultConfig = Object.fromEntries(
      (Object.keys(KEYS) as (keyof Settings)[]).map((k) => [KEYS[k], DEFAULT_SETTINGS[k]]),
    );
    await fetchAndActivate(rc);
    current = {
      tier1Runs: getValue(rc, KEYS.tier1Runs).asNumber(),
      tier1MaxImages: getValue(rc, KEYS.tier1MaxImages).asNumber(),
      escalateConfidenceBelow: getValue(rc, KEYS.escalateConfidenceBelow).asNumber(),
      escalateMarginBelow: getValue(rc, KEYS.escalateMarginBelow).asNumber(),
      escalateHighSeverity: getValue(rc, KEYS.escalateHighSeverity).asBoolean(),
      triageCloudModel: getValue(rc, KEYS.triageCloudModel).asString(),
      expertCloudModel: getValue(rc, KEYS.expertCloudModel).asString(),
      enableGrounding: getValue(rc, KEYS.enableGrounding).asBoolean(),
    };
  } catch (err) {
    // Offline or not configured: keep the last activated / default values.
    console.warn('Remote Config unavailable, using defaults', err);
  }
  return current;
}
