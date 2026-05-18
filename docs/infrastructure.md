# Infrastructure — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [api.md](api.md) — API endpoints and validation rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# Repo Layout

Monorepo with two apps:

```
worklogr/
  web/    Vite + React + TypeScript frontend
  api/    ASP.NET Core backend
```

No `apps/` or `packages/` prefix and no monorepo tool (Nx, Turborepo, pnpm workspaces). The repo has two apps and no shared code, so plain folders are simpler.

**Deployment:** two GitHub Actions workflows with path filters.

- `.github/workflows/web.yml` — triggers on `web/**` changes → builds Vite → deploys to Azure SWA
- `.github/workflows/api.yml` — triggers on `api/**` changes → builds .NET → deploys to Azure F1 App Service

Path filters ensure only the changed app deploys. The Azure SWA action accepts `app_location: web`. The Azure App Service action runs `dotnet publish` from `api/`.

If shared code is ever added (e.g. shared TS types generated from .NET DTOs), revisit and add Nx or pnpm workspaces.

---

# Stack Decisions

## Backend

**C# ASP.NET Core** with **PostgreSQL**. Full backend tech stack, project structure, auth implementation, and conventions live in [backend.md](backend.md).

Picked over Supabase for the reasons in [Why Not Supabase](#why-not-supabase) below.

## Custom Domain

None for MVP. App lives at `*.azurewebsites.net` (backend) and `*.azurestaticapps.net` (frontend).

Skipping the $10-15/yr domain cost and the F1→B1 upgrade ($13/mo) that custom backend SSL would require. Easy to add later — buy a domain, add a CNAME, done in 30 minutes. Frontend custom domain alone is possible on F1 (SWA supports free SSL on custom domains) if a personal-touch URL becomes worth $10-15/yr.

## Frontend Hosting

**Azure Static Web Apps (SWA)** — free tier.

Picked over Vercel for unified Azure dashboard with the backend. Both are equivalent in DX and free-tier limits, so the tiebreaker is single-vendor for app + frontend.

SWA free tier:
- 100GB bandwidth/mo
- 0.5GB storage
- 2 custom domains, free SSL on each
- GitHub Actions deploy pipeline auto-generated
- Preview environments per PR
- Permanent free (no 12-month cliff)

**Why not Azure F1 App Service for the frontend:**
- F1 is for server apps, not static SPAs
- Cold starts would slow first page load
- Single-region serving is slower than edge CDN
- F1's 60 CPU min/day cap would be eaten serving static files — wastes capacity the backend needs
- SWA is Microsoft's purpose-built SPA host with edge CDN included

## Backend Hosting

**Azure F1 App Service** — free tier, to start.

Worklogr is the only service for now, so paying for B1 capacity is premature. F1 is enough until usage demands more or more apps are added.

F1 limits accepted for now:
- 60 CPU min/day (well above personal worklogr usage)
- Cold starts after 20 min idle (~5-10s wake)
- No custom domain SSL — `*.azurewebsites.net` only
- No Always On
- 1GB RAM, 1GB storage
- 165MB outbound data/day

**Cap math for 2 users — caps are not the bottleneck:**

A worklogr request is simple CRUD (~30ms CPU). A user makes ~10-15 requests per day. So 2 users = roughly 1 second of CPU per day, against a 3,600 second cap. Outbound data is similar — ~1MB/day against a 165MB cap. RAM and storage have plenty of headroom.

**The real issue on F1 is not the caps but cold starts.** The app sleeps after 20 min idle, so the first request after a quiet period takes 5-10s to wake. That is the trigger to consider B1 — UX, not resource exhaustion.

Caps would only matter at hundreds of daily active users or heavy export/report jobs.

**Upgrade trigger — move to B1 (~$13/mo) when:**
- Cold starts get annoying in real use
- Custom domain + SSL is needed
- A second personal app gets added (B1 holds up to 8 apps for the same $13/mo)
- 60 CPU min/day cap is hit (unlikely for solo use)

B1 removes every F1 limit: no cold starts, no CPU cap, Always On, custom SSL, 1.75GB RAM.

## Email (Transactional)

**Resend** free tier — 3,000 emails/month, 100/day.

Used for password reset emails only in MVP. Volume is tiny (~5-10/mo expected).

Picked over SendGrid, Brevo, Postmark, and Azure Communication Services for the cleanest API and best DX — modern provider, GitHub signup with no credit card, automated DKIM/SPF setup when adding a domain, simple `POST /emails` HTTP API.

For early development, can send from `onboarding@resend.dev` without verifying a domain.

ASP.NET integration: `Resend.Net` NuGet package or plain HTTPS calls.

**Fallback plan if deliverability becomes an issue:** SendGrid has proven 0 error rate to Philippine recipients in prior projects — swap to it if Resend underdelivers in practice. Email provider is a small, contained change (one service class, one config key).

---

## Database Hosting

**Neon** free tier (production).

- $0/mo permanent
- 0.5GB storage (years of personal data)
- 100 projects on free tier (one project per app, no need to upgrade for side projects)
- Auto-suspend after 5 min idle
- Postgres branching available if useful later

If usage grows beyond free, Neon Launch is usage-based with no flat fee — pay only for what is used.

**Local development:** native Postgres install on the dev machine, not Docker.

- Lighter than Docker Desktop (~1-2GB RAM saved)
- Native `psql` / pgAdmin / DBeaver work directly
- Already installed, zero setup
- Match Neon's Postgres version (16 picked) to avoid drift
- Use a dedicated database: `CREATE DATABASE worklogr_dev;`
- Connection string in `api/appsettings.Development.json`

## File Storage (Uploads) — Post-MVP

**Cloudflare R2.** Free 10GB, zero egress fees, S3-compatible.

Not part of the MVP. The MVP has no upload features (notes are plain text, Excel export is client-side). Pre-decided here so customization features added later — profile photo, session note attachments, custom assets — have a vendor already chosen.

Why R2 over Azure-native:
- 10GB free is permanent (not a 12-month trial)
- Zero egress fees — biggest hidden cost in cloud storage avoided entirely
- S3-compatible → use `AWSSDK.S3` from ASP.NET, point endpoint at R2
- Portable — same SDK works against AWS S3, Backblaze B2, etc. if R2 is ever swapped out

**Cross-vendor concern:**

The stack already mixes vendors (Azure for app + frontend, Neon for DB). Adding R2 for storage adds nothing material — all communication is HTTPS, latency between providers is ~20-50ms, irrelevant for upload/download.

Single-cloud discipline matters at enterprise scale (private networking, compliance, consolidated billing). For a personal app, mixing providers is the cheaper, more portable choice.

**Alternatives considered:**

| Option | Free | Why Rejected |
|--------|------|--------------|
| Azure Blob Storage | 5GB for 12 months | 12-month cliff; costs ~$0.20/mo for 10GB after |
| AWS S3 | 5GB for 12 months | Same 12-month cliff |
| Backblaze B2 | 10GB | Good alternative — R2 picked for zero egress |
| Cloudinary | 25GB | Image-focused; overkill if non-image uploads added later |
| Supabase Storage | 1GB | Supabase already rejected (see [Why Not Supabase](#why-not-supabase)) |

---

## Total Monthly Cost

**$0/mo to start** (Azure F1, Azure SWA, Neon free, R2 free).

After upgrade to B1: ~$13/mo.

---

# Why This Combo

1. **Microsoft owns ASP.NET**, so Azure has the best deployment story for .NET — Visual Studio Publish, and Azure Portal auto-generates GitHub Actions workflows on first deploy.
2. **Neon free tier is generous enough** that splitting DB from app costs nothing.
3. **No vendor lock-in** if standard practices are followed (see below).
4. **Scales for a portfolio cheaply.** Stays $0/mo on F1 for solo use. If a second personal app is added later, a single B1 plan ($13/mo) hosts up to 8 apps — cost stays flat as the portfolio grows.

---

# Portability Rules

To keep the option of moving off Azure later, avoid these vendor-specific SDKs and services:

- Avoid Azure Blob Storage SDK → use S3-compatible (Backblaze B2, Cloudflare R2, or AWS S3)
- Avoid Azure Service Bus / Cosmos DB → use Postgres for queues and storage
- Avoid Azure Key Vault SDK → use environment variables for secrets
- Avoid Application Insights SDK as primary observability → use OpenTelemetry
- Avoid Azure AD / Entra ID auth → use plain JWT or BCrypt password hashing

Stick with:
- EF Core + Npgsql (standard Postgres driver)
- `ILogger` (standard .NET logging interface)
- Environment variables for configuration
- Standard ASP.NET Core middleware

If those rules hold, migration off Azure is:
- App: redeploy container or binary to new host (~1-2 hours)
- DB: `pg_dump` from Neon, `pg_restore` to new Postgres host (~30 minutes)
- DNS: swap (~5 minutes)

---

# Why Not Supabase

Supabase was the obvious "ship fastest" choice — generous free tier, built-in auth, RLS for per-user isolation, no backend code to write. It was seriously considered before being rejected.

Reasons it was rejected:

1. **Replaces the backend.** The point of this project is to build and run a real ASP.NET Core backend. Supabase makes the backend disappear — frontend talks to Postgres directly via PostgREST. That eliminates exactly the layer worth learning.
2. **Hit a Supabase Auth bug.** Forgot-password flow misbehaved in a previous attempt. The whole pitch is "auth is solved" — but when it isn't, there is no fix path.
3. **Lock-in to non-portable patterns.** Supabase RLS is Postgres-specific SQL written in a Supabase-specific way. Auth is Supabase-specific. Edge Functions are Supabase-specific. Migrating away means rewriting all three.
4. **Skill transfer is poor.** Knowing Supabase teaches Supabase. Knowing ASP.NET, JWT, EF Core, and middleware patterns transfers to any .NET shop and the concepts apply to any stack.
5. **"Easy" hides fundamentals.** Skipping how auth, migrations, and REST design work is the wrong outcome for a learning project.

Supabase remains a fair choice for someone whose goal is "ship a CRUD app fast" — that just is not the goal here.

---

# Alternatives Considered

| Option | Cost | Why Rejected |
|--------|------|--------------|
| Supabase | $0 | See [Why Not Supabase](#why-not-supabase) |
| Render | ~$14/mo | More expensive, no benefit over Azure for ASP.NET |
| Fly.io + Neon | ~$5/mo | Cheaper but worse DX for ASP.NET |
| AWS Free Tier | $0 → $30-50/mo | 12-month cliff is bad for personal projects |
| Self-host VPS | ~€4/mo | Too much ops work for "just works" goal |
| Azure B1 + Neon (paid app) | ~$13/mo | Premature — only one app, F1 limits are tolerable for now |
| Azure B1 + Azure Postgres | ~$28/mo | More expensive; Neon free is enough |
| SSO-only auth for MVP | $0 | Skips backend auth fundamentals (BCrypt, JWT, reset flow) — moved to post-MVP |
| Vercel for frontend | $0 | Equivalent to SWA on free tier; SWA picked for single Azure dashboard |
| Azure F1 for frontend | $0 | F1 is for server apps, not static SPAs — cold starts and CPU cap make it worse than SWA |

---

# Upgrade Path

Step by step, only when triggered:

1. **F1 → B1** (~$13/mo) — when cold starts get annoying, custom domain SSL is needed, or a second personal app is added.
2. **Neon free → Launch** (usage-based) — when 0.5GB storage or 100 CU-hours is exceeded.
3. **B1 → S1** (~$70/mo) — when autoscale, deployment slots, or daily backups are needed.
4. **Neon → Azure Postgres Flexible Server** (~$15-25/mo) — only if tighter Azure integration becomes worth more than Neon's free tier and branching.

Do not pre-pay for capacity that is not needed yet.
