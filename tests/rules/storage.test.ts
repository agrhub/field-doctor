import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-field-doctor',
    // Storage rules look up stations/{uid} in Firestore.
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearStorage();
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc('stations/officer').set({ grantedBy: 'admin' });
    await ctx.storage().ref('cases/alice/c1/0.jpg').put(jpeg, { contentType: 'image/jpeg' });
  });
});

afterAll(() => env.cleanup());

const as = (uid: string) => env.authenticatedContext(uid).storage();
/** UploadTask is only thenable; turn it into a real Promise for the assertions. */
const put = (ref: ReturnType<ReturnType<typeof as>['ref']>, data: Uint8Array, contentType: string) =>
  new Promise((resolve, reject) => ref.put(data, { contentType }).then(resolve, reject));

describe('case photos', () => {
  it('lets a farmer upload JPEG photos only into their own folder', async () => {
    await assertSucceeds(put(as('alice').ref('cases/alice/c2/0.jpg'), jpeg, 'image/jpeg'));
    await assertFails(put(as('bob').ref('cases/alice/c2/1.jpg'), jpeg, 'image/jpeg'));
    await assertFails(put(as('alice').ref('cases/alice/c2/2.png'), jpeg, 'image/png'));
  });

  it('rejects photos of 5 MB or more', async () => {
    const big = new Uint8Array(5 * 1024 * 1024);
    await assertFails(put(as('alice').ref('cases/alice/c3/0.jpg'), big, 'image/jpeg'));
  });

  it('lets the owner and stations read photos, but not other farmers', async () => {
    await assertSucceeds(as('alice').ref('cases/alice/c1/0.jpg').getDownloadURL());
    await assertSucceeds(as('officer').ref('cases/alice/c1/0.jpg').getDownloadURL());
    await assertFails(as('bob').ref('cases/alice/c1/0.jpg').getDownloadURL());
    await assertFails(env.unauthenticatedContext().storage().ref('cases/alice/c1/0.jpg').getDownloadURL());
  });
});
