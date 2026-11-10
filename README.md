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
| Rounds | `#/rounds/<id>` | Rounding list and per-patient transcript and notes editor that generates checklist tasks. |
| Messages | `#/messages` | Care team inbox with threads tied to patients. Sending a message gets a simulated reply. |
| Settings | `#/settings` | Profile, preference toggles, and **Reset demo data**. |

## What works

- **Generate checklist** (header, Overview, Rounds): a rule-based extractor in the browser reads the rounds transcript and notes and adds any action items not already on the patient's checklist (oxygen/DME, PT, transport, prescriptions, labs, follow-up, home health, PICC, prior auth, coverage, and more).
- Checking off, re-prioritizing (task ⋯ menu), deleting, and adding tasks updates readiness, status, open effort, the primary blocker, and the unit dashboard.
- Readiness = baseline + remaining share × fraction of tasks complete. Status is derived from readiness and open high-priority tasks.
- When every task is done, **Discharge patient** removes the patient from the list.
- Patient switcher, care team modal (message any member), SNF referrals, sign out / sign in, and a 404 page.
- All changes are saved in the browser (localStorage). **Settings → Reset demo data** restores the 8 seed patients.

## Code layout

- `src/data.ts`: seed patients, staff, message threads, facilities
- `src/logic.ts`: readiness and status math, checklist extraction rules
- `src/store.tsx`: app state (reducer and localStorage) and hash router
- `src/ui.tsx`: icons and shared UI components
- `src/components/`: task row and modals
- `src/pages/`: one file per page
