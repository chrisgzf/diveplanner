import { useMemo } from 'react'
import { parseISO, format } from 'date-fns'
import { cn } from '@/lib/cn'
import { typeColor } from '@/components/calendar/TripBlock'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { useAppStore } from '@/store/useAppStore'
import { estimatedDives } from '@/lib/dives'
import { leaveDaysInRange } from '@/lib/leave'
import { holidaySetFromCache } from '@/lib/holidays'
import type { Trip } from '@/types'

export default function TripsOverview({ onSelect }: { onSelect: (trip: Trip) => void }) {
  const trips = useAppStore((s) => s.trips)
  const holidays = useAppStore((s) => s.holidays)
  const locations = useMergedLocations()
  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate))

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-base text-muted">
        Select a date range on the calendar, or click an existing trip, to see details here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Planned trips</h2>
      <div className="space-y-2">
        {sorted.map((t) => {
          const place = t.locationId ? locations.find((l) => l.id === t.locationId)?.name : t.customLocation
          const dives = t.type === 'non-dive' ? undefined : t.estimatedDives ?? estimatedDives(t.type, t.startDate, t.endDate)
          const excluded = t.excludedLeaveDates ? new Set(t.excludedLeaveDates) : undefined
          const leave = leaveDaysInRange(t.startDate, t.endDate, holidaySet, excluded)
          const lgParts = [
            dives !== undefined ? `${dives} dive${dives === 1 ? '' : 's'}` : null,
            leave > 0 ? `${leave} day${leave === 1 ? '' : 's'} leave` : null,
          ].filter((p): p is string => p !== null)
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t)}
              className="flex w-full flex-col gap-0.5 rounded-md border border-line px-3 py-2 text-left transition-colors hover:border-primary">
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', typeColor[t.type])} />
                <span className="truncate text-base font-medium">{t.label}</span>
              </span>
              <span className="pl-4 text-sm text-muted">
                {format(parseISO(t.startDate), 'd MMM yyyy')} – {format(parseISO(t.endDate), 'd MMM yyyy')}
                {place && ` · ${place}`}
                {lgParts.length > 0 && <span className="hidden lg:inline"> · {lgParts.join(' · ')}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
