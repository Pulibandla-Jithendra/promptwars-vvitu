# NammaWard AI

> **A civic grievance prototype for evidence-based resolution review and clearer complaint histories.**

Built for **PromptWars x Creative Community, VVITU**, under *AI for Better Living & Smarter Communities* and the *Citizen Engagement and Public Services* challenge area.

## Problem statement

> Citizen grievance systems allow people to report civic problems, but submitting a complaint and changing its status do not, by themselves, establish whether the underlying real-world problem has been resolved. Citizens may need a clear way to review resolution evidence, dispute a closure when the problem persists, and see what happens next. Communities can also struggle to understand recurring complaints when reports are treated as isolated cases.
>
> NammaWard AI explores how evidence-based resolution verification, transparent complaint histories and AI-assisted analysis can make civic grievance handling more accountable and community-focused.

This is a **problem hypothesis**, not a claim that every existing grievance platform has these shortcomings. Interviews with residents and municipal staff, and comparison with real workflows, are needed to validate how common these needs are and what evidence is useful.

## Proposed solution

The prototype keeps a complaint open after staff propose a resolution. Staff add a required resolution note and may attach an after-photo; the reporting citizen can confirm that the issue appears fixed or explain why it persists. A dispute returns the item to the staff queue. The app records these events alongside the original report in browser storage.

| Problem | NammaWard AI approach | How to verify it |
|---|---|---|
| A staff status change alone does not confirm an on-the-ground fix | Staff propose a resolution; only the reporting citizen can confirm it in the demo flow | Sign in as staff, move a complaint to review/in progress, add a resolution note, then sign in as its reporting citizen |
| A citizen may still see the problem after a proposed closure | The citizen can dispute with a required explanation; the complaint returns to staff review as **Citizen Disputed** | Open a complaint awaiting review as its citizen, enter a reason, choose **It still exists**, then inspect the staff queue |
| Reports need evidence and an understandable history | Optional original photo, optional staff after-photo, status notes and citizen responses appear in the complaint history | Open a complaint detail and review its timeline and attached photos |
| Repeated issues can be hard to spot when viewed separately | The Insights panel groups current records by category and exact locality text; advanced recurrence analysis is planned | Add multiple reports with the same category/locality and compare the local counts |

The citizen response is a report of what the citizen observes, not independent proof that a repair succeeded.

## Target users

- **Citizens:** report a civic issue, follow its status, inspect staff notes/evidence, and confirm or dispute a proposed resolution.
- **Municipal staff:** review a local queue, update progress, add review notes and propose work for citizen review.

## Features and implementation status

| Feature | Status |
|---|---|
| Complaint form with title, description, category, locality and optional photo | Implemented in the browser; records are stored in localStorage |
| Citizen and staff dashboards, category/status filters, search and summary counts | Implemented against the same browser-local dataset |
| Staff progress updates and review notes | Implemented in the demo |
| Resolution note, optional after-photo and citizen confirm/dispute flow | Implemented in the demo; dispute returns the complaint to staff review |
| Original report, status history, notes and available photos | Implemented in browser storage; not a server-side audit log |
| AI classification, summary and suggested routing | **Simulated:** local category mapping and keyword rules; no AI model or AI service is connected |
| Community insights | Basic local category and exact-locality aggregation; no geographic clustering, causal analysis or AI-generated recommendation |
| Authentication and role permissions | **Simulated:** hard-coded demo accounts and client-side role checks only |
| Municipal system integration, server API, shared cross-device records | Not implemented |

The starter dataset is fictional and illustrative. Counts in it are not usage, impact or response-time measurements. Demo credentials shown on the login screen are `citizen@demo.com` / `citizen123` and `staff@demo.com` / `staff123`.

## End-to-end workflow

1. A citizen submits a description, category, locality and optional photograph.
2. Staff review the record and add status updates or notes.
3. After work, staff enter a resolution note and may add an after-photo. The status becomes **Awaiting Citizen Review**.
4. The reporting citizen reviews the note and evidence, then confirms that the issue appears fixed or disputes it with an explanation.
5. Confirmation records **Resolved**; a dispute records **Citizen Disputed** and returns the complaint to the staff queue.
6. The complaint detail keeps the original report and the later notes, status changes and available evidence together.

