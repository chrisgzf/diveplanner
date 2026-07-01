import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
import TripsOverview from '@/components/TripsOverview'
import TripStats from '@/components/TripStats'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAppStore } from '@/store/useAppStore'
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
  const [mobileTab, setMobileTab] = useState<'planner' | 'trips'>('planner')
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  const mode = editing ? 'edit' : 'create'
  const close = () => { setPending(null); setEditing(null) }
  const isDesktop = useIsDesktop()
  const trips = useAppStore((s) => s.trips)
  const selectTrip = (t: Trip) => { setPending(null); setEditing(t) }
  const calendar = (
    <CalendarView
      onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
      onTripClick={selectTrip}
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
                <div className="space-y-4">
                  <TripStats trips={trips} />
                  <TripsOverview onSelect={selectTrip} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Mobile/tablet: Planner/Trips tabs, calendar + Sheet overlay. */}
      <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'planner' | 'trips')}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
        </TabsList>
        <TabsContent value="planner">{calendar}</TabsContent>
        <TabsContent value="trips" className="space-y-4">
          <TripStats trips={trips} />
          <TripsOverview onSelect={selectTrip} />
        </TabsContent>
      </Tabs>
      <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
        trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
    </main>
  )
}
