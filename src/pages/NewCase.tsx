import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { route } from '../ai/router';
import { runTier1 } from '../ai/tier1';
import type { CaseContext, Tier1Result } from '../ai/types';
import { useAppState } from '../app/context';
import type { PreparedPhoto } from '../capture/prepare';
import { createCase } from '../cases/repo';
import { useI18n } from '../i18n';
import { CROPS, getCrop, type Observation } from '../knowledge';
import { scoreObservation } from '../knowledge/scoring';
import { ManualChecklist } from '../ui/ManualChecklist';
import { PhotoSlot } from '../ui/PhotoSlot';

const WEATHERS: CaseContext['weather'][] = ['rainy', 'hot_dry', 'foggy_humid', 'normal'];
const SPREADS: CaseContext['spread'][] = ['few_plants', 'patch', 'whole_field'];

function approximateArea(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      // Two decimals ≈ 1 km: enough for an outbreak map, not a farm address.
      (p) => resolve({ lat: +p.coords.latitude.toFixed(2), lng: +p.coords.longitude.toFixed(2) }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export function NewCase() {
  const { t, l, lang } = useI18n();
  const { user, settings } = useAppState();
  const navigate = useNavigate();

  const [cropId, setCropId] = useState(CROPS[0].id);
  const crop = getCrop(cropId);
  const [photos, setPhotos] = useState<(PreparedPhoto | null)[]>(() => crop.shots.map(() => null));
  const [context, setContext] = useState<CaseContext>({
    growthStage: crop.growthStages[1].id,
    weather: 'normal',
    spread: 'few_plants',
    daysSinceNoticed: 1,
  });
  const [shareArea, setShareArea] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [needChecklist, setNeedChecklist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taken = crop.shots.map((s, i) => ({ shot: s, photo: photos[i] })).filter((x) => x.photo);
  const blobs = taken.map((x) => x.photo!.blob);
  const shotIds = taken.map((x) => x.shot.id);
  const shotLabels = taken.map((x) => x.shot.label.en);

  async function finish(tier1: Tier1Result) {
    if (!user) return;
    setStage(t('stageSave'));
    const decision = route({ crop, tier1, rules: scoreObservation(crop, tier1.observation), settings });
    const area = shareArea ? await approximateArea() : null;
    const id = await createCase({
      ownerUid: user.uid,
      cropId,
      lang,
      context,
      shotIds,
      photos: blobs,
      area,
      tier1,
      decision,
    });
    navigate(`/case/${id}`);
  }

  async function analyze() {
    setError(null);
    if (!photos[0]) return setError(t('needClosePhoto'));
    try {
      const tier1 = await runTier1(crop, blobs, shotLabels, context, settings, {
        onStage: (s, run, total) =>
          setStage(s === 'observe' ? t('stageObserve') : `${t('stageClassify')} ${run}/${total}…`),
      });
      await finish(tier1);
    } catch (err) {
      console.error(err);
      setStage(null);
      // No local model and no network: fall back to the symptom checklist.
      if (!navigator.onLine) setNeedChecklist(true);
      else setError(err instanceof Error ? err.message : String(err));
    }
  }

  function fromChecklist(observation: Observation) {
    void finish({ where: 'manual', observation, votes: [], durationMs: 0 });
  }

  return (
    <div className="page">
      <h2>{t('navNew')}</h2>

      <section className="card">
        <label className="field">
          <span>{t('crop')}</span>
          <select
            value={cropId}
            onChange={(e) => {
              const next = getCrop(e.target.value);
              setCropId(next.id);
              setPhotos(next.shots.map(() => null));
              setContext((c) => ({ ...c, growthStage: next.growthStages[1].id }));
            }}
          >
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {l(c.names)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <h3>{t('photos')}</h3>
      <div className="slots">
        {crop.shots.map((shot, i) => (
          <PhotoSlot
            key={shot.id}
            shot={shot}
            required={i === 0}
            value={photos[i]}
            onChange={(p) => setPhotos((all) => all.map((x, j) => (j === i ? p : x)))}
          />
        ))}
      </div>

      <section className="card">
        <h3>{t('details')}</h3>
        <div className="grid2">
          <label className="field">
            <span>{t('growthStage')}</span>
            <select value={context.growthStage} onChange={(e) => setContext({ ...context, growthStage: e.target.value })}>
              {crop.growthStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {l(s.label)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('weather')}</span>
            <select
              value={context.weather}
              onChange={(e) => setContext({ ...context, weather: e.target.value as CaseContext['weather'] })}
            >
              {WEATHERS.map((w) => (
                <option key={w} value={w}>
                  {t(`weather_${w}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('spread')}</span>
            <select
              value={context.spread}
              onChange={(e) => setContext({ ...context, spread: e.target.value as CaseContext['spread'] })}
            >
              {SPREADS.map((s) => (
                <option key={s} value={s}>
                  {t(`spread_${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('daysSince')}</span>
            <input
              type="number"
              min={0}
              max={90}
              value={context.daysSinceNoticed}
              onChange={(e) => setContext({ ...context, daysSinceNoticed: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={shareArea} onChange={(e) => setShareArea(e.target.checked)} />
          {t('shareArea')}
        </label>
      </section>

      {error && <p className="error">{error}</p>}

      {needChecklist ? (
        <>
          <p className="notice">{t('aiFailed')}</p>
          <ManualChecklist onDone={fromChecklist} />
        </>
      ) : (
        <button className="btn btn-big" onClick={() => void analyze()} disabled={!!stage || !user}>
          {stage ?? t('analyze')}
        </button>
      )}
    </div>
  );
}
