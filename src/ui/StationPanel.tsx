import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { route } from '../ai/router';
import { runTier1 } from '../ai/tier1';
import { useAppState } from '../app/context';
import { updateCase } from '../cases/repo';
import type { CaseRecord } from '../cases/types';
import { useI18n } from '../i18n';
import { UNKNOWN_ID, type CropModule } from '../knowledge';
import { scoreObservation } from '../knowledge/scoring';
import { Tier1Card } from './Tier1Card';

/**
 * Extension-officer tools: re-run tier 1 strictly on this laptop's Gemini
 * Nano (free, private, works offline in the field) and record a verdict.
 */
export function StationPanel({ rec, crop, photos }: { rec: CaseRecord; crop: CropModule; photos: Blob[] }) {
  const { t, l } = useI18n();
  const { user, settings, device } = useAppState();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState(rec.review?.conditionId ?? rec.expert?.conditionId ?? rec.decision.topConditionId);
  const [note, setNote] = useState(rec.review?.note ?? '');

  async function recheck() {
    if (!user) return;
    setError(null);
    try {
      const labels = rec.shotIds.map((id) => crop.shots.find((s) => s.id === id)?.label.en ?? id);
      const tier1 = await runTier1(crop, photos, labels, rec.context, settings, {
        onlyOnDevice: true,
        onStage: (s, run, total) => setBusy(s === 'observe' ? t('stageObserve') : `${t('stageClassify')} ${run}/${total}…`),
      });
      const decision = route({ crop, tier1, rules: scoreObservation(crop, tier1.observation), settings });
      await updateCase(rec.id, { stationCheck: { byUid: user.uid, tier1, decision, at: Timestamp.now() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function saveReview() {
    if (!user) return;
    setBusy(t('stageSave'));
    try {
      await updateCase(rec.id, {
        status: 'reviewed',
        review: { byUid: user.uid, conditionId: verdict, note, at: Timestamp.now() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {rec.stationCheck ? (
        <Tier1Card
          title={t('stationCheck')}
          crop={crop}
          tier1={rec.stationCheck.tier1}
          decision={rec.stationCheck.decision}
          showActions={false}
        />
      ) : (
        <section className="card">
          <button className="btn btn-secondary" onClick={() => void recheck()} disabled={!!busy || device !== 'available'}>
            ⚡ {busy ?? t('recheck')}
          </button>
          {device !== 'available' && <p className="small muted">{t('recheckNeedsDevice')}</p>}
        </section>
      )}

      <section className="card">
        <h3>{t('review')}</h3>
        <label className="field">
          <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            {crop.conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {l(c.names)}
              </option>
            ))}
            <option value={UNKNOWN_ID}>{t('unknownCondition')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('reviewNote')}</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="btn" onClick={() => void saveReview()} disabled={!!busy}>
          {t('saveReview')}
        </button>
      </section>
      {error && <p className="error">{error}</p>}
    </>
  );
}
