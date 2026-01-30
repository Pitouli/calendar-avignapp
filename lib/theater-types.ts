// Theater types for Festival d'Avignon calendar

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday, 1 = Monday, etc.

export type SchedulePattern = 
  | { type: 'daily' }
  | { type: 'daily-except'; exceptDay: DayOfWeek }
  | { type: 'every-other-day'; startOffset: 0 | 1 }
  | { type: 'specific-days'; days: DayOfWeek[] }

export interface Play {
  id: string
  title: string
  duration: number // in minutes (45-90)
  startTime: { hour: number; minute: number } // Fixed daily start time
  schedule: SchedulePattern
}

export interface Representation {
  id: string
  playId: string
  playTitle: string
  date: string // ISO date string (YYYY-MM-DD)
  start: string // ISO datetime string  
  end: string // ISO datetime string
}

// State types for the theater context
export interface TheaterState {
  plays: Play[]
  representations: Representation[]
  favorites: Set<string> // Play IDs
  chosen: Set<string> // Representation IDs
  dateRange: {
    start: Date
    end: Date
  }
  simulatedDate: Date
  showOnlyChosen: boolean
}
