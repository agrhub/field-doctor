import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';
import type { DeviceModelState } from '../ai/device';
import type { Settings } from '../lib/settings';

export interface AppState {
  user: User | null;
  authError: string | null;
  settings: Settings;
  device: DeviceModelState;
  downloadProgress: number | null;
  station: boolean;
  online: boolean;
  configured: boolean;
  refreshDevice: () => Promise<void>;
  downloadDeviceModel: () => Promise<void>;
}

export const Ctx = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
