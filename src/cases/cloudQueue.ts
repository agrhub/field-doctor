import { runExpert } from '../ai/expert';
import { getCrop } from '../knowledge';
import { getSettings } from '../lib/remoteConfig';
import { getCasePhotos, updateCase, uploadPhotos, watchMyCases } from './repo';
import type { CaseRecord } from './types';

const MAX_AUTO_ATTEMPTS = 3;

/**
 * Store-and-forward: cases created in the field are completed in the cloud
 * as soon as the phone is back online — photos are uploaded and escalated
 * cases get the expert diagnosis. Runs on the owner's device.
 */
export function startCloudQueue(uid: string): () => void {
  let latest: CaseRecord[] = [];
  const busy = new Set<string>();

  async function handle(rec: CaseRecord) {
    if (busy.has(rec.id) || !navigator.onLine) return;
    const needsUpload = rec.photoPaths.length === 0;
    const needsExpert = rec.status === 'pending_cloud' && rec.cloud.attempts < MAX_AUTO_ATTEMPTS;
    if (!needsUpload && !needsExpert) return;

    busy.add(rec.id);
    try {
      const photos = await getCasePhotos(rec.id, rec.photoPaths);
      if (needsUpload && photos.length) {
        await updateCase(rec.id, { photoPaths: await uploadPhotos(rec, photos) });
      }
      if (needsExpert) {
        const crop = getCrop(rec.cropId);
        const labels = rec.shotIds.map((id) => crop.shots.find((s) => s.id === id)?.label.en ?? id);
        const hint = rec.tier1.where === 'manual' ? null : rec.tier1;
        const expert = await runExpert(crop, photos, labels, rec.context, hint, rec.lang, getSettings());
        await updateCase(rec.id, {
          expert,
          status: 'diagnosed',
          'cloud.attempts': rec.cloud.attempts + 1,
          'cloud.lastError': null,
        });
      }
    } catch (err) {
      console.error('Cloud queue failed for', rec.id, err);
      if (needsExpert) {
        await updateCase(rec.id, {
          'cloud.attempts': rec.cloud.attempts + 1,
          'cloud.lastError': err instanceof Error ? err.message : String(err),
        }).catch(() => undefined);
      }
    } finally {
      busy.delete(rec.id);
    }
  }

  const drain = () => latest.forEach((rec) => void handle(rec));
  const stop = watchMyCases(uid, (list) => {
    latest = list;
    drain();
  });
  window.addEventListener('online', drain);
  return () => {
    stop();
    window.removeEventListener('online', drain);
  };
}
