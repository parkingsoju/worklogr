# Product — Personal Work Session Tracker

## Related Files

- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Product Summary

A personal work-session tracker for flexible workers in trust-based environments.

The system helps users record, review, and update their own daily work logs without functioning as a strict attendance, monitoring, or company-controlled system.

The system tracks **work sessions**, not just one attendance record per day.

A user may work in the office in the morning, remotely in the afternoon, and add another session later in the day.

---

# Problem Statement

Flexible workers in trust-based environments need a simple way to personally track multiple work sessions across different locations.

Existing spreadsheet-based tracking is manual, error-prone, and poorly suited for split workdays where a person may work in the office in the morning and remotely later in the day.

The system should help users record, review, and update their own daily work logs accurately without functioning as a strict attendance or monitoring tool.

---

# MVP Goal

The MVP should help the user answer three main questions:

1. What sessions did I work today?
2. How many total hours did I work today?
3. Have I reviewed and completed today's log?

Everything in the MVP should support those three questions.

---

# Product Positioning

This is not an attendance monitoring system.

This is a personal tracker for honest self-reporting.

Use language like:

- Work Session
- Today's Log
- Daily Log
- Mark Today as Complete
- Reopen Log
- Add Session
- Edit Session
- Work Location

Avoid language like:

- Clock In
- Clock Out
- Submit Attendance
- Employee Monitoring
- Approval
- Late
- Undertime
- Violation
- Payroll
- Manager Review

---

# Core Concept

The product has two main concepts:

Daily Log
  - Work Session 1
  - Work Session 2
  - Work Session 3

A **Daily Log** represents one calendar day.

A **Work Session** represents one block of work.

Example:

Daily Log: April 30, 2026  
Status: Draft  
Total: 7h 30m  

Sessions:
1. 8:30 AM - 12:00 PM | Office
2. 1:30 PM - 4:30 PM | Remote
3. 8:00 PM - 9:00 PM | Remote

---

# Important Product Decision

The user should not manually create a daily log.

A daily log should be created automatically when the user starts or manually adds the first session for that date.

User action:
- Start Session
- Add Session Manually

System behavior:
- Create today's daily log automatically if it does not exist
- Add the session under that daily log
- Recalculate total worked time

---

# Core MVP Flow

## Normal Real-Time Flow

User opens app  
→ sees Today's Log  
→ clicks Start Session  
→ selects location  
→ session starts  
→ clicks End Session  
→ session is added to today's log  
→ total hours update  
→ user marks today as complete  

## Split Workday Flow

User works in office in the morning  
→ starts Office session  
→ ends Office session  
→ later starts Remote session  
→ ends Remote session  
→ both sessions appear under the same daily log  

## Forgotten Session Flow

User forgot to start tracking  
→ opens Today's Log  
→ clicks Add Session Manually  
→ enters date, start time, end time, location  
→ saves session  
→ daily total updates  

## Edit Flow

User notices a mistake  
→ opens daily log  
→ edits session  
→ saves changes  
→ total hours recalculate  

## Completed Log Edit Flow

User marked a day complete but needs to fix it  
→ opens completed daily log  
→ clicks Reopen Log  
→ log status changes to Draft  
→ user edits/adds/deletes sessions  
→ user marks it complete again  

---

# MVP Features

## 1. User Account

Each user should have private personal records.

Minimum features:

- Register
- Login
- Logout
- View current user

User fields:

- id
- name
- email
- passwordHash
- timezone
- createdAt
- updatedAt

For MVP, email/password authentication is enough.

Google SSO is post-MVP — added as a second sign-in method later.

---

## 2. Today's Log

The main page of the app should be Today's Log.

It should show:

- Today's date
- Daily log status
- Total worked time
- Active session, if any
- Completed sessions
- Daily note
- Weekly summary card
- Start Session button
- End Session button, if there is an active session
- Add Session Manually button
- Mark Today as Complete button
- Reopen Log button, if the log is complete

The weekly summary card shows the current week's daily totals and weekly total. It sits below the session list so the user sees their week at a glance without navigating away.

Empty state example:

Today  
April 30, 2026  

No work sessions recorded yet.

Actions:
- Start Session
- Add Session Manually

With sessions example:

Today  
April 30, 2026  

Status: Draft  
Total: 6h 30m  

Completed Sessions:
- 8:30 AM - 12:00 PM | Office | 3h 30m
- 1:30 PM - 4:30 PM | Remote | 3h 00m

Actions:
- Start Session
- Add Session Manually
- Mark Today as Complete

This Week

- Monday: 6h 30m
- Tuesday: 8h 00m
- Wednesday: 6h 45m
- Thursday: 0h 00m
- Friday: 0h 00m

Weekly Total: 21h 15m

