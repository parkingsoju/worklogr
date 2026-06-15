import { z } from 'zod'

export const startSessionSchema = z.object({
  locationType: z.enum(['Office', 'Remote', 'Other']),
  note: z.string().optional(),
  startTime: z.string().optional(), // HH:mm local; empty = start now
})
export type StartSessionInput = z.infer<typeof startSessionSchema>

export const sessionFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  locationType: z.enum(['Office', 'Remote', 'Other'], { message: 'Location is required' }),
  note: z.string().optional(),
}).refine(d => d.startTime < d.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})
export type SessionFormInput = z.infer<typeof sessionFormSchema>
