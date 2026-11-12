import { getGenerativeModel } from 'firebase/ai';
import { findCondition, type CropModule, type Severity } from '../knowledge';
import { ai } from '../lib/firebase';
import type { Settings } from '../lib/settings';
import { parseJson } from './parse';
import { advisoryPrompt, expertPrompt, expertSystemInstruction } from './prompts';
import { expertSchema } from './schemas';
import { toImagePart } from './tier1';
import type { Advisory, CaseContext, EvidenceBox, ExpertResult, Tier1Result } from './types';

const SEVERITIES: Severity[] = ['low', 'medium', 'high'];
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : []);

/**
 * Expert tier (cloud only): every photo at full size, the farmer's context
 * and the on-device hint go to a larger Gemini model that returns a
 * differential diagnosis, located evidence and an IPM plan.
 */
export async function runExpert(
  crop: CropModule,
  photos: Blob[],
  shotLabels: string[],
  context: CaseContext,
  tier1: Tier1Result | null,
  lang: 'vi' | 'en',
  settings: Settings,
): Promise<ExpertResult> {
  const started = performance.now();
  const model = getGenerativeModel(ai, {
    model: settings.expertCloudModel,
    systemInstruction: expertSystemInstruction(lang),
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: expertSchema(crop),
      temperature: 0.2,
    },
  });
  const images = await Promise.all(photos.map(toImagePart));
  const result = await model.generateContent([expertPrompt(crop, context, shotLabels, tier1), ...images]);
  const raw = parseJson<Record<string, unknown>>(result.response.text());

  const ipm = (raw.ipm ?? {}) as Record<string, unknown>;
  const evidence: EvidenceBox[] = (Array.isArray(raw.evidence) ? raw.evidence : []).map((e: Record<string, unknown>) => {
    const box = Array.isArray(e.box) && e.box.length === 4 && e.box.every((n) => typeof n === 'number')
      ? (e.box as [number, number, number, number])
      : undefined;
    return { imageIndex: Number(e.image_index) || 0, description: String(e.description ?? ''), box };
  });
  const confidence = Number(raw.confidence);

  return {
    conditionId: String(raw.condition ?? 'unknown'),
    otherName: String(raw.other_name ?? ''),
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence > 1 ? confidence / 100 : confidence)) : 0,
    severity: SEVERITIES.includes(raw.severity as Severity) ? (raw.severity as Severity) : 'medium',
    summary: String(raw.summary ?? ''),
    differential: (Array.isArray(raw.differential) ? raw.differential : []).map((d: Record<string, unknown>) => ({
      conditionId: String(d.condition ?? ''),
      whyNot: String(d.why_not ?? ''),
    })),
    evidence,
    actionsNow: strings(raw.actions_now),
    ipm: {
      cultural: strings(ipm.cultural),
      biological: strings(ipm.biological),
      chemicalGuidance: String(ipm.chemical_guidance ?? ''),
    },
    followUp: strings(raw.follow_up),
    seeExtensionOfficer: Boolean(raw.see_extension_officer),
    model: settings.expertCloudModel,
    lang,
    durationMs: Math.round(performance.now() - started),
  };
}

/** Current, cited advisories via Grounding with Google Search. */
export async function fetchAdvisory(
  crop: CropModule,
  conditionId: string,
  lang: 'vi' | 'en',
  settings: Settings,
): Promise<Advisory | null> {
  const condition = findCondition(crop, conditionId);
  if (!condition || condition.kind === 'healthy') return null;
  const model = getGenerativeModel(ai, {
    model: settings.expertCloudModel,
    tools: [{ googleSearch: {} }],
  });
  const name = `${condition.names.en} (${condition.names.vi}${condition.scientificName ? `, ${condition.scientificName}` : ''})`;
  const result = await model.generateContent(advisoryPrompt(name, crop.names.en, lang));
  const meta = result.response.candidates?.[0]?.groundingMetadata;
  return {
    text: result.response.text(),
    searchEntryPointHtml: meta?.searchEntryPoint?.renderedContent ?? '',
    sources: (meta?.groundingChunks ?? [])
      .map((c) => ({ title: c.web?.title ?? '', uri: c.web?.uri ?? '' }))
      .filter((s) => s.uri),
  };
}
