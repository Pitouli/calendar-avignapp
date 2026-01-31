
import { CalendarEvent } from '@/components/calendar/calendar-types'

export interface EventLayout {
    event: CalendarEvent
    lane: number
    totalLanes: number
}

/**
 * Computes the visual layout for a set of events.
 * 
 * Algorithm:
 * 1. Sort events by start time.
 * 2. Cluster events into disjoint overlapping groups.
 * 3. within each group, assign lanes using a "First Fit" packing strategy.
 * 4. "Expand" the group: All events in a group share the same width (or height), determined by the max number of concurrent lanes needed.
 */
export function computeEventLayout(events: CalendarEvent[]): EventLayout[] {
    if (events.length === 0) return []

    // 1. Sort by start time, then by longer duration first (heuristic for better packing)
    const sortedEvents = [...events].sort((a, b) => {
        const startDiff = a.start.getTime() - b.start.getTime()
        if (startDiff !== 0) return startDiff
        return b.end.getTime() - a.end.getTime()
    })

    const results: EventLayout[] = []

    // 2. Cluster into groups
    let currentGroup: CalendarEvent[] = []
    let groupEnd = 0

    for (const event of sortedEvents) {
        if (currentGroup.length === 0) {
            currentGroup.push(event)
            groupEnd = event.end.getTime()
        } else {
            if (event.start.getTime() < groupEnd) {
                // Overlaps with the current group (extends group)
                currentGroup.push(event)
                groupEnd = Math.max(groupEnd, event.end.getTime())
            } else {
                // New disjoint group starting
                results.push(...layoutGroup(currentGroup))
                currentGroup = [event]
                groupEnd = event.end.getTime()
            }
        }
    }
    // Process final group
    if (currentGroup.length > 0) {
        results.push(...layoutGroup(currentGroup))
    }

    return results
}

function layoutGroup(group: CalendarEvent[]): EventLayout[] {
    // 3. Pack columns
    // lanes[i] stores the end time of the last event in lane i
    const lanes: number[] = []
    const placements: { event: CalendarEvent; lane: number }[] = []

    for (const event of group) {
        const start = event.start.getTime()
        let placed = false

        // Find the first lane where this event fits
        for (let i = 0; i < lanes.length; i++) {
            // If the lane is free (last event ended before this one starts)
            // We add a tiny buffer if needed, but strictly < is usually fine
            if (lanes[i] <= start) {
                lanes[i] = event.end.getTime()
                placements.push({ event, lane: i })
                placed = true
                break
            }
        }

        // If it didn't fit in any existing lane, add a new one
        if (!placed) {
            lanes.push(event.end.getTime())
            placements.push({ event, lane: lanes.length - 1 })
        }
    }

    // 4. Return results with total lanes for this group
    const totalLanes = lanes.length
    return placements.map(p => ({
        event: p.event,
        lane: p.lane,
        totalLanes
    }))
}
