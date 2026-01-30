import { Play, Representation, SchedulePattern } from './theater-types'
import playsData from '@/data/mock-theater-plays.json'
import { addMinutes, format, parseISO, getDay } from 'date-fns'

// Festival dates: July 1-31, 2026
const FESTIVAL_START = new Date(2026, 6, 1) // July 1, 2026
const FESTIVAL_END = new Date(2026, 6, 31) // July 31, 2026

export function getPlays(): Play[] {
  return playsData.plays as Play[]
}

function matchesSchedule(date: Date, schedule: SchedulePattern, festivalStart: Date): boolean {
  const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday, etc.

  switch (schedule.type) {
    case 'daily':
      return true
    case 'daily-except':
      return dayOfWeek !== schedule.exceptDay
    case 'every-other-day': {
      const daysSinceStart = Math.floor((date.getTime() - festivalStart.getTime()) / (1000 * 60 * 60 * 24))
      return (daysSinceStart % 2) === schedule.startOffset
    }
    case 'specific-days':
      return schedule.days.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6)
    default:
      return false
  }
}

export function generateRepresentations(plays: Play[]): Representation[] {
  const representations: Representation[] = []
  let repId = 1

  for (const play of plays) {
    // Iterate through all days of the festival
    const currentDate = new Date(FESTIVAL_START)

    while (currentDate <= FESTIVAL_END) {
      if (matchesSchedule(currentDate, play.schedule, FESTIVAL_START)) {
        // Create representation for this day
        const startDateTime = new Date(currentDate)
        startDateTime.setHours(play.startTime.hour, play.startTime.minute, 0, 0)

        const endDateTime = addMinutes(startDateTime, play.duration)

        representations.push({
          id: `rep-${String(repId).padStart(4, '0')}`,
          playId: play.id,
          playTitle: play.title,
          date: format(currentDate, 'yyyy-MM-dd'),
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        })

        repId++
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  // Sort by start time
  return representations.sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )
}

// Get representations filtered by date range
export function getRepresentationsInRange(
  representations: Representation[],
  startDate: Date,
  endDate: Date
): Representation[] {
  return representations.filter(rep => {
    const repDate = parseISO(rep.start)
    return repDate >= startDate && repDate <= endDate
  })
}

// Check if two representations overlap
export function representationsOverlap(rep1: Representation, rep2: Representation): boolean {
  const start1 = new Date(rep1.start).getTime()
  const end1 = new Date(rep1.end).getTime()
  const start2 = new Date(rep2.start).getTime()
  const end2 = new Date(rep2.end).getTime()

  return start1 < end2 && start2 < end1
}

// Get all representations that conflict with a given one
export function getConflictingRepresentations(
  targetRep: Representation,
  allReps: Representation[]
): Representation[] {
  return allReps.filter(rep =>
    rep.id !== targetRep.id && representationsOverlap(targetRep, rep)
  )
}

// Festival date constants for export
export const FESTIVAL_DATE_RANGE = {
  start: FESTIVAL_START,
  end: FESTIVAL_END,
}
