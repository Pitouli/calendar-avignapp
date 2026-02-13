"use client";

import { useCalendarContext } from "../../calendar-context";
import { useTheaterContext } from "@/components/theater/theater-context";
import { startOfWeek, addDays, format, parseISO, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useRef } from "react";
import CalendarEvent from "@/components/calendar/calendar-event";
import { CalendarEvent as CalendarEventType } from "@/components/calendar/calendar-types";
import { representationToTheaterEvent } from "@/lib/theater-data";
import { computeEventLayout } from "@/lib/event-layout";
import { cn } from "@/lib/utils";

const HOUR_WIDTH = 300; // pixels per hour
const MIN_ROW_HEIGHT = 45; // minimum height per show
const DAY_LABEL_WIDTH = 60; // width of day labels column
const HEADER_HEIGHT = 37; // Matches unified height

// Hours from 0h to 23h
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarBodyHorizontal() {
  const { date, events } = useCalendarContext();
  const { visibleRepresentations, chosen } = useTheaterContext();

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group representations/events by day and calculate overlaps
  const dayData = useMemo(() => {
    return weekDays.map((day) => {
      // 1. Get Blockers for this day
      const dayBlockers = events
        .filter((event) => isSameDay(event.start, day))
        .map((evt) => ({ ...evt, type: "blocker" as const }));

      // 2. Get Shows for this day
      const dayShows = visibleRepresentations
        .filter((rep) => isSameDay(parseISO(rep.start), day))
        .map((rep) => representationToTheaterEvent(rep, chosen.has(rep.id)));

      // 3. Merge
      const allDayEvents: CalendarEventType[] = [...dayBlockers, ...dayShows];

      // 4. Compute layout using the centralized algorithm
      const layoutItems = computeEventLayout(allDayEvents);

      // Calculate row height based on the max dimension of any group in the day
      const maxLanes =
        layoutItems.length > 0
          ? Math.max(...layoutItems.map((item) => item.totalLanes))
          : 1;

      const rowHeight = Math.max(MIN_ROW_HEIGHT, maxLanes * MIN_ROW_HEIGHT);

      return {
        date: day,
        layoutItems,
        rowHeight,
      };
    });
  }, [weekDays, visibleRepresentations, events, chosen]);

  // Total width for all hours
  const totalWidth = HOURS.length * HOUR_WIDTH;

  return (
    <div
      // Scrolling Viewport
      className="flex-1 relative overflow-auto"
    >
      <div
        // Inner container
        className="min-w-full relative"
        style={{ minWidth: DAY_LABEL_WIDTH + totalWidth }}
      >
        <div
          // Header Row
          className="sticky top-0 flex shrink-0 border-b bg-background z-30"
        >
          <div
            // Corner Cell
            className="shrink-0 border-r bg-background sticky top-0 left-0 z-40"
            style={{ width: DAY_LABEL_WIDTH }}
          />
          {HOURS.map((hour) => (
            <div
              // Hour label Cell
              key={hour}
              className="shrink-0 relative"
              style={{ width: HOUR_WIDTH, height: HEADER_HEIGHT }}
            >
              {hour !== 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                </div>
              )}
            </div>
          ))}
        </div>

        {dayData.map(({ date: dayDate, layoutItems, rowHeight }) => (
          <div
            // Row container
            key={dayDate.toISOString()}
            className="flex border-b"
            style={{ height: rowHeight }}
          >
            <div
              // Day label Cell
              className="shrink-0 border-r bg-background sticky left-0 z-20 flex flex-col items-center justify-center p-1"
              style={{ width: DAY_LABEL_WIDTH }}
            >
              <span
                className={cn(
                  "text-sm font-medium leading-none",
                  isSameDay(dayDate, new Date())
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {format(dayDate, "EEE")}
              </span>
              <span
                className={cn(
                  "text-sm font-medium leading-none mt-1",
                  isSameDay(dayDate, new Date())
                    ? "text-primary font-bold"
                    : "text-foreground",
                )}
              >
                {format(dayDate, "dd")}
              </span>
            </div>

            <div
              // Events container
              className="relative my-3"
              style={{
                width: totalWidth,
                backgroundImage: `linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px)`,
                backgroundSize: `${HOUR_WIDTH}px 100%`,
                backgroundPositionX: "-1px",
              }}
            >
              {layoutItems.map(({ event, lane, totalLanes }) => {
                const startTime = event.start;
                const endTime = event.end;

                const startHour =
                  startTime.getHours() + startTime.getMinutes() / 60;
                const endHour = endTime.getHours() + endTime.getMinutes() / 60;

                // Offset from 0h
                const left = (startHour - 0) * HOUR_WIDTH;
                const width = (endHour - startHour) * HOUR_WIDTH;

                const topPercentage = (lane / totalLanes) * 100;
                const heightPercentage = (1 / totalLanes) * 100;

                // Minimum width for visibility
                const finalWidth = Math.max(width, 60);

                return (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    customPosition={{
                      left: `${left}px`,
                      width: `${finalWidth}px`,
                      top: `${topPercentage}%`,
                      height: `${heightPercentage}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
