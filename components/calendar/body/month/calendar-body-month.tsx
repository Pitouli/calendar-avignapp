'use client'

import { useCalendarContext } from '../../calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'
import CalendarEvent from '../../calendar-event'
import { AnimatePresence, motion } from 'framer-motion'
import { representationToTheaterEvent } from '@/lib/theater-data'
import { CalendarEvent as CalendarEventType } from '@/components/calendar/calendar-types'

export default function CalendarBodyMonth() {
  const { date, events, setDate, setMode } = useCalendarContext()
  const { visibleRepresentations, chosen } = useTheaterContext()

  // Get date range for month view
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const today = new Date()

  // 1. Prepare Blockers (Classic Events)
  const visibleEvents: CalendarEventType[] = events.filter(
    (event) =>
      isWithinInterval(event.start, {
        start: calendarStart,
        end: calendarEnd,
      }) ||
      isWithinInterval(event.end, { start: calendarStart, end: calendarEnd })
  )

  // 2. Prepare Shows (Theater Events)
  const visibleShows: CalendarEventType[] = visibleRepresentations
    .filter((rep) => {
      const repDate = parseISO(rep.start)
      return isWithinInterval(repDate, {
        start: calendarStart,
        end: calendarEnd,
      })
    })
    .map(rep => representationToTheaterEvent(rep, chosen.has(rep.id)))

  // Sort helper
  const sortEvents = (a: CalendarEventType, b: CalendarEventType) => {
    const diff = a.start.getTime() - b.start.getTime()
    if (diff !== 0) return diff
    if (a.type === 'blocker' && b.type === 'theater') return -1
    if (a.type === 'theater' && b.type === 'blocker') return 1
    return 0
  }

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      {/* Day of Week Header */}
      <div className="grid grid-cols-7 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 flex-grow">
        {calendarDays.map((day) => {
          // Filter events for this specific day
          const dayEvents = visibleEvents.filter((event) =>
            isSameDay(event.start, day)
          )
          const dayShows = visibleShows.filter((event) =>
            isSameDay(event.start, day)
          )

          // Merge and sort
          const allDayEvents = [...dayEvents, ...dayShows].sort(sortEvents)

          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, date)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[100px] border-b border-r p-2 flex flex-col group transition-colors hover:bg-muted/50 relative',
                !isCurrentMonth && 'bg-muted/10 text-muted-foreground',
                day.getDay() === 0 && 'border-r-0' // No right border for Sunday columns
              )}
              onClick={() => {
                setDate(day)
                setMode('day')
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground',
                    !isCurrentMonth && 'opacity-50'
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <div className="flex flex-col gap-1 mt-1">
                  {/* Show up to 3 unified events */}
                  {allDayEvents.slice(0, 3).map((event) => (
                    <CalendarEvent
                      key={event.id}
                      event={event}
                      month
                    />
                  ))}

                  {allDayEvents.length > 3 && (
                    <motion.div
                      key={`more-${day.toISOString()}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-muted-foreground font-medium pl-1 cursor-pointer hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDate(day)
                        setMode('day')
                      }}
                    >
                      +{allDayEvents.length - 3} more
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
