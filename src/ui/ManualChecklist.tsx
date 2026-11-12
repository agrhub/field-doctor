import { useState } from 'react';
import { useI18n } from '../i18n';
import { LESION_COLORS, LESION_SHAPES, ORGANS, PATTERNS, SIGNS, type Observation } from '../knowledge';

type ListKey = 'organs' | 'lesionColors' | 'lesionShapes' | 'patterns' | 'signs';

const GROUPS: { key: ListKey; values: readonly string[]; label: { vi: string; en: string } }[] = [
  { key: 'organs', values: ORGANS, label: { vi: 'Bộ phận bị hại', en: 'Affected part' } },
  { key: 'lesionColors', values: LESION_COLORS, label: { vi: 'Màu vết bệnh', en: 'Lesion colour' } },
  { key: 'lesionShapes', values: LESION_SHAPES, label: { vi: 'Hình dạng', en: 'Shape' } },
  { key: 'patterns', values: PATTERNS, label: { vi: 'Vị trí / kiểu lan', en: 'Where / pattern' } },
  { key: 'signs', values: SIGNS, label: { vi: 'Dấu hiệu khác', en: 'Other signs' } },
];

/**
 * Offline fallback for phones without on-device AI: the farmer describes the
 * symptoms with the same vocabulary the model uses, so the rule scorer and
 * the router work unchanged and the expert tier runs once back online.
 */
export function ManualChecklist({ onDone }: { onDone: (obs: Observation) => void }) {
  const { t, l, v } = useI18n();
  const [obs, setObs] = useState<Observation>({
    organs: [],
    lesionColors: [],
    lesionShapes: [],
    patterns: [],
    signs: [],
    imageQuality: 'ok',
    notes: '',
  });

  const toggle = (key: ListKey, value: string) =>
    setObs((o) => {
      const list = o[key] as string[];
      return { ...o, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] };
    });

  return (
    <section className="card">
      <h3>{t('checklistTitle')}</h3>
      {GROUPS.map((g) => (
        <fieldset key={g.key} className="chips">
          <legend>{l(g.label)}</legend>
          {g.values.map((value) => (
            <button
              type="button"
              key={value}
              className={`chip ${(obs[g.key] as string[]).includes(value) ? 'chip-on' : ''}`}
              aria-pressed={(obs[g.key] as string[]).includes(value)}
              onClick={() => toggle(g.key, value)}
            >
              {v(value)}
            </button>
          ))}
        </fieldset>
      ))}
      <button className="btn" onClick={() => onDone(obs)} disabled={obs.organs.length === 0}>
        {t('checklistDone')}
      </button>
    </section>
  );
}
