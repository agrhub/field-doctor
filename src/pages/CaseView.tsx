import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppState } from '../app/context';
import { getCasePhotos, requestExpert, watchCase } from '../cases/repo';
import type { CaseRecord } from '../cases/types';
import { useI18n } from '../i18n';
import { getCrop } from '../knowledge';
import { formatDate, useConditionName } from '../ui/format';
import { ExpertCard } from '../ui/ExpertCard';
import { StationPanel } from '../ui/StationPanel';
import { Tier1Card } from '../ui/Tier1Card';

function CloudStatus({ rec }: { rec: CaseRecord }) {
  const { t } = useI18n();
  const { online } = useAppState();
  if (rec.status === 'diagnosed' || rec.status === 'reviewed') return null;
  if (rec.status === 'triaged') {
    return (
      <button className="btn btn-secondary" onClick={() => void requestExpert(rec.id)}>
        ☁️ {t('askExpert')}
      </button>
    );
  }
  if (rec.cloud.lastError) {
    return (
      <section className="card">
        <p className="error">
          {t('expertFailed')} {rec.cloud.lastError}
        </p>
        <button className="btn btn-secondary" onClick={() => void requestExpert(rec.id)}>
          {t('retry')}
        </button>
      </section>
    );
  }
  return <p className="notice">{online ? `☁️ ${t('diagnosing')}` : `📶 ${t('queuedOffline')}`}</p>;
}

export function CaseView() {
  const { id = '' } = useParams();
  const { t, lang } = useI18n();
  const { station, user } = useAppState();
  const name = useConditionName();
  const [rec, setRec] = useState<CaseRecord | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Blob[]>([]);

  useEffect(() => watchCase(id, setRec), [id]);

  // Reload photos only when the case is found or its uploads change, not on every snapshot.
  const found = Boolean(rec);
  const pathsKey = rec?.photoPaths.join('|') ?? '';
  useEffect(() => {
    if (!found) return;
    let cancelled = false;
    getCasePhotos(id, pathsKey ? pathsKey.split('|') : [])
      .then((p) => !cancelled && setPhotos(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id, found, pathsKey]);

  const urls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => urls.forEach((x) => URL.revokeObjectURL(x)), [urls]);

  if (rec === undefined) return <div className="page">…</div>;
  if (rec === null)
    return (
      <div className="page">
        <p>{t('notFound')}</p>
        <Link to="/">{t('back')}</Link>
      </div>
    );

  const crop = getCrop(rec.cropId);
  const isOwner = user?.uid === rec.ownerUid;

  return (
    <div className="page">
      <p className="small muted">
        {formatDate(rec.createdAt, lang)} · {t(`status_${rec.status}`)}
        {rec.pendingSync && ` · ⏳ ${t('waitingSync')}`}
      </p>

      <div className="thumbs">
        {urls.map((u, i) => (
          <img key={i} src={u} alt="" />
        ))}
      </div>

      {rec.review && (
        <section className="card review">
          <h3>✅ {t('review')}</h3>
          <p className="diagnosis">{name(crop, rec.review.conditionId)}</p>
          {rec.review.note && <p>{rec.review.note}</p>}
        </section>
      )}

      <Tier1Card title={t('firstLook')} crop={crop} tier1={rec.tier1} decision={rec.decision} />

      {isOwner && <CloudStatus rec={rec} />}
      {rec.expert && <ExpertCard crop={crop} expert={rec.expert} photoUrls={urls} />}
      {station && photos.length > 0 && <StationPanel rec={rec} crop={crop} photos={photos} />}
    </div>
  );
}
