import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getBlob, ref, uploadBytes } from 'firebase/storage';
import type { CaseContext, RoutingDecision, Tier1Result } from '../ai/types';
import { db, storage } from '../lib/firebase';
import { loadPhotos, savePhotos } from './blobStore';
import type { CaseDoc, CaseRecord, CaseStatus } from './types';

const cases = collection(db, 'cases');

function toRecord(snap: DocumentSnapshot | QueryDocumentSnapshot): CaseRecord | null {
  if (!snap.exists()) return null;
  // Estimate server timestamps so cases created offline still sort and render.
  const data = snap.data({ serverTimestamps: 'estimate' }) as CaseDoc;
  return { ...data, id: snap.id, pendingSync: snap.metadata.hasPendingWrites };
}

export interface NewCase {
  ownerUid: string;
  cropId: string;
  lang: 'vi' | 'en';
  context: CaseContext;
  shotIds: string[];
  photos: Blob[];
  area: { lat: number; lng: number } | null;
  tier1: Tier1Result;
  decision: RoutingDecision;
}

/**
 * Creates a case offline-first: photos go to IndexedDB, the document to the
 * Firestore local cache. Neither waits for the network; sync happens later.
 */
export async function createCase(input: NewCase): Promise<string> {
  const ref_ = doc(cases);
  await savePhotos(ref_.id, input.photos);
  const status: CaseStatus = input.decision.action === 'escalate' ? 'pending_cloud' : 'triaged';
  const data = {
    ownerUid: input.ownerUid,
    cropId: input.cropId,
    lang: input.lang,
    context: input.context,
    shotIds: input.shotIds,
    photoPaths: [],
    area: input.area,
    tier1: input.tier1,
    decision: input.decision,
    status,
    expert: null,
    cloud: { attempts: 0, lastError: null, requestId: crypto.randomUUID() },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  setDoc(ref_, data).catch((err) => console.error('Case sync failed', err));
  return ref_.id;
}

export function watchCase(id: string, cb: (c: CaseRecord | null) => void): () => void {
  return onSnapshot(doc(cases, id), { includeMetadataChanges: true }, (s) => cb(toRecord(s)), (err) => {
    console.error(err);
    cb(null);
  });
}

export function watchMyCases(uid: string, cb: (c: CaseRecord[]) => void): () => void {
  const q = query(cases, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (s) => cb(s.docs.map(toRecord).filter((c): c is CaseRecord => c !== null)),
    (err) => console.error('Case list listener failed', err),
  );
}

export function watchStationCases(cb: (c: CaseRecord[]) => void, onError: (e: Error) => void): () => void {
  const q = query(cases, orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (s) => cb(s.docs.map(toRecord).filter((c): c is CaseRecord => c !== null)),
    onError,
  );
}

export async function isStation(uid: string): Promise<boolean> {
  try {
    return (await getDoc(doc(db, 'stations', uid))).exists();
  } catch {
    return false;
  }
}

export function updateCase(id: string, data: Record<string, unknown>): Promise<void> {
  return updateDoc(doc(cases, id), { ...data, updatedAt: serverTimestamp() });
}

/** Farmer asks for a second opinion; also resets automatic retries. */
export function requestExpert(id: string): Promise<void> {
  return updateCase(id, {
    status: 'pending_cloud',
    'cloud.attempts': 0,
    'cloud.lastError': null,
    'cloud.requestId': crypto.randomUUID(),
  });
}

export async function uploadPhotos(rec: CaseRecord, photos: Blob[]): Promise<string[]> {
  const paths = photos.map((_, i) => `cases/${rec.ownerUid}/${rec.id}/${i}.jpg`);
  await Promise.all(photos.map((p, i) => uploadBytes(ref(storage, paths[i]), p, { contentType: 'image/jpeg' })));
  return paths;
}

/** Local copy first (works offline), otherwise download from Storage. */
export async function getCasePhotos(caseId: string, photoPaths: string[]): Promise<Blob[]> {
  const local = await loadPhotos(caseId);
  if (local?.length) return local;
  return Promise.all(photoPaths.map((p) => getBlob(ref(storage, p))));
}
