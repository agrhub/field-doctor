# Testing Field Doctor

Three layers of tests:

1. **Unit tests** for the pure logic.
2. **End-to-end tests** that drive the production build in Chrome.
3. **A manual pass** on real hardware with a real Firebase project.

```bash
npm test                    # unit tests (Vitest)
npm run test:e2e            # end-to-end (Playwright + Chrome)
SCREENSHOTS=1 npm run test:e2e   # also refresh docs/screenshots
```

## 1. Unit tests (27)

| Area | File | What is checked |
|---|---|---|
| Cascade router | `src/ai/router.test.ts` | accepts confident low-severity answers; escalates on high severity, disagreeing votes, rule contradictions, poor photos, `unknown`, checklist-only cases |
| Vote aggregation | `src/ai/router.test.ts` | agreement between runs is folded into confidence |
| Model output parsing | `src/ai/parse.test.ts` | Markdown fences, out-of-vocabulary values, percent confidences |
| Rule scorer | `src/knowledge/scoring.test.ts` | each rice and durian profile ranks first for its own symptoms; module integrity (unique ids, valid look-alikes, VI/EN parity) |
| Photo quality | `src/capture/quality.test.ts` | Laplacian blur detection, darkness, over-exposure |
| Outbreak map | `src/cases/outbreaks.test.ts` | anonymous ~1 km cells, worst severity, officer review overrides |
| Evaluation | `src/eval/metrics.test.ts` | labels from folders or filename prefixes; top-1, top-3, on-device share, cloud calls; CSV escaping |

## 2. End-to-end tests (15)

The tests run `vite build --mode e2e` (see `.env.e2e`) in Chrome at phone size (412 × 915). What is real and what is simulated:

| Component | In the tests |
|---|---|
| App code, Firebase AI Logic SDK, Firestore SDK with offline cache, service worker | **Real**, production build |
| Firebase Auth | **Real Auth emulator** (anonymous sign-in) |
| Gemini Nano | **Simulated Chrome Prompt API** (`LanguageModel`) driven by the real SDK through `ChromeAdapter`; answers honour the `responseConstraint` schema ([`e2e/support/fakes.ts`](../e2e/support/fakes.ts)) |
| Cloud Gemini | The SDK's real HTTPS requests to `firebasevertexai.googleapis.com` are **intercepted** and answered according to the requested JSON schema |
| Network loss | Playwright `context.setOffline(true)`; all other Google hosts are cut off |

Scenarios:

| # | Scenario | Proves |
|---|---|---|
| 1 | Home + language switch | VI/EN UI, persisted choice |
| 2 | Blurry photo | Quality gate fires before any model call |
| 3 | Confident on-device answer | ⚡ badge, 3 self-consistency votes, router accepts, **zero cloud calls**; farmer can still ask the expert |
| 4 | Rice blast | Router escalates high severity; expert card with 2 located lesion boxes, differential, IPM; grounded advisories with sources and Search suggestions |
| 5 | No local model | Same code falls back to cloud (☁️ badge) and only pays for one vote |
| 6 | Expert outage | HTTP 500 is shown with Retry; retry succeeds |
| 7 | Model download | `initializeDeviceModel()` from a click, progress, then ready |
| 8 | Durian | Second crop module: its own photo guide, Phytophthora path |
| 9 | Case history | Status and badge in "My cases" |
| 10 | Offline + Gemini Nano | Triage works with no signal; expert step queued; completes automatically when back online |
| 11 | Offline, no model | Symptom checklist → rules → router; queued; completes online |
| 12 | Installed PWA | App opens and navigates with no connection after the first visit |
| 13 | Station without access | Clear instructions and the user's UID |
| 14 | Station workflow | Outbreak map marker, per-condition counts, `ONLY_ON_DEVICE` re-check, officer verdict visible to the farmer |
| 15 | Evaluation page | 3 set-ups over labelled photos, summary table, CSV export |

### Bugs found by these tests and fixed

- A returning user was signed in as a **new** anonymous account on every launch, so they lost their cases. Sign-in now waits for `auth.authStateReady()`.
- The offline queue awaited Firestore server acknowledgements, so on a weak link a case could stay "analysing" and Retry did nothing. Local writes no longer wait for the server.
- A slow photo upload (Storage retries for minutes) held the case lock and blocked the diagnosis and the Retry button. Upload and diagnosis now have separate locks, and uploads give up after 2 minutes and retry later.

## 3. Not covered automatically — check by hand before submitting

The Firestore and Storage emulators could not be downloaded in the build environment, so these were **not** exercised:

- server-side persistence;
- `firestore.rules` and `storage.rules`;
- real Gemini model quality.

Run this pass with your real Firebase project, on Chrome desktop with Gemini Nano.

1. `npm run emulators` (with internet access), then `VITE_USE_EMULATORS=true npm run dev`:
   - a farmer cannot read another farmer's case;
   - a station (`stations/{uid}` created in the emulator UI) can read and review cases;
   - a farmer cannot write `review`.
2. With the real project (`.env.local`):
   - on Chrome with Gemini Nano, a leaf photo shows the **⚡ On-device** badge;
   - in another browser without the Prompt API, the same flow shows **☁️ Cloud**;
   - DevTools → Network → Offline: create a case, then go online and watch it complete;
   - App Check: requests carry a valid token (debug token on localhost, reCAPTCHA Enterprise in production).
3. Evaluation page: run your own labelled field photos through all three set-ups and paste the summary table into the submission.
