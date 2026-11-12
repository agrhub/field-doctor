import type { Observation, Severity } from '../knowledge';

/** Where an inference actually ran, as reported by Firebase AI Logic. */
export type InferenceWhere = 'on_device' | 'in_cloud' | 'mixed' | 'manual';

export interface CaseContext {
  growthStage: string;
  weather: 'rainy' | 'hot_dry' | 'foggy_humid' | 'normal';
  spread: 'few_plants' | 'patch' | 'whole_field';
  daysSinceNoticed: number;
}

export interface Vote {
  conditionId: string;
  confidence: number;
  secondChoiceId: string;
}

export interface Tier1Result {
  where: InferenceWhere;
  observation: Observation;
  votes: Vote[];
  durationMs: number;
}

export type EscalationReason =
  | 'poor_image'
  | 'unknown'
  | 'low_confidence'
  | 'close_margin'
  | 'rule_disagrees'
  | 'high_severity'
  | 'user_requested'
  | 'manual_checklist';

export interface RankedCandidate {
  conditionId: string;
  support: number;
  ruleScore: number;
}

export interface RoutingDecision {
  action: 'accept' | 'escalate';
  reasons: EscalationReason[];
  topConditionId: string;
  confidence: number;
  margin: number;
  ranking: RankedCandidate[];
}

export interface EvidenceBox {
  imageIndex: number;
  description: string;
  /** [ymin, xmin, ymax, xmax] normalised to 0..1000, when the model located it. */
  box?: [number, number, number, number];
}

export interface ExpertResult {
  conditionId: string;
  otherName: string;
  confidence: number;
  severity: Severity;
  summary: string;
  differential: { conditionId: string; whyNot: string }[];
  evidence: EvidenceBox[];
  actionsNow: string[];
  ipm: { cultural: string[]; biological: string[]; chemicalGuidance: string };
  followUp: string[];
  seeExtensionOfficer: boolean;
  model: string;
  lang: 'vi' | 'en';
  durationMs: number;
}

export interface Advisory {
  text: string;
  /** Google Search suggestions chip HTML; must be displayed with grounded results. */
  searchEntryPointHtml: string;
  sources: { title: string; uri: string }[];
}
