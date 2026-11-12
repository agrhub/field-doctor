/**
 * Photos taken offline live in IndexedDB until the case can be uploaded.
 * Firestore keeps the case document offline; Storage cannot, so this fills
 * the gap and also lets the farmer see their photos with no connection.
 */
const DB_NAME = 'field-doctor';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export function savePhotos(caseId: string, photos: Blob[]): Promise<IDBValidKey> {
  return tx('readwrite', (s) => s.put(photos, caseId));
}

export async function loadPhotos(caseId: string): Promise<Blob[] | undefined> {
  return (await tx<Blob[] | undefined>('readonly', (s) => s.get(caseId))) ?? undefined;
}

export function deletePhotos(caseId: string): Promise<undefined> {
  return tx('readwrite', (s) => s.delete(caseId));
}
