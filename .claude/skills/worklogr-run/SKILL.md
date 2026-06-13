---
name: worklogr-run
description: >-
  Launch and drive the worklogr app locally — the ASP.NET API (port 5059) and
  the Vite React frontend (port 5173) — to see a change working in the real app,
  not just tests. USE THIS whenever the user says "run it", "start the app",
  "launch worklogr", "spin it up", "see it in the browser", or wants to confirm a
  change works end-to-end locally. Covers the gotchas: freeing a stale port,
  the required env/flags, health polling, and a token round-trip smoke test.
---

# Run worklogr locally

Two processes: **API** (ASP.NET, `:5059`) and **web** (Vite, `:5173`). The web
dev server proxies `/api` and `/health` to the API (`web/vite.config.ts`), so the
API must be up first. Postgres must be running locally (`localhost/worklogr_dev`,
see `api/appsettings.Development.json`).

## Step 0 — Free port 5059 if a stale API holds it

A leftover `dotnet run` (often orphaned, PPID 1) commonly squats on 5059 with
**old code** — symptom: login response has no `token` field, or `/me` is missing
new fields. Always check and reclaim before starting:

```bash
PID=$(lsof -nP -iTCP:5059 -sTCP:LISTEN -t 2>/dev/null)
[ -n "$PID" ] && ps -o pid,ppid,command -p $PID   # confirm it's a worklogr dotnet run
# If stale, kill the dotnet run parent + the built child:
kill $PID $(ps -o ppid= -p $PID) 2>/dev/null
```

## Step 1 — Start the API (background)

`--no-launch-profile` avoids the https profile; pin the URL and Development env
(Development holds the local connection string + seeds the dev user):

```bash
cd api
ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls "http://localhost:5059"
```

Run it in the background, then poll health (don't assume it's instant):

```bash
for i in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5059/health)" = "200" ] && { echo "API up"; break; }
  sleep 1
done
```

## Step 2 — Start the web dev server (background)

```bash
cd web && npm run dev      # vite; prints the actual URL
```

**Vite picks the next free port** if 5173 is taken (e.g. 5176) — read the task
output for the real `Local:` URL and hand the user *that*. The proxy still points
at 5059 regardless of which port Vite lands on.

## Step 3 — Drive it (smoke test, not just launch)

Seeded dev user: **`test@local.dev` / `test1234`**. Prove the round-trip through
the API (adjust the body to whatever the change touches):

```bash
TOKEN=$(curl -s -X POST http://localhost:5059/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@local.dev","password":"test1234"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s http://localhost:5059/api/auth/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

A present `token` field confirms the running API is **current code** (not a stale
instance). For UI-visible changes, hand the user the Vite URL — there is no
headless browser (chromium-cli / playwright / tmux) in this environment, so visual
confirmation is the user's to make.

## Step 4 — Stop when done

```bash
kill $(lsof -tiTCP:5059 -sTCP:LISTEN) $(lsof -tiTCP:5173 -sTCP:LISTEN) 2>/dev/null
# if vite moved ports, substitute its actual port
```

## Notes
- `dotnet ef` is installed globally but not on PATH — use `~/.dotnet/tools/dotnet-ef`. Migrations are **not** auto-applied on boot; run `dotnet-ef database update` (with `ASPNETCORE_ENVIRONMENT=Development`) after adding one.
- EF design-time commands log a `Fatal: HostAborted` line then print `Done.` — that's normal teardown, not a failure.
