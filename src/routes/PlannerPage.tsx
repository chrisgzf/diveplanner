import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarView from '@/components/calendar/CalendarView'
import TripDrawer from '@/components/TripDrawer'
import TripPanel from '@/components/TripPanel'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)
  const open = pending !== null || editing !== null
  const [params] = useSearchParams()
  const defaultLocationId = params.get('location') ?? undefined
  const mode = editing ? 'edit' : 'create'
  const close = () => { setPending(null); setEditing(null) }
  const calendar = (
    <CalendarView
      onRangeSelected={(start, end) => { setEditing(null); setPending({ start, end }) }}
      onTripClick={(t) => { setPending(null); setEditing(t) }}
    />
  )
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Desktop: inline split. Calendar narrows to ~60% when the panel is open. */}
      <div className="hidden lg:flex lg:gap-6">
        <div className={open ? 'lg:w-3/5' : 'w-full'}>{calendar}</div>
        {open && (
          <aside className="lg:w-2/5">
            <div className="sticky top-32 rounded-lg border border-line bg-surface-elevated p-4">
              <TripPanel key={editing?.id ?? `${pending?.start}-${pending?.end}`}
                mode={mode} initialRange={pending ?? undefined} trip={editing ?? undefined}
                defaultLocationId={defaultLocationId} onClose={close} />
            </div>
          </aside>
        )}
      </div>
      {/* Mobile/tablet: calendar + Sheet overlay. */}
      <div className="lg:hidden">
        {calendar}
        <TripDrawer open={open} mode={mode} initialRange={pending ?? undefined}
          trip={editing ?? undefined} defaultLocationId={defaultLocationId} onClose={close} />
      </div>
    </main>
  )
}
