# Pending Decisions — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Purpose

These are 25 implementation-level questions that will surface during coding. The proactive recommendations below are starting points — each still needs a final yes/no before it lands in the canonical spec docs.

When a decision is made, move it out of this file into the appropriate spec doc, and delete the entry here. When this file is empty, delete the file.

Format per item: **question**, **recommendation**, **why**, **target doc** (where it lands when accepted).

---

# Data Model

## 1. Timezone implementation library

**Recommendation:** NodaTime (NuGet) on the backend. Use `Instant` for stored UTC values, `ZonedDateTime` for "user's local date" computation, `DateTimeZoneProviders.Tzdb` for IANA lookups.

**Why:** .NET's built-in `TimeZoneInfo` requires Windows-IANA mapping and is awkward for IANA-first apps. NodaTime makes timezone-aware code feel native.

**Lands in:** [data-model.md](data-model.md) Rule 0.

---

## 2. Re-bucketing sessions on timezone change

**Recommendation:** No re-bucketing. Sessions stay attached to the daily log they were created under. Changing timezone applies only to sessions created after the change.

**Why:** Changing your timezone setting should not rewrite history. Avoids ambiguity about which day a 7-month-old session belongs to.

**Lands in:** [data-model.md](data-model.md) Rule 0.

---

## 3. Cross-midnight sessions

**Recommendation:** The session's start time decides which daily log it belongs to. A session starting 11:00 PM April 30 (local) and ending 1:00 AM May 1 (local) belongs to April 30's daily log.

**Why:** Matches mental model — "I started working last night" is associated with last night.

**Lands in:** [data-model.md](data-model.md) Rule 0 or its own rule.

---

## 4. Stale active session threshold

**Recommendation:** 24 hours. Any active session whose `startTime` is more than 24 hours before now triggers the Rule 10 recovery prompt.

**Why:** Most legitimately long sessions end within a workday. 24 hours catches the "forgot to end" case while not annoying long workers.

**Lands in:** [data-model.md](data-model.md) Rule 10.

---

## 5. DST transitions

**Recommendation:** Don't handle specially. Document in Rule 0 that NodaTime resolves ambiguous wall-clock times automatically and Philippines (primary use case) has no DST.

**Why:** Spending time on DST edge cases is premature for a Philippines-first personal app.

**Lands in:** [data-model.md](data-model.md) Rule 0.

---

## 6. Soft delete vs hard delete

**Recommendation:** Hard delete. No `isDeleted` flag, no audit log of deletions.

**Why:** Personal app, no compliance or audit need. Saves complexity (no `IsDeleted` filtering everywhere). Excel exports of past data naturally reflect current state.

**Lands in:** [data-model.md](data-model.md) as a new rule, e.g. Rule 12.

---

## 7. EF Core `updatedAt` — DB trigger or interceptor?

**Recommendation:** EF Core `SaveChangesInterceptor`. Update Rule 11 in [data-model.md](data-model.md) to reflect this.

**Why:** Lives in version-controlled code. Easy to test. Does not fight EF Core's change tracking. Database triggers complicate migrations and are an extra place to look when debugging.

**Lands in:** [data-model.md](data-model.md) Rule 11 and [backend.md](backend.md).

---

# Auth Security

## 8. CSRF protection

**Recommendation:** Skip for MVP. Rely on `SameSite=Lax` cookie attribute. Document as accepted gap.

**Why:** Frontend (SWA) and backend (F1) are different origins but no third-party iframe scenarios. `SameSite=Lax` blocks the common attack vectors.

**Lands in:** [backend.md](backend.md) Auth Implementation.

---

## 9. Password requirements

**Recommendation:** Minimum 12 characters. No HaveIBeenPwned breach check for MVP. Display: "Use at least 12 characters."

**Why:** 12 chars beats the 8 char convention. HIBP adds an HTTP call per register and complexity for a personal app.

**Lands in:** [backend.md](backend.md) Auth Implementation and [api.md](api.md) Validation Rules.

---

## 10. Account enumeration on register

**Recommendation:** Accept the leak. Returning generic "If valid, check your email" requires email verification, which is out of MVP scope.

**Why:** Personal app, single known user. Document as accepted gap. Revisit if/when the app opens to public sign-ups.

**Lands in:** [backend.md](backend.md) Auth Implementation as a documented gap.

---

# Domain Edge Cases

## 11. Live timer drift

**Recommendation:** Recalculate from `Date.now() - startTime` each tick. Don't increment a counter.

**Why:** `setInterval(1000)` drifts on slow devices. Timestamp-based recalculation stays accurate even if intervals fire late.

**Lands in:** [frontend.md](frontend.md) Active Session Card section or UI Mutation Behavior.

---

## 12. Multi-device active session race

**Recommendation:** Last-writer-wins on End Session. EF Core's default behavior. Document the (rare) outcome.

**Why:** Personal app, race is unlikely. Implementing optimistic concurrency or 409 Conflict UX is over-engineering.

**Lands in:** [backend.md](backend.md) End Session handler notes.

---

# EF Core / DB Concurrency

## 13. DailyLog upsert race

**Recommendation:** Postgres `ON CONFLICT (user_id, date) DO NOTHING` via raw SQL or EF Core's `ExecuteUpdate`.

**Why:** Cleaner than catch-and-retry on unique constraint violation. Atomic. Idempotent.

