---
name: worklogr-slice
description: >-
  Scaffold a feature in the worklogr app, end-to-end or one side at a time —
  the ASP.NET backend vertical slice (command/query + MediatR handler +
  FluentValidation validator + endpoint + xUnit test) and/or the matching React
  frontend (TanStack Router route, TanStack Query hook, Zod schema, Chakra
  components with data-testid). USE THIS whenever the user adds or wires up any
  feature in worklogr: "add an endpoint", "new feature", "scaffold a slice",
  "build the StartSession handler", "wire up the Today page", "create the add
  session form", or any work under api/Features/ or web/src/. Even if they name
  just one piece — only the validator, only the query hook — reach for this so
  the whole feature stays consistent with the established pattern.
---

# worklogr feature scaffold

worklogr is built as **vertical slices**: a feature is a self-contained unit, end to end. The backend is ASP.NET + MediatR + EF Core (no repository/service layer — handlers hit `AppDbContext` directly). The frontend is Vite + React + Chakra + TanStack Router/Query + React Hook Form + Zod.

This skill keeps a new feature matching the slices already in the codebase instead of drifting. The repo's `docs/` folder is the source of truth — this skill is the operational shortcut over it.

## Step 1 — Scope the work

Decide what you're building this invocation:

- **Backend only** — a new endpoint/handler/validator under `api/Features/`.
- **Frontend only** — a route, page, form, or query hook under `web/src/`.
- **Full feature** — both, backend first (the frontend consumes its shape).

Then pin down:
- **Area + feature name** — `Auth` / `Sessions` / `Logs`, PascalCase feature (e.g. `StartSession`).
- **Route + verb** — already listed in `docs/api.md` for every MVP endpoint. Don't invent one; match it.
- **Command vs query** — writes vs reads.

## Step 2 — Read the matching reference, then scaffold

Load only the side(s) you're building — each reference has the templates and the conventions that bite:

- Backend slice → read [references/backend-slice.md](references/backend-slice.md)
- Frontend feature → read [references/frontend-feature.md](references/frontend-feature.md)

For a full feature, do backend first so the frontend Zod schema and query types match the real request/response shape.

## Step 3 — Wire it up and flag follow-ups

- Register the endpoint (map call in `Program.cs` / the area's endpoint group) or the route (file-based, TanStack Router picks it up).
- New entity or field on the backend? Tell the user to run `dotnet ef migrations add <Name>` then `dotnet ef database update`. Migrations live in `api/Migrations/`, committed to git.
- Note any test you skipped and why — worklogr tests validators and rule-heavy handlers (overlap, status transitions, daily-log auto-create); skipping those silently is a gap.

## Conventions that span both sides

- **Don't invent routes, rules, or fields.** `docs/api.md` lists every MVP endpoint and its validation rules one-to-one with the `*Validator.cs` classes. `docs/data-model.md` has the business rules. Match them; ask if something's genuinely missing.
- **Two validation layers, on purpose.** FluentValidation (C#) is the real gate; Zod (frontend) is for UX. They mirror the same rules but aren't shared code — keep both in sync when a rule changes.
- **Trust-based product language.** Labels and messages use "Work Session", "Today's Log", "Mark Complete", "Reopen" — never "Clock In", "Attendance", "Late", "Violation", "Approval". This is a personal tracker, not a monitoring tool; surveillance vocabulary breaks the product's whole positioning.
- **Ownership is a security boundary.** Every session/log mutation must verify the row belongs to the current user. Every session rule in `docs/api.md` opens with "must belong to the current user" — skipping it is a data-leak bug, not a nicety.
