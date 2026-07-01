import { useMemo } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { formatISO } from '@/lib/dates'
import { estimatedDives } from '@/lib/dives'
import type { Trip } from '@/types'

function diveCount(trip: Trip): number {
  if (trip.type === 'non-dive') return 0
  return trip.estimatedDives ?? estimatedDives(trip.type, trip.startDate, trip.endDate)
}

export default function TripStats({ trips }: { trips: Trip[] }) {
  const today = formatISO(new Date())

  const stats = useMemo(() => {
    const upcoming = trips.filter((t) => t.startDate >= today)
    const past = trips.filter((t) => t.endDate < today)
    const nextTrip = [...upcoming].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    return {
      tripsPlanned: upcoming.length,
      divesPlanned: upcoming.reduce((n, t) => n + diveCount(t), 0),
      daysUntilNext: nextTrip ? differenceInCalendarDays(parseISO(nextTrip.startDate), parseISO(today)) : undefined,
      divesDone: past.reduce((n, t) => n + diveCount(t), 0),
    }
  }, [trips, today])

  const cards: { label: string; value: number }[] = [
    { label: 'Trips planned', value: stats.tripsPlanned },
    { label: 'Dives planned', value: stats.divesPlanned },
  ]
  if (stats.daysUntilNext !== undefined) cards.push({ label: 'Days until next trip', value: stats.daysUntilNext })
  if (stats.divesDone > 0) cards.push({ label: 'Dives done', value: stats.divesDone })

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-semibold">{c.value}</div>
            <div className="text-sm text-muted">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
