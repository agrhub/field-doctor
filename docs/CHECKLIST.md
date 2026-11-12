# Submission checklist — #BuildHybridAI 2026

Deadline: **Nov 30, 2026, 2:00 pm PST** (Dec 1, 05:00 Vietnam time). Aim to submit on Nov 29.

## Official requirements

| Requirement | Status | Where |
|---|---|---|
| All AI inference through Firebase AI Logic | ✅ | `src/ai/tier1.ts`, `src/ai/expert.ts`; no other model APIs |
| Combines on-device and cloud inference | ✅ | `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, cloud expert tier |
| Platform: Web (Chrome) with Gemini Nano | ✅ | Select **Web (Chrome)** on the form |
| App Check | ✅ code / ☐ console | `src/lib/firebase.ts`; register reCAPTCHA Enterprise and enforce App Check for AI Logic |
| Public GitHub/GitLab repo | ✅ | https://github.com/agrhub/field-doctor |
| Open-source license visible in the About section | ✅ | MIT (`LICENSE`) — check the About sidebar shows "MIT license" |
| Repo shows Firebase AI Logic imported **and called** at runtime | ✅ | `firebase/ai` imports and `generateContent` calls |
| Setup instructions in the repo | ✅ | `README.md` → Run it |
| Tests passing | ✅ | GitHub Actions CI: unit, security rules, end-to-end with emulators |
| Text description: Firebase AI Logic usage, features, value proposition | ✅ draft | `docs/SUBMISSION.md` (fill placeholders) |
| Demo video ≤ 3 min, public on YouTube, English or English subtitles, shows the app running | ☐ | Script: `docs/VIDEO_SCRIPT.md` |
| All materials in English, app free of charge | ✅ | |
| Hosted URL for judges (strongly encouraged) | ☐ | Steps below |

## Your steps

### 1. Firebase project (about 30 minutes)

1. Create a project in the Firebase console and add a **Web app**.
2. Under **AI Logic**, choose the **Gemini Developer API**.
3. Under **Authentication**, enable the **Anonymous** provider.
4. Create **Firestore** in a region near Vietnam (e.g. `asia-southeast1`).
5. Create the **Storage** bucket.
6. Under **App Check**, register **reCAPTCHA Enterprise** for the web app. Add your Hosting domain and `localhost` to the key, then **enforce** App Check for Firebase AI Logic once it works.
7. Optional: create the Remote Config keys listed in the README. The defaults already work.

### 2. Run locally

`cp .env.example .env.local`, fill it in, then `npm install` and `npm run dev`. Register the debug token printed in the console under App Check → Manage debug tokens.

### 3. Deploy

There are two ways to deploy.

**Option A — automatic (recommended).** Add the repository secrets listed at the top of [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). Every push to `main` then builds and deploys Hosting and the security rules. Until the secrets exist, the Deploy workflow simply skips.

**Option B — from your machine:**

```bash
npm i -g firebase-tools
firebase login
firebase use --add                      # choose your project
npm run build
firebase deploy --only firestore,storage,hosting
```

### 4. Officer account

Open the app → Extension station → copy your UID. In Firestore, create the document `stations/<UID>` (an empty document is fine).

### 5. Real-world check

Run the manual checklist in `docs/TESTING.md` §3.

Check the cloud model names: `expert_cloud_model` defaults to `gemini-3.8-flash`. If your project reports the model as unavailable, set a supported model in Remote Config; no redeploy is needed.

### 6. Measure

Collect **≥ 50 labelled field photos**, ideally 100+. Name them `rice_blast__001.jpg` or put them in folders named after the condition ids. Run all three set-ups on the Evaluation page, download the CSV and copy the summary into `docs/SUBMISSION.md` and the video.

### 7. Record the video

Follow `docs/VIDEO_SCRIPT.md`, upload it to YouTube and add English captions.

### 8. Fill in the Devpost form

| Field | Value |
|---|---|
| Name, tagline, description | `docs/SUBMISSION.md` |
| Platform | **Web (Chrome)** |
| New or existing | **New** |
| Repository URL | https://github.com/agrhub/field-doctor |
| Video URL | your YouTube link |
| Try-it-out | your Hosting URL |
| Gallery | the images in `docs/screenshots/`, replaced by real-photo screenshots where possible |

### 9. Before you press Submit

Open the repo in a private browser window: README, LICENSE in the About section, and the live URL all reachable without login.
