import { useCalendarContext } from '../calendar-context'
import CalendarBodyDay from './day/calendar-body-day'
import CalendarBodyWeek from './week/calendar-body-week'
import CalendarBodyHorizontal from './horizontal/calendar-body-horizontal'
import CalendarBodyMonth from './month/calendar-body-month'

export default function CalendarBody() {
  const { mode } = useCalendarContext()

  return (
    <>
      {mode === 'day' && <CalendarBodyDay />}
      {mode === 'week' && <CalendarBodyWeek />}
      {mode === 'horizontal' && <CalendarBodyHorizontal />}
      {mode === 'month' && <CalendarBodyMonth />}
    </>
  )
}

