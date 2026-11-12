import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../app/context';
import { finalConditionId } from '../cases/outbreaks';
import { watchMyCases } from '../cases/repo';
import type { CaseRecord } from '../cases/types';
import { useI18n } from '../i18n';
import { getCrop } from '../knowledge';
import { WhereBadge } from '../ui/common';
import { formatDate, useConditionName } from '../ui/format';

export function CaseList({ cases }: { cases: CaseRecord[] }) {
  const { t, lang, l } = useI18n();
  const name = useConditionName();
  if (cases.length === 0) return <p className="muted">{t('myCasesEmpty')}</p>;
  return (
    <ul className="case-list">
      {cases.map((c) => {
        const crop = getCrop(c.cropId);
        const finalId = finalConditionId(c);
        return (
          <li key={c.id}>
            <Link to={`/case/${c.id}`}>
              <span>
                <strong>{name(crop, finalId, c.expert?.otherName)}</strong>
                <span className="small muted">
                  {' '}
                  · {l(crop.names)} · {formatDate(c.createdAt, lang)}
                </span>
              </span>
              <span className="case-meta">
                <WhereBadge where={c.tier1.where} />
                <span className={`status status-${c.status}`}>{t(`status_${c.status}`)}</span>
                {c.pendingSync && <span title={t('waitingSync')}>⏳</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MyCases() {
  const { t } = useI18n();
  const { user } = useAppState();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  useEffect(() => (user ? watchMyCases(user.uid, setCases) : undefined), [user]);
  return (
    <div className="page">
      <h2>{t('navCases')}</h2>
      <CaseList cases={cases} />
    </div>
  );
}
