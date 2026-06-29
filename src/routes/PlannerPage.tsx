import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Desktop: inline split. Calendar narrows to ~60% when the panel is open. */}
        <div className="flex gap-6">
          <div className={open ? 'w-3/5' : 'w-full'}>{calendar}</div>
          {open && (
            <aside className="w-2/5">
              <div className="sticky top-32 rounded-lg border border-line bg-surface-elevated p-4">
                <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                  mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                  defaultLocationId={defaultLocationId} onClose={close} />
              </div>
            </aside>
          )}
        </div>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Mobile/tablet: calendar + Sheet overlay. */}
      {calendar}
      <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
        trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
    </main>
  )
}
