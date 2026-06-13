import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CurrentUser {
  id: string
  name: string
  email: string
  timezone: string
  defaultLocationType: string | null
  weekStartsOn: number
  theme: string
  accentColor: string
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me'),
    retry: false,
  })
}
