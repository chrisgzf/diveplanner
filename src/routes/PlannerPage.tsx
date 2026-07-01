import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
import TripsOverview from '@/components/TripsOverview'
import type { Trip } from '@/types'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  const mode = editing ? 'edit' : 'create'
  const close = () => { setPending(null); setEditing(null) }
  const isDesktop = useIsDesktop()
  const calendar = (
    <CalendarView
      onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
      onTripClick={(t) => { setPending(null); setEditing(t) }}
    />
  )
  if (isDesktop) {
    return (
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {/* Desktop: static 60/40 split so opening the panel never reflows the calendar. */}
        <div className="flex gap-6">
          <div className="w-3/5">{calendar}</div>
          <aside className="w-2/5">
            <div className="sticky top-32 rounded-lg border border-line bg-surface-elevated p-4">
              {open ? (
                <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                  mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                  defaultLocationId={defaultLocationId} showClose onClose={close} />
              ) : (
                <TripsOverview onSelect={(t) => { setPending(null); setEditing(t) }} />
              )}
            </div>
          </aside>
        </div>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Mobile/tablet: calendar + Sheet overlay. */}
      {calendar}
      <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
        trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
    </main>
  )
}
