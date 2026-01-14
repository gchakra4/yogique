import { supabase } from '@/shared/lib/supabase'
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * Convert time from one timezone to another and return HH:mm:ss in target tz.
 * @param time - HH:MM or HH:MM:SS
 * @param date - YYYY-MM-DD
 * @param fromTz - source IANA timezone
 * @param toTz - target IANA timezone
 */
export function convertToTimezone(
  time: string,
  date: string,
  fromTz: string,
  toTz: string
): string {
  const dateTimeString = `${date}T${time}`
  const utcDate = zonedTimeToUtc(dateTimeString, fromTz)
  const targetDate = utcToZonedTime(utcDate, toTz)
  return format(targetDate, 'HH:mm:ss', { timeZone: toTz })
}

/**
 * Convert time and return both date and time in the target timezone.
 */
export function convertToTimezoneWithDate(
  time: string,
  date: string,
  fromTz: string,
  toTz: string
): { date: string; time: string } {
  const dateTimeString = `${date}T${time}`
  const utcDate = zonedTimeToUtc(dateTimeString, fromTz)
  const targetDate = utcToZonedTime(utcDate, toTz)
  return {
    date: format(targetDate, 'yyyy-MM-dd', { timeZone: toTz }),
    time: format(targetDate, 'HH:mm:ss', { timeZone: toTz })
  }
}

/**
 * Normalize a local time (date + time + timezone) to a UTC timestamp (ms) - useful for comparisons.
 */
export function normalizeTimeForComparison(
  time: string,
  date: string,
  timezone: string
): number {
  const dateTimeString = `${date}T${time}`
  const utcDate = zonedTimeToUtc(dateTimeString, timezone)
  return utcDate.getTime()
}

/**
 * Fetch instructor timezone from DB (instructor_availability.timezone).
 * Returns IANA timezone string or null.
 */
export async function getInstructorTimezone(instructorId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('instructor_availability')
      .select('timezone')
      .eq('instructor_id', instructorId)
      .maybeSingle()

    if (error) {
      console.warn('getInstructorTimezone supabase error', error)
      return null
    }

    return data?.timezone || null
  } catch (err) {
    console.warn('getInstructorTimezone unexpected error', err)
    return null
  }
}

/**
 * Quick IANA timezone validator using Intl API.
 */
export function isValidIANATimezone(tz: string): boolean {
  try {
    // This will throw a RangeError for invalid timezones
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch (e) {
    return false
  }
}

/**
 * Parse `HH:MM` or `HH:MM:SS` into minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(p => parseInt(p, 10) || 0)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  return hours * 60 + minutes
}
