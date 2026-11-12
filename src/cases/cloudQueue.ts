import { runExpert } from '../ai/expert';
import { getCrop } from '../knowledge';
import { getSettings } from '../lib/remoteConfig';
import { getCasePhotos, updateCase, uploadPhotos, watchMyCases } from './repo';
import type { CaseRecord } from './types';

export const MAX_AUTO_ATTEMPTS = 3;
/** Wait between automatic retries; a farmer's "Retry" skips it. */
export const RETRY_BACKOFF_MS = 30_000;

/** What still has to happen in the cloud for a case. */
export function pendingWork(rec: Pick<CaseRecord, 'photoPaths' | 'status' | 'cloud'>) {
  return {
    upload: rec.photoPaths.length === 0,
    expert: rec.status === 'pending_cloud' && rec.cloud.attempts < MAX_AUTO_ATTEMPTS,
  };
}

/**
 * Firestore applies writes to the local cache immediately but only resolves
 * the promise once the server acknowledges them, which may take a long time
 * on a weak connection. The queue never waits for that acknowledgement.
 */
function write(id: string, data: Record<string, unknown>) {
  updateCase(id, data).catch((err) => console.warn('Case write will retry when online', id, err));
}

/**
 * Store-and-forward: cases created in the field are completed in the cloud
 * as soon as the phone is back online — photos are uploaded and escalated
 * cases get the expert diagnosis. Runs on the owner's device.
 *
 * Upload and diagnosis are independent: the photos the expert needs are on
 * the device already, so a slow or failing upload never blocks an answer.
 */
export function startCloudQueue(uid: string): () => void {
  let latest: CaseRecord[] = [];
  const diagnosing = new Set<string>();
  const uploading = new Set<string>();
  const lastExpertTry = new Map<string, number>();
  const lastUploadTry = new Map<string, number>();

  async function upload(rec: CaseRecord, photos: Blob[]) {
    lastUploadTry.set(rec.id, Date.now());
    try {
      write(rec.id, { photoPaths: await uploadPhotos(rec, photos) });
    } catch (err) {
      console.warn('Photo upload deferred for', rec.id, err);
    }
  }

  async function diagnose(rec: CaseRecord, photos: Blob[]) {
    lastExpertTry.set(rec.id, Date.now());
    try {
      const crop = getCrop(rec.cropId);
      const labels = rec.shotIds.map((id) => crop.shots.find((s) => s.id === id)?.label.en ?? id);
      const hint = rec.tier1.where === 'manual' ? null : rec.tier1;
      const expert = await runExpert(crop, photos, labels, rec.context, hint, rec.lang, getSettings());
      write(rec.id, {
        expert,
        status: 'diagnosed',
        'cloud.attempts': rec.cloud.attempts + 1,
        'cloud.lastError': null,
      });
    } catch (err) {
      console.error('Expert diagnosis failed for', rec.id, err);
      write(rec.id, {
        'cloud.attempts': rec.cloud.attempts + 1,
        'cloud.lastError': err instanceof Error ? err.message : String(err),
      });
    }
  }

  const recently = (m: Map<string, number>, id: string, ms: number) => Date.now() - (m.get(id) ?? 0) < ms;

  // Separate locks: a slow upload (Storage retries for minutes on a weak
  // link) must never hold back the diagnosis or a farmer's "Retry".
  async function run(lock: Set<string>, rec: CaseRecord, job: (rec: CaseRecord, photos: Blob[]) => Promise<void>) {
    lock.add(rec.id);
    try {
      const photos = await getCasePhotos(rec.id, rec.photoPaths);
      if (photos.length > 0) await job(rec, photos);
    } catch (err) {
      console.error('Cloud queue failed for', rec.id, err);
    } finally {
      lock.delete(rec.id);
    }
  }

  function handle(rec: CaseRecord) {
    if (!navigator.onLine) return;
    const work = pendingWork(rec);
    // A fresh request (attempts reset to 0) runs at once; automatic retries back off.
    if (
      work.expert &&
      !diagnosing.has(rec.id) &&
      (rec.cloud.attempts === 0 || !recently(lastExpertTry, rec.id, RETRY_BACKOFF_MS))
    ) {
      void run(diagnosing, rec, diagnose);
    }
    if (work.upload && !uploading.has(rec.id) && !recently(lastUploadTry, rec.id, RETRY_BACKOFF_MS)) {
      void run(uploading, rec, upload);
    }
  }

  const drain = () => latest.forEach(handle);
  const stop = watchMyCases(uid, (list) => {
    latest = list;
    drain();
  });
  // Retry after coming back online, and periodically for backed-off cases.
  const timer = window.setInterval(drain, RETRY_BACKOFF_MS);
  window.addEventListener('online', drain);
  return () => {
    stop();
    window.clearInterval(timer);
    window.removeEventListener('online', drain);
  };
}
