'use client'

import { useState, useMemo, ReactNode } from 'react'
import { TheaterContext, TheaterContextType } from './theater-context'
import { Play, Representation } from '@/lib/theater-types'
import { CalendarEvent } from '@/components/calendar/calendar-types'
import {
    getPlays,
    generateRepresentations,
    getRepresentationsInRange,
    representationsOverlap,
    FESTIVAL_DATE_RANGE
} from '@/lib/theater-data'

interface TheaterProviderProps {
    children: ReactNode
    events: CalendarEvent[]
    setEvents: (events: CalendarEvent[]) => void
}

// Check if a calendar event overlaps with a representation
function eventOverlapsRepresentation(event: CalendarEvent, rep: Representation): boolean {
    const repStart = new Date(rep.start).getTime()
    const repEnd = new Date(rep.end).getTime()
    const eventStart = event.start.getTime()
    const eventEnd = event.end.getTime()

    return eventStart < repEnd && eventEnd > repStart
}

export default function TheaterProvider({ children, events, setEvents }: TheaterProviderProps) {
    // Load plays and generate representations once
    const [plays] = useState<Play[]>(() => getPlays())
    const [allRepresentations] = useState<Representation[]>(() => generateRepresentations(plays))

    // User selections
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [chosen, setChosen] = useState<Set<string>>(new Set())

    // Filters
    const [dateRange, setDateRange] = useState({
        start: FESTIVAL_DATE_RANGE.start,
        end: FESTIVAL_DATE_RANGE.end,
    })
    const [simulatedDate, setSimulatedDate] = useState(FESTIVAL_DATE_RANGE.start)
    const [showOnlyChosen, setShowOnlyChosen] = useState(false)

    // Toggle favorite for a play
    const toggleFavorite = (playId: string) => {
        setFavorites(prev => {
            const next = new Set(prev)
            if (next.has(playId)) {
                next.delete(playId)
            } else {
                next.add(playId)
            }
            return next
        })
    }

    // Toggle chosen for a representation
    const toggleChosen = (representationId: string) => {
        setChosen(prev => {
            const next = new Set(prev)
            if (next.has(representationId)) {
                next.delete(representationId)
            } else {
                next.add(representationId)
            }
            return next
        })
    }

    // Filter representations by date range
    const representationsInRange = useMemo(() =>
        getRepresentationsInRange(allRepresentations, dateRange.start, dateRange.end),
        [allRepresentations, dateRange]
    )

    // Compute hidden representation IDs (conflicts + other reps of chosen plays + blocked by events)
    const hiddenRepresentationIds = useMemo(() => {
        const hidden = new Set<string>()

        const chosenReps = representationsInRange.filter(rep => chosen.has(rep.id))

        for (const chosenRep of chosenReps) {
            // Hide other representations of the same play
            for (const rep of representationsInRange) {
                if (rep.playId === chosenRep.playId && rep.id !== chosenRep.id) {
                    hidden.add(rep.id)
                }
            }

            // Hide conflicting representations
            for (const rep of representationsInRange) {
                if (rep.id !== chosenRep.id && representationsOverlap(chosenRep, rep)) {
                    hidden.add(rep.id)
                }
            }
        }

        // Hide "interested" (non-chosen) representations that are blocked by events
        for (const rep of representationsInRange) {
            // Skip if already hidden or if it's chosen (chosen shows are never blocked)
            if (hidden.has(rep.id) || chosen.has(rep.id)) {
                continue
            }

            // Check if any event overlaps this representation
            for (const event of events) {
                if (eventOverlapsRepresentation(event, rep)) {
                    hidden.add(rep.id)
                    break
                }
            }
        }

        return hidden
    }, [representationsInRange, chosen, events])

    // Compute visible representations
    const visibleRepresentations = useMemo(() => {
        return representationsInRange.filter(rep => {
            // Filter by favorite plays
            if (!favorites.has(rep.playId)) {
                return false
            }

            // If showing only chosen, filter out non-chosen
            if (showOnlyChosen && !chosen.has(rep.id)) {
                return false
            }

            // Don't show if hidden due to conflicts (unless it's chosen)
            if (hiddenRepresentationIds.has(rep.id) && !chosen.has(rep.id)) {
                return false
            }

            return true
        })
    }, [representationsInRange, favorites, chosen, showOnlyChosen, hiddenRepresentationIds])

    const value: TheaterContextType = {
        plays,
        representations: allRepresentations,
        events,
        setEvents,
        favorites,
        toggleFavorite,
        chosen,
        toggleChosen,
        dateRange,
        setDateRange,
        simulatedDate,
        setSimulatedDate,
        showOnlyChosen,
        setShowOnlyChosen,
        visibleRepresentations,
        hiddenRepresentationIds,
    }

    return (
        <TheaterContext.Provider value={value}>
            {children}
        </TheaterContext.Provider>
    )
}
