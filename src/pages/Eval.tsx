import { useMemo, useRef, useState } from 'react';
import { useAppState } from '../app/context';
import { runEvaluation, type EvalItem } from '../eval/runner';
import { EVAL_CONFIGS, labelFromPath, summarize, toCsv, type EvalConfig, type EvalRow } from '../eval/metrics';
import { useI18n } from '../i18n';
import { CROPS, getCrop } from '../knowledge';
import { useConditionName } from '../ui/format';

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Batch evaluation used to produce the numbers in the submission: the same
 * photos through the full cascade, the on-device tier alone and the cloud
 * expert alone.
 */
export function Eval() {
  const { t, l } = useI18n();
  const { settings, device, online } = useAppState();
  const name = useConditionName();
  const [cropId, setCropId] = useState(CROPS[0].id);
  const crop = getCrop(cropId);
  const [items, setItems] = useState<EvalItem[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [configs, setConfigs] = useState<EvalConfig[]>(['cascade']);
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const abort = useRef<AbortController | null>(null);

  const ids = useMemo(() => crop.conditions.map((c) => c.id), [crop]);
  const summary = useMemo(() => summarize(rows), [rows]);
  const perLabel = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.label, (m.get(i.label) ?? 0) + 1);
    return [...m.entries()];
  }, [items]);

  function onFiles(list: FileList | null) {
    const files = [...(list ?? [])].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    const next: EvalItem[] = [];
    for (const f of files) {
      const path = f.webkitRelativePath || f.name;
      const label = labelFromPath(path, ids);
      if (label) next.push({ file: path, label, blob: f });
    }
    setItems(next);
    setSkipped(files.length - next.length);
    setRows([]);
  }

  async function run() {
    abort.current = new AbortController();
    setRows([]);
    setProgress([0, items.length * configs.length]);
    await runEvaluation(
      crop,
      items,
      configs,
      settings,
      (row, done, total) => {
        setRows((r) => [...r, row]);
        setProgress([done, total]);
      },
      abort.current.signal,
    );
    setProgress(null);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-doctor-eval-${crop.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const configLabel = (c: EvalConfig) => t(`eval_${c}`);

  return (
    <div className="page">
      <h2>{t('evalTitle')}</h2>
      <p>{t('evalIntro')}</p>

      <section className="card">
        <label className="field">
          <span>{t('crop')}</span>
          <select value={cropId} onChange={(e) => (setCropId(e.target.value), setItems([]), setRows([]))}>
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {l(c.names)}
              </option>
            ))}
          </select>
        </label>
        <p className="small muted">
          {t('evalLabelHint')} <code>{ids.slice(0, 3).join(', ')}…</code>
        </p>
        <div className="row-buttons">
          <label className="btn btn-secondary">
            {t('evalPickFolder')}
            <input
              type="file"
              className="visually-hidden"
              multiple
              {...{ webkitdirectory: '' }}
              onChange={(e) => onFiles(e.target.files)}
              data-testid="eval-folder"
            />
          </label>
          <label className="btn btn-secondary">
            {t('evalPickFiles')}
            <input
              type="file"
              className="visually-hidden"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onFiles(e.target.files)}
              data-testid="eval-files"
            />
          </label>
        </div>
        {items.length > 0 && (
          <p className="small" data-testid="eval-loaded">
            {items.length} {t('evalPhotos')}: {perLabel.map(([k, n]) => `${name(crop, k)} (${n})`).join(', ')}
            {skipped > 0 && ` · ${skipped} ${t('evalSkipped')}`}
          </p>
        )}

        <fieldset className="chips">
          <legend>{t('evalConfigs')}</legend>
          {EVAL_CONFIGS.map((c) => {
            const disabled = c === 'device' ? device !== 'available' : !online;
            const on = configs.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`chip ${on ? 'chip-on' : ''}`}
                aria-pressed={on}
                disabled={disabled}
                onClick={() => setConfigs((s) => (on ? s.filter((x) => x !== c) : [...s, c]))}
              >
                {configLabel(c)}
              </button>
            );
          })}
        </fieldset>

        {progress ? (
          <>
            <progress value={progress[0]} max={progress[1]} />
            <p className="small">
              {progress[0]}/{progress[1]}{' '}
              <button className="linklike" onClick={() => abort.current?.abort()}>
                {t('evalStop')}
              </button>
            </p>
          </>
        ) : (
          <button className="btn" disabled={items.length === 0 || configs.length === 0} onClick={() => void run()}>
            {t('evalRun')}
          </button>
        )}
      </section>

      {summary.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>{t('evalResults')}</h3>
            <button className="btn btn-secondary" onClick={download}>
              CSV
            </button>
          </div>
          <div className="table-wrap">
            <table className="table" data-testid="eval-summary">
              <thead>
                <tr>
                  <th>{t('evalConfig')}</th>
                  <th>n</th>
                  <th>Top-1</th>
                  <th>Top-3</th>
                  <th>{t('evalOnDevice')}</th>
                  <th>{t('evalCloudCalls')}</th>
                  <th>{t('evalLatency')}</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.config}>
                    <td>{configLabel(s.config)}</td>
                    <td>
                      {s.n}
                      {s.errors > 0 && <span className="muted"> ({s.errors} err)</span>}
                    </td>
                    <td>{pct(s.top1)}</td>
                    <td>{pct(s.top3)}</td>
                    <td>{pct(s.resolvedOnDevice)}</td>
                    <td>{Math.round(s.cloudCallsPer100)}</td>
                    <td>{(s.avgMs / 1000).toFixed(1)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>{t('evalDetails')}</summary>
            <div className="table-wrap">
              <table className="table small">
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.predicted === r.label ? '' : 'row-miss'}>
                      <td>{r.file}</td>
                      <td>{configLabel(r.config)}</td>
                      <td>{name(crop, r.label)}</td>
                      <td>{r.error || name(crop, r.predicted)}</td>
                      <td>{r.answeredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
