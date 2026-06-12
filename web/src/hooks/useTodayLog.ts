import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TodayData } from '@/lib/types'
import type { StartSessionInput, SessionFormInput } from '@/lib/validations/session'
import { toUtc } from '@/lib/time'

const KEY = ['daily-log', 'today'] as const

export function useTodayLog() {
  return useQuery<TodayData>({ queryKey: KEY, queryFn: () => api.get('/api/daily-logs/today') })
}

function useInvalidateToday() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: KEY })
}

export function useStartSession() {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: (data: StartSessionInput) => api.post('/api/work-sessions/start', data),
    onSuccess: inv,
  })
}

export function useEndSession() {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/work-sessions/${id}/end`),
    onSuccess: inv,
  })
}

export function useAddManualSession(timezone: string) {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: (data: SessionFormInput) => api.post('/api/work-sessions', {
      startTime: toUtc(data.date, data.startTime, timezone),
      endTime: toUtc(data.date, data.endTime, timezone),
      locationType: data.locationType,
      note: data.note || null,
    }),
    onSuccess: inv,
  })
}

export function useEditSession(timezone: string) {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SessionFormInput }) =>
      api.put(`/api/work-sessions/${id}`, {
        startTime: toUtc(data.date, data.startTime, timezone),
        endTime: toUtc(data.date, data.endTime, timezone),
        locationType: data.locationType,
        note: data.note || null,
      }),
    onSuccess: inv,
  })
}

export function useUpdateSessionNote() {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      api.patch(`/api/work-sessions/${id}`, { note }),
    onSuccess: inv,
  })
}

export function useDeleteSession() {
  const inv = useInvalidateToday()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/work-sessions/${id}`),
    onSuccess: inv,
  })
}
