import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import type { Trip } from '@/types'

const typeColor: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive', course: 'bg-course', liveaboard: 'bg-liveaboard', 'non-dive': 'bg-non-dive',
}

export default function TripBlock({ trip, onClick, readOnly }: { trip: Trip; onClick?: () => void; readOnly?: boolean }) {
  const locations = useMergedLocations()
  const place = trip.locationId ? locations.find((l) => l.id === trip.locationId)?.name : trip.customLocation
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-left text-xs font-medium text-white',
        typeColor[trip.type],
        trip.status === 'wishlist' && 'border border-dashed border-white/70 bg-opacity-60',
        trip.status === 'confirmed' && 'ring-1 ring-white/40',
      )}
    >
      {trip.status === 'confirmed' && <Check className="h-3 w-3 shrink-0" />}
      <span className="truncate">{trip.label}</span>
      {place && <span className="truncate text-white/70">· {place}</span>}
    </button>
  )
}
