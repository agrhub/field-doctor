import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../app/context';
import { watchStationCases } from '../cases/repo';
import type { CaseRecord } from '../cases/types';
import { useI18n } from '../i18n';
import { getCrop } from '../knowledge';
import { useConditionName } from '../ui/format';
import { DeviceCard } from '../ui/DeviceCard';
import { CaseList } from './MyCases';

export function Station() {
  const { t } = useI18n();
  const { user, station } = useAppState();
  const name = useConditionName();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => (station ? watchStationCases(setCases, (e) => setError(e.message)) : undefined), [station]);

  // Simple outbreak signal: which conditions are being reported right now.
  const counts = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    for (const c of cases) {
      const crop = getCrop(c.cropId);
      const id = c.review?.conditionId ?? c.expert?.conditionId ?? c.decision.topConditionId;
      const key = `${crop.id}:${id}`;
      m.set(key, { label: name(crop, id, c.expert?.otherName), n: (m.get(key)?.n ?? 0) + 1 });
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [cases, name]);

  if (!station) {
    return (
      <div className="page">
        <h2>{t('navStation')}</h2>
        <p>{t('stationIntro')}</p>
        <p className="notice">
          {t('stationNoAccess')} <code>{user?.uid ?? '…'}</code>
        </p>
      </div>
    );
  }

  const max = counts[0]?.n ?? 1;
  return (
    <div className="page">
      <h2>{t('navStation')}</h2>
      <p>{t('stationIntro')}</p>
      <DeviceCard />
      {counts.length > 0 && (
        <section className="card">
          <h3>{t('outbreakSummary')}</h3>
          <ul className="ranking">
            {counts.map((c) => (
              <li key={c.label}>
                <span>{c.label}</span>
                <span className="bar">
                  <span className="bar-fill" style={{ width: `${(c.n / max) * 100}%` }} />
                  <span className="bar-label">{c.n}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && <p className="error">{error}</p>}
      <CaseList cases={cases} />
    </div>
  );
}
