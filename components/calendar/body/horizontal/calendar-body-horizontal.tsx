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
import { cn } from '@/lib/utils'

const HOUR_WIDTH = 300 // pixels per hour
const MIN_ROW_HEIGHT = 45 // minimum height per show
const DAY_LABEL_WIDTH = 60 // width of day labels column
const HEADER_HEIGHT = 37 // Matches unified height

// Hours from 0h to 23h
const HOURS = Array.from({ length: 24 }, (_, i) => i)

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
            ).map(evt => ({ ...evt, type: 'blocker' as const }))

            // 2. Get Shows for this day
            const dayShows = visibleRepresentations
                .filter(rep => isSameDay(parseISO(rep.start), day))
                .map(rep => representationToTheaterEvent(rep, chosen.has(rep.id)))

            // 3. Merge
            const allDayEvents: CalendarEventType[] = [...dayBlockers, ...dayShows]

            // 4. Compute layout using the centralized algorithm
            const layoutItems = computeEventLayout(allDayEvents)

            // Calculate row height based on the max dimension of any group in the day
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
                                className="shrink-0 relative"
                                style={{ width: HOUR_WIDTH, height: HEADER_HEIGHT }}
                            >
                                {hour !== 0 && (
                                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 text-sm text-muted-foreground">
                                        {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                                    </div>
                                )}
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
                        {dayData.map(({ date: dayDate, rowHeight }) => {
                            const isToday = isSameDay(dayDate, new Date())
                            return (
                                <div
                                    key={dayDate.toISOString()}
                                    className="border-b flex flex-col items-center justify-center p-1"
                                    style={{ height: rowHeight }}
                                >
                                    <span className={cn(
                                        "text-sm font-medium leading-none",
                                        isToday ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {format(dayDate, 'EEE')}
                                    </span>
                                    <span className={cn(
                                        "text-sm font-medium leading-none mt-1",
                                        isToday ? "text-primary font-bold" : "text-foreground"
                                    )}>
                                        {format(dayDate, 'dd')}
                                    </span>
                                </div>
                            )
                        })}
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
                                            className="shrink-0 border-l border-border/50"
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

                                    // Offset from 0h
                                    const left = (startHour - 0) * HOUR_WIDTH
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
