# Frontend feature

worklogr's frontend is **Vite + React + TypeScript**, Chakra UI, TanStack Router (file-based), TanStack Query (server state), React Hook Form + Zod (forms). No Redux/context for server data — Query owns it. (Source: `docs/frontend.md`.)

A feature usually touches four things: a **Zod schema**, a **query/mutation hook**, **components**, and (for new pages) a **route file**. Build what the feature needs; not every feature is a new page.

## Where things live

```
web/src/
  routes/                 file-based routes (TanStack Router); _auth/* and _app/* layouts
  lib/validations/        Zod schemas — single source of truth for frontend validation
  lib/api/                fetch wrapper (credentials: 'include' for the JWT cookie)
  components/             feature components (TodayPage, SessionItem, SessionFormModal, ...)
  hooks/                  TanStack Query hooks (useTodayLog, useStartSession, ...)
```

## Templates

Worked example: the Start Session mutation + inline form. Adapt names and fields.

### Zod schema — `lib/validations/`

```ts
// Single source of frontend validation. Mirror the FluentValidation rules from
// docs/api.md for this feature (they aren't shared code — keep them in sync).
import { z } from 'zod';

export const startSessionSchema = z.object({
  locationType: z.enum(['Office', 'Remote', 'Other']),
  note: z.string().optional(),
});
export type StartSessionInput = z.infer<typeof startSessionSchema>;
```

### Query / mutation hook — `hooks/`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      api.post('/api/work-sessions/start', input),
    // Update affected data in place — don't remount the page (see UI Mutation Behavior).
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-log', 'today'] }),
  });
}
```

Reads use `useQuery` with a stable `queryKey` (e.g. `['daily-log', 'today']`, `['logs', { from, to, status }]`).

### Form component — RHF + Zod + Chakra

```tsx
const { register, handleSubmit, formState: { errors } } =
  useForm<StartSessionInput>({ resolver: zodResolver(startSessionSchema) });
const startSession = useStartSession();

// On submit: call the mutation. While in flight, disable ONLY this button and show
// its spinner (Button isLoading) — never a full-page/section loader, no layout shift.
// On error, re-enable and show an inline <Alert> near the action; keep form input.
<FormControl isInvalid={!!errors.locationType}>
  <FormLabel>Where did you work?</FormLabel>   {/* intent-driven question, not "Location" */}
  {/* 3 options → radio buttons (docs/frontend.md Form Conventions) */}
  <RadioGroup>...</RadioGroup>
  <FormErrorMessage>{errors.locationType?.message}</FormErrorMessage>
</FormControl>
<Button colorScheme="brand" isLoading={startSession.isPending}
        data-testid="today-start-session-btn">Start Session</Button>
```

### Route file — `routes/` (only for new pages)

File-based: dropping `routes/_app/settings.tsx` creates `/settings` under the app layout. `_auth/*` = centered-card auth layout (no nav); `_app/*` = sidebar layout. Authed by redirect logic — unauthenticated → `/login`. Match the route map in `docs/frontend.md`; don't invent paths.

## Conventions that bite

- **Intent-driven labels.** Write form labels as questions — "Where did you work?", "When did the session start?" — not nouns. The form reads as a conversation. (`docs/frontend.md` Form Conventions.)
- **Input type by option count.** 2–7 options → radio buttons; 8+ → Select; multi-select → chips. Location (3) and most settings are radios; timezone (400+) is a searchable dropdown.
- **`data-testid` on every interactive element + list container.** `kebab-case`, feature-prefixed, action-based: `today-start-session-btn`, `session-item-{id}`, `session-edit-btn-{id}`, `session-list`. Small lists get a per-item id suffix. Skip purely structural wrappers. No E2E yet, but adding these now avoids a retrofit.
- **UI Mutation Behavior — the feel is "instant, no refresh."** Disable only the triggering button + inline spinner; leave fields editable; no layout shift, scroll jump, or remount. Success → update in place (invalidate the relevant query). Error → re-enable, inline error near the action, keep input. Modals stay open on error and close on success.
- **Trust-based product language.** "Work Session", "Today's Log", "Mark Complete", "Reopen Log" — never "Clock In", "Attendance", "Late", "Submit". Surveillance vocabulary breaks the product's positioning.
- **Cookie auth.** API calls go through the `lib/api` fetch wrapper with `credentials: 'include'` so the HTTP-only JWT cookie rides along. Don't hand-roll `fetch` per call.
- **Theme via `brand` scale.** Components reference `colorScheme="brand"` (not hardcoded teal) so the palette swaps in one file. Dark mode through `useColorMode`, defaults to system.
