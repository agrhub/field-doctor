import { UNKNOWN_ID, type CropModule, type Observation } from '../knowledge';
import type { CaseContext, Tier1Result } from './types';

// The on-device model is validated for English, so tier-1 prompts are English
// and return enum values; the UI renders them in Vietnamese or English.

function candidateList(crop: CropModule): string {
  const lines = crop.conditions.map((c) => `- ${c.id}: ${c.promptHint}`);
  lines.push(`- ${UNKNOWN_ID}: none of the above clearly fits, or the photo is unclear.`);
  return lines.join('\n');
}

function contextLine(crop: CropModule, ctx: CaseContext): string {
  const stage = crop.growthStages.find((s) => s.id === ctx.growthStage)?.label.en ?? ctx.growthStage;
  return [
    `Growth stage: ${stage}.`,
    `Recent weather: ${ctx.weather.replace('_', ' ')}.`,
    `Spread: ${ctx.spread.replace('_', ' ')}.`,
    `First noticed ${ctx.daysSinceNoticed} day(s) ago.`,
  ].join(' ');
}

export function observationPrompt(crop: CropModule, shotLabels: string[]): string {
  return [
    `You are helping a farmer check a ${crop.promptName} crop.`,
    `Photos in order: ${shotLabels.map((l, i) => `[${i + 1}] ${l}`).join(', ')}.`,
    'Describe ONLY what is visible. Do not guess a disease name.',
    'Choose values from the allowed lists. Use "none" when there are no lesions.',
    'Set image_quality to something other than "ok" if the photo is blurry, too dark, too far, or not a plant.',
    'Keep notes under 25 words.',
  ].join('\n');
}

export function classificationPrompt(crop: CropModule, obs: Observation, ctx: CaseContext): string {
  return [
    `You are a plant-health assistant for ${crop.promptName}.`,
    contextLine(crop, ctx),
    `Visible symptoms (JSON): ${JSON.stringify(obs)}`,
    'Pick the single best matching condition from this list:',
    candidateList(crop),
    `If nothing fits well, answer "${UNKNOWN_ID}". Confidence is 0 to 1; be honest and conservative.`,
    'second_choice is the next most likely condition. Evidence: one short sentence.',
  ].join('\n');
}

export function expertSystemInstruction(lang: 'vi' | 'en'): string {
  const language = lang === 'vi' ? 'Vietnamese' : 'English';
  return [
    'You are an experienced plant pathologist and IPM adviser working with Mekong Delta smallholder farmers.',
    `Write every free-text field in ${language}, in plain words a farmer understands.`,
    'Base the diagnosis on visible evidence; say when a lab test or field visit is needed.',
    'Follow integrated pest management: cultural and biological measures first.',
    'Never give pesticide doses or brand names. In chemical_guidance, name only active-ingredient groups,',
    'tell the farmer to use products registered in Vietnam, follow the label and the pre-harvest interval,',
    'and to confirm with the local plant protection station.',
  ].join(' ');
}

export function expertPrompt(
  crop: CropModule,
  ctx: CaseContext,
  shotLabels: string[],
  tier1: Tier1Result | null,
): string {
  const parts = [
    `Crop: ${crop.promptName}. ${contextLine(crop, ctx)}`,
    `Photos in order (image_index starts at 0): ${shotLabels.map((l, i) => `[${i}] ${l}`).join(', ')}.`,
    'Known conditions for this crop:',
    candidateList(crop),
    'If it is none of these, use "other" and give its name in other_name.',
  ];
  if (tier1) {
    parts.push(
      `A small on-device model saw: ${JSON.stringify(tier1.observation)}`,
      `and voted: ${JSON.stringify(tier1.votes)}. Treat this as a hint that may be wrong.`,
    );
  }
  parts.push(
    'For each piece of evidence, give image_index, a short description and, if you can locate it,',
    'box as [ymin, xmin, ymax, xmax] normalised to 0-1000.',
    'In differential, explain briefly why the closest look-alikes are less likely.',
  );
  return parts.join('\n');
}

export function advisoryPrompt(conditionName: string, cropName: string, lang: 'vi' | 'en'): string {
  const language = lang === 'vi' ? 'Vietnamese' : 'English';
  return [
    `Search for current official advisories in Vietnam about ${conditionName} on ${cropName}:`,
    'outbreak warnings from plant protection departments this season and recommended IPM practices.',
    `Answer in ${language} with at most 5 short bullet points. Do not recommend specific doses.`,
  ].join(' ');
}
