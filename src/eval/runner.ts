import { runExpert } from '../ai/expert';
import { route } from '../ai/router';
import { runTier1 } from '../ai/tier1';
import type { CaseContext } from '../ai/types';
import { preparePhoto } from '../capture/prepare';
import type { CropModule } from '../knowledge';
import { scoreObservation } from '../knowledge/scoring';
import type { Settings } from '../lib/settings';
import type { EvalConfig, EvalRow } from './metrics';

export interface EvalItem {
  file: string;
  label: string;
  blob: Blob;
}

/**
 * Runs each labelled photo through the selected configurations, exactly as
 * the app would: the same tier-1 code, router and expert tier.
 */
export async function runEvaluation(
  crop: CropModule,
  items: EvalItem[],
  configs: EvalConfig[],
  settings: Settings,
  onRow: (row: EvalRow, done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const context: CaseContext = {
    growthStage: crop.growthStages[1].id,
    weather: 'normal',
    spread: 'few_plants',
    daysSinceNoticed: 1,
  };
  const label = [crop.shots[0].label.en];
  const total = items.length * configs.length;
  let done = 0;

  for (const item of items) {
    const photo = (await preparePhoto(item.blob)).blob;
    for (const config of configs) {
      if (signal?.aborted) return;
      const started = performance.now();
      const base = { file: item.file, label: item.label, config, error: '' };
      let row: EvalRow;
      try {
        if (config === 'cloud') {
          const expert = await runExpert(crop, [photo], label, context, null, 'en', settings);
          row = {
            ...base,
            predicted: expert.conditionId,
            top3: [expert.conditionId, ...expert.differential.map((d) => d.conditionId)].slice(0, 3),
            answeredBy: 'expert',
            escalated: true,
            cloudCalls: 1,
            ms: 0,
          };
        } else {
          const tier1 = await runTier1(crop, [photo], label, context, settings, { onlyOnDevice: config === 'device' });
          // Without a local model the SDK serves even ONLY_ON_DEVICE from the
          // cloud; that would silently inflate the "device" numbers.
          if (config === 'device' && tier1.where !== 'on_device') {
            throw new Error('On-device model not available in this browser');
          }
          const decision = route({ crop, tier1, rules: scoreObservation(crop, tier1.observation), settings });
          const tier1Cloud = tier1.where === 'on_device' ? 0 : 1 + tier1.votes.length;
          if (config === 'cascade' && decision.action === 'escalate') {
            const expert = await runExpert(crop, [photo], label, context, tier1, 'en', settings);
            row = {
              ...base,
              predicted: expert.conditionId,
              top3: [expert.conditionId, ...expert.differential.map((d) => d.conditionId)].slice(0, 3),
              answeredBy: 'expert',
              escalated: true,
              cloudCalls: tier1Cloud + 1,
              ms: 0,
            };
          } else {
            row = {
              ...base,
              predicted: decision.topConditionId,
              top3: decision.ranking.map((r) => r.conditionId),
              answeredBy: tier1.where === 'on_device' ? 'on_device' : 'in_cloud',
              escalated: decision.action === 'escalate',
              cloudCalls: tier1Cloud,
              ms: 0,
            };
          }
        }
      } catch (err) {
        row = {
          ...base,
          predicted: '',
          top3: [],
          answeredBy: 'error',
          escalated: false,
          cloudCalls: 0,
          ms: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      row.ms = performance.now() - started;
      onRow(row, ++done, total);
    }
  }
}
