/**
 * Evaluation of the cascade against labelled photos. Pure functions so the
 * numbers in the submission can be reproduced and unit-tested.
 */

export const EVAL_CONFIGS = ['cascade', 'device', 'cloud'] as const;
export type EvalConfig = (typeof EVAL_CONFIGS)[number];

export interface EvalRow {
  file: string;
  label: string;
  config: EvalConfig;
  predicted: string;
  top3: string[];
  /** Where the final answer came from. */
  answeredBy: 'on_device' | 'in_cloud' | 'expert' | 'error';
  escalated: boolean;
  cloudCalls: number;
  ms: number;
  error: string;
}

export interface EvalSummary {
  config: EvalConfig;
  n: number;
  errors: number;
  top1: number;
  top3: number;
  /** Share of photos answered on the device with no cloud call at all. */
  resolvedOnDevice: number;
  cloudCallsPer100: number;
  avgMs: number;
}

/**
 * Label from a folder name (`rice_blast/img1.jpg`) or a filename prefix
 * (`rice_blast__img1.jpg`). Returns null when it is not a known condition.
 */
export function labelFromPath(path: string, knownIds: readonly string[]): string | null {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const candidates = [parts.at(-2), parts.at(-1)?.split('__')[0]].filter((x): x is string => Boolean(x));
  return candidates.map((c) => c.toLowerCase()).find((c) => knownIds.includes(c)) ?? null;
}

export function summarize(rows: EvalRow[]): EvalSummary[] {
  return EVAL_CONFIGS.map((config) => {
    const all = rows.filter((r) => r.config === config);
    const ok = all.filter((r) => r.answeredBy !== 'error');
    const share = (n: number) => (ok.length ? n / ok.length : 0);
    return {
      config,
      n: all.length,
      errors: all.length - ok.length,
      top1: share(ok.filter((r) => r.predicted === r.label).length),
      top3: share(ok.filter((r) => r.top3.includes(r.label)).length),
      resolvedOnDevice: share(ok.filter((r) => r.answeredBy === 'on_device' && r.cloudCalls === 0).length),
      cloudCallsPer100: share(ok.reduce((s, r) => s + r.cloudCalls, 0)) * 100,
      avgMs: ok.length ? ok.reduce((s, r) => s + r.ms, 0) / ok.length : 0,
    };
  }).filter((s) => s.n > 0);
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: EvalRow[]): string {
  const header = ['file', 'label', 'config', 'predicted', 'correct', 'top3', 'answered_by', 'escalated', 'cloud_calls', 'ms', 'error'];
  const lines = rows.map((r) =>
    [r.file, r.label, r.config, r.predicted, r.predicted === r.label, r.top3.join('|'), r.answeredBy, r.escalated, r.cloudCalls, Math.round(r.ms), r.error]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
