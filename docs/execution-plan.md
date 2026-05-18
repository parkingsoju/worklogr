# Execution Plan — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions

---

# Purpose

Build sequence for the MVP. Each phase has a clear deliverable and is testable in isolation. Phases build on each other — do not skip ahead.

The goal is to keep momentum: ship one vertical slice end-to-end as soon as possible (auth → start session → see it on Today page), then layer the rest on top.

---

# Phase 0 — Foundation

**Goal:** Repo + databases ready before any code.

- [ ] Create `worklogr/` repo with `web/` and `api/` folders
- [ ] Initialize git, push to GitHub (private repo)
- [ ] Install local Postgres 16 if not already
- [ ] Create local DB: `CREATE DATABASE worklogr_dev;`
- [ ] Create Neon project for production, copy connection string
- [ ] Create Resend account, verify a sender (or use `onboarding@resend.dev` for now)
- [ ] Create Azure account (free tier, credit card required)

**Done when:** Empty repo pushed; local + Neon DBs accessible; Resend test email succeeds.

---

# Phase 1 — Backend Skeleton

**Goal:** ASP.NET app boots, connects to Postgres, exposes `/health`, deploys nowhere yet.

- [ ] `dotnet new webapi -n Worklogr.Api -o api`
- [ ] Install NuGet packages: `Npgsql.EntityFrameworkCore.PostgreSQL`, `FluentValidation.AspNetCore`, `MediatR`, `Serilog.AspNetCore`, `Serilog.Sinks.Console`, `BCrypt.Net-Next`, `Bogus`
- [ ] Set up vertical slice folder structure (see [backend.md](backend.md))
- [ ] Create entities: `User`, `DailyLog`, `WorkSession`
- [ ] Create `AppDbContext` with EF Core configurations
- [ ] First migration: `dotnet ef migrations add InitialCreate`
- [ ] Apply to local DB: `dotnet ef database update`
- [ ] Configure Serilog → console with JSON formatter
- [ ] Add global `IExceptionHandler` returning JSON error shape
- [ ] Add CORS policy (allow-list, credentials)
- [ ] Add `/health` endpoint with `AddDbContextCheck<AppDbContext>`
- [ ] `Program.cs` wiring complete
- [ ] Test: `dotnet run` works, `GET /health` returns 200, schema visible in pgAdmin

**Done when:** Local API runs, hits local DB, `/health` is 200, console logs are JSON.

---

# Phase 2 — Backend Auth

**Goal:** Register / login / logout / forgot-password / reset-password all work via real HTTP calls.

- [ ] `Features/Auth/Register/` — command, handler, validator (email unique async check), endpoint
- [ ] `Features/Auth/Login/` — issue JWT, set HTTP-only cookie
- [ ] `Features/Auth/Logout/` — clear cookie
- [ ] `Features/Auth/Me/` — return current user from JWT
- [ ] `PasswordResetToken` entity + migration
- [ ] `Features/Auth/ForgotPassword/` — generate token, send via Resend
- [ ] `Features/Auth/ResetPassword/` — validate token, update password
- [ ] BCrypt password hasher service in `Shared/Auth/`
- [ ] JWT helper in `Shared/Auth/`
- [ ] Resend client wrapper in `Shared/Email/`
- [ ] JWT validation middleware
- [ ] Rate limiting on `/register`, `/login`, `/forgot-password` per [backend.md](backend.md)
- [ ] FluentValidation pipeline behavior wired into MediatR
- [ ] `DevSeeder` creates test user (`test@local.dev`) if DB is empty
- [ ] Tests: `RegisterValidator.Tests`, `LoginHandler.Tests`

**Done when:** `curl` flow works end-to-end — register a user, login, hit `/me` with cookie, forgot-password email arrives, reset-password updates the hash.

---

# Phase 3 — Frontend Skeleton

**Goal:** Vite app boots, has both layouts, hits the API for `/health`.

