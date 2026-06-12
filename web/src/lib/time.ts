import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export const fmtTime = (utc: string, tz: string) =>
  formatInTimeZone(new Date(utc), tz, 'h:mm a')

export const fmtDuration = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const toLocalDate = (utc: string, tz: string) =>
  formatInTimeZone(new Date(utc), tz, 'yyyy-MM-dd')

export const toLocalTime = (utc: string, tz: string) =>
  formatInTimeZone(new Date(utc), tz, 'HH:mm')

export const toUtc = (localDate: string, localTime: string, tz: string): string =>
  fromZonedTime(`${localDate}T${localTime}:00`, tz).toISOString()

export const todayLocal = (tz: string) =>
  formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')

export const formatDisplayDate = (isoDate: string) =>
  format(new Date(`${isoDate}T12:00:00`), 'EEEE, MMMM d, yyyy')
