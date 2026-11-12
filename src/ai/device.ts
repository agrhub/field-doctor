import type { LanguageModelCreateOptions } from 'firebase/ai';

/** One definition of what we ask the on-device model to accept and produce. */
export const ON_DEVICE_CREATE_OPTIONS: LanguageModelCreateOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

export type DeviceModelState = 'unsupported' | 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface LanguageModelStatic {
  availability(options?: LanguageModelCreateOptions): Promise<Exclude<DeviceModelState, 'unsupported'>>;
}

/** Reports whether this browser can run the multimodal on-device model. */
export async function checkDeviceModel(): Promise<DeviceModelState> {
  const lm = (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel;
  if (!lm) return 'unsupported';
  try {
    return await lm.availability(ON_DEVICE_CREATE_OPTIONS);
  } catch {
    return 'unavailable';
  }
}
