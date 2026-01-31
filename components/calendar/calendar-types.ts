export type CalendarProps = {
  events: CalendarEvent[]
  setEvents: (events: CalendarEvent[]) => void
  mode: Mode
  setMode: (mode: Mode) => void
  date: Date
  setDate: (date: Date) => void
  calendarIconIsToday?: boolean
  settingsPanel?: React.ReactNode
}

export type CalendarContextType = CalendarProps & {
  newEventDialogOpen: boolean
  setNewEventDialogOpen: (open: boolean) => void
  manageEventDialogOpen: boolean
  setManageEventDialogOpen: (open: boolean) => void
  selectedEvent: CalendarEvent | null
  setSelectedEvent: (event: CalendarEvent | null) => void
}

export type BaseCalendarEvent = {
  id: string
  title: string
  color: string
  start: Date
  end: Date
}

export type BlockerEvent = BaseCalendarEvent & {
  type: 'blocker'
}

export type TheaterEvent = BaseCalendarEvent & {
  type: 'theater'
  representationId: string
  playTitle: string
}

export type CalendarEvent = BlockerEvent | TheaterEvent

export const calendarModes = ['day', 'week', 'horizontal', 'month'] as const
export type Mode = (typeof calendarModes)[number]
