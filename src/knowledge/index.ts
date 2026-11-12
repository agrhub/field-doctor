import { rice } from './crops/rice';
import type { Condition, CropModule } from './types';

export * from './types';

/** Registered modules. Add a new crop (or livestock / aquaculture) here. */
export const CROPS: CropModule[] = [rice];

export const UNKNOWN_ID = 'unknown';

export function getCrop(id: string): CropModule {
  const crop = CROPS.find((c) => c.id === id);
  if (!crop) throw new Error(`Unknown crop module: ${id}`);
  return crop;
}

export function findCondition(crop: CropModule, id: string): Condition | undefined {
  return crop.conditions.find((c) => c.id === id);
}
