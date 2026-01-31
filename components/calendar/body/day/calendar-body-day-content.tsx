'use client'

import { useCalendarContext } from '../../calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import { isSameDay, parseISO } from 'date-fns'
import { hours } from './calendar-body-margin-day-margin'
import CalendarBodyHeader from '../calendar-body-header'
import CalendarEvent from '../../calendar-event'
import { CalendarEvent as CalendarEventType, TheaterEvent } from '@/components/calendar/calendar-types'
import { computeEventLayout } from '@/lib/event-layout'

export default function CalendarBodyDayContent({ date }: { date: Date }) {
  const { events } = useCalendarContext() // These are blockers
  const { visibleRepresentations, chosen } = useTheaterContext()

  // Filter blockers for this day
  const dayBlockers = events.filter((event) => isSameDay(event.start, date))

  // Filter shows for this day and convert to TheaterEvent
  const dayShows: TheaterEvent[] = visibleRepresentations
    .filter((rep) => isSameDay(parseISO(rep.start), date))
    .map((rep) => ({
      id: rep.id,
      type: 'theater',
      title: rep.playTitle,
      playTitle: rep.playTitle,
      start: parseISO(rep.start),
      end: parseISO(rep.end),
      color: chosen.has(rep.id) ? 'blue' : 'amber',
      representationId: rep.id,
    }))

  // Merge events
  const allDayEvents: CalendarEventType[] = [...dayBlockers, ...dayShows]

  // Compute layout (lanes)
  const layoutItems = computeEventLayout(allDayEvents)

  return (
    <div className="flex flex-col flex-grow">
      {/* Date Header using reusable component */}
      <CalendarBodyHeader date={date} />

      {/* Time Grid with Events */}
      <div className="flex-grow relative min-h-[1000px]">
        {hours.map((hour) => (
          <div key={hour} className="h-32 border-b border-border/50 group" />
        ))}

        {layoutItems.map(({ event, lane, totalLanes }) => {
          const startHour = event.start.getHours()
          const startMin = event.start.getMinutes()
          const endHour = event.end.getHours()
          const endMin = event.end.getMinutes()

          // 128px per hour (h-32 = 8rem = 128px)
          const pixelsPerHour = 128
          const startInHours = startHour + startMin / 60
          const endInHours = endHour + endMin / 60
          const durationInHours = endInHours - startInHours

          return (
            <CalendarEvent
              key={event.id}
              event={event}
              // Pass the computed layout position
              customPosition={{
                left: `${(lane / totalLanes) * 100}%`,
                width: `${(1 / totalLanes) * 100}%`,
                top: `${startInHours * pixelsPerHour}px`,
                height: `${durationInHours * pixelsPerHour}px`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
