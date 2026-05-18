# API — Personal Work Session Tracker

## Related Files

- [product.md](product.md) — Product definition, features, and flows
- [data-model.md](data-model.md) — Data model and business rules
- [backend.md](backend.md) — Backend tech stack, project structure, and implementation details
- [frontend.md](frontend.md) — Frontend tech stack, routes, layouts, components
- [infrastructure.md](infrastructure.md) — Hosting, vendor, and cost decisions
- [execution-plan.md](execution-plan.md) — Build sequence and phase checklists

---

# API Endpoints

## Auth

POST /api/auth/register  
POST /api/auth/login  
POST /api/auth/logout  
GET /api/auth/me  
POST /api/auth/forgot-password  
POST /api/auth/reset-password  

Rate limits apply to register, login, and forgot-password — see [backend.md](backend.md) for specific thresholds.

---

## Today

GET /api/daily-logs/today  

Returns:

- date
- status
- activeSession
- sessions (each with startTime, endTime, locationType, note)
- note

totalDuration is computed by the frontend from the sessions list.

---

## Daily Logs

GET /api/daily-logs  
GET /api/daily-logs/{date}  
PATCH /api/daily-logs/{id}  
POST /api/daily-logs/{id}/complete  
POST /api/daily-logs/{id}/reopen  

---

## Work Sessions

POST /api/work-sessions/start  
POST /api/work-sessions/{id}/end  
POST /api/work-sessions  
PUT /api/work-sessions/{id}  
DELETE /api/work-sessions/{id}  

Endpoint meaning:

POST /api/work-sessions/start  
Starts a real-time session using the current time.

POST /api/work-sessions/{id}/end  
Ends an active session using the current time.

POST /api/work-sessions  
Creates a manual session.

PUT /api/work-sessions/{id}  
Updates an existing session.

DELETE /api/work-sessions/{id}  
Deletes a session.

---

## Reports

GET /api/reports/weekly?startDate=2026-04-27  

Note: Excel export is handled client-side via SheetJS. No export API endpoint is needed.

---

# Validation Rules

Backend validation uses FluentValidation (see [backend.md](backend.md)). The rules listed below describe what each validator enforces. Each rule maps to a `*Validator.cs` class co-located with its handler under `api/Features/`.

## Register

- Name is required
- Email is required
- Email must be valid
- Password is required
- Password must meet minimum length
- Confirm password must match password

---

## Login

- Email is required
- Password is required
- Invalid credentials should show a generic error

Example:

Invalid email or password.

---

## Start Session

- Location is required
- User must not already have an active session

---

## End Session

- Session must exist
- Session must belong to the current user
- Session must be active
- endTime must be after startTime

---

## Manual Session

- Date is required
- Start time is required
- End time is required
- End time must be after start time
- Location is required
- Session must not overlap another session on that date

---

## Edit Session

- Session must belong to the current user
- Daily log must be Draft
- End time must be after start time
- Session must not overlap another session on that date (excluding itself)
- Date is not editable

---

## Delete Session

- Session must belong to the current user
- If session is completed: daily log must be Draft
- If session is active: allowed at any time (treated as cancel)
- Confirmation is required
