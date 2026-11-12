# Devpost submission — Field Doctor

Copy each section into the matching Devpost field. Replace every `‹…›` placeholder before submitting; the evaluation numbers must come from your own run of the Evaluation page.

---

## Project name

Field Doctor — hybrid crop health for the Mekong Delta

## Elevator pitch (≤ 200 characters)

Snap a sick rice or durian plant: Gemini Nano answers on-device, free and offline. Dangerous or unsure cases go to a cloud Gemini expert, queued until signal returns.

## Platform

Web (Chrome) — installable PWA. Repository: <https://github.com/agrhub/field-doctor>

## Try it out

- Live app: ‹Firebase Hosting URL›
- Code: https://github.com/agrhub/field-doctor
- Demo video: ‹YouTube URL›

---

## About the project

### Inspiration

In the Mekong Delta, a rice blast or Phytophthora outbreak can take a season's income in a week. Farmers already photograph sick plants and post them in Facebook groups, then wait for someone to answer. Extension officers are few and travel between fields with patchy coverage.

Two facts shaped the design:

- **Phones:** most farmers' phones cannot run an on-device model, while many officers' laptops can.
- **Connectivity:** the field is exactly where connectivity is worst.

### What it does

Field Doctor is a crop health assistant for farmers and for the agricultural extension officers who support them.

1. **Guided capture.** Two or three crop-specific photos (close-up, plant base, whole clump). Blurry or dark photos are rejected instantly, offline, before any model runs.
2. **First look in seconds.** The on-device model describes the visible symptoms in a constrained JSON vocabulary, then classifies them against the crop's closed list of conditions three times. Agreement between the votes becomes its confidence. The farmer gets the likely condition and **curated, non-chemical first steps** (never model-generated).
3. **A router that knows when to ask for help.** The case is escalated when confidence is low, the top two candidates are close, the model contradicts a deterministic symptom-rule scorer, the photo is poor, or the condition is dangerous and fast-spreading.
4. **Cloud expert.** A larger Gemini model sees all photos at full size and returns:
   - a differential diagnosis;
   - **boxes around the lesions it relied on**;
   - an IPM plan (cultural → biological → chemical guidance, never doses or brands);
   - current advisories from Grounding with Google Search, with sources.
5. **Store and forward.** Offline, the case is saved locally and the expert step runs automatically when signal returns. On a phone with no local model and no signal, a symptom checklist feeds the same rules and router.
6. **Extension station.** Officers see incoming cases and an anonymous outbreak map (~1 km cells, opt-in). They re-check cases **on their laptop's Gemini Nano** (free, data stays local) and record a verdict the farmer sees.
7. **Evaluation page.** Labelled photos run through three set-ups (hybrid cascade, on-device only, cloud only) to measure accuracy, on-device share and cloud calls.

Two crops ship as modules:

- **Rice:** blast, bacterial leaf blight, sheath blight, brown spot, brown planthopper, leaf folder, stunt viruses, golden apple snail.
- **Durian:** Phytophthora, anthracnose, leaf blight, pink disease, psyllid, fruit borer, mealybugs, algal leaf spot.

The UI is in Vietnamese and English.

### How we used Firebase AI Logic

- **One hybrid call for tier 1.** `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, onDeviceParams, inCloudParams })` runs on Gemini Nano in Chrome when available and on `gemini-3.5-flash-lite` otherwise, with no branching in our code.
- **`ONLY_ON_DEVICE`** for the officer re-check, so officer triage stays free and local by design.
- **One JSON Schema for both paths.** The same schema is passed as `responseConstraint` (Prompt API) and `responseJsonSchema` (cloud), so the app parses one shape wherever inference ran.
- **`inferenceSource` drives the product.** It powers the ⚡/☁️ badge, and it decides how many self-consistency votes to run: three when votes are free on device, one in the cloud.
- **`initializeDeviceModel()`** with a progress bar, started from a user click as Chrome requires.
- **Multimodal expert tier** with located evidence, and **Grounding with Google Search**, displaying the required Search suggestions.
- **Other Firebase products:**
  - App Check (reCAPTCHA Enterprise);
  - Anonymous Auth;
  - Firestore with persistent offline cache (the offline queue);
  - Cloud Storage;
  - Remote Config (router thresholds and model names, tunable per season without a release);
  - Hosting.

