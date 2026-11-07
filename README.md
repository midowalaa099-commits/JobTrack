# JobTrack

A small, complete MVP for organizing a job search. Track applications, interviews, and follow-ups in English or Arabic. Open the app without signing up; data stays in your browser.

**Live demo:** https://midowalaa099-commits.github.io/JobTrack/

## What it does

- Create, edit, inspect, and delete applications with validation.
- Move applications through Saved, Applied, Screening, Interview, Offer, Rejected, and Archived.
- Browse a searchable table or a pipeline board; filter by stage and work arrangement.
- Keep interview dates, contact details, salary ranges, notes, and follow-up dates together.
- View upcoming interviews and due follow-ups. Times use the device’s local time zone.
- See computed totals, active opportunities, upcoming interviews, and response rate.
- Export JSON backups or spreadsheet-safe CSV; validate a backup before replacing data.
- Switch between English and Arabic, including RTL layout.
- Try 10 fictional applications or explicitly start an empty personal workspace.

## Run it

Open `index.html` directly, or use Node.js 20+:

```sh
npm run build
npm test
npm start
```

There are no third-party runtime or development dependencies. The optional local server uses `http://127.0.0.1:4174`; set `PORT` to change it.

Browser storage is tied to the page’s origin. A local file, localhost, and the hosted demo have separate workspaces. Export and import JSON when moving between them.

## Structure

| Path | Purpose |
| --- | --- |
| `src/model.js` | Validation, filtering, metrics, backup parsing, CSV export |
| `src/app.js` | Accessible UI, browser storage, application workflows |
| `src/seed.js` | Fictional sample data relative to the current date |
| `src/styles.css` | Responsive layout and RTL support |
| `src/template.html` | HTML shell |
| `scripts/build.mjs` | Bundles source into a standalone HTML file |
| `tests/model.test.js` | Domain tests, build checks, and screen rendering checks |
| `index.html` | Ready-to-host app and offline copy |

## Data and safety

No analytics, API calls, automatic applications, email integrations, or calendar invitations. The app does not read your email or send anything to recruiters. All sample companies and opportunities are fictional. It does not request account credentials or payment information.

Your records are stored under `jobtrack:workspace:v1` in localStorage. Export backups regularly: clearing browser data removes this workspace. If storage is unavailable, the app clearly warns that changes are temporary. Unreadable saved data is preserved until an explicit replacement; the original can be downloaded for recovery.

Job links allow only HTTP/HTTPS and reject embedded credentials. User text is escaped before rendering. JSON imports are versioned and validated, capped at 1,000 records and 1.5 MB. CSV export neutralizes formula prefixes. Import, reset, and delete actions ask for confirmation.

Response rate is the percentage of non-saved, non-archived applications with a Screening, Interview, Offer, or Rejected status. It is a personal tracking metric, not a hiring prediction. The interview agenda does not send notifications.

## Publish on GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, select `main`, and use the repository root (`/`). The standalone `index.html` needs no build step or secrets. Run `npm run build` and tests before committing source changes.

## MVP limits

This release is local-first: no backend, multi-device sync, authentication, team access, email reminders, or CV uploads. A next version could add a Laravel API, database-backed storage, Sanctum authentication, and background reminder jobs. These features are not claimed by this release.

Built by Mohamed Walaa.
