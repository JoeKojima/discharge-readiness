# ClearPath — Discharge Readiness Checklist Generator

A discharge command center that turns rounds transcripts and clinical notes into a prioritized discharge-readiness checklist. Built with React, Vite and Tailwind CSS v4. It is a static site with no backend, so it runs as-is on GitHub Pages.

> Demo data only. All patients, facilities and costs are fictional.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this folder to its `main` branch.
2. In the repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys the site on every push to `main`. The site appears at `https://<your-username>.github.io/<repo-name>/`.

The Vite `base` is set to `./`, so the build works under any repository name or custom domain without changes.

### Manual alternative

Run `npm run build` and publish the contents of `dist/` (for example, to a `gh-pages` branch).

## Pages

Routes use the URL hash (`#/patients`, `#/tasks`, ...) so every page and refresh works on GitHub Pages without server configuration.

| Page | Route | What it does |
| --- | --- | --- |
| Overview | `#/patients/<id>` | Discharge command center for one patient: readiness ring, primary blocker, checklist, AI summary, discharge plan, care team, and SNF facility comparison for patients going to a facility. |
| My patients | `#/patients` | Dashboard of all patients with unit stats, search, status filters, sorting, and **Add patient**. |
| Tasks | `#/tasks` | Every task across patients, with filters for patient, owner, urgency and status, plus **Add task**. |
| Rounds | `#/rounds/<id>` | Rounding list plus ambient capture: record the round, summarize it with AI, review and apply checklist updates. |
| Messages | `#/messages` | Care team inbox with threads tied to patients. Sending a message gets a simulated reply. |
| Settings | `#/settings` | Profile, preference toggles, **AI rounds summarizer** connection, and **Reset demo data**. |

## What works

- **Ambient rounds** (Rounds page, or **Generate checklist** in the header): tap the mic at the bedside and the browser's speech recognition transcribes the conversation live into the patient's transcript. Tap **End round & summarize** and the summarizer returns a clinical summary, key findings, a discharge outlook, new tasks, tasks the team said are done, and urgency changes, each with the supporting quote. You tick which changes to keep and click **Apply**. Nothing changes until you apply.
  - Live transcription uses on-device speech recognition when the browser offers it (audio stays on the computer; the first use may download a language pack), and otherwise the browser's cloud speech service. It works in Chrome, Edge and Safari. Browsers whose cloud speech service is unavailable (Brave, Arc, Opera, Vivaldi, in-app browsers, or networks that block it) show a message instead, and you can still type or paste a transcript.
  - **Summarizer options** (Settings → AI rounds summarizer):
    - **Built-in rules** (default): keyword matching in the browser. No setup and no AI; finds new tasks only.
    - **My Anthropic API key**: calls Claude (`claude-opus-5-5`) straight from the browser. The key is stored only in that browser.
    - **Team proxy**: calls Claude through a small Cloudflare Worker that holds the key, so the shared site never contains it. Setup is in [`proxy/README.md`](proxy/README.md).
  - **Demo only:** don't record real patient information. When on-device recognition isn't available, browser speech recognition may send audio to Google or Apple, and none of this is set up for HIPAA.
- Checking off, re-prioritizing (task ⋯ menu), deleting, and adding tasks updates readiness, status, open effort, the primary blocker, and the unit dashboard.
- Readiness = baseline + remaining share × fraction of tasks complete. Status is derived from readiness and open high-priority tasks.
- When every task is done, **Discharge patient** removes the patient from the list.
- Patient switcher, care team modal (message any member), SNF referrals, sign out / sign in, and a 404 page.
- All changes are saved in the browser (localStorage). **Settings → Reset demo data** restores the 8 seed patients.

## Code layout

- `src/data.ts`: seed patients, staff, message threads, facilities
- `src/logic.ts`: readiness and status math, checklist extraction rules
- `src/ambient.ts`: live mic transcription (Web Speech API, on-device first)
- `src/ai.ts`: Claude rounds summarizer (prompt, JSON schema, rule-based fallback)
- `src/store.tsx`: app state (reducer and localStorage) and hash router
- `src/ui.tsx`: icons and shared UI components
- `src/components/`: task row, modals, rounds editor (record → review → apply), AI settings
- `src/pages/`: one file per page
- `proxy/`: Cloudflare Worker that holds the API key for shared use
