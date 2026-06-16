import { useEffect } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCurrentUser, type CurrentUser } from './useCurrentUser'

export type ThemePref = 'light' | 'dark' | 'system'

// `system` resolves against the OS at apply-time. (useSystemColorMode is off, so we
// resolve once here rather than letting Chakra live-follow the OS — see theme.ts.)
function resolveMode(theme: ThemePref): 'light' | 'dark' {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return theme
}

// Applies the signed-in user's saved theme to Chakra's color mode whenever it loads
// or changes. Server `me.theme` is the source of truth, so the choice follows the
// user across devices. Pre-auth (no `me`) is a no-op.
export function useThemeSync() {
  const { data: me } = useCurrentUser()
  const { colorMode, setColorMode } = useColorMode()
  useEffect(() => {
    // Logged out (me cleared) or still loading: leave color mode as-is. Light/dark is a
    // device-level pref and is used on the login screen too, so it persists across logout.
    // Accent resets to the default separately (ThemedChakraProvider, me?.accentColor -> teal).
    if (!me?.theme) return
    const target = resolveMode(me.theme as ThemePref)
    if (target !== colorMode) setColorMode(target)
    // accentColor in deps: changing accent rebuilds the Chakra theme (can reset color mode),
    // so re-apply here to keep it in sync. colorMode omitted so in-session toggles aren't fought.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.theme, me?.accentColor])
}

// Sets the theme everywhere: applies it immediately AND persists to the server so it
// survives reloads and follows across devices. Used by the sidebar toggle + settings.
export function useSetTheme() {
  const qc = useQueryClient()
  const { setColorMode } = useColorMode()
  const mutation = useMutation({
    mutationFn: (theme: ThemePref) => api.patch('/api/users/me', { theme }),
    onSuccess: (updated: CurrentUser) => qc.setQueryData(['me'], updated),
  })
  return (theme: ThemePref) => {
    setColorMode(resolveMode(theme))
    mutation.mutate(theme)
  }
}
