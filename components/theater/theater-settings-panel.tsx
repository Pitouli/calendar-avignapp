'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTheaterContext } from './theater-context'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RiSettings3Line, RiCalendarLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FESTIVAL_DATE_RANGE } from '@/lib/theater-data'
import { GlobalThemeToggle } from '../global/global-theme-toggle'

export default function TheaterSettingsPanel() {
  const {
    plays,
    favorites,
    toggleFavorite,
    dateRange,
    setDateRange,
    simulatedDate,
    setSimulatedDate,
    showOnlyChosen,
    setShowOnlyChosen,
  } = useTheaterContext()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <RiSettings3Line className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Paramètres du calendrier</SheetTitle>
          <SheetDescription>
            Sélectionnez vos pièces favorites et définissez vos filtres.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-4 flex-1 overflow-hidden">
          {/* Display toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-only-chosen" className="text-sm font-medium">
              Afficher uniquement les choix confirmés
            </Label>
            <Switch
              id="show-only-chosen"
              checked={showOnlyChosen}
              onCheckedChange={setShowOnlyChosen}
            />
          </div>

          {/* Simulated date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date simulée (aujourd'hui)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !simulatedDate && 'text-muted-foreground'
                  )}
                >
                  <RiCalendarLine className="mr-2 h-4 w-4" />
                  {simulatedDate ? format(simulatedDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={simulatedDate}
                  onSelect={(date) => date && setSimulatedDate(date)}
                  disabled={(date) =>
                    date < FESTIVAL_DATE_RANGE.start || date > FESTIVAL_DATE_RANGE.end
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Plage de dates</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <RiCalendarLine className="mr-2 h-4 w-4" />
                    {format(dateRange.start, 'd MMM', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => date && setDateRange({ ...dateRange, start: date })}
                    disabled={(date) =>
                      date < FESTIVAL_DATE_RANGE.start ||
                      date > FESTIVAL_DATE_RANGE.end ||
                      date > dateRange.end
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <RiCalendarLine className="mr-2 h-4 w-4" />
                    {format(dateRange.end, 'd MMM', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => date && setDateRange({ ...dateRange, end: date })}
                    disabled={(date) =>
                      date < FESTIVAL_DATE_RANGE.start ||
                      date > FESTIVAL_DATE_RANGE.end ||
                      date < dateRange.start
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Favorites list */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Label className="text-sm font-medium mb-2">
              Pièces favorites ({favorites.size} sélectionnées)
            </Label>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4 space-y-3">
                {plays.map((play) => (
                  <div key={play.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={play.id}
                      checked={favorites.has(play.id)}
                      onCheckedChange={() => toggleFavorite(play.id)}
                    />
                    <Label
                      htmlFor={play.id}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {play.title}
                      <span className="text-muted-foreground ml-2">
                        ({play.duration}min, {play.startTime.hour}h{play.startTime.minute.toString().padStart(2, '0')})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Theme Toggle */}
          <GlobalThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  )
}
