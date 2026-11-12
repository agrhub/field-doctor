import type { RoutingDecision, Tier1Result } from '../ai/types';
import { useI18n } from '../i18n';
import { findCondition, type CropModule } from '../knowledge';
import { ConfidenceBar, WhereBadge } from './common';
import { useConditionName } from './format';

interface Props {
  title: string;
  crop: CropModule;
  tier1: Tier1Result;
  decision: RoutingDecision;
  /** Show curated first steps (farmer view). */
  showActions?: boolean;
}

export function Tier1Card({ title, crop, tier1, decision, showActions = true }: Props) {
  const { t, l, v } = useI18n();
  const name = useConditionName();
  const top = findCondition(crop, decision.topConditionId);
  const obs = tier1.observation;
  const seen = [...obs.organs, ...obs.lesionColors, ...obs.lesionShapes, ...obs.patterns, ...obs.signs].filter(
    (x) => x !== 'none',
  );

  return (
    <section className="card">
      <div className="card-head">
        <h3>{title}</h3>
        <WhereBadge where={tier1.where} />
      </div>
      <p className="diagnosis">{name(crop, decision.topConditionId)}</p>
      <ul className="ranking">
        {decision.ranking.map((r) => (
          <li key={r.conditionId}>
            <span>{name(crop, r.conditionId)}</span>
            <ConfidenceBar value={r.support} />
          </li>
        ))}
      </ul>
      <p className="small muted">
        {tier1.votes.length > 0 && `${tier1.votes.length} ${t('votes')} · `}
        {tier1.durationMs > 0 && `${(tier1.durationMs / 1000).toFixed(1)} s · `}
        {seen.map(v).join(', ')}
      </p>

      {showActions && top && (
        <>
          {top.reportToStation && <p className="notice">{t('reportStation')}</p>}
          <h4>{t('doNow')}</h4>
          <ul>
            {l(top.immediateActions).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <div className={`routing routing-${decision.action}`}>
        <strong>{t('routing')}: </strong>
        {decision.action === 'accept' ? (
          t('accepted')
        ) : (
          <>
            {t('escalated')} {decision.reasons.map((r) => t(`reason_${r}`)).join(', ')}
          </>
        )}
      </div>
    </section>
  );
}
