import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, GoogleAIBackend } from 'firebase/ai';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Placeholders keep the SDK from throwing at import time, so an unconfigured
// checkout still renders and shows setup instructions instead of a blank page.
export const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : { apiKey: 'not-configured', projectId: 'not-configured', appId: '1:0:web:0' },
);

// App Check is required by Firebase AI Logic. On localhost we use a debug token.
if (env.DEV) {
  (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
    env.VITE_APPCHECK_DEBUG_TOKEN || true;
}
if (env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Offline-first: writes made in the field are kept locally and synced when online.
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);
// Give up an upload attempt after 2 minutes; the queue retries it later.
storage.maxUploadRetryTime = 2 * 60 * 1000;
export const auth = getAuth(app);
export const ai = getAI(app, { backend: new GoogleAIBackend() });

/**
 * Resolves with the signed-in user. Waits for the persisted session first so
 * a returning farmer keeps the same anonymous account (and their cases);
 * only a first launch creates a new one.
 */
export async function ensureSignedIn(): Promise<User> {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
