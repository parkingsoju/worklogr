import { StrictMode, useEffect, useMemo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript, useToast } from '@chakra-ui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { theme, makeTheme } from './lib/theme'
import { accentScale } from './lib/accents'
import { queryClient, setErrorNotifier } from './lib/queryClient'
import { useCurrentUser } from './hooks/useCurrentUser'

const router = createRouter({ routeTree, trailingSlash: 'never' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

// Re-themes the app from the signed-in user's accent preference. Lives inside
// QueryClientProvider so it can read `me`; pre-auth (no `me`) falls back to teal.
function ThemedChakraProvider({ children }: { children: ReactNode }) {
  const { data: me } = useCurrentUser()
  const appTheme = useMemo(() => makeTheme(accentScale(me?.accentColor)), [me?.accentColor])
  return <ChakraProvider theme={appTheme}>{children}</ChakraProvider>
}

// Bridges the MutationCache's global error handler (outside React) to a toast
// rendered inside the app's ChakraProvider — so the toast uses the live theme and
// doesn't inject a competing Chakra context. id = message dedupes identical errors.
function ToastBridge() {
  const toast = useToast()
  useEffect(() => {
    setErrorNotifier(message => {
      if (!toast.isActive(message)) {
        toast({ id: message, status: 'error', description: message, duration: 5000, isClosable: true })
      }
    })
    return () => setErrorNotifier(null)
  }, [toast])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <QueryClientProvider client={queryClient}>
      <ThemedChakraProvider>
        <RouterProvider router={router} />
        <ToastBridge />
      </ThemedChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
)
