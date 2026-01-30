'use client'

import { useState } from 'react'
import Calendar from './calendar/calendar'
import { CalendarEvent, Mode } from './calendar/calendar-types'
import { generateMockEvents } from '@/lib/mock-calendar-events'
import TheaterProvider from './theater/theater-provider'

export default function CalendarDemo() {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents())
  const [mode, setMode] = useState<Mode>('horizontal')
  const [date, setDate] = useState<Date>(new Date(2026, 6, 7)) // July 7, 2026 - festival period

  return (
    <TheaterProvider events={events} setEvents={setEvents}>
      <Calendar
        events={events}
        setEvents={setEvents}
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
      />
    </TheaterProvider>
  )
}
