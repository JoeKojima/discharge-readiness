# ClearPath — Discharge Readiness Checklist Generator

A discharge command centre that turns rounds transcripts and clinical notes into a prioritized discharge-readiness checklist. Built with React, Vite and Tailwind CSS v4. It is a static site with no backend, so it runs as-is on GitHub Pages.

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
| Overview | `#/` | Patient dashboard: every patient with unit stats, search, status filters, sorting, and **Add patient**. |
| My patients | `#/patients/<id>` | One discharge card per patient, top to bottom: header with readiness and a ☰ menu (automation status and rounds status per discipline); **Round summary** split into Physician (dot points + A–G), PT and OT; **Rehab tracker** (or discharge tracker for home) from the coordinator, with a start-automated-referral button; **Insurance** (plan, prior auth, portal); **Home situation** (address, home, support) with a flag and an ask-social-work task when nobody has asked yet; **Social work** checklist; the task **Checklist**; and the Epic chart. |
| Tasks | `#/tasks` | Unit task board in due-time order (Overdue, Due in the next hour, Later today, Tomorrow and later), groupable by patient or role, with Open / JMO list / Automations / Completed views and task automations. |
| Coordinator | `#/coordinator`, `#/coordinator/<id>` | Outside-Epic discharge coordinator: facility matching, parallel referrals, follow-up, prior auth, equipment, home health, infusion, rides and family texts on one board per patient, plus Epic sandbox write-back. |
| Rounds | `#/rounds/<id>` | Rounding list plus ambient capture: record the round, summarize it with AI, review and apply checklist updates. |
| Messages | `#/messages` | Care team inbox with threads tied to patients. Sending a message gets a simulated reply. |
| Settings | `#/settings` | Profile, preference toggles, **AI rounds summarizer** connection, and **Reset demo data**. |

## What works

- **Ambient rounds** (Rounds page, or **Generate checklist** in the header): tap the mic at the bedside and the browser's speech recognition transcribes the conversation live into the patient's transcript. Tap **End round & summarize** and the summarizer turns the round into a handoff tied to this patient: their diagnosis and hospital day, how they're doing clinically, which checklist items were done, what still blocks the planned disposition, new action items and urgency changes (each with the supporting quote), and a discharge outlook with projected readiness. You tick which changes to keep and click **Apply**. Nothing changes until you apply. The summary becomes the record of the round on the patient's dashboard; the raw transcript is only input, kept collapsed while you capture and discarded once the round is applied.
  - Live transcription uses on-device speech recognition when the browser offers it (audio stays on the computer; the first use may download a language pack), and otherwise the browser's cloud speech service. It works in Chrome, Edge and Safari. Browsers whose cloud speech service is unavailable (Brave, Arc, Opera, Vivaldi, in-app browsers, or networks that block it) show a message instead, and you can still type or paste a transcript.
  - **Summarizer options** (Settings → AI rounds summarizer):
    - **Built-in summarizer** (default): runs in the browser with no setup and no AI service. It links each statement to the patient's checklist to find completed items, blockers, urgency changes and new tasks, and writes a structured summary from them. It's pattern-based, so its summaries are more formulaic than Claude's.
    - **My Anthropic API key**: calls Claude (`claude-opus-5-5`) straight from the browser. The key is stored only in that browser.
    - **Team proxy**: calls Claude through a small Cloudflare Worker that holds the key, so the shared site never contains it. Setup is in [`proxy/README.md`](proxy/README.md).
  - **Demo only:** don't record real patient information. When on-device recognition isn't available, browser speech recognition may send audio to Google or Apple, and none of this is set up for HIPAA.
