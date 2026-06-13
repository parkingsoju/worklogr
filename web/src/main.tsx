import { StrictMode, useMemo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { theme, makeTheme } from './lib/theme'
import { accentScale } from './lib/accents'
import { queryClient, ToastContainer } from './lib/queryClient'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <QueryClientProvider client={queryClient}>
      <ThemedChakraProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </ThemedChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
)
