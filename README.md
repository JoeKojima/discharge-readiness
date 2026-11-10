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

## What works

- **Generate checklist**: edit the rounds transcript or clinical notes, then generate. A rule-based extractor in the browser picks out action items (oxygen/DME, PT/ambulation, transport, prescriptions, labs, follow-up, home safety, prior auth, and more) and adds any that are new to the checklist.
- Checking off tasks updates the readiness ring, open-task count, estimated effort and primary blocker.
- Search and filters (All / Open / Completed). Tasks are sorted by urgency.
- **View task** jumps to the current primary blocker.
- Patient switcher, facility comparison, "Send referral" confirmation, and a mobile navigation drawer.

State resets on page reload.