### Value proposition

- **Farmers** get an answer in the field, with or without signal, and a second opinion when it matters. That costs nothing on capable devices and one cloud call when it is needed.
- **Extension officers** triage many cases for free on their own laptops, and see where outbreaks are forming.
- **For whoever pays the cloud bill**, hybrid is a cost curve, not a feature flag. As more devices ship Gemini Nano, more cases resolve on-device and cloud cost falls, with no code change.

Measured on ‹N› labelled field photos (Evaluation page):

| Set-up | Top-1 | Top-3 | Done on device | Cloud calls / 100 photos | Avg time |
|---|---|---|---|---|---|
| Hybrid cascade | ‹›% | ‹›% | ‹›% | ‹› | ‹› s |
| On-device only | ‹›% | ‹›% | 100% | 0 | ‹› s |
| Cloud expert only | ‹›% | ‹›% | 0% | 100 | ‹› s |

### How we built it

- **Stack:** React + TypeScript + Vite, installable PWA (Workbox), Leaflet for the outbreak map.
- **Hybrid inference:** Firebase AI Logic. **Data:** Firestore, Storage, Auth, Remote Config, App Check.
- **Crop modules:** plain TypeScript data, holding photo guides, growth stages, symptom profiles and curated first steps. Adding a crop, or later livestock or shrimp, is one file.
- **Testing:**
  - 27 unit tests (router, rule scorer, photo quality, parsing, outbreak cells, evaluation metrics);
  - 15 end-to-end tests in Chrome against the Auth emulator, a simulated Prompt API and an intercepted cloud endpoint. They cover offline, fallback, outage and officer flows.

### Challenges we ran into

- **Small models invent disease names.** We split tier 1 into "describe what you see" and "pick from this closed list", with `unknown` always allowed, and cross-check the result against deterministic rules.
- **Phones vs laptops.** Most farmers' phones have no local model, so offline on those phones had to work without AI (the checklist). On-device AI had to earn its place where it actually exists: officers' laptops and newer phones.
- **Offline is harder than it looks.** Our end-to-end tests caught three real bugs:
  - returning users got a new anonymous account;
  - Firestore writes awaited server acknowledgements on weak links;
  - slow uploads blocked diagnoses.
- **Language.** Gemini Nano in Chrome does not support Vietnamese. Tier-1 prompts and outputs are English enums; everything the farmer reads is rendered in Vietnamese.

### Accomplishments that we're proud of

- A router whose decisions are explainable: every escalation shows its reason.
- A case photographed with no signal is diagnosed by the cloud expert automatically when the phone reconnects.
- An officer workflow that keeps triage free and private on the officer's own laptop.

### What we learned

Hybrid inference is most valuable when each side does what it is best at:

- **On-device** for cheap, private, repeated passes (self-consistency votes, officer triage);
- **Cloud** for the hard cases, full-resolution images and fresh information.

The key product decision is the **routing policy**, not the model call.

### What's next

- Field validation with extension officers in ‹province› and a larger labelled photo set.
- A native Android app on the same Firebase AI Logic hybrid API (`firebase-ai-ondevice`).
- Push alerts to nearby farms when an outbreak cell grows.
- More modules: mango, citrus, and shrimp ponds, where the tier-1 interview matters more than the photo.

### Built with

`firebase-ai-logic` `gemini-nano` `gemini` `firebase` `firestore` `firebase-auth` `firebase-app-check` `firebase-remote-config` `firebase-storage` `firebase-hosting` `react` `typescript` `vite` `pwa` `leaflet` `playwright` `vitest`

### Existing app?

No — new project, built during the submission period (started November 12, 2026).
