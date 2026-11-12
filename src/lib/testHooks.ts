import { doc, setDoc } from 'firebase/firestore';
import { db, usingEmulators } from './firebase';

/**
 * Hooks for automated end-to-end tests. Only installed when the app runs
 * against the Firebase emulators (`VITE_USE_EMULATORS=true`), never in a
 * production build.
 */
export function installTestHooks(): void {
  if (!usingEmulators) return;
  (window as unknown as { __fieldDoctorTest: object }).__fieldDoctorTest = {
    /** Marks a user as an extension station in the local Firestore cache. */
    grantStation(uid: string) {
      void setDoc(doc(db, 'stations', uid), { grantedBy: 'e2e' }).catch(() => undefined);
    },
  };
}
