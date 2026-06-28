import { getDaysInMonth, getDay } from 'date-fns'
import DayCell from './DayCell'
import TripBlock from './TripBlock'
import type { Trip } from '@/types'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function MonthGrid({ year, month, trips, holidays, covered, today, selection, readOnly, onDayEnter, onDayClick, onTripClick }: {
  year: number; month: number; trips: Trip[]; holidays: Set<string>; covered: Map<string, Trip>; today: string
  selection: { start: string | null; end: string | null }; readOnly: boolean
  onDayEnter: (iso: string) => void; onDayClick: (iso: string) => void; onTripClick: (trip: Trip) => void
}) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const firstDow = (getDay(new Date(year, month - 1, 1)) + 6) % 7 // Monday-first
  const monthTrips = trips.filter((t) => t.startDate <= iso(year, month, daysInMonth) && t.endDate >= iso(year, month, 1))

  const inRange = (d: string) => {
    if (!selection.start) return false
    const end = selection.end ?? selection.start
    const lo = selection.start < end ? selection.start : end
    const hi = selection.start < end ? end : selection.start
    return d >= lo && d <= hi
  }

  return (
    <section className="mb-8">
      <h2 className="mb-2 font-display text-lg font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => <div key={w} className="pb-1">{w}</div>)}
        {Array.from({ length: firstDow }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const d = iso(year, month, day)
          return (
            <DayCell key={d} iso={d} day={day}
              inRange={inRange(d)} isStart={selection.start === d} isEnd={selection.end === d}
              isHoliday={holidays.has(d)} coveredByTrip={covered.get(d)} isToday={today === d} readOnly={readOnly}
              onMouseEnter={() => onDayEnter(d)} onClick={() => onDayClick(d)} />
          )
        })}
      </div>
      {monthTrips.length > 0 && (
        <div className="mt-2 space-y-1">
          {monthTrips.map((t) => <TripBlock key={t.id} trip={t} readOnly={readOnly} onClick={() => onTripClick(t)} />)}
        </div>
      )}
    </section>
  )
}
