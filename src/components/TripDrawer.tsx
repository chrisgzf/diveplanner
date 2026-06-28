import { useMemo, useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import BookingChecklist from './BookingChecklist'
import LocationPicker from './LocationPicker'
import { useAppStore } from '@/store/useAppStore'
import { hasOverlap } from '@/lib/overlap'
import { leaveDaysByYear } from '@/lib/leave'
import { estimatedDives } from '@/lib/dives'
import { holidaySetFromCache } from '@/lib/holidays'
import type { BookingItem, Trip, TripStatus, TripType } from '@/types'

const TYPES: TripType[] = ['fun-dive', 'course', 'liveaboard', 'non-dive']
const STATUSES: TripStatus[] = ['wishlist', 'planned', 'confirmed']

function seedBookings(type: TripType): BookingItem[] {
  if (type === 'non-dive') return []
  return [
    { id: crypto.randomUUID(), category: 'dive-shop', label: '', booked: false },
    { id: crypto.randomUUID(), category: 'accommodation', label: '', booked: false },
  ]
}

export default function TripDrawer({ open, mode, initialRange, trip, defaultLocationId, onClose }: {
  open: boolean
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
  const { addTrip, updateTrip, deleteTrip, trips, holidays } = useAppStore()
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [type, setType] = useState<TripType>('fun-dive')
  const [status, setStatus] = useState<TripStatus>('planned')
  const [locationId, setLocationId] = useState<string | undefined>(undefined)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [notes, setNotes] = useState('')
  const [diveOverride, setDiveOverride] = useState<number | undefined>(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && trip) {
      setLabel(trip.label); setStart(trip.startDate); setEnd(trip.endDate); setType(trip.type)
      setStatus(trip.status); setLocationId(trip.locationId); setBookings(trip.bookings)
      setNotes(trip.notes ?? ''); setDiveOverride(trip.estimatedDives)
    } else if (initialRange) {
      setLabel(''); setStart(initialRange.start); setEnd(initialRange.end); setType('fun-dive')
      setStatus('planned'); setLocationId(defaultLocationId); setBookings(seedBookings('fun-dive'))
      setNotes(''); setDiveOverride(undefined)
    }
    setError('')
  }, [open, mode, trip, initialRange, defaultLocationId])

  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const leaveByYear = start && end ? leaveDaysByYear(start, end, holidaySet) : {}
  const autoDives = start && end ? estimatedDives(type, start, end) : 0
  const allBooked = bookings.length > 0 && bookings.every((b) => b.booked)

  const onTypeChange = (t: TripType) => {
    setType(t)
    if (t === 'non-dive') setBookings([])
    else if (bookings.length === 0) setBookings(seedBookings(t))
  }

  const save = () => {
    if (!start || !end || start > end) { setError('Please enter a valid date range.'); return }
    const id = mode === 'edit' && trip ? trip.id : crypto.randomUUID()
    if (hasOverlap(trips, start, end, id)) { setError('This range overlaps another trip.'); return }
    const next: Trip = {
      id, label: label.trim() || 'Untitled trip', startDate: start, endDate: end, type, status,
      locationId, bookings: type === 'non-dive' ? [] : bookings, notes: notes.trim() || undefined,
      estimatedDives: diveOverride,
    }
    mode === 'edit' ? updateTrip(next) : addTrip(next)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{mode === 'edit' ? 'Edit trip' : 'New trip'}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label htmlFor="trip-name" className="text-sm font-medium">Trip name</label>
            <input id="trip-name" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" placeholder="Malapascua May 2026" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="start" className="text-sm font-medium">Start</label>
              <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="end" className="text-sm font-medium">End</label>
              <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
            </div>
          </div>

          <LocationPicker value={locationId} onChange={setLocationId} />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm font-medium">Trip type</label>
              <select id="type" value={type} onChange={(e) => onTypeChange(e.target.value as TripType)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as TripStatus)} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {type !== 'non-dive' && <BookingChecklist items={bookings} onChange={setBookings} />}

          {allBooked && status !== 'confirmed' && (
            <button type="button" onClick={() => setStatus('confirmed')} className="text-sm text-primary">
              All booked — mark as confirmed?
            </button>
          )}

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
          </div>

          <div className="rounded-md border border-line bg-surface-elevated p-3 font-mono text-xs">
            <div>Leave: {Object.entries(leaveByYear).map(([y, n]) => `${y}: ${n}d`).join('  ·  ') || '0d'}</div>
            <div className="mt-1 flex items-center gap-2">
              <span>Dives: {diveOverride ?? autoDives}</span>
              <input type="number" min={0} value={diveOverride ?? autoDives}
                onChange={(e) => setDiveOverride(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-16 rounded border border-line px-1 py-0.5" aria-label="estimated dives" />
            </div>
          </div>

          {error && <p className="text-sm text-poor">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={save} className="flex-1">Save</Button>
            {mode === 'edit' && trip && (
              <Button variant="destructive" onClick={() => { deleteTrip(trip.id); onClose() }}>Delete</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
