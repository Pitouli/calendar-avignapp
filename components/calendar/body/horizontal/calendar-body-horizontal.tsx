'use client'

import { useCalendarContext } from '../../calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import { startOfWeek, addDays, format, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo, useRef, useState } from 'react'
import CalendarEvent from '@/components/calendar/calendar-event'
import { CalendarEvent as CalendarEventType } from '@/components/calendar/calendar-types'
import { representationToTheaterEvent } from '@/lib/theater-data'
import { computeEventLayout } from '@/lib/event-layout'

const HOUR_WIDTH = 300 // pixels per hour
const MIN_ROW_HEIGHT = 45 // minimum height per show
const DAY_LABEL_WIDTH = 60 // width of day labels column
const HEADER_HEIGHT = 40 // height of hour headers

// Hours from 8h to 24h (we show 8-24 for theater)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 8) // 8, 9, 10, ..., 24

export default function CalendarBodyHorizontal() {
    const { date, events } = useCalendarContext()
    const { visibleRepresentations, chosen } = useTheaterContext()

    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [scrollTop, setScrollTop] = useState(0)

    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // Group representations/events by day and calculate overlaps
    const dayData = useMemo(() => {
        return weekDays.map(day => {
            // 1. Get Blockers for this day
            const dayBlockers = events.filter(event =>
                isSameDay(event.start, day)
            ).map(evt => ({ ...evt, type: 'blocker' as const })) // Ensure type is set

            // 2. Get Shows for this day
            const dayShows = visibleRepresentations
                .filter(rep => isSameDay(parseISO(rep.start), day))
                .map(rep => representationToTheaterEvent(rep, chosen.has(rep.id)))

            // 3. Merge
            const allDayEvents: CalendarEventType[] = [...dayBlockers, ...dayShows]

            // 4. Compute layout using the centralized algorithm
            const layoutItems = computeEventLayout(allDayEvents)

            // Calculate row height based on the max dimension of any group in the day
            // If empty, maxLanes is 1 (default height)
            const maxLanes = layoutItems.length > 0
                ? Math.max(...layoutItems.map(item => item.totalLanes))
                : 1

            const rowHeight = Math.max(MIN_ROW_HEIGHT, maxLanes * MIN_ROW_HEIGHT)

            return {
                date: day,
                layoutItems,
                rowHeight,
            }
        })
    }, [weekDays, visibleRepresentations, events, chosen])

    // Handle scroll synchronization
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement
        setScrollLeft(target.scrollLeft)
        setScrollTop(target.scrollTop)
    }

    // Total width for all hours
    const totalWidth = HOURS.length * HOUR_WIDTH

    return (
        <div className="flex flex-col flex-grow overflow-hidden relative">
            {/* Fixed header row */}
            <div
                className="flex shrink-0 border-b bg-background z-20"
                style={{ height: HEADER_HEIGHT }}
            >
                {/* Corner cell */}
                <div
                    className="shrink-0 border-r bg-background"
                    style={{ width: DAY_LABEL_WIDTH }}
                />
                {/* Hour headers - scrolls horizontally */}
                <div className="flex-1 overflow-hidden">
                    <div
                        className="flex"
                        style={{
                            transform: `translateX(-${scrollLeft}px)`,
                            width: totalWidth,
                        }}
                    >
                        {HOURS.map(hour => (
                            <div
                                key={hour}
                                className="shrink-0 flex items-center justify-center text-sm font-medium text-muted-foreground border-r"
                                style={{ width: HOUR_WIDTH, height: HEADER_HEIGHT }}
                            >
                                {hour}h
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main scrollable area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Fixed day labels column */}
                <div
                    className="shrink-0 border-r bg-background z-10 overflow-hidden"
                    style={{ width: DAY_LABEL_WIDTH }}
                >
                    <div
                        style={{ transform: `translateY(-${scrollTop}px)` }}
                    >
                        {dayData.map(({ date: dayDate, rowHeight }) => (
                            <div
                                key={dayDate.toISOString()}
                                className="border-b flex items-center justify-center"
                                style={{ height: rowHeight }}
                            >
                                <div
                                    className="text-sm font-medium text-muted-foreground"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        transform: 'rotate(180deg)',
                                    }}
                                >
                                    {format(dayDate, 'EEE d', { locale: fr })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable content area */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto"
                    onScroll={handleScroll}
                >
                    <div style={{ width: totalWidth }}>
                        {dayData.map(({ date: dayDate, layoutItems, rowHeight }) => (
                            <div
                                key={dayDate.toISOString()}
                                className="relative border-b"
                                style={{ height: rowHeight }}
                            >
                                {/* Hour grid lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {HOURS.map(hour => (
                                        <div
                                            key={hour}
                                            className="shrink-0 border-r border-dashed border-muted"
                                            style={{ width: HOUR_WIDTH }}
                                        />
                                    ))}
                                </div>

                                {/* Events */}
                                {layoutItems.map(({ event, lane, totalLanes }) => {
                                    const startTime = event.start
                                    const endTime = event.end

                                    const startHour = startTime.getHours() + startTime.getMinutes() / 60
                                    const endHour = endTime.getHours() + endTime.getMinutes() / 60

                                    const left = (startHour - 8) * HOUR_WIDTH
                                    const width = (endHour - startHour) * HOUR_WIDTH

                                    const topPercentage = (lane / totalLanes) * 100
                                    const heightPercentage = (1 / totalLanes) * 100

                                    // Minimum width for visibility
                                    const finalWidth = Math.max(width, 60)

                                    return (
                                        <CalendarEvent
                                            key={event.id}
                                            event={event}
                                            customPosition={{
                                                left: `${left}px`,
                                                width: `${finalWidth}px`,
                                                top: `${topPercentage}%`,
                                                height: `${heightPercentage}%`
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
