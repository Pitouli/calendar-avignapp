'use client'

import { useCalendarContext } from '../../calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import { startOfWeek, addDays, format, parseISO, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo, useRef, useState } from 'react'
import TheaterShowEvent from '@/components/theater/theater-show-event'
import { Representation } from '@/lib/theater-types'


const HOUR_WIDTH = 300 // pixels per hour
const MIN_ROW_HEIGHT = 45 // minimum height per show
const DAY_LABEL_WIDTH = 60 // width of day labels column
const HEADER_HEIGHT = 40 // height of hour headers

// Hours from 8h to 24h (we show 8-24 for theater)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 8) // 8, 9, 10, ..., 24

export default function CalendarBodyHorizontal() {
    const { date } = useCalendarContext()
    const { visibleRepresentations, chosen } = useTheaterContext()

    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [scrollTop, setScrollTop] = useState(0)

    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    // Group representations by day and calculate overlaps
    const dayData = useMemo(() => {
        return weekDays.map(day => {
            const dayReps = visibleRepresentations.filter(rep =>
                isSameDay(parseISO(rep.start), day)
            )

            // Calculate max overlapping at any point in time
            const maxOverlap = calculateMaxOverlap(dayReps)
            const rowHeight = Math.max(MIN_ROW_HEIGHT, maxOverlap * MIN_ROW_HEIGHT)

            // Assign vertical positions to each representation
            const repsWithPositions = assignVerticalPositions(dayReps)

            return {
                date: day,
                representations: repsWithPositions,
                maxOverlap,
                rowHeight,
            }
        })
    }, [weekDays, visibleRepresentations])

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
                        {dayData.map(({ date: dayDate, representations, rowHeight, maxOverlap }) => (
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

                                {/* Representations */}
                                {representations.map(({ rep, lane, totalLanes }) => {
                                    const startTime = parseISO(rep.start)
                                    const endTime = parseISO(rep.end)

                                    const startHour = startTime.getHours() + startTime.getMinutes() / 60
                                    const endHour = endTime.getHours() + endTime.getMinutes() / 60

                                    const left = (startHour - 8) * HOUR_WIDTH
                                    const width = (endHour - startHour) * HOUR_WIDTH
                                    const laneHeight = rowHeight / totalLanes
                                    const top = lane * laneHeight

                                    const isChosen = chosen.has(rep.id)

                                    return (
                                        <div
                                            key={rep.id}
                                            className="absolute p-0.5"
                                            style={{
                                                left,
                                                width: Math.max(width, 60),
                                                top,
                                                height: laneHeight,
                                            }}
                                        >
                                            <TheaterShowEvent
                                                representation={rep}
                                                className="h-full"
                                                compact={laneHeight < 50}
                                            />
                                        </div>
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

// Calculate maximum number of overlapping representations at any point
function calculateMaxOverlap(reps: Representation[]): number {
    if (reps.length === 0) return 1

    // Create events for start and end times
    const events: { time: number; type: 'start' | 'end' }[] = []

    for (const rep of reps) {
        events.push({ time: new Date(rep.start).getTime(), type: 'start' })
        events.push({ time: new Date(rep.end).getTime(), type: 'end' })
    }

    // Sort events by time, with 'end' coming before 'start' at the same time
    events.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time
        return a.type === 'end' ? -1 : 1
    })

    let current = 0
    let max = 0

    for (const event of events) {
        if (event.type === 'start') {
            current++
            max = Math.max(max, current)
        } else {
            current--
        }
    }

    return Math.max(max, 1)
}

// Assign vertical lane positions to representations
function assignVerticalPositions(reps: Representation[]): { rep: Representation; lane: number; totalLanes: number }[] {
    if (reps.length === 0) return []

    // Sort by start time
    const sorted = [...reps].sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    const lanes: { end: number }[] = []
    const result: { rep: Representation; lane: number; totalLanes: number }[] = []

    for (const rep of sorted) {
        const startTime = new Date(rep.start).getTime()

        // Find a free lane
        let lane = lanes.findIndex(l => l.end <= startTime)

        if (lane === -1) {
            lane = lanes.length
            lanes.push({ end: 0 })
        }

        lanes[lane].end = new Date(rep.end).getTime()
        result.push({ rep, lane, totalLanes: 0 }) // totalLanes will be set later
    }

    // Set totalLanes for all
    const totalLanes = lanes.length
    for (const item of result) {
        item.totalLanes = totalLanes
    }

    return result
}