- **A–G rounds note:** each round is written up as Airway, Breathing, Circulation, Disability, Exposure, Fluids and Glucose alongside the dot-point summary. On the review screen each letter is editable; letters not covered in the round keep their previous finding.
- **Task automations** (Tasks page, ⚡ **Automate**): a playbook runs the routine steps of a task and waits on the step that needs a person, with a fallback if it doesn't happen. For example, a repeat Hb is ordered on a pathology request and the phlebotomist is paged; if they can't collect (or there's no response within an hour), the task moves to the **JMO list** as high priority. Playbooks also cover discharge scripts (pharmacist verification), follow-up bookings, equipment delivery, coverage checks, and referrals and authorisations. **These are simulated in the demo:** nothing is sent to pathology, paging, pharmacy or booking systems.
- **Discharge coordinator** (Tier 1 of the social work task inventory: the admin work that happens outside Epic). Staff enter a short profile (destination, insurance, zip, care needs, family contact) and approve the referral packet. The coordinator then works every outside party in parallel:
  - matches facilities from its own directory (level of care, capabilities, insurance, acceptance history, distance) and explains exclusions
  - verifies the family's number by text, sends them the facility list and collects ranked choices
  - faxes referrals to every chosen facility at once, recovers from failed faxes, calls non-responders on a schedule, sends extra documents on request, auto-advances to the next match after a denial, and confirms the bed with the family's best acceptance
  - adds facility admission rules (e.g. 24 h restraint-free) to the patient's checklist
  - submits prior auth on the payer portal with deadline tracking (front-loaded before weekends), drafts appeals for a clinician to sign and books the peer-to-peer
  - for home discharges, orders equipment and moves delivery into the caregiver's window, refers to several home health agencies at once (first to accept wins), and chases the infusion medical-benefit approval
  - books the right ride, and keeps the family updated by text; distress goes to the social worker instead of an automatic reply
  **All outreach is simulated:** outside parties respond from the directory's stats on a simulated clock you control (+1 h, +4 h, next event, play). Nothing is faxed, called, texted or submitted.
- **Epic chart (simulated, the default)**: every patient card and coordinator board has an Epic chart that lives in this browser, so there is no Epic sign-in. ClearPath sends the same FHIR requests Epic's real API takes: an **unsigned note** (`DocumentReference`, `docStatus: preliminary`, LOINC note type, base64 text, filed against the encounter) and a **provisional problem** (`Condition`, ICD-10). The simulated Epic answers like Epic does, and a clinician can then sign the note or accept/reject the problem. Each item shows its request and response JSON. Nothing leaves the browser.
- **Real Epic sandbox (optional)**: tucked under "Optional: send to Epic's real public sandbox" on the same panel. It does a SMART on FHIR standalone launch (public client, PKCE, no server) against fhir.epic.com, signs in with a clinician test user from Epic's test-data page (e.g. FHIRTWO), and writes the same note and problem to one of Epic's fake test patients. The GitHub Pages site has ClearPath's own non-production client ID built in; to use your own, register a non-production app (audience clinicians/staff, not confidential; APIs Patient.Read, Encounter.Search, DocumentReference.Create/Read (Clinical Notes), Condition.Create/Read (Problems); redirect URI = the site URL without `#`) and paste its client ID. Epic wipes sandbox writes weekly.
- Checking off, re-prioritizing (task ⋯ menu), deleting, and adding tasks updates readiness, status, open effort, the primary blocker, and the unit dashboard.
- **Readiness** = clinical baseline + the weighted share of each completed task. Each task gets points for urgency (High 3, Medium 2, Low 1) plus 1 if it takes 30 min or more; its share of the gap to 100% is its points ÷ the checklist's total points. **How is X% calculated?** on the command centre shows the full breakdown, and each task shows what it adds, why, and its share of the patient's open workload. Status is derived from readiness and open high-priority tasks.
- When every task is done, **Discharge patient** removes the patient from the list.
- Patient switcher, care team modal (message any member), SNF referrals, sign out / sign in, and a 404 page.
- All changes are saved in the browser (localStorage). **Settings → Reset demo data** restores the 8 seed patients.

## Code layout

- `src/data.ts`: seed patients, staff, message threads, facilities
- `src/logic.ts`: readiness and status math, checklist extraction rules, due-time parsing
- `src/summarize.ts`: built-in rounds summarizer (dot points, A–G, checklist changes)
- `src/automation.ts`: task automation playbooks
- `src/coordinator/`: discharge coordinator (directory and matching, simulation engine, seed scenarios)
- `src/epic.ts`: Epic sandbox SMART sign-in (PKCE) and FHIR read/write
- `src/epicSim.ts`: the simulated Epic chart (stored in this browser) that answers the same FHIR writes; `src/components/EpicPanel.tsx` is the panel, with the real sandbox as an option
- `src/careProfile.ts`: PT/OT findings, home situation and social work items per patient
- `src/ambient.ts`: live mic transcription (Web Speech API, on-device first)
- `src/ai.ts`: Claude rounds summarizer (prompt, JSON schema, rule-based fallback)
- `src/store.tsx`: app state (reducer and localStorage) and hash router
- `src/ui.tsx`: icons and shared UI components
- `src/components/`: task row, modals, rounds editor (record → review → apply), AI settings
- `src/pages/`: one file per page
- `proxy/`: Cloudflare Worker that holds the API key for shared use
