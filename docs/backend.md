# Backend — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [frontend.md](frontend.md) — Tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Tech Stack

## Language & Framework

C# with ASP.NET Core. Targeting the latest LTS (.NET 8+).

## ORM

Entity Framework Core with `Npgsql.EntityFrameworkCore.PostgreSQL` provider.

Picked over Dapper / raw Npgsql for DX, migrations, and learning value — EF Core is the standard ASP.NET data access pattern.

No repository layer. `DbContext` already abstracts data access; adding repositories on top is over-engineering for this scope.

## Migrations

EF Core migrations (`dotnet ef migrations add` / `dotnet ef database update`).

Migration files live in `api/Migrations/` and are committed to git. Standard ASP.NET workflow, no third-party tool like DbUp.

## Validation

FluentValidation (NuGet).

Picked over DataAnnotations because worklogr has rules attributes can't express cleanly:

- Cross-field rules (end time after start time)
- Async DB checks (email uniqueness)
- Domain rules (no overlapping sessions on the same day)

Validators run automatically as a MediatR pipeline behavior — the request never reaches a handler if validation fails.

## Mediator

MediatR (NuGet).

Free for non-commercial use. If commercial use ever applies, swap to Wolverine, FastEndpoints, or a hand-rolled dispatcher — handler logic ports without rewrite.

## Logging

Serilog writing to console only.

- Azure App Service captures stdout and exposes it in the portal log stream
- Structured JSON output
- Code uses `ILogger<T>` (standard interface) so Serilog can be swapped without touching application code
- Other sinks (Application Insights, Seq, BetterStack) added later only when console-only logs become insufficient

## Email

Resend (`Resend.Net` NuGet or plain HTTPS calls). See [infrastructure.md](infrastructure.md) for vendor decision and fallback plan.

---

# Project Structure

Vertical Slice with MediatR. Each feature gets its own folder containing the command/query, handler, validator, and endpoint together. Controllers become 2-line dispatchers (`_mediator.Send(...)`).

Single project, no multi-project Clean Architecture split.

## Folder layout

```
api/
  Features/
    Auth/
      Login/
        LoginCommand.cs
        LoginHandler.cs
        LoginValidator.cs
        LoginEndpoint.cs
        LoginHandler.Tests.cs
      Register/
      ForgotPassword/
      ResetPassword/
    Sessions/
      StartSession/
      EndSession/
      AddManualSession/
      EditSession/
      DeleteSession/
    Logs/
      GetToday/
      GetByDate/
      GetLogs/
      MarkComplete/
      ReopenLog/
  Shared/
    Db/                  AppDbContext, entity configurations
    Entities/            User, DailyLog, WorkSession
    Auth/                JWT helpers, password hasher, current user accessor
    Email/               Resend client wrapper
    Errors/              Domain exception types
    Seeding/             DevSeeder
    Middleware/          Global exception handler, etc.
  Migrations/
  Program.cs
  appsettings.json
  appsettings.Development.json
```

Tests live next to their handlers (vertical slice principle).

---

# Auth Implementation

## MVP — email/password

- **Password hashing:** BCrypt
- **Session token:** JWT issued by the backend, stored in an HTTP-only `Secure` cookie (`SameSite=Lax`)
- **JWT lifetime:** 7 days. No refresh tokens for MVP — when the JWT expires, the user signs in again. Long enough that re-login is rare; short enough that a stolen cookie does not stay valid forever.
- **Password reset:** custom flow with single-use, time-limited tokens stored in a `PasswordResetToken` table (see [data-model.md](data-model.md)); raw token in the email link, SHA-256 hash stored in DB; tokens expire after 1 hour and become invalid after first use; reset email sent via Resend
- **Email verification:** not in MVP. Documented risk: someone could register `victim@example.com` and lock out the real owner, since forgot-password resets go to whoever owns the account in our DB. Acceptable for a personal app with a single known user; revisit if the app ever opens to public sign-ups.

Reasons MVP uses email/password instead of starting with SSO:

- Real backend learning value — BCrypt, JWT issuance and validation, password reset flow with expiring tokens, email sending
- SSO short-circuits those fundamentals
- Once email/password is built and understood, adding Google SSO is a small additive change, not a rewrite

## Post-MVP — Google SSO

Added as a second sign-in method. Each app registers its own Google OAuth client ID in Google Cloud Console and uses ASP.NET Core's built-in OAuth (`Microsoft.AspNetCore.Authentication.Google`).

Per-app OAuth (not a central identity provider) is the right choice while there is only worklogr. If a portfolio of personal apps grows past 3-4, evaluate moving to a central identity provider (IdentityServer / OpenIddict) for true SSO across them.

---

# CORS

Allow-list of specific origins (no wildcards):

- SWA production URL (e.g. `https://worklogr.azurestaticapps.net`)
- `http://localhost:5173` (Vite dev server)

`AllowCredentials()` enabled so JWT cookies work cross-origin.

Origins list lives in `appsettings.json` so prod and dev configs differ.

---

# Rate Limiting

ASP.NET Core built-in rate limiting (`Microsoft.AspNetCore.RateLimiting`) applied only to auth endpoints.

In-memory limiter (single F1 instance is fine; swap to Redis-backed limiter if scaled out later).

Limits:

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5 per IP per minute, 10 per email per hour |
| `POST /api/auth/forgot-password` | 3 per IP per hour, 1 per email per 15 minutes |
| `POST /api/auth/register` | 5 per IP per hour |
| All authenticated endpoints | No rate limit |

---

# Health Check

Single `GET /health` endpoint using `Microsoft.AspNetCore.HealthChecks` with `AddDbContextCheck<AppDbContext>()`.

- Returns `200 OK` if app is up AND Postgres is reachable
- Returns `503 Service Unavailable` otherwise
- Azure App Service is configured to ping it every minute and restart the instance if 3 consecutive checks fail
- Not exposed in the frontend — user-facing error messages handle that
- Liveness/readiness split skipped (only matters for multi-replica deployments like Kubernetes)

---

# Error Handling

Global `IExceptionHandler` (built into .NET 8+) catches unhandled exceptions, logs them via Serilog, and returns a consistent JSON shape:

```json
{ "status": 400, "message": "...", "traceId": "abc-123" }
```

Domain exception types map to specific HTTP status codes:

- `ValidationException` → 400
- `NotFoundException` → 404
- `UnauthorizedException` → 401
- `ConflictException` → 409
- All other exceptions → 500 (`Internal server error`, details hidden in prod)

The frontend's matching error handling pattern lives in [frontend.md](frontend.md) (UI Mutation Behavior + React Error Boundary).

---

# Testing

xUnit + FluentAssertions for backend unit tests. Tests co-located with handlers (e.g. `Features/Sessions/StartSession/StartSessionHandler.Tests.cs`).

**Scope for MVP:**

- Unit tests on validators and complex handlers (overlap detection, status transitions, daily log auto-create)
- No controller integration tests
- No full DB integration tests
- No frontend component tests
- No E2E

Frontend uses `data-testid` attributes (convention in [frontend.md](frontend.md)) so Playwright E2E can be added post-MVP without retrofitting selectors.

---

# Dev Seed Data

Code-based seeder using Bogus (NuGet) for realistic fake data.

- Lives at `api/Shared/Seeding/DevSeeder.cs`
- Runs on startup only when `app.Environment.IsDevelopment()` AND the database is empty (so it does not double-seed across restarts)
- Creates one test user (`test@local.dev` with a hardcoded dev password)
- Creates ~30 days of varied work sessions across mixed locations
- Never runs in production — real users start with an empty workspace
