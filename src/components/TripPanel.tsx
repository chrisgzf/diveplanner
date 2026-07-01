import { useMemo, useState, useEffect } from 'react'
import { randomUUID } from '@/lib/uuid'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import BookingChecklist from './BookingChecklist'
import LocationPicker from './LocationPicker'
import LeaveBreakdown from './LeaveBreakdown'
import { useAppStore } from '@/store/useAppStore'
import { hasOverlap } from '@/lib/overlap'
import { segmentDays } from '@/lib/leave'
import { estimatedDives } from '@/lib/dives'
import { holidayNameMap } from '@/lib/holidays'
import { monthsInRange, enumerateDays, formatWeekday } from '@/lib/dates'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import type { BookingItem, Trip, TripStatus, TripType } from '@/types'

const TYPES: TripType[] = ['fun-dive', 'course', 'liveaboard', 'non-dive']
const STATUSES: TripStatus[] = ['wishlist', 'planned', 'confirmed']

function seedBookings(type: TripType): BookingItem[] {
  if (type === 'non-dive') return []
  return [
    { id: randomUUID(), category: 'dive-shop', label: '', booked: false },
    { id: randomUUID(), category: 'accommodation', label: '', booked: false },
  ]
}

export default function TripPanel({ mode, initialRange, trip, defaultLocationId, showClose = false, onClose }: {
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  showClose?: boolean
  onClose: () => void
}) {
  const { addTrip, updateTrip, deleteTrip, trips, holidays } = useAppStore()
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState<TripType>('fun-dive')
  const [status, setStatus] = useState<TripStatus>('wishlist')
  const [locationId, setLocationId] = useState<string | undefined>(undefined)
  const [customLocation, setCustomLocation] = useState<string | undefined>(undefined)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [notes, setNotes] = useState('')
  const [diveOverride, setDiveOverride] = useState<number | undefined>(undefined)
  const [excludedLeaveDates, setExcludedLeaveDates] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'edit' && trip) {
      setLabel(trip.label); setStart(trip.startDate); setEnd(trip.endDate); setType(trip.type)
      setStatus(trip.status); setLocationId(trip.locationId); setCustomLocation(trip.customLocation); setBookings(trip.bookings)
      setNotes(trip.notes ?? ''); setDiveOverride(trip.estimatedDives); setExcludedLeaveDates(trip.excludedLeaveDates ?? [])
    } else if (initialRange) {
      setLabel(''); setStart(initialRange.start); setEnd(initialRange.end); setType('fun-dive')
      setStatus('wishlist'); setLocationId(defaultLocationId); setCustomLocation(undefined); setBookings(seedBookings('fun-dive'))
      setNotes(''); setDiveOverride(undefined); setExcludedLeaveDates([])
    }
    setError('')
  }, [mode, trip, initialRange, defaultLocationId])

  useEffect(() => {
    if (!showClose) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showClose, onClose])

  const names = useMemo(() => holidayNameMap(holidays), [holidays])
  const segments = start && end && start <= end ? segmentDays(start, end, names) : []
  const leaveDates = useMemo(() => segments.filter((s) => s.kind === 'leave').flatMap((s) => enumerateDays(s.startDate, s.endDate)), [segments])
  const excludedCount = leaveDates.filter((d) => excludedLeaveDates.includes(d)).length
  const totalLeave = segments.reduce((n, s) => n + s.leaveDays, 0) - excludedCount
  const totalDays = segments.reduce((n, s) => n + s.days, 0)
  const autoDives = start && end ? estimatedDives(type, start, end) : 0
  const allBooked = bookings.length > 0 && bookings.every((b) => b.booked)

  const allLocations = useMergedLocations()
  const conditions = useMemo(() => {
    if (type === 'non-dive' || !start || !end) return { good: [] as string[], fair: [] as string[] }
    const months = monthsInRange(start, end)
    const good: string[] = []
    const fair: string[] = []
    for (const loc of allLocations) {
      const ratings = months.map((m) => loc.seasonality.find((s) => s.month === m)?.rating)
      if (ratings.includes('good')) good.push(loc.name)
      else if (ratings.includes('fair')) fair.push(loc.name)
    }
    return { good, fair }
  }, [type, start, end, allLocations])

  const onTypeChange = (t: TripType) => {
    setType(t)
    if (t === 'non-dive') setBookings([])
    else if (bookings.length === 0) setBookings(seedBookings(t))
  }

  const save = () => {
    if (!start || !end || start > end) { setError('Please enter a valid date range.'); return }
    const id = mode === 'edit' && trip ? trip.id : randomUUID()
    if (hasOverlap(trips, start, end, id)) { setError('This range overlaps another trip.'); return }
    const next: Trip = {
      id, label: label.trim() || 'Untitled trip', startDate: start, endDate: end, type, status,
      locationId, customLocation: customLocation?.trim() || undefined,
      bookings: type === 'non-dive' ? [] : bookings, notes: notes.trim() || undefined,
      estimatedDives: diveOverride,
      // Drop any excluded dates that fell outside the range after an edit.
      excludedLeaveDates: excludedLeaveDates.filter((d) => leaveDates.includes(d)),
    }
    mode === 'edit' ? updateTrip(next) : addTrip(next)
    onClose()
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{mode === 'edit' ? 'Edit trip' : 'New trip'}</h2>
        {showClose && (
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-4 py-4">
        <div className="space-y-1">
          <label htmlFor="trip-name" className="text-base font-medium">Trip name</label>
          <Input id="trip-name" value={label} onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base" placeholder="e.g. Malapascua May 2026" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <label htmlFor="start" className="text-base font-medium">Start (inclusive)</label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full min-w-0 rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
            {start && <p className="text-sm text-muted">{formatWeekday(start)}</p>}
          </div>
          <div className="min-w-0 space-y-1">
            <label htmlFor="end" className="text-base font-medium">End (inclusive)</label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full min-w-0 rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
            {end && <p className="text-sm text-muted">{formatWeekday(end)}</p>}
          </div>
        </div>

        <LocationPicker value={locationId} customValue={customLocation}
          onChange={(id, custom) => { setLocationId(id); setCustomLocation(custom) }} />

        {type !== 'non-dive' && (conditions.good.length > 0 || conditions.fair.length > 0) && (
          <div className="rounded-md border border-line bg-surface-elevated p-3 text-sm">
            <div className="mb-1 font-medium">Dive conditions</div>
            {conditions.good.length > 0 && (
              <div className="mb-1"><span className="font-semibold text-good">Good for diving</span><div className="text-muted">· {conditions.good.join(' · ')}</div></div>
            )}
            {conditions.fair.length > 0 && (
              <div><span className="font-semibold text-fair">Fair</span><div className="text-muted">· {conditions.fair.join(' · ')}</div></div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="type" className="text-base font-medium">Trip type</label>
            <Select value={type} onValueChange={(v) => onTypeChange(v as TripType)}>
              <SelectTrigger id="type" className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-base font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as TripStatus)}>
              <SelectTrigger id="status" className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {type !== 'non-dive' && <BookingChecklist items={bookings} onChange={setBookings} />}

        {allBooked && status !== 'confirmed' && (
          <button type="button" onClick={() => setStatus('confirmed')} className="text-base text-primary">
            All booked — mark as confirmed?
          </button>
        )}

        <div className="space-y-1">
          <label htmlFor="notes" className="text-base font-medium">Notes</label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
        </div>

        <div className="rounded-md border border-line bg-surface-elevated p-3 font-mono text-sm">
          <LeaveBreakdown segments={segments} excludedLeaveDates={excludedLeaveDates} onChange={setExcludedLeaveDates} />
          {segments.length > 0 && (
            <div className="mt-1 space-y-0.5 border-t border-line pt-1">
              <div>Total leave used: {totalLeave} day{totalLeave === 1 ? '' : 's'}</div>
              <div>Total days on trip: {totalDays} day{totalDays === 1 ? '' : 's'}</div>
            </div>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span>Dives:</span>
            <Input type="number" min={0} value={diveOverride ?? autoDives}
              onChange={(e) => setDiveOverride(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-16 rounded border-line px-1 py-0.5" aria-label="estimated dives" />
          </div>
        </div>

        {error && <p className="text-base text-poor">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={save} className="flex-1">Save</Button>
          {mode === 'edit' && trip && (
            <Button variant="destructive" onClick={() => { deleteTrip(trip.id); onClose() }}>Delete</Button>
          )}
        </div>
      </div>
    </>
  )
}
