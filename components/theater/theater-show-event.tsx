'use client'

import { Button } from '@/components/ui/button'
import { useTheaterContext } from './theater-context'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Representation } from '@/lib/theater-types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TheaterShowEventProps {
  representation: Representation
  className?: string
  showDate?: boolean
  compact?: boolean
}

export default function TheaterShowEvent({
  representation,
  className,
  showDate = false,
  compact = false,
}: TheaterShowEventProps) {
  const { chosen, toggleChosen } = useTheaterContext()

  const isChosen = chosen.has(representation.id)
  const startTime = parseISO(representation.start)
  const endTime = parseISO(representation.end)

  // Colors from colorOptions: amber for interested, blue for chosen
  const colorValue = isChosen ? 'blue' : 'amber'

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleChosen(representation.id)
  }

  return (
    <div
      className={cn(
        'relative rounded-md px-2 py-1 text-sm cursor-pointer transition-colors border',
        `bg-${colorValue}-500/10 hover:bg-${colorValue}-500/20 border-${colorValue}-500 text-${colorValue}-500`,
        'hover:opacity-80',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={cn('font-medium truncate', compact && 'text-xs')}>
            {representation.playTitle}
          </p>
          {!compact && (
            <p className="text-xs opacity-70">
              {showDate && format(startTime, 'd MMM', { locale: fr })} {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant={isChosen ? 'default' : 'outline'}
          className={cn(
            'h-6 w-6 shrink-0',
            isChosen && `bg-${colorValue}-500 hover:bg-${colorValue}-600`
          )}
          onClick={handleConfirm}
        >
          <Check className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
