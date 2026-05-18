# Data Model — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Data Model

For this MVP, use a real DailyLog table because the daily log has its own data:

- status
- daily note
- completedAt
- updatedAt

Work sessions are still the source of truth for total hours.

---

## User

Fields:

- id
- name
- email
- passwordHash
- timezone
- createdAt
- updatedAt

---

## DailyLog

Fields:

- id
- userId
- date
- status
- note
- completedAt
- createdAt
- updatedAt

Status values:

- Draft
- Complete

Important constraint:

One DailyLog per user per date.

Unique constraint:

userId + date

---

## PasswordResetToken

Fields:

- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt

Important:

- `tokenHash` stores the SHA-256 hash of the raw token, not the raw token itself. The raw token is only ever in the email link.
- `usedAt` is null until the token is consumed. Once set, the token is single-use.
- `expiresAt` is set to `createdAt + 1 hour`.
- Cleanup of expired/used tokens is not required for MVP — they accumulate harmlessly. Add a background sweep later if the table grows.

Lookup pattern:

- User clicks reset link → backend hashes the raw token → finds the row by `tokenHash` → checks `expiresAt > now` AND `usedAt IS NULL`.

---

## WorkSession

Fields:

- id
- dailyLogId
- userId
- startTime
- endTime
- locationType
- note
- createdAt
- updatedAt

Location type values:

- Office
- Remote
- Other

Important:

endTime can be null.

If endTime is null, the session is active.

---

# Business Rules

## Rule 0: All Timestamps Are UTC

All timestamps are stored in UTC.

The frontend converts to the user's local timezone (from User.timezone) for display.

When determining which daily log a session belongs to, the backend must use the user's local date, not the UTC date.

Example: a user in UTC+8 starting a session at 11:00 PM local time is still on today's date for them, even though the UTC timestamp is the next day.

---

## Rule 1: Daily Log Is Automatic

The user should not manually create a daily log.

If the user starts or adds the first session for a date, the system automatically creates the daily log for that date using an upsert — if a daily log already exists for that user and date, the existing one is used.

---

## Rule 2: Sessions Are the Source of Truth

Daily total should be calculated from work sessions.

Daily total = sum of all completed session durations

Duration is computed by the frontend from endTime - startTime. Active session duration is shown as a live ticking timer.

Do not manually store daily total in the MVP unless needed for performance later.

---

## Rule 3: Only One Active Session

A user can only have one active session at a time.

Active session = work session where endTime is null.

If an active session exists, the user cannot start another session.

Before starting a new session, the backend also checks that the new session's start time does not overlap any existing completed session on that date.

---

## Rule 4: Completed Logs Can Be Reopened

A completed daily log is not permanently locked.

The user can reopen it.

Flow:

Complete → Reopen Log → Draft

---

## Rule 5: Editing a Completed Log Requires Reopening

If a daily log is complete, editing should not happen silently.

Show:

This log is marked complete. Reopen it to make changes.

Action:

Reopen Log

---

## Rule 6: No Overlapping Sessions

For MVP, block overlapping sessions on the same day.

The overlap check is a single shared backend function used by all write paths: Start Session, Add Manual Session, and Edit Session.

When editing an existing session, the check excludes the session being edited so it does not conflict with itself.

Invalid example:

Session 1: 9:00 AM - 12:00 PM  
Session 2: 11:00 AM - 2:00 PM  

Error:

This session overlaps with an existing session.

---

## Rule 7: Breaks Are Represented by Separate Sessions

Do not add pause/resume or break tracking in the MVP.

Example:

Work: 9:00 AM - 12:00 PM  
Break: 12:00 PM - 1:00 PM  
Work: 1:00 PM - 5:00 PM  

Should be represented as:

Session 1: 9:00 AM - 12:00 PM  
Session 2: 1:00 PM - 5:00 PM  

---

## Rule 8: Manual Edits Are Allowed

Because this is a trust-based personal tracker, users should be able to correct mistakes.

They can:

- Add forgotten sessions
- Edit times
- Delete incorrect sessions
- Reopen completed logs
- Mark logs complete again

---

## Rule 9: Cannot Complete a Log With an Active Session

A daily log cannot be marked complete if any of its sessions has no endTime.

The backend rejects the request and returns:

You have an active session. End it before marking the day complete.

---

## Rule 10: Stale Active Session Recovery

When the user opens the app, the backend checks if they have an active session from a previous date.

If found, the app prompts the user before showing Today's Log:

You have an unfinished session from [date] starting at [startTime].

Actions:

- End it (user sets an end time manually)
- Delete it

---

## Rule 11: Timestamps Are Server-Stamped

completedAt is set server-side when the user marks a log complete. The client never sends this value.

updatedAt on both DailyLog and WorkSession is automatically updated by a database trigger on every update. The client never sends this value.
