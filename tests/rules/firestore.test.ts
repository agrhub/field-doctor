import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const caseDoc = (ownerUid: string) => ({
  ownerUid,
  cropId: 'rice',
  lang: 'vi',
  status: 'pending_cloud',
  photoPaths: [],
  tier1: { where: 'on_device' },
  decision: { action: 'escalate', topConditionId: 'rice_blast' },
  expert: null,
  cloud: { attempts: 0, lastError: null },
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-field-doctor',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('stations/officer').set({ grantedBy: 'admin' });
    await db.doc('cases/alice-case').set(caseDoc('alice'));
  });
});

afterAll(() => env.cleanup());

const farmer = (uid: string) => env.authenticatedContext(uid).firestore();

describe('cases', () => {
  it('lets a farmer create a case they own, without a review', async () => {
    await assertSucceeds(farmer('bob').doc('cases/new').set(caseDoc('bob')));
    await assertFails(farmer('bob').doc('cases/spoof').set(caseDoc('alice')));
    await assertFails(
      farmer('bob').doc('cases/self-reviewed').set({ ...caseDoc('bob'), review: { conditionId: 'healthy' } }),
    );
  });

  it('rejects signed-out users', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(anon.doc('cases/alice-case').get());
    await assertFails(anon.doc('cases/x').set(caseDoc('x')));
  });

  it('only lets the owner and stations read a case', async () => {
    await assertSucceeds(farmer('alice').doc('cases/alice-case').get());
    await assertSucceeds(farmer('officer').doc('cases/alice-case').get());
    await assertFails(farmer('bob').doc('cases/alice-case').get());
  });

  it('lets a signed-in user listen to a case before its create reaches the server', async () => {
    await assertSucceeds(farmer('bob').doc('cases/not-created-yet').get());
    await assertFails(env.unauthenticatedContext().firestore().doc('cases/not-created-yet').get());
  });

  it('lets stations list all cases but not other farmers', async () => {
    await assertSucceeds(farmer('officer').collection('cases').orderBy('createdAt', 'desc').limit(10).get());
    await assertSucceeds(farmer('alice').collection('cases').where('ownerUid', '==', 'alice').get());
    await assertFails(farmer('bob').collection('cases').get());
  });

  it('lets the owner update the case but never the officer review', async () => {
    const own = farmer('alice').doc('cases/alice-case');
    await assertSucceeds(own.update({ status: 'diagnosed', expert: { conditionId: 'rice_blast' } }));
    await assertFails(own.update({ review: { conditionId: 'healthy' } }));
    await assertFails(own.update({ ownerUid: 'bob' }));
    await assertFails(farmer('bob').doc('cases/alice-case').update({ status: 'triaged' }));
  });

  it('lets stations add a review and a re-check, and nothing else', async () => {
    const asOfficer = farmer('officer').doc('cases/alice-case');
    await assertSucceeds(asOfficer.update({ status: 'reviewed', review: { conditionId: 'rice_blast', note: 'ok' } }));
    await assertSucceeds(asOfficer.update({ stationCheck: { tier1: { where: 'on_device' } } }));
    // Exactly what the app sends: every write is stamped with updatedAt.
    await assertSucceeds(
      asOfficer.update({ status: 'reviewed', review: { conditionId: 'rice_blast' }, updatedAt: new Date() }),
    );
    await assertFails(asOfficer.update({ tier1: { where: 'in_cloud' } }));
    await assertFails(asOfficer.update({ ownerUid: 'officer' }));
  });

  it('only lets the owner delete a case', async () => {
    await assertFails(farmer('officer').doc('cases/alice-case').delete());
    await assertSucceeds(farmer('alice').doc('cases/alice-case').delete());
  });
});

describe('stations', () => {
  it('can be read by the officer themself but written by no client', async () => {
    await assertSucceeds(farmer('officer').doc('stations/officer').get());
    await assertFails(farmer('bob').doc('stations/officer').get());
    await assertFails(farmer('bob').doc('stations/bob').set({ grantedBy: 'me' }));
    await assertFails(farmer('officer').doc('stations/officer').update({ grantedBy: 'me' }));
  });
});
