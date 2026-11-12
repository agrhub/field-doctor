# Demo video script (≤ 3:00)

**Format:**
- Screen recordings of real devices, plus 2–3 field shots.
- Narration in English, or in Vietnamese with English subtitles; the subtitle text below is the English narration.
- Upload to YouTube as **Public** or **Unlisted**, with English captions.

**What you need:**
- A laptop running Chrome with Gemini Nano ready (`await LanguageModel.availability()` → `available`).
- A phone or a second browser **without** the Prompt API.
- 3–4 real photos of sick rice leaves, and one healthy leaf.
- The app deployed to Firebase Hosting, with an officer account (`stations/{uid}`).

| Time | Shot | Narration / subtitle |
|---|---|---|
| 0:00–0:15 | Field footage: rice field, a farmer looking at a yellowing leaf. Title card "Field Doctor". | "In the Mekong Delta, rice blast can take a season's income in a week. Farmers photograph sick plants and wait days for an answer — often with no signal in the field." |
| 0:15–0:30 | Laptop: home screen, "Gemini Nano is ready" card. Toggle VI/EN. | "Field Doctor is a hybrid crop health assistant built with Firebase AI Logic. It runs on-device when it can, in the cloud when it must." |
| 0:30–0:55 | New check → take a blurry photo (warning) → retake → fill context → Analyze. Show "Reading symptoms… Matching conditions 1/3, 2/3, 3/3". | "Photos are checked for blur instantly. Then Gemini Nano describes the symptoms and votes three times on a closed list of diseases — free, private, and offline." |
| 0:55–1:15 | Result: ⚡ On-device badge, ranking bars, 'Do now' steps, green routing box "reliable enough". | "When the votes agree and the condition is low-risk, the farmer gets the answer and safe first steps right here, with zero cloud calls." |
| 1:15–1:45 | DevTools → Network → **Offline**. New case with a blast photo. Result: escalated because "dangerous condition", "Queued…". Turn network back **on** → the Cloud expert card appears with **lesion boxes**, differential and IPM plan. | "Rice blast is dangerous, so the router asks for a second opinion. We're offline, so the case is queued. When signal returns, a larger cloud Gemini model diagnoses it — and shows exactly which lesions it used." |
| 1:45–2:00 | Click "Find current advisories" → grounded bullets with sources. | "Grounding with Google Search adds this season's official advisories, with sources." |
| 2:00–2:15 | Phone / second browser without Prompt API: same photo → ☁️ Cloud badge. | "On a phone with no local model, the exact same code falls back to cloud Gemini. One SDK, every device." |
| 2:15–2:40 | Officer laptop: Extension station → outbreak map → open case → "Re-check on this device" (⚡) → save verdict → farmer sees "Officer verdict". | "Extension officers see an anonymous outbreak map, re-check cases on their own laptop's Gemini Nano for free, and send a verdict back to the farmer." |
| 2:40–2:55 | Evaluation page with your real summary table; cut to the architecture diagram from the README. | "On ‹N› field photos, the hybrid cascade matched the cloud expert's accuracy while answering ‹X›% of cases on-device." |
| 2:55–3:00 | Logo + repo URL. | "Field Doctor — built with Firebase AI Logic. Code: github.com/agrhub/field-doctor." |

**Tips:**
- Keep the ⚡/☁️ badge in frame whenever you switch device or network: it is the visual proof of hybrid inference.
- Do not speed up the on-device analysis; real latency is part of the story.
- Only state numbers you measured on the Evaluation page.
