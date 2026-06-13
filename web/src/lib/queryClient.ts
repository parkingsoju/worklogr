import { QueryCache, QueryClient } from '@tanstack/react-query'
import { clearToken, isApiError } from './api'

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
