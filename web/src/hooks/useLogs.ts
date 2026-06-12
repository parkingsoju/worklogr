import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TodayData } from '@/lib/types'

export interface LogSummary {
  id: string
  date: string
  status: 'Draft' | 'Complete'
  totalSeconds: number
}

export function useLogs(from?: string, to?: string, status?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (status && status !== 'All') params.set('status', status)
  const qs = params.toString()
  return useQuery<LogSummary[]>({
    queryKey: ['logs', { from, to, status }],
    queryFn: () => api.get(`/api/daily-logs${qs ? `?${qs}` : ''}`),
  })
}

export function useLogByDate(date: string) {
  return useQuery<TodayData>({
    queryKey: ['log', date],
    queryFn: () => api.get(`/api/daily-logs/${date}`),
  })
}

export function useMarkComplete() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/daily-logs/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log', 'today'] })
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['log'] })
    },
  })
}

export function useUpdateDailyNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      api.patch(`/api/daily-logs/${id}`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log', 'today'] })
      qc.invalidateQueries({ queryKey: ['log'] })
    },
  })
}

export function useReopenLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/daily-logs/${id}/reopen`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log', 'today'] })
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['log'] })
    },
  })
}
