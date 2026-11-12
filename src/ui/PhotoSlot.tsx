import { useEffect, useId, useMemo, useState } from 'react';
import { preparePhoto, type PreparedPhoto } from '../capture/prepare';
import { useI18n } from '../i18n';
import type { CaptureShot } from '../knowledge';

interface Props {
  shot: CaptureShot;
  required: boolean;
  value: PreparedPhoto | null;
  onChange: (p: PreparedPhoto | null) => void;
}

export function PhotoSlot({ shot, required, value, onChange }: Props) {
  const { t, l } = useI18n();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const url = useMemo(() => (value ? URL.createObjectURL(value.blob) : null), [value]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await preparePhoto(file));
    } finally {
      setBusy(false);
    }
  }

  const verdict = value?.quality.verdict;
  return (
    <div className={`slot ${verdict && verdict !== 'ok' ? 'slot-warn' : ''}`}>
      <div className="slot-head">
        <strong>{l(shot.label)}</strong>
        {!required && <span className="muted"> ({t('optional')})</span>}
        <p className="muted small">{l(shot.hint)}</p>
      </div>
      {url ? <img src={url} alt={l(shot.label)} className="slot-img" /> : <div className="slot-empty" aria-hidden>📷</div>}
      {verdict && <p className={`quality quality-${verdict}`}>{t(`quality_${verdict}`)}</p>}
      <label htmlFor={id} className="btn btn-secondary">
        {busy ? '…' : value ? t('retake') : t('takePhoto')}
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="visually-hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
