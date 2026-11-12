import { getGenerativeModel, InferenceMode, type GenerativeModel, type Part } from 'firebase/ai';
import { blobToBase64 } from '../capture/prepare';
import type { CropModule } from '../knowledge';
import { ai } from '../lib/firebase';
import type { Settings } from '../lib/settings';
import { ON_DEVICE_CREATE_OPTIONS } from './device';
import { parseJson, toObservation, toVote } from './parse';
import { classificationPrompt, observationPrompt } from './prompts';
import { classificationSchema, observationSchema } from './schemas';
import type { CaseContext, InferenceWhere, Tier1Result, Vote } from './types';

type Mode = (typeof InferenceMode)[keyof typeof InferenceMode];

function hybridModel(schema: Record<string, unknown>, mode: Mode, settings: Settings): GenerativeModel {
  return getGenerativeModel(ai, {
    mode,
    onDeviceParams: {
      createOptions: ON_DEVICE_CREATE_OPTIONS,
      promptOptions: { responseConstraint: schema },
    },
    inCloudParams: {
      model: settings.triageCloudModel,
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema },
    },
  });
}

/** Model used to start the on-device download from a user gesture. */
export function deviceWarmupModel(settings: Settings): GenerativeModel {
  return hybridModel(observationSchema, InferenceMode.PREFER_ON_DEVICE, settings);
}

export async function toImagePart(blob: Blob): Promise<Part> {
  return { type: 'inlineData', inlineData: { mimeType: 'image/jpeg', data: await blobToBase64(blob) } };
}

export interface Tier1Options {
  /** Station re-checks must stay on this device; farmers fall back to cloud. */
  onlyOnDevice?: boolean;
  onStage?: (stage: 'observe' | 'classify', run?: number, total?: number) => void;
}

/**
 * Tier 1 of the cascade.
 * 1. Describe visible symptoms with constrained vocabulary (JSON).
 * 2. Classify against the crop's closed candidate list, several times when on
 *    device (free), to measure self-consistency.
 * With PREFER_ON_DEVICE the same code transparently runs in the cloud on
 * devices without a local model; `inferenceSource` tells us which happened.
 */
export async function runTier1(
  crop: CropModule,
  photos: Blob[],
  shotLabels: string[],
  context: CaseContext,
  settings: Settings,
  options: Tier1Options = {},
): Promise<Tier1Result> {
  const started = performance.now();
  const mode = options.onlyOnDevice ? InferenceMode.ONLY_ON_DEVICE : InferenceMode.PREFER_ON_DEVICE;
  const limit = Math.max(1, settings.tier1MaxImages);
  const images = await Promise.all(photos.slice(0, limit).map(toImagePart));
  const sources = new Set<string>();

  options.onStage?.('observe');
  const observer = hybridModel(observationSchema, mode, settings);
  const obsResult = await observer.generateContent([observationPrompt(crop, shotLabels.slice(0, limit)), ...images]);
  sources.add(obsResult.response.inferenceSource ?? 'in_cloud');
  const observation = toObservation(parseJson(obsResult.response.text()));

  // Extra votes are free on device; in the cloud one vote is enough.
  const onDevice = sources.has('on_device');
  const runs = onDevice ? Math.max(1, settings.tier1Runs) : 1;
  const classifier = hybridModel(classificationSchema(crop), mode, settings);
  const prompt = classificationPrompt(crop, observation, context);
  const votes: Vote[] = [];
  for (let i = 0; i < runs; i++) {
    options.onStage?.('classify', i + 1, runs);
    const res = await classifier.generateContent([prompt, images[0]]);
    sources.add(res.response.inferenceSource ?? 'in_cloud');
    votes.push(toVote(crop, parseJson(res.response.text())));
  }

  const where: InferenceWhere = sources.size > 1 ? 'mixed' : sources.has('on_device') ? 'on_device' : 'in_cloud';
  return { where, observation, votes, durationMs: Math.round(performance.now() - started) };
}