---

## 3. Start Session

The user should be able to start a real-time work session.

Button:

Start Session

When clicked, expand an inline form below the button (not a modal) asking for:

- Location: Office / Remote / Other
- Optional session note

When saved:

- Create a session with startTime = current time
- endTime should be null
- This session becomes the active session
- Today's daily log is created automatically if needed

Important rule:

A user can only have one active session at a time.

If the user already has an active session:

- Hide Start Session
- Or disable Start Session
- Show End Session instead

---

## 4. End Session

If the user has an active session, show:

End Session

When clicked:

- Set endTime = current time
- Calculate duration
- Move it into the completed sessions list
- Update today's total hours

The user should still be able to edit the end time later.

This keeps the system trust-based and flexible.

---

## 5. Add Session Manually

Manual session entry is required for the MVP because users may forget to start tracking.

Form fields:

- Date
- Start time
- End time
- Location
- Optional session note

Validation:

- Date is required
- Start time is required
- End time is required
- End time must be after start time
- Location is required
- Session must not overlap another session on the same day

For MVP, overlapping sessions should be blocked to keep totals clean.

Example error:

This session overlaps with an existing session.

---

## 6. Edit Session

The user should be able to edit any completed session.

Editable fields:

- Start time
- End time
- Location
- Session note

Date is not editable. A session belongs to the daily log it was created under. If the user needs a session on a different date, they should delete it and add a new one manually.

When edited:

- Save changes
- Recalculate total hours for the affected daily log
- Update updatedAt

If the daily log is complete, the user should reopen it first before editing.

---

## 7. Delete Session

The user should be able to delete a session, including an active one.

Flow:

- User clicks Delete
- Confirmation dialog appears
- User confirms
- Session is removed
- Daily total recalculates

Confirmation message for a completed session:

Delete this work session?  
This will update your daily total.

Confirmation message for an active session:

Cancel this active session?  
Your current work time will not be saved.

---

## 8. Daily Log Status

Daily logs should have two statuses:

- Draft
- Complete

## Draft

Means the daily log is still being edited or has not been reviewed.

## Complete

Means the user reviewed the day and considers the log accurate.

Complete does not mean permanently locked.

The user can reopen it.

Status flow:

Draft → Complete  
Complete → Draft

Actions:

- Mark Today as Complete
- Reopen Log

Rules:

- A completed log can still be reopened
- Editing a completed log requires reopening it first
- Reopening changes the status back to Draft
- A daily log cannot be marked complete if it has an active session

Error when trying to complete with an active session:

You have an active session. End it before marking the day complete.

---

## 9. Daily Log Detail View

The user should be able to view a specific day.

Example route:

/logs/2026-04-30

The page should show:

- Date
- Status
- Total worked time
- Session list
- Daily note
- Actions

Example:

April 30, 2026  

Status: Complete  
Total: 7h 30m  

Sessions:
- 8:30 AM - 12:00 PM | Office | 3h 30m
- 1:30 PM - 4:30 PM | Remote | 3h 00m
- 8:00 PM - 9:00 PM | Remote | 1h 00m

Daily Note:
Worked split schedule today.

Actions:
- Reopen Log

If the log is Draft:

Actions:
- Add Session
- Edit Sessions
- Mark Complete

---

## 10. Daily Note

Each daily log can have an optional daily note.

Example:

Had a split schedule today. Worked remotely in the afternoon.

Editing behavior:

The daily note uses inline editing. It is always visible on the Today page and the Daily Log Detail page. The user clicks the note area to activate a textarea. A small Save button appears below it. On save, the textarea collapses back to plain text. No modal.

For MVP:

- Plain text only
- Optional
- No rich text
- No attachments
- No tags

---

## 11. Session Note

Each work session can have an optional note.

Examples:

- Morning office work
- Client fixes
- Remote bug fixing
- Documentation updates

Editing behavior:

The session note uses inline editing directly on the session row. The user clicks the note area (or an empty placeholder if no note exists) to activate a textarea. A small Save button appears. On save, it collapses back to plain text. No modal.

For MVP:

- Plain text only
- Optional

---

## 12. Location Type

Each session should have a location type.

MVP values:

- Office
- Remote
- Other

For MVP, custom locations are not required.

If the user selects Other, they can explain in the session note.

Example:

Location: Other  
Note: Worked from cafe

---

## 13. Logs / History Page

The user needs a way to view past daily logs.

The Logs page should show a list grouped by date.

Example:

April 2026

- Apr 30 | 7h 30m | Complete
- Apr 29 | 6h 45m | Draft
- Apr 28 | 8h 00m | Complete

Each row should open the daily log detail view.

MVP filters:

- Date range
- Status: All / Draft / Complete