- [ ] `npm create vite@latest web -- --template react-ts`
- [ ] Install: `@chakra-ui/react`, `@emotion/react`, `@emotion/styled`, `framer-motion`, `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `xlsx`, `date-fns`, `date-fns-tz`
- [ ] Configure Chakra theme in `src/lib/theme.ts` with `brand` color (teal initial), `ColorModeScript` for system-default dark mode
- [ ] TanStack Router file-based routes per [frontend.md](frontend.md)
- [ ] TanStack Query client + provider
- [ ] API client wrapper (`fetch` with `credentials: 'include'` for cookies)
- [ ] Auth layout (`_auth.tsx`) — centered card, max-width 400px
- [ ] App layout (`_app.tsx`) — fixed sidebar, user menu
- [ ] React Error Boundary at `__root.tsx`

**Done when:** `npm run dev`, both layouts render, sidebar links visible, sample API call to `/health` succeeds with CORS.

---

# Phase 4 — Frontend Auth

**Goal:** User can register, log in, log out, reset password from the UI.

- [ ] Login page (email + password, `data-testid` attributes)
- [ ] Register page
- [ ] Forgot password page (with success-regardless-of-existence message)
- [ ] Reset password page (consumes token from URL)
- [ ] `useCurrentUser` hook backed by `/api/auth/me` query
- [ ] Redirect logic: unauthenticated → `/login`, authenticated visiting `/login` → `/`
- [ ] Logout action in sidebar user menu
- [ ] RHF + Zod validators for each form
- [ ] Inline error display per [frontend.md](frontend.md) UI Mutation Behavior

**Done when:** End-to-end login flow works in browser. After login, user sees the app shell.

---

# Phase 5 — Sessions (Core Feature)

**Goal:** Start, end, edit, add-manually, delete sessions. This is the heart of the product.

**Backend:**

- [ ] `Features/Sessions/StartSession/` — handler, validator (overlap check + only-one-active), endpoint
- [ ] `Features/Sessions/EndSession/`
- [ ] `Features/Sessions/AddManualSession/` — overlap check shared with Start
- [ ] `Features/Sessions/EditSession/` — overlap check excluding self
- [ ] `Features/Sessions/DeleteSession/`
- [ ] Shared overlap-check helper in `Shared/`
- [ ] Daily log auto-create / upsert by user + local date (per Rule 0 + Rule 1 in [data-model.md](data-model.md))
- [ ] Tests: overlap detection, only-one-active, daily-log auto-create

**Frontend:**

- [ ] Today page (`/`) hits `GET /api/daily-logs/today`
- [ ] `DailyLogCard` (date + status + total)
- [ ] `ActiveSessionCard` with live ticking timer (`useEffect` + `setInterval`)
- [ ] `SessionList` + `SessionItem` with edit/delete icon buttons
- [ ] Inline `Start Session` form (Collapse expands below button)
- [ ] `End Session` button on active card
- [ ] `SessionFormModal` for Add Manually + Edit Session
- [ ] `ConfirmDeleteDialog` (AlertDialog, different copy for active vs completed)
- [ ] Optimistic-feeling UX per UI Mutation Behavior

**Done when:** Open Today page → start session → see live timer → end session → it appears in completed list. Edit and delete work. Add Manually works with overlap detection.

---

# Phase 6 — Daily Log Status + Detail Page

**Goal:** Mark Complete, Reopen, view past logs.

**Backend:**

- [ ] `Features/Logs/MarkComplete/` — rejects if any active session
- [ ] `Features/Logs/ReopenLog/`
- [ ] `Features/Logs/GetByDate/`
- [ ] `Features/Logs/GetLogs/` — filtered by date range and status

**Frontend:**

- [ ] `Mark Complete` button on Today page
- [ ] `Reopen Log` button (visible when status is Complete)
- [ ] Daily Log Detail page (`/logs/$date`)
- [ ] Logs / History page (`/logs`)
- [ ] Date range filter + status filter
- [ ] `DailyLogStatusBadge` component

**Done when:** Mark today complete → status flips → editing requires reopen → reopen works → logs page lists past days.

---

# Phase 7 — Notes (Daily + Session)

**Goal:** Inline-editable plain text notes.

**Backend:**

- [ ] `PATCH /api/daily-logs/{id}` accepts `{ note }`
- [ ] `PUT /api/work-sessions/{id}` already supports `note` field

**Frontend:**

- [ ] Inline editable daily note on Today page and Detail page
- [ ] Inline editable session note on each `SessionItem`
- [ ] Click placeholder → activates Textarea + Save button
- [ ] Save → collapses back to plain text

**Done when:** Notes save without modal, persist across reload.

---

# Phase 8 — Weekly Summary

**Goal:** Show this week's totals on the Today page.

- [ ] Frontend computes weekly totals from existing session data — no separate endpoint needed
- [ ] `WeeklySummaryCard` component with 7 daily rows + total
- [ ] Bar indicator per day (Chakra `Progress`)
- [ ] Respects `weekStartsOn` from user settings (default Monday)

**Done when:** Today page shows correct weekly totals, updates when sessions change.

---

# Phase 9 — Excel Export

**Goal:** Export sessions by date range to `.xlsx`.

- [ ] Logs page `Export Excel` button
- [ ] SheetJS generates `.xlsx` client-side from filtered sessions
- [ ] Filename format: `worklogr-2026-04-01-to-2026-04-30.xlsx`
- [ ] Columns: Date, Start, End, Duration, Location, Session Note, Daily Status, Daily Note

**Done when:** Click Export → file downloads → opens cleanly in Excel/Numbers/Sheets.

---

# Phase 10 — Settings + Polish

**Goal:** Settings page works; UI polished.

- [ ] Settings page form: name, timezone, default location, week starts on, theme
- [ ] `PATCH /api/users/me` endpoint
- [ ] Theme selector applies via `useColorMode`
- [ ] Stale active session recovery prompt on app load (Rule 10 in [data-model.md](data-model.md))
- [ ] Empty states on Today and Logs pages
- [ ] Mobile responsive — sidebar collapses to top nav
- [ ] Loading skeletons for initial page load
- [ ] Final pass on `data-testid` coverage
- [ ] Final pass on intent-driven labels per [frontend.md](frontend.md) Form Conventions

**Done when:** App feels finished. Nothing obviously broken. Mobile works.

---

# Phase 11 — Deploy

**Goal:** Live on Azure, accessible from the internet.

- [ ] Apply EF migrations to Neon production DB
- [ ] Verify Resend sender domain (or stay on `onboarding@resend.dev` for now)
- [ ] Create Azure F1 App Service for the backend
- [ ] Configure backend env vars in Azure: `ConnectionStrings__Default`, `Jwt__Secret`, `Resend__ApiKey`, `Cors__AllowedOrigins`
- [ ] Create Azure SWA for the frontend
- [ ] Configure SWA build: `app_location: web`, output the Vite build folder
- [ ] Add GitHub Actions workflows: `.github/workflows/web.yml` and `.github/workflows/api.yml` with path filters
- [ ] First deploy succeeds for both apps
- [ ] Smoke test: register, login, start session, end session — all working in production
- [ ] Configure Azure App Service health check pinging `/health`

**Done when:** Public URLs work end-to-end. Sessions saved on prod survive restarts.

---

# Out of Scope for MVP

These intentionally come later — see [product.md](product.md) "What Is Not Included in the MVP":

- Google SSO (post-MVP, additive change)
- File uploads (post-MVP, R2 already chosen)
- Custom domain (post-MVP, $10-15/yr)
- Frontend component tests
- Playwright E2E
- Reports page beyond weekly summary
- Application Insights / OpenTelemetry observability
- Notifications, calendar integrations, mobile app

---

# Estimating Effort

This is a learning project — calendar time matters less than checkpoint progress. Rough sizing for solo evening/weekend work:

| Phase | Difficulty | Time estimate |
|-------|------------|---------------|
| 0 — Foundation | Easy | Half a session |
| 1 — Backend skeleton | Medium | 1-2 sessions |
| 2 — Backend auth | Hard (most learning) | 3-5 sessions |
| 3 — Frontend skeleton | Medium | 1-2 sessions |
| 4 — Frontend auth | Medium | 2-3 sessions |
| 5 — Sessions | Hard (most domain logic) | 3-5 sessions |
| 6 — Logs status + detail | Medium | 2-3 sessions |
| 7 — Notes | Easy | 1 session |
| 8 — Weekly summary | Easy | 1 session |
| 9 — Excel export | Easy | 1 session |
| 10 — Polish | Medium | 2-3 sessions |
| 11 — Deploy | Medium (first-time Azure setup) | 1-2 sessions |

A "session" here is ~2-3 hours of focused work. Total: roughly 20-30 sessions to MVP. Cut scope or split phases further if any phase stalls more than ~2x its estimate.
