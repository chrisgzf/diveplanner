import { useMemo, useState } from 'react'
import { calendarWindow, formatISO, enumerateDays } from '@/lib/dates'
import { coveredDays } from '@/lib/overlap'
import { holidaySetFromCache } from '@/lib/holidays'
import { useAppStore } from '@/store/useAppStore'
import MonthGrid from './MonthGrid'
import type { Trip, ISODate } from '@/types'

export default function CalendarView({ readOnly = false, trips: tripsProp, holidays: holidaysProp, onRangeSelected, onTripClick }: {
  readOnly?: boolean
  trips?: Trip[]
  holidays?: Record<string, ISODate[]>
  onRangeSelected?: (start: string, end: string) => void
  onTripClick?: (trip: Trip) => void
}) {
  const storeTrips = useAppStore((s) => s.trips)
  const storeHolidays = useAppStore((s) => s.holidays)
  const trips = tripsProp ?? storeTrips
  const holidays = holidaysProp ?? storeHolidays
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  const window = useMemo(() => calendarWindow(new Date()), [])
  const today = formatISO(new Date())
  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const covered = useMemo(() => coveredDays(trips), [trips])

  // A preview that would cross a covered day is rejected (no overlap allowed).
  const previewValid = (end: string) => {
    if (!anchor) return true
    const [lo, hi] = anchor < end ? [anchor, end] : [end, anchor]
    return !enumerateDays(lo, hi).some((d) => covered.has(d))
  }

  const handleDayClick = (d: string) => {
    if (readOnly) return
    if (!anchor) { setAnchor(d); setHover(d); return }
    if (!previewValid(d)) return
    const [start, end] = anchor < d ? [anchor, d] : [d, anchor]
    setAnchor(null); setHover(null)
    onRangeSelected?.(start, end)
  }

  const handleDayEnter = (d: string) => {
    if (readOnly || !anchor) return
    setHover(previewValid(d) ? d : anchor)
  }

  const selection = { start: anchor, end: anchor ? hover : null }

  return (
    <div>
      {window.map(({ year, month }) => (
        <MonthGrid key={`${year}-${month}`} year={year} month={month}
          trips={trips} holidays={holidaySet} covered={covered} today={today}
          selection={selection} readOnly={readOnly}
          onDayEnter={handleDayEnter} onDayClick={handleDayClick}
          onTripClick={(t) => onTripClick?.(t)} />
      ))}
    </div>
  )
}
