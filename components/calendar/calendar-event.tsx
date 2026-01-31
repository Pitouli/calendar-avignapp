'use client'

import { CalendarEvent as CalendarEventType } from '@/components/calendar/calendar-types'
import { useCalendarContext } from '@/components/calendar/calendar-context'
import { useTheaterContext } from '@/components/theater/theater-context'
import { format, isSameDay, isSameMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, MotionConfig, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EventPosition {
  left: string
  width: string
}

// Check if two events overlap
function eventsOverlap(e1: CalendarEventType, e2: CalendarEventType): boolean {
  return e1.start < e2.end && e2.start < e1.end
}

// Find all overlapping events for a given event from a list of events
function getOverlappingEvents(
  target: CalendarEventType,
  allEvents: CalendarEventType[]
): CalendarEventType[] {
  return allEvents.filter(
    (e) => e.id !== target.id && eventsOverlap(target, e) && isSameDay(target.start, e.start)
  )
}

// Calculate visual position (left/width) based on overlaps
function calculateEventPosition(
  event: CalendarEventType,
  allEvents: CalendarEventType[]
): EventPosition {
  const overlappingEvents = getOverlappingEvents(event, allEvents)
  // Sort primarily by start time
  // If start times are equal, blockers come first (to mimic existing behavior or ensures consistency)
  const group = [event, ...overlappingEvents].sort(
    (a, b) => {
      const timeDiff = a.start.getTime() - b.start.getTime()
      if (timeDiff !== 0) return timeDiff
      if (a.id < b.id) return -1
      return 1
    }
  )
  const position = group.indexOf(event)
  const width = `${100 / (overlappingEvents.length + 1)}%`
  const left = `${(100 / (overlappingEvents.length + 1)) * position}%`

  return { left, width }
}

interface CalendarEventProps {
  event: CalendarEventType
  allEvents?: CalendarEventType[] // List of all events for tiling calculations
  month?: boolean
  className?: string
  customPosition?: React.CSSProperties; // Allow full override including left/width
}

export default function CalendarEvent({
  event,
  allEvents = [],
  month = false,
  className,
  customPosition,
}: CalendarEventProps) {
  const { setSelectedEvent, setManageEventDialogOpen, date } = useCalendarContext()
  const { chosen, toggleChosen } = useTheaterContext()

  // If month view, no positioning style.
  // If customPosition provided, use it (and keep left/width unset or handled by parent).
  // Otherwise, use automatic tiling calculation.
  let style: React.CSSProperties = {}

  if (!month) {
    if (customPosition) {
      style = { ...customPosition }
    } else {
      style = calculateEventPosition(event, allEvents)
    }
  }

  // Generate a unique key that includes the current month to prevent animation conflicts
  const isEventInCurrentMonth = isSameMonth(event.start, date)
  const animationKey = `${event.id}-${isEventInCurrentMonth ? 'current' : 'adjacent'
    }`

  const isBlocker = event.type === 'blocker'
  const isTheater = event.type === 'theater'

  // For theater events: check if chosen
  const isChosen = isTheater && chosen.has(event.representationId)

  // Determine color:
  // Blocker: use event.color (default pink usually)
  // Theater: uses 'blue' if chosen, 'amber' if not. (The event object might already have this set by the transformer, but we can enforce it here if needed)
  // The 'color' property on event should be correct from the data source.
  const color = event.color

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isBlocker) {
      setSelectedEvent(event)
      setManageEventDialogOpen(true)
    }
    // Theater events: do nothing on main click
  }

  const handleTheaterConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTheater) {
      toggleChosen(event.representationId)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="popLayout">
        <motion.div
          className={cn(
            `px-3 py-1.5 rounded-md truncate transition-all duration-300 border`,
            // Dynamic color classes
            `bg-${color}-500/10 hover:bg-${color}-500/20 border-${color}-500 text-${color}-500`,
            // Positioning
            !month && 'absolute',
            // Cursor
            isBlocker ? 'cursor-pointer' : 'cursor-default',
            // Hover effect for theater to show it's interactive (via button) or just visual
            isTheater && 'hover:opacity-100', // Override the old hover opacity if needed
            className
          )}
          style={style}
          onClick={handleClick}
          initial={{
            opacity: 0,
            y: -3,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.15 },
          }}
          // Use layoutId for smooth transitions between views, adding month context
          layoutId={animationKey}
        >
          <motion.div
            className={cn(
              `flex flex-col w-full h-full`,
              // Month view layout is row
              month && 'flex-row items-center justify-between h-auto'
            )}
            layout="position"
          >
            {/* Header / Title Row */}
            <div className={cn("flex items-start justify-between gap-2 w-full", month && "items-center")}>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className={cn('font-bold truncate', month && 'text-xs')}>
                  {isTheater ? event.playTitle : event.title}
                </p>

                {/* Time display */}
                <p className={cn('text-sm opacity-90', month && 'text-xs')}>
                  <span>{format(event.start, 'HH:mm')}</span>
                  <span className={cn('mx-1', month && 'hidden')}>-</span>
                  <span className={cn(month && 'hidden')}>
                    {format(event.end, 'HH:mm')}
                  </span>
                </p>
              </div>

              {/* Theater Action Button */}
              {isTheater && !month && (
                <Button
                  size="icon"
                  variant={isChosen ? 'default' : 'outline'}
                  className={cn(
                    'h-6 w-6 shrink-0 z-10', // z-10 to ensure clickable
                    isChosen ? `bg-${color}-500 hover:bg-${color}-600 text-white` : `border-${color}-500 text-${color}-500 hover:bg-${color}-500/10`
                  )}
                  onClick={handleTheaterConfirm}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>

          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
