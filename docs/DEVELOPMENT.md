# Development guide

Where the project stands, how to work on it, and what is left before the #BuildHybridAI deadline (**Nov 30, 2026, 2:00 pm PST**).

## Conventions

- **Commits are grouped by feature** (`feat(scope): …`, `fix: …`, `test: …`, `docs: …`, `ci: …`). No work-in-progress or "fix typo" commits on `main`; squash locally first.
- **Commit identity is the human author.** No AI assistant names, `Co-Authored-By` trailers or tool attribution in commit messages or files.
- **Every commit must pass** `npm run typecheck` and `npm test`. CI also runs the rules and end-to-end suites on every push.
- **Strings** go in `src/i18n/dict.ts` in both Vietnamese and English. Submission material is English.
- **AI calls go only through Firebase AI Logic** (`firebase/ai`). This is a hard contest rule.
- **First steps shown to farmers are curated** in the crop modules, never model-generated. The expert tier must not give pesticide doses or brands.

## Map of the code

| Area | Files | Notes |
|---|---|---|
| Hybrid tier 1 | `src/ai/tier1.ts` | `PREFER_ON_DEVICE`; 3 votes on device, 1 in cloud; `ONLY_ON_DEVICE` for the station re-check |
| Router | `src/ai/router.ts` | Pure; thresholds come from `src/lib/settings.ts` / Remote Config |
| Expert tier and advisories | `src/ai/expert.ts` | Cloud only; grounding with Google Search |
| Schemas, prompts | `src/ai/schemas.ts`, `src/ai/prompts.ts` | One JSON Schema for device (`responseConstraint`) and cloud (`responseJsonSchema`) |
| Crop modules | `src/knowledge/crops/*.ts` | Register new crops in `src/knowledge/index.ts`; extend the vocabulary in `types.ts` and its labels in `dict.ts` |
| Offline queue | `src/cases/cloudQueue.ts` | Never awaits Firestore acks; separate upload/diagnosis locks; one run per `requestId` × attempt |
| Data and rules | `src/cases/repo.ts`, `firestore.rules`, `storage.rules` | Stations are `stations/{uid}` docs created by an admin |
| Screens | `src/pages`, `src/ui` | Officer screens (`Station`, `Eval`, map) are lazy-loaded |

## Running and testing

```bash
npm install
cp .env.example .env.local      # real project; or use the emulators below
npm run dev

npm test                        # unit
npm run test:rules              # rules (Java 21)
npm run test:e2e                # Chrome + Auth emulator; set CHROME_PATH if Chrome is not at the default location
E2E_EMULATORS=auth,firestore,storage npm run test:e2e   # same as CI
npm run emulators               # then VITE_USE_EMULATORS=true npm run dev
```

The end-to-end tests simulate Gemini Nano (the Chrome `LanguageModel` API) and intercept cloud Gemini requests. Scenarios live in `e2e/support/scenarios.ts`. See [TESTING.md](TESTING.md).

## Status (Nov 12, 2026)

Done:
- Farmer app: guided capture, hybrid tier 1, router, cloud expert with lesion boxes, grounded advisories, offline queue, symptom checklist, PWA.
- Extension station: outbreak map, on-device re-check, verdicts.
- Evaluation page.
- Rice and durian modules; Vietnamese and English UI.
- CI: unit, rules and end-to-end with emulators, all green. Deploy workflow, waiting for secrets.

## Backlog, in priority order

1. **Real Firebase project and deploy.** Add the secrets listed in `.github/workflows/deploy.yml`; check App Check enforcement and the cloud model names (`expert_cloud_model` in Remote Config).
2. **Real-model pass** ([TESTING.md §4](TESTING.md)). Tune prompts in `src/ai/prompts.ts` and thresholds in Remote Config against real Gemini Nano output on field photos.
3. **Evaluation numbers.** Run ≥ 50 labelled field photos through the three set-ups and fill the table in [SUBMISSION.md](SUBMISSION.md).
4. **Demo video** per [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md); replace `docs/screenshots` with real-photo screenshots.
5. **Optional, for the multi-platform Grand Prize criterion:** a thin native Android app using `firebase-ai` + `firebase-ai-ondevice` (`InferenceMode.PREFER_ON_DEVICE`, `response.inferenceSource`) that reuses the same JSON schemas, prompts and Firestore cases. It needs an Android toolchain and a Gemini Nano device or Samsung Remote Test Lab.
6. **Nice to have:**
   - push alerts when an outbreak cell grows (FCM);
   - more crop modules (mango, citrus);
   - an aquaculture module (shrimp) built around a pond-log interview.
