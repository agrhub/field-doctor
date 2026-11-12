import type { InferenceWhere } from '../ai/types';
import { useI18n } from '../i18n';

export function WhereBadge({ where }: { where: InferenceWhere }) {
  const { t } = useI18n();
  const map: Record<InferenceWhere, [string, string]> = {
    on_device: ['⚡', t('ranOnDevice')],
    in_cloud: ['☁️', t('ranInCloud')],
    mixed: ['⚡☁️', t('ranMixed')],
    manual: ['✍️', t('ranManual')],
  };
  const [icon, label] = map[where];
  return (
    <span className={`badge badge-${where}`}>
      <span aria-hidden>{icon}</span> {label}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className="bar" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className="bar-fill" style={{ width: `${pct}%` }} />
      <span className="bar-label">{pct}%</span>
    </span>
  );
}
