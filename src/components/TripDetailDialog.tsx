import { format, parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import { formatWeekday } from '@/lib/dates'
import { typeColor } from '@/components/calendar/TripBlock'
import type { Trip, Location } from '@/types'

function fullDate(date: string): string {
  return `${formatWeekday(date)}, ${format(parseISO(date), 'd MMM yyyy')}`
}

export default function TripDetailDialog({ trip, locations, onClose }: {
  trip: Trip | null
  locations: Location[]
  onClose: () => void
}) {
  if (!trip) return null
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{trip.label}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-base">
          <div>
            <div>{fullDate(trip.startDate)}</div>
            <div>{fullDate(trip.endDate)}</div>
          </div>
          {place && <div className="text-muted">{place}</div>}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', typeColor[trip.type])} />
              {trip.type}
            </span>
            <span className="flex items-center gap-1.5">
              {trip.status === 'confirmed' && <Check className="h-3.5 w-3.5" />}
              {trip.status}
            </span>
          </div>
          {trip.bookings.length > 0 && (
            <div className="space-y-1">
              <div className="font-semibold">Booking checklist</div>
              {trip.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-2">
                  {b.booked
                    ? <Check className="h-4 w-4 shrink-0 text-good" />
                    : <span className="h-4 w-4 shrink-0 rounded-full border border-line" />}
                  <span className="text-muted">{b.category}</span>
                  {b.label && <span>{b.label}</span>}
                </div>
              ))}
            </div>
          )}
          {trip.notes && (
            <div className="rounded-md border border-line bg-surface-elevated p-3 text-muted">{trip.notes}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
