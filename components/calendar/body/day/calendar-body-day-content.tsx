import { useCalendarContext } from '../../calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import { isSameDay, parseISO } from 'date-fns'
import { hours } from './calendar-body-margin-day-margin'
import CalendarBodyHeader from '../calendar-body-header'
import CalendarEvent from '../../calendar-event'
import TheaterShowEvent from '@/components/theater/theater-show-event'
import { Representation } from '@/lib/theater-types'

// Calculate position for a theater show (similar to CalendarEvent positioning)
function calculateShowPosition(rep: Representation): { top: string; height: string } {
  const startTime = parseISO(rep.start)
  const endTime = parseISO(rep.end)

  const startHour = startTime.getHours()
  const startMinutes = startTime.getMinutes()
  const endHour = endTime.getHours()
  const endMinutes = endTime.getMinutes()

  const topPosition = startHour * 128 + (startMinutes / 60) * 128
  const duration = endHour * 60 + endMinutes - (startHour * 60 + startMinutes)
  const height = (duration / 60) * 128

  return {
    top: `${topPosition}px`,
    height: `${height}px`,
  }
}

export default function CalendarBodyDayContent({ date }: { date: Date }) {
  const { events } = useCalendarContext()
  const { visibleRepresentations } = useTheaterContext()

  const dayEvents = events.filter((event) => isSameDay(event.start, date))
  const dayShows = visibleRepresentations.filter((rep) =>
    isSameDay(parseISO(rep.start), date)
  )

  return (
    <div className="flex flex-col flex-grow">
      <CalendarBodyHeader date={date} />

      <div className="flex-1 relative">
        {hours.map((hour) => (
          <div key={hour} className="h-32 border-b border-border/50 group" />
        ))}

        {/* Classic events (pink) */}
        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}

        {/* Theater shows (amber/blue) */}
        {dayShows.map((rep) => {
          const position = calculateShowPosition(rep)
          return (
            <div
              key={rep.id}
              className="absolute left-0 right-0 px-1"
              style={position}
            >
              <TheaterShowEvent
                representation={rep}
                className="h-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
