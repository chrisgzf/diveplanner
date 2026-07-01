import { useMemo } from 'react'
import { parseISO, format } from 'date-fns'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { typeColor } from '@/components/calendar/TripBlock'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { useAppStore } from '@/store/useAppStore'
import { estimatedDives } from '@/lib/dives'
import { leaveDaysInRange } from '@/lib/leave'
import { holidaySetFromCache } from '@/lib/holidays'
import type { Trip, Location } from '@/types'

function tripSummaryParts(t: Trip, locations: Location[], holidaySet: Set<string>) {
  const place = t.locationId ? locations.find((l) => l.id === t.locationId)?.name : t.customLocation
  const dives = t.type === 'non-dive' ? undefined : t.estimatedDives ?? estimatedDives(t.type, t.startDate, t.endDate)
  const excluded = t.excludedLeaveDates ? new Set(t.excludedLeaveDates) : undefined
  const leave = leaveDaysInRange(t.startDate, t.endDate, holidaySet, excluded)
  return { place, dives, leave }
}

function buildSummaryText(trips: Trip[], locations: Location[], holidaySet: Set<string>) {
  const blocks = trips.map((t, i) => {
    const { place, dives, leave } = tripSummaryParts(t, locations, holidaySet)
    const dateRange = `${format(parseISO(t.startDate), 'd MMM yyyy')} – ${format(parseISO(t.endDate), 'd MMM yyyy')}`
    const detail = [
      dateRange,
      place,
      dives !== undefined ? `${dives} dive${dives === 1 ? '' : 's'}` : null,
      leave > 0 ? `${leave} day${leave === 1 ? '' : 's'} leave` : null,
    ].filter((p): p is string => Boolean(p)).join(' · ')
    return `${i + 1}. ${t.label} (${t.status})\n${detail}`
  })
  return `Here is my trip plan so far.\n\n${blocks.join('\n\n')}`
}

export default function TripsOverview({ onSelect }: { onSelect: (trip: Trip) => void }) {
  const trips = useAppStore((s) => s.trips)
  const holidays = useAppStore((s) => s.holidays)
  const locations = useMergedLocations()
  const holidaySet = useMemo(() => holidaySetFromCache(holidays), [holidays])
  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate))

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-base text-muted">
        No trips planned yet — select a date range on the calendar to start stacking some leave for quality time off!
      </p>
    )
  }

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText(sorted, locations, holidaySet))
      toast.success('Trip summary copied to clipboard')
    } catch {
      toast.error('Could not copy summary')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Planned trips</h2>
        <button type="button" onClick={copySummary}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <Copy className="h-3.5 w-3.5" /> Copy Summary
        </button>
      </div>
      <div className="space-y-2">
        {sorted.map((t) => {
          const { place, dives, leave } = tripSummaryParts(t, locations, holidaySet)
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
