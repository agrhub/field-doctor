import { useState } from 'react';
import { fetchAdvisory } from '../ai/expert';
import type { Advisory, ExpertResult } from '../ai/types';
import { useAppState } from '../app/context';
import { useI18n } from '../i18n';
import type { CropModule } from '../knowledge';
import { ConfidenceBar } from './common';
import { useConditionName } from './format';

function EvidencePhoto({ url, boxes }: { url: string; boxes: ExpertResult['evidence'] }) {
  return (
    <div className="evidence-photo">
      <img src={url} alt="" />
      {boxes.map((e, i) =>
        e.box ? (
          <span
            key={i}
            className="evidence-box"
            title={e.description}
            style={{
              top: `${e.box[0] / 10}%`,
              left: `${e.box[1] / 10}%`,
              height: `${(e.box[2] - e.box[0]) / 10}%`,
              width: `${(e.box[3] - e.box[1]) / 10}%`,
            }}
          >
            <span className="evidence-num">{i + 1}</span>
          </span>
        ) : null,
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </>
  );
}

function AdvisoryBlock({ crop, conditionId }: { crop: CropModule; conditionId: string }) {
  const { t, lang } = useI18n();
  const { settings, online } = useAppState();
  const [advisory, setAdvisory] = useState<Advisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!settings.enableGrounding) return null;
  return (
    <div className="advisory">
      <h4>{t('advisories')}</h4>
      {advisory ? (
        <>
          <p className="prewrap">{advisory.text}</p>
          {advisory.sources.length > 0 && (
            <p className="small">
              {t('sources')}:{' '}
              {advisory.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer">
                  {s.title || s.uri}
                  {i < advisory.sources.length - 1 ? ', ' : ''}
                </a>
              ))}
            </p>
          )}
          {/* Google Search suggestions must be shown with grounded results. */}
          {advisory.searchEntryPointHtml && (
            <iframe
              className="search-entry"
              title="Google Search suggestions"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={advisory.searchEntryPointHtml}
            />
          )}
        </>
      ) : (
        <button
          className="btn btn-secondary"
          disabled={loading || !online}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              setAdvisory(await fetchAdvisory(crop, conditionId, lang, settings));
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? '…' : t('loadAdvisories')}
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function ExpertCard({ crop, expert, photoUrls }: { crop: CropModule; expert: ExpertResult; photoUrls: string[] }) {
  const { t } = useI18n();
  const name = useConditionName();
  const byImage = photoUrls.map((_, i) => expert.evidence.filter((e) => e.imageIndex === i));

  return (
    <section className="card expert">
      <div className="card-head">
        <h3>{t('expert')}</h3>
        <span className="badge badge-in_cloud">☁️ {expert.model}</span>
      </div>
      <p className="diagnosis">{name(crop, expert.conditionId, expert.otherName)}</p>
      <div className="meta-row">
        <span>
          {t('confidence')} <ConfidenceBar value={expert.confidence} />
        </span>
        <span className={`sev sev-${expert.severity}`}>
          {t('severity')}: {t(`severity_${expert.severity}`)}
        </span>
      </div>
      <p>{expert.summary}</p>
      {expert.seeExtensionOfficer && <p className="notice">{t('seeOfficer')}</p>}

      {expert.evidence.length > 0 && (
        <>
          <h4>{t('evidence')}</h4>
          <div className="evidence-grid">
            {photoUrls.map((url, i) =>
              byImage[i].length ? <EvidencePhoto key={i} url={url} boxes={byImage[i]} /> : null,
            )}
          </div>
          <ol>
            {expert.evidence.map((e, i) => (
              <li key={i}>{e.description}</li>
            ))}
          </ol>
        </>
      )}

      <List title={t('doNow')} items={expert.actionsNow} />
      <h4>{t('ipm')}</h4>
      <List title={t('ipmCultural')} items={expert.ipm.cultural} />
      <List title={t('ipmBiological')} items={expert.ipm.biological} />
      {expert.ipm.chemicalGuidance && (
        <>
          <h4>{t('ipmChemical')}</h4>
          <p>{expert.ipm.chemicalGuidance}</p>
        </>
      )}
      {expert.differential.length > 0 && (
        <>
          <h4>{t('differential')}</h4>
          <ul>
            {expert.differential.map((d, i) => (
              <li key={i}>
                <strong>{name(crop, d.conditionId, d.conditionId)}</strong>: {d.whyNot}
              </li>
            ))}
          </ul>
        </>
      )}
      <List title={t('followUp')} items={expert.followUp} />
      <AdvisoryBlock crop={crop} conditionId={expert.conditionId} />
      <p className="disclaimer">{t('disclaimer')}</p>
    </section>
  );
}
