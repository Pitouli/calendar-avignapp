'use client'

import { createContext, useContext } from 'react'
import { Play, Representation } from '@/lib/theater-types'

export interface TheaterContextType {
    // Data
    plays: Play[]
    representations: Representation[]

    // Favorites (plays the user wants to see)
    favorites: Set<string>
    toggleFavorite: (playId: string) => void

    // Chosen representations (confirmed attendance)
    chosen: Set<string>
    toggleChosen: (representationId: string) => void

    // Date range filter
    dateRange: { start: Date; end: Date }
    setDateRange: (range: { start: Date; end: Date }) => void

    // Simulated "today" date
    simulatedDate: Date
    setSimulatedDate: (date: Date) => void

    // Display toggle
    showOnlyChosen: boolean
    setShowOnlyChosen: (value: boolean) => void

    // Computed: representations that should be visible
    visibleRepresentations: Representation[]

    // Computed: representations hidden due to conflicts or already chosen play
    hiddenRepresentationIds: Set<string>
}

export const TheaterContext = createContext<TheaterContextType | null>(null)

export function useTheaterContext() {
    const context = useContext(TheaterContext)
    if (!context) {
        throw new Error('useTheaterContext must be used within a TheaterProvider')
    }
    return context
}
