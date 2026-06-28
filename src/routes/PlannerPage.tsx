import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <CalendarView
        onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
        onTripClick={(t) => { setPending(null); setEditing(t) }}
      />
      <TripDrawer
        open={open}
        mode={editing ? 'edit' : 'create'}
        initialRange={pending ?? undefined}
        trip={editing ?? undefined}
        defaultLocationId={defaultLocationId}
        onClose={() => { setPending(null); setEditing(null) }}
      />
    </main>
  )
}
