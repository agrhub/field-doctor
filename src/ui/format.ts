import { OTHER_ID } from '../ai/schemas';
import { useI18n } from '../i18n';
import { findCondition, UNKNOWN_ID, type CropModule } from '../knowledge';

export function useConditionName() {
  const { l, t } = useI18n();
  return (crop: CropModule, id: string, otherName?: string): string => {
    if (id === UNKNOWN_ID) return t('unknownCondition');
    if (id === OTHER_ID) return otherName || t('otherCondition');
    const c = findCondition(crop, id);
    return c ? l(c.names) : id;
  };
}

export function formatDate(ts: { toDate(): Date } | null | undefined, lang: string): string {
  if (!ts) return '';
  return ts.toDate().toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
