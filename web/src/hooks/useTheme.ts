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
    if (!me?.theme) return
    const target = resolveMode(me.theme as ThemePref)
    if (target !== colorMode) setColorMode(target)
    // colorMode intentionally omitted: only react to the saved preference changing,
    // not to in-session toggles (which already drive colorMode + persist via useSetTheme).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.theme])
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