**Lands in:** [backend.md](backend.md) Sessions feature notes.

---

## 14. Bogus seed avoiding overlaps

**Recommendation:** Generate sessions sequentially per day. Each session starts after the previous one ends, plus a random gap. ~20 lines.

**Why:** Domain rule (no overlapping sessions) means the seeder has to respect overlap detection itself. Sequential generation is the simplest pattern that satisfies it.

**Lands in:** [backend.md](backend.md) Dev Seed Data section.

---

# Frontend Implementation

## 15. DatePicker / TimePicker library

**Recommendation:** `react-datepicker` for date input + range filter. Native `<input type="time">` for time fields.

**Why:** Chakra v2 doesn't ship a DatePicker. `react-datepicker` is mature and small. Native time input is good enough on modern browsers — zero deps. Avoid Mantine just for dates — too heavy with Chakra already loaded.

**Lands in:** [frontend.md](frontend.md) Tech Stack.

---

## 16. TanStack Query cache invalidation strategy

**Recommendation:** Document a per-mutation invalidation map. Examples:

- `StartSession` / `EndSession` / `EditSession` / `DeleteSession` → invalidate `['daily-log', 'today']`, `['weekly-summary']`
- `AddManualSession` → invalidate `['daily-log', date]`, `['weekly-summary']`, `['logs']` if date is in current logs query
- `MarkComplete` / `ReopenLog` → invalidate `['daily-log', date]`, `['logs']`

**Why:** Without a documented map, invalidation gets forgotten and stale UI bugs accumulate.

**Lands in:** [frontend.md](frontend.md) UI Mutation Behavior.

---

## 17. Optimistic updates

**Recommendation:** Yes for Start Session and End Session. Skip for everything else.

**Why:** Live timer must feel instant. Server response is fast enough for the rest. Don't pay optimistic-update complexity tax where users won't notice.

**Lands in:** [frontend.md](frontend.md) UI Mutation Behavior.

---

## 18. SheetJS lazy load

**Recommendation:** `const xlsx = await import('xlsx')` inside the Export button click handler.

**Why:** SheetJS is ~1MB. Don't ship it to users who never click Export.

**Lands in:** [frontend.md](frontend.md) Excel Export section.

---

## 19. Logout cache cleanup

**Recommendation:** `queryClient.clear()` after logout API succeeds, then redirect to `/login`. One line.

**Why:** Clearing the cookie isn't enough — TanStack Query still has cached `/me`. Cache leak between users on shared devices.

**Lands in:** [frontend.md](frontend.md) UI Mutation Behavior.

---

## 20. JWT expiry handling

**Recommendation:** Add a TanStack Query `onError` global handler: if any query/mutation returns 401, `queryClient.clear()` then redirect to `/login`. No silent refresh for MVP.

**Why:** No refresh token flow needed. UX of "logged out mid-session" once a week is acceptable for a personal app.

**Lands in:** [frontend.md](frontend.md) UI Mutation Behavior.

---

# Deployment

## 21. Migrations on deploy

**Recommendation:** Separate step in GitHub Actions before app deploy. `dotnet ef database update` against Neon prod, then deploy. If migration fails, app deploy doesn't run.

**Why:** Running migrations on app startup is risky if the migration fails — app doesn't boot, prod is down. Pre-deploy migration step is the standard ASP.NET pattern.

**Lands in:** [infrastructure.md](infrastructure.md) deployment notes.

---

## 22. Env vars checklist (.env.example)

**Recommendation:** Add `.env.example` to repo root listing required keys with placeholder values.

Required keys:
- `ConnectionStrings__Default`
- `Jwt__Secret`
- `Jwt__Issuer`
- `Resend__ApiKey`
- `Resend__FromEmail`
- `Cors__AllowedOrigins__0`
- `Frontend__BaseUrl`

**Why:** Onboarding the next environment (or yourself in 6 months) takes 5 min instead of an hour of trial and error.

**Lands in:** [infrastructure.md](infrastructure.md) deployment notes.

---

## 23. F1 deploy downtime

**Recommendation:** Accept ~30s downtime per deploy. Document as known limitation.

**Why:** F1 has no deployment slots. Personal app, brief downtime is fine. Mitigation when annoyed: upgrade to B1 (gets deployment slots).

**Lands in:** [infrastructure.md](infrastructure.md) Backend Hosting section.

---

## 24. Resend "from" address

**Recommendation:** Use `onboarding@resend.dev` until a custom domain is added. When domain is added, switch to `noreply@yourdomain.com`.

**Why:** Don't block on domain verification for MVP. Real users will see `onboarding@resend.dev` as the sender — a bit ugly but acceptable for personal use.

**Lands in:** [infrastructure.md](infrastructure.md) Email section.

---

## 25. Azure region

**Recommendation:** Southeast Asia (Singapore) for both backend (F1) and frontend (SWA).

**Why:** Closest Azure region to Philippines. ~30-50ms latency vs ~200ms+ from US/Europe regions.

**Lands in:** [infrastructure.md](infrastructure.md) deployment notes.

---

# Workflow

When you decide each item:

1. Pick yes/no/different on the recommendation
2. Move the decision into the listed target doc, with the same reasoning
3. Delete the entry from this file
4. When the file is empty, delete the file itself

If you change your mind on something already moved, edit the target doc directly — this file is for the initial pass only.
