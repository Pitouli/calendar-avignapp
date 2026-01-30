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

interface TheaterShowBlockProps {
  representation: Representation
  className?: string
  showDate?: boolean
  compact?: boolean
}

export default function TheaterShowBlock({
  representation,
  className,
  showDate = false,
  compact = false,
}: TheaterShowBlockProps) {
  const { chosen, toggleChosen } = useTheaterContext()

  const isChosen = chosen.has(representation.id)
  const startTime = parseISO(representation.start)
  const endTime = parseISO(representation.end)

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleChosen(representation.id)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative rounded-md px-2 py-1 text-sm cursor-pointer transition-colors',
              isChosen
                ? 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300',
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
                  isChosen && 'bg-blue-500 hover:bg-blue-600'
                )}
                onClick={handleConfirm}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{representation.playTitle}</p>
          <p className="text-xs">
            {format(startTime, 'EEEE d MMMM', { locale: fr })}
            <br />
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isChosen ? 'Choix confirmé' : 'Cliquer ✓ pour confirmer'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
