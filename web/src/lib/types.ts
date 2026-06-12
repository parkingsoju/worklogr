export type LocationType = 'Office' | 'Remote' | 'Other'
export type DailyLogStatus = 'Draft' | 'Complete'

export interface SessionDto {
  id: string
  startTime: string
  endTime: string | null
  locationType: LocationType
  note: string | null
}

export interface TodayData {
  date: string
  dailyLogId: string | null
  status: DailyLogStatus
  note: string | null
  activeSession: SessionDto | null
  sessions: SessionDto[]
  staleSession: { id: string; date: string; startTime: string; locationType: LocationType } | null
}