Do not add advanced analytics yet.

---

## 14. Weekly Summary

The weekly summary appears on the Today page below the session list.

It shows the current week's daily totals and weekly total so the user can see their week at a glance without navigating to the Logs page.

Example:

This Week

- Monday: 7h 30m
- Tuesday: 8h 00m
- Wednesday: 6h 45m
- Thursday: 7h 30m
- Friday: 0h 00m

Weekly Total: 29h 45m

For MVP:

- Simple totals only
- No charts required
- No productivity scoring

---

## 15. Export to Excel

Since the product replaces spreadsheet tracking, Excel export is a core MVP feature.

The user should be able to export sessions by date range as an `.xlsx` file.

Export is handled entirely client-side using SheetJS (`xlsx` package). No server endpoint required — the file downloads directly from the browser.

Excel columns:

- Date
- Start Time
- End Time
- Duration
- Location
- Session Note
- Daily Status
- Daily Note

The exported file should have a single sheet named "Work Sessions".

Filename format:

worklogr-2026-04-01-to-2026-04-30.xlsx

This gives users confidence that their data is not trapped inside the app, and puts it directly into a format they can use.

---

# MVP Screens

## 1. Login Page

Fields:

- Email
- Password

Actions:

- Log In
- Go to Register
- Forgot Password

---

## 2. Forgot Password Page

Fields:

- Email

Actions:

- Send Reset Link
- Go to Login

Behavior:

- User submits their email
- Backend sends a password reset link
- Always show the same success message regardless of whether the email exists:

If an account exists for this email, a reset link has been sent.

---

## 3. Register Page

Fields:

- Name
- Email
- Password
- Confirm Password

Actions:

- Create Account
- Go to Login

---

## 4. Today Page

Main page after login.

Sections:

- Date
- Status
- Total hours
- Active session
- Completed sessions
- Daily note
- Weekly summary
- Actions

Actions:

- Start Session
- End Session
- Add Session Manually
- Mark Today as Complete
- Reopen Log

---

## 5. Add/Edit Session Modal

Fields:

- Date
- Start time
- End time
- Location
- Note

Actions:

- Save
- Cancel

Validation:

- Required fields
- End time after start time
- No overlapping sessions

---

## 6. Daily Log Detail Page

Shows one specific daily log.

Sections:

- Date
- Status
- Total hours
- Session list
- Daily note
- Actions

Actions:

- Add Session
- Edit Session
- Delete Session
- Mark Complete
- Reopen Log

---

## 7. Logs / History Page

Shows previous daily logs.

Sections:

- Date range filter
- Status filter
- Log list
- Export Excel button

---

## 8. Settings Page

Simple MVP settings.

Fields:

- Name
- Timezone
- Default location
- Week starts on
- Theme

Default location options:

- Office
- Remote
- Other
- None

Week starts on options:

- Monday (default)
- Sunday

Theme options:

- System (default — follows OS preference)
- Light
- Dark

---

# What Is Not Included in the MVP

Do not include these yet:

- Company accounts
- Organizations
- Admin dashboard
- Manager approval
- Employee invites
- Payroll computation
- GPS tracking
- Screenshot monitoring
- Activity monitoring
- Productivity scoring
- Overtime rules
- Leave management
- Shift scheduling
- Biometric attendance
- Complex analytics
- Calendar integrations
- Mobile app
- Notifications
- Approval workflows
- Audit logs

These features would shift the product away from being a simple personal tracker.

---

# MVP Success Criteria

The MVP is successful if a user can:

- Create an account
- Log in
- View today's daily log
- Start a work session
- End a work session
- Add a forgotten session manually
- Edit a session
- Delete a session
- See total worked time for the day
- Add a daily note
- Mark the day as complete
- Reopen a completed day
- View previous logs
- See weekly totals
- Export records to Excel

---

# MVP in One Sentence

A user can track multiple work sessions per day, review them inside an automatically created daily log, mark the day as complete, reopen it if needed, and export their personal work records.

---

# Final MVP Scope

Included:

- Authentication
- Today's Log
- Start Session
- End Session
- Manual Session Entry
- Edit Session
- Delete Session
- Daily Log Status: Draft / Complete
- Reopen Completed Log
- Daily Note
- Session Note
- Location: Office / Remote / Other
- Log History
- Weekly Summary
- Excel Export

Excluded:

- Company management
- Manager approvals
- Monitoring
- Payroll
- GPS
- Screenshots
- Complex analytics
- Productivity scoring
- Shift scheduling
- Leave management

---

# Core Product Model

Daily Log = one day's reviewed work record

Work Session = one block of actual work

Daily logs are created automatically.

Work sessions are the source of truth.

The product should feel personal, flexible, and trust-based.
