# Frontend — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Tech Stack

## Frontend

Vite + React + TypeScript

## UI

Chakra UI.

**Theming:**

- Custom theme defined in `src/lib/theme.ts`
- Single `brand` color scale with all 50-900 shades — components reference `colorScheme="brand"` so the palette can be swapped in one file
- Initial palette: teal (Chakra's built-in teal scale, copied into `brand`). May change later — utilitarian app, no fixed brand identity yet.
- Dark mode: enabled via Chakra's `ColorModeScript` and `useColorMode`. Defaults to `system` (follows OS preference). User can override in Settings → Theme: Light / Dark / System.

## Routing

TanStack Router — file-based, fully type-safe routes

## Tables

TanStack Table

## Server State / Data Fetching

TanStack Query

## Forms and Validation

React Hook Form + Zod + @hookform/resolvers/zod

Zod schemas are the single source of truth for frontend validation. Place all schemas in `src/lib/validations/`. The backend has its own validation in C# using FluentValidation (see [backend.md](backend.md)) — Zod is for the frontend only.

## Icons

Lucide React — icon library used throughout the UI (edit, delete, session status, navigation, etc.)

## Excel Export

SheetJS (`xlsx`) — client-side `.xlsx` file generation, no server endpoint required

## Date / Time

date-fns + date-fns-tz — functional, tree-shakeable date library with timezone support. Used for formatting session times, calculating durations, grouping by date for weekly summaries, and resolving "today" in the user's timezone (per Rule 0 in `data-model.md`).

## Backend

C# ASP.NET Core — REST API. See [infrastructure.md](infrastructure.md) for hosting details.

## Database

PostgreSQL on Neon. See [data-model.md](data-model.md) for schema.

## Auth

Email/password for MVP. JWT issued by the backend, stored in an HTTP-only cookie. Google SSO post-MVP.

## Hosting

Azure Static Web Apps — frontend only. Backend hosted separately (Azure App Service F1). See [infrastructure.md](infrastructure.md).

---

# Routes

TanStack Router file-based structure:

```
src/routes/
  __root.tsx
  _auth/
    _auth.tsx          ← Auth layout
    login.tsx          → /login
    register.tsx       → /register
    forgot-password.tsx → /forgot-password
  _app/
    _app.tsx           ← App layout
    index.tsx          → / (Today's Log)
    logs/
      index.tsx        → /logs (Logs / History)
      $date.tsx        → /logs/$date (Daily Log Detail, e.g. /logs/2026-04-30)
    settings.tsx       → /settings
    reports.tsx        → /reports (post-MVP, not built yet)
```

Unauthenticated users are redirected to `/login`.  
Authenticated users visiting `/login` are redirected to `/`.

---

# Layouts

The app has two root layouts:

## Auth Layout (`_auth.tsx`)

Used by: `/login`, `/register`, `/forgot-password`

- No navigation
- Centered card on a plain background
- Max width ~400px

## App Layout (`_app.tsx`)

Used by: `/`, `/logs`, `/logs/$date`, `/settings`

- Fixed left sidebar with navigation links:
  - Today → `/`
  - Logs → `/logs`
  - Reports → `/reports` (post-MVP, hidden for now)
  - Settings → `/settings`
- User menu at the bottom of the sidebar: shows user name, logout action
- Main content area: centered, max width ~720px, padded

On smaller screens the sidebar collapses to a top navigation bar.

---

# Page Layout Diagrams

## App Shell

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌───────────────────────────────┐   │
│  │          │  │                               │   │
│  │  Today   │  │       Main Content            │   │
│  │  Logs    │  │       max-width 680px         │   │
│  │  Settings│  │       centered                │   │
│  │          │  │                               │   │
│  │──────────│  │                               │   │
│  │  User    │  │                               │   │
│  │  Logout  │  │                               │   │
│  └──────────┘  └───────────────────────────────┘   │
│  240px fixed                                        │
└─────────────────────────────────────────────────────┘
```

---

## Today Page

```
┌─────────────────────────────┐
│  Thursday, April 30 2026    │  ← date + status badge inline
│  Draft          6h 30m      │  ← status left, total right
└─────────────────────────────┘

┌─────────────────────────────┐
│  🟢 Active Session           │  ← highlighted card, only if active
│  Started 2:00 PM · Remote   │
│  01:24:37  ←  live timer    │
│                  [End Session] │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Sessions                   │
│  ─────────────────────────  │
│  8:30 AM – 12:00 PM         │
│  Office · 3h 30m      ✎ 🗑 │
│  ─────────────────────────  │
│  1:30 PM – 4:30 PM          │
│  Remote · 3h 00m      ✎ 🗑 │
└─────────────────────────────┘

  [Start Session]  [Add Manually]      [Mark Complete]

┌─────────────────────────────┐
│  Daily Note                 │
│  Click to add a note...     │  ← inline editable placeholder
└─────────────────────────────┘

┌─────────────────────────────┐
│  This Week          29h 45m │  ← week total right-aligned
│  ─────────────────────────  │
│  Mon  7h 30m  ██████░░      │
│  Tue  8h 00m  ███████░      │
│  Wed  6h 45m  █████░░░      │
│  Thu  6h 30m  █████░░░      │
│  Fri  0h 00m  ░░░░░░░░      │
└─────────────────────────────┘
```

---

## Logs Page

```
┌─────────────────────────────┐
│  Logs                       │
│  [Date Range ▼]  [Status ▼] │  ← filters inline
│                [Export Excel]│
└─────────────────────────────┘

April 2026
┌─────────────────────────────┐
│  Apr 30  6h 30m   Draft   → │
│  Apr 29  8h 00m   Complete →│
│  Apr 28  6h 45m   Complete →│
└─────────────────────────────┘
```

---

## Daily Log Detail Page

```
┌─────────────────────────────┐
│  ← Back to Logs             │
│  Wednesday, April 29        │
│  Complete       8h 00m      │
└─────────────────────────────┘

┌─────────────────────────────┐
│  Sessions                   │
│  ─────────────────────────  │
│  8:00 AM – 12:00 PM         │
│  Office · 4h 00m      ✎ 🗑 │
│  ─────────────────────────  │
│  1:00 PM – 5:00 PM          │
│  Remote · 4h 00m      ✎ 🗑 │
└─────────────────────────────┘

  [Reopen Log]

┌─────────────────────────────┐
│  Daily Note                 │
│  Had a split schedule today │
└─────────────────────────────┘
```

---

## Auth Pages

```
        ┌───────────────────┐
        │      Worklogr     │
        │                   │
        │  Email            │
        │  [_____________]  │
        │  Password         │
        │  [_____________]  │
        │                   │
        │  [   Log In     ] │
        │                   │
        │  Register · Forgot│
        └───────────────────┘
```

---

# Chakra UI Components

## Primary — will definitely use

- `Box`, `VStack`, `HStack`, `Stack`, `Container` — layout throughout
- `Card`, `CardHeader`, `CardBody` — daily log card, active session card, session items, weekly summary
- `Button` — all actions, using built-in `isLoading` and `isDisabled` props
- `IconButton` — edit and delete icons on every session row
- `Badge` — Draft / Complete status, location type
- `Progress` — weekly summary bar indicators per day
- `FormControl`, `FormLabel`, `FormErrorMessage` — all RHF-connected forms
- `Input`, `Textarea`, `Select` — session form fields, note fields, and Logs page filters
- `DatePicker` — date range filter on the Logs page and date field in the manual session form; supports range selection, min/max constraints, and locale-aware formatting
- `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter` — Add/Edit Session
- `AlertDialog` — Delete confirmation (Chakra's dedicated component for destructive actions)
- `Alert`, `AlertIcon` — inline error messages
- `Spinner` — inside buttons during mutation
- `Link` — Back to Logs navigation on the Daily Log Detail page
- `Text`, `Heading` — typography throughout
- `Divider` — section separators inside cards
- `Collapse` — inline Start Session form expanding below the button
- `Menu`, `MenuButton`, `MenuList`, `MenuItem` — user account menu at the bottom of the sidebar

## Possible — likely useful

- `Stat`, `StatLabel`, `StatNumber` — total hours and weekly total display
- `useToast` — lightweight success feedback without layout disruption
- `Tooltip` — hints on icon-only buttons (edit, delete)
- `Skeleton` — initial page load placeholders without layout shift
- `Tag` — alternative to Badge for location type

---

# React Components

Suggested component structure:

- `TodayPage`
- `DailyLogCard`
- `ActiveSessionCard`
- `SessionList`
- `SessionItem`
- `SessionFormModal`
- `DailyLogStatusBadge`
- `WeeklySummaryCard`
- `LogsPage`
- `LogHistoryList`
- `ExportButton`
- `ConfirmDeleteDialog`
- `LocationSelect`
- `TimeInput`
- `DateInput`

---

# Form Conventions

Consistent input choices and labels across all forms.

## Input type by option count

| Number of choices | Input type | Why |
|-------------------|------------|-----|
| 2–7 options | Radio buttons | Choices visible, no comparison cost |
| 8+ options | Dropdown / Select | Saves vertical space, scanning longer lists in a dropdown is acceptable |
| Multi-select (any count) | Chips | Selections stay visible, lower interaction cost than multi-select dropdowns |

Worklogr application:

- Location (Office / Remote / Other) → 3 options → **radio buttons**
- Default location in Settings (Office / Remote / Other / None) → 4 → **radio buttons**
- Week starts on (Monday / Sunday) → 2 → **radio buttons**
- Theme (System / Light / Dark) → 3 → **radio buttons**
- Status filter on Logs (All / Draft / Complete) → 3 → **radio buttons** or segmented control
- Timezone → 400+ IANA values → **dropdown** with search

## Labels

Write labels as intent-driven questions, not nouns.

- "What's the priority?" not "Priority"
- "Where did you work?" not "Location"
- "When did the session start?" not "Start Time"

Removes ambiguity at zero cost — the user reads the form as a conversation, not a list of fields. Especially important for personal apps where the form is a conversation with yourself.

Forms with many fields can group questions under section headings to keep the question style readable.

---

# Test IDs

All interactive elements and list containers carry a `data-testid` attribute so future E2E tests have stable selectors. No E2E tests in the MVP, but adding test IDs upfront avoids retrofitting later.

## Where to add `data-testid`

- All interactive elements: buttons, links, form inputs, selects, toggles
- All list containers: `<ul>`, `<div>` wrapping repeated items
- Individual list items, with the entity ID as a suffix
- All modals and dialogs
- Status indicators (badges, banners, counters)

Skip purely structural elements (layout wrappers, grid cells, decorative containers). Only add `data-testid` where a test would interact or assert.

## Naming convention

`kebab-case`, feature-prefixed, action-based. Format: `feature-element-type`.

Examples (singletons, finite items, small lists):

```
today-start-session-btn
today-end-session-btn
today-mark-complete-btn

session-list
session-item-{sessionId}
session-edit-btn-{sessionId}
session-delete-btn-{sessionId}

session-form-modal
session-form-start-time-input
session-form-end-time-input
session-form-location-select
session-form-save-btn
session-form-cancel-btn

login-email-input
login-password-input
login-submit-btn

logs-date-range-filter
logs-status-filter
logs-export-btn

daily-log-status-badge
weekly-summary-card
weekly-summary-total

menu-item-today
menu-item-logs
menu-item-settings
menu-item-logout
```

## List item granularity

Two patterns depending on list size:

**Small dynamic lists (≤ ~20 items):** unique `data-testid` per item with ID suffix.

```jsx
<ul data-testid="session-list">
  {sessions.map(s =>
    <li data-testid={`session-item-${s.id}`}>...</li>
  )}
</ul>
```

This applies to MVP worklogr lists — sessions per day (typically 1-5), weekly summary rows (7), settings options.

**Large lists or grids (100+ items):** container `data-testid` + value-based `data-` attribute on each item.

```jsx
<div data-testid="calendar">
  {days.map(d =>
    <button data-testid="calendar-day" data-date={d.iso}>{d.day}</button>
  )}
</div>
```

E2E selector: `[data-testid="calendar-day"][data-date="2026-04-30"]`.

This pattern is for post-MVP features like a calendar grid or year heatmap. Avoids polluting the DOM with hundreds of unique IDs.

## Why this convention

- `feature-element-type` reads naturally and groups related IDs
- `-{id}` suffix lets E2E tests target specific list items in small lists
- Container + `data-` attribute scales to large lists without DOM clutter
- Avoids inline copy ("save", "cancel") that can change without breaking tests
- Stable across refactors — only changes when the feature itself changes

---

# UI Mutation Behavior

When the user triggers a mutation (Start Session, End Session, Save, Delete, Mark Complete, Reopen):

- Disable only the triggering button immediately and show a loading indicator inside it (e.g. a spinner replacing the label) so the user knows the action is in progress. Leave form fields editable. Note: if the user edits a field after hitting Save and the mutation succeeds, those edits are discarded when the modal closes — this is intentional and expected behavior.
- Do not show a full-page or section loading state. The layout must not shift, reflow, or cause scroll or focus changes while the request is in flight.
- On success, update the affected data in place. The page should not remount or reset scroll position.
- On error, re-enable the button and show an inline error message near the action. Do not lose form input.

For modals (Add Session, Edit Session, Delete confirmation):

- On success, close the modal and update the underlying page in place.
- On error, keep the modal open and show the error inline. Do not close or reset the form.

The user should feel like the action happened instantly — not like the page is refreshing.
