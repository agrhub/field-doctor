import { findCondition, UNKNOWN_ID, type CropModule } from '../knowledge';
import type { RuleScore } from '../knowledge/scoring';
import type { Settings } from '../lib/settings';
import type { EscalationReason, RankedCandidate, RoutingDecision, Tier1Result, Vote } from './types';

/**
 * Turns self-consistency votes into a support score per condition.
 * A run's top pick adds its confidence; its second choice adds half of the
 * remaining mass. Dividing by the number of runs folds agreement between runs
 * into the score: three runs that disagree can never look confident.
 */
export function aggregateVotes(votes: Vote[]): Map<string, number> {
  const support = new Map<string, number>();
  if (votes.length === 0) return support;
  const add = (id: string, v: number) => support.set(id, (support.get(id) ?? 0) + v / votes.length);
  for (const vote of votes) {
    const c = Math.min(1, Math.max(0, vote.confidence));
    add(vote.conditionId, c);
    if (vote.secondChoiceId && vote.secondChoiceId !== vote.conditionId) add(vote.secondChoiceId, (1 - c) / 2);
  }
  return support;
}

export interface RouteInput {
  crop: CropModule;
  tier1: Tier1Result;
  rules: RuleScore[];
  settings: Pick<Settings, 'escalateConfidenceBelow' | 'escalateMarginBelow' | 'escalateHighSeverity'>;
}

/**
 * The cascade router. Accepting means the on-device answer is good enough to
 * act on immediately; escalating sends the case to the expert cloud tier
 * (right away when online, or through the offline queue).
 */
export function route({ crop, tier1, rules, settings }: RouteInput): RoutingDecision {
  const ruleById = new Map(rules.map((r) => [r.conditionId, r.score]));
  const manual = tier1.where === 'manual';

  // The offline checklist has no model votes: rank purely by the rules.
  const support = manual
    ? new Map(rules.map((r) => [r.conditionId, r.score]))
    : aggregateVotes(tier1.votes);

  const ranking: RankedCandidate[] = [...support.entries()]
    .map(([conditionId, s]) => ({ conditionId, support: s, ruleScore: ruleById.get(conditionId) ?? 0 }))
    .sort((a, b) => b.support - a.support || b.ruleScore - a.ruleScore)
    .slice(0, 3);

  const top = ranking[0] ?? { conditionId: UNKNOWN_ID, support: 0, ruleScore: 0 };
  const confidence = top.support;
  const margin = top.support - (ranking[1]?.support ?? 0);

  const reasons: EscalationReason[] = [];
  if (manual) reasons.push('manual_checklist');
  if (tier1.observation.imageQuality !== 'ok') reasons.push('poor_image');
  if (top.conditionId === UNKNOWN_ID) reasons.push('unknown');
  if (confidence < settings.escalateConfidenceBelow) reasons.push('low_confidence');
  if (ranking.length > 1 && margin < settings.escalateMarginBelow) reasons.push('close_margin');

  if (!manual && top.conditionId !== UNKNOWN_ID) {
    const ruleTop3 = rules.slice(0, 3).map((r) => r.conditionId);
    if (!ruleTop3.includes(top.conditionId) && top.ruleScore < 0.3) reasons.push('rule_disagrees');
  }

  const condition = findCondition(crop, top.conditionId);
  if (settings.escalateHighSeverity && condition?.severity === 'high') reasons.push('high_severity');

  return {
    action: reasons.length > 0 ? 'escalate' : 'accept',
    reasons,
    topConditionId: top.conditionId,
    confidence,
    margin,
    ranking,
  };
}