## How AI is used

There is no live AI integration. Submission currently runs a local rule-based demo that uses the selected category and a few keywords to assign an estimated priority, generate a template summary and suggest a department/response window. Community Insights is arithmetic over browser-local complaint records, not AI analysis. AI-assisted classification, summarization and recurring-issue discovery are future directions and require evaluation before they can guide real decisions.

## Technology and architecture

- React 19, TypeScript 6, Vite 8 and custom CSS.
- Browser `localStorage` for complaints/photos and `sessionStorage` for the demo session.
- Camera/gallery capture uses browser media and file APIs; images are compressed in the browser.
- No backend, database, external AI service or environment variables are required by the current code.

```text
nammaward-ai/
  index.html
  package.json             scripts and dependencies
  public/                  app icons and web manifest
  src/
    App.tsx                citizen dashboard and app-level flow
    components/            forms, details, insights, login and staff queue
    context/               demo auth and browser-local complaint state
    data/sampleComplaints.ts
    types.ts               complaint, status and history types
    App.css
```

## Local setup

Run these commands from the repository root:

```bash
cd nammaward-ai
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). To create and preview a production build:

```bash
npm run build
npm run preview
```

Run the automated component and workflow suite with:

```bash
npm run test -- --run
```

Vitest runs in jsdom with React Testing Library and user-event. The suite covers report validation and creation, staff status/resolution updates, citizen confirmation and dispute, history and photo persistence, status counts, ownership checks, malformed browser state, upload type/size limits and an axe-core scan of the report dialog.

No `.env` file is needed. `.env` and `.env.*` are ignored; `.env.example` remains trackable if a future integration introduces documented, non-secret variable names.

## Verification

Final verification for this revision: `npm run test -- --run` passed **12/12 tests across 3 files**; `npm run build` passed the TypeScript check and Vite production build; `git diff --check` passed. The axe-core DOM scan reported no violations. jsdom cannot evaluate browser-rendered color contrast or physical layout, so those still need browser review. No lint script is configured. Component tests use jsdom and do not replace manual assistive-technology checks or a real-browser responsive review; mobile and desktop CSS breakpoints were inspected, but no browser viewport run was available.

To manually walk through the flow in one browser, sign in as the citizen, submit a complaint, sign out, and sign in as staff. Move it to **In Progress**, add a review note, propose a resolution with a required note and optional after-photo, and send it for citizen review. Sign back in as the citizen: dispute with a reason to return it to the staff queue, or confirm that it appears fixed. The seeded complaint `NW-2026-006` is already awaiting citizen review for a shorter confirmation demo.

## Screenshots

There are no application screenshots in the repository at present. If adding judge/demo captures, place them under `docs/screenshots/` and link them here with captions; avoid including real personal or complaint data.

## Deploy to Vercel

The app is a client-side Vite site and has no required environment variables. From `nammaward-ai/`, authenticate and link the intended Vercel project if the CLI asks, then deploy:

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

Use the Vite build command `npm run build` and output directory `dist` if project settings need to be entered. Do not add secrets to the repository; future server-side integrations should use Vercel environment settings.

## Limitations, privacy and security

- Complaint records and compressed image data stay in that browser's localStorage. They are not uploaded, backed up, shared across devices, or sent to an authority; storage limits can affect photo retention.
- Demo sign-in credentials are embedded in client code, sessions use sessionStorage, and role checks run in the browser. This is not authentication, authorization or access control suitable for production.
- The prototype has no server-side validation, tamper-resistant audit trail, moderation, real notification, geospatial clustering or municipal integration.
- Sample data is fictional. AI labels describe a deterministic mock, not a model prediction. Priorities and suggestions must not be treated as operational guidance.
- A production service would need consent and retention rules for photos, secure identity and role enforcement, server-side storage, audit controls, accessibility review and validation with citizens and municipal staff.

## Competition prototype

NammaWard AI is a competition prototype for PromptWars x Creative Community, VVITU. Unless a future integration is explicitly added and verified, it is **not connected to a real municipal authority** and must not be used to submit real emergencies or sensitive personal information.
