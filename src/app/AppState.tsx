import type { User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { checkDeviceModel, type DeviceModelState } from '../ai/device';
import { deviceWarmupModel } from '../ai/tier1';
import { startCloudQueue } from '../cases/cloudQueue';
import { isStation as fetchIsStation } from '../cases/repo';
import { ensureSignedIn, isFirebaseConfigured } from '../lib/firebase';
import { DEFAULT_SETTINGS, loadSettings, type Settings } from '../lib/remoteConfig';
import { Ctx } from './context';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [device, setDevice] = useState<DeviceModelState>('unsupported');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [station, setStation] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const refreshDevice = useCallback(async () => setDevice(await checkDeviceModel()), []);

  useEffect(() => {
    void checkDeviceModel().then(setDevice);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let stopQueue: (() => void) | undefined;
    let cancelled = false;
    void loadSettings().then((s) => !cancelled && setSettings(s));
    ensureSignedIn()
      .then(async (u) => {
        if (cancelled) return;
        setUser(u);
        stopQueue = startCloudQueue(u.uid);
        setStation(await fetchIsStation(u.uid));
      })
      .catch((err: Error) => setAuthError(err.message));
    return () => {
      cancelled = true;
      stopQueue?.();
    };
  }, []);

  // Must be called from a click: Chrome only starts a model download after a user gesture.
  const downloadDeviceModel = useCallback(async () => {
    setDownloadProgress(0);
    setDevice('downloading');
    try {
      await deviceWarmupModel(settings).initializeDeviceModel((p) => setDownloadProgress(p));
    } finally {
      setDownloadProgress(null);
      await refreshDevice();
    }
  }, [settings, refreshDevice]);

  return (
    <Ctx.Provider
      value={{
        user,
        authError,
        settings,
        device,
        downloadProgress,
        station,
        online,
        configured: isFirebaseConfigured,
        refreshDevice,
        downloadDeviceModel,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
