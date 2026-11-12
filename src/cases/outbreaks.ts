import { findCondition, getCrop, type Severity } from '../knowledge';
import type { CaseDoc } from './types';

type CaseLike = Pick<CaseDoc, 'cropId' | 'area' | 'review' | 'expert' | 'decision'>;

/** Best available verdict: officer review, then expert, then first look. */
export function finalConditionId(c: Pick<CaseDoc, 'review' | 'expert' | 'decision'>): string {
  return c.review?.conditionId ?? c.expert?.conditionId ?? c.decision.topConditionId;
}

export interface HotspotEntry {
  cropId: string;
  conditionId: string;
  otherName: string;
  count: number;
}

export interface Hotspot {
  lat: number;
  lng: number;
  total: number;
  /** Highest severity reported here, for colouring the marker. */
  severity: Severity;
  entries: HotspotEntry[];
}

const RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

/**
 * Groups cases by their ~1 km area cell. Cases stay anonymous: only the
 * rounded area and the verdict are used, never who reported them.
 */
export function hotspots(cases: CaseLike[], ignoreHealthy = true): Hotspot[] {
  const cells = new Map<string, Hotspot>();
  for (const c of cases) {
    if (!c.area) continue;
    const conditionId = finalConditionId(c);
    if (ignoreHealthy && conditionId === 'healthy') continue;
    const key = `${c.area.lat.toFixed(2)},${c.area.lng.toFixed(2)}`;
    const cell = cells.get(key) ?? { lat: c.area.lat, lng: c.area.lng, total: 0, severity: 'low', entries: [] };
    cell.total++;
    const otherName = c.expert?.conditionId === conditionId ? c.expert.otherName : '';
    const entry = cell.entries.find((e) => e.cropId === c.cropId && e.conditionId === conditionId);
    if (entry) entry.count++;
    else cell.entries.push({ cropId: c.cropId, conditionId, otherName, count: 1 });
    const severity = findCondition(getCrop(c.cropId), conditionId)?.severity ?? c.expert?.severity ?? 'medium';
    if (RANK[severity] > RANK[cell.severity]) cell.severity = severity;
    cells.set(key, cell);
  }
  for (const cell of cells.values()) cell.entries.sort((a, b) => b.count - a.count);
  return [...cells.values()].sort((a, b) => b.total - a.total);
}
