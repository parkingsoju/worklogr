import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { clearToken, isApiError } from './api'

// Error toast is bridged from inside the app's ChakraProvider (see ToastBridge in
// main.tsx) rather than a standalone toast — a standalone toast spins up a second
// Chakra context that injects its own `:root` CSS vars and overrides the app's
// per-user accent. The MutationCache (outside React) calls this notifier instead.
let errorNotifier: ((message: string) => void) | null = null
export function setErrorNotifier(fn: ((message: string) => void) | null) { errorNotifier = fn }

// Token expired mid-action: drop it and boot to /login. Returns true if handled,
// so callers can skip showing an error for what is really a re-auth, not a failure.
function bootIfUnauthorized(error: unknown): boolean {
  if (isApiError(error) && error.status === 401) {
    clearToken()
    if (window.location.pathname !== '/login') window.location.href = '/login'
    return true
  }
  return false
}

export const queryClient = new QueryClient({
  // Session expired mid-app: any authed query returning 401 boots to /login.
  // The 'me' probe is excluded — the route guards own that path, and redirecting
  // on it would loop on /register, /forgot-password, etc. where 'me' 401s by design.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isApiError(error) && error.status === 401) {
        clearToken() // invalid/expired token — drop it
        if (query.queryKey[0] !== 'me' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    },
  }),
  // Safety net: no mutation can fail silently. Components may still render their
  // own inline error for precise placement; this guarantees the user always sees
  // something — including races a fail-fast UI can't prevent (stale cache, two
  // tabs/devices). id = message dedupes identical errors instead of stacking.
  mutationCache: new MutationCache({
    onError: (error) => {
      if (bootIfUnauthorized(error)) return
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      errorNotifier?.(message)
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) return false
        return failureCount < 2
      },
      staleTime: 30_000,
    },
  },
})
