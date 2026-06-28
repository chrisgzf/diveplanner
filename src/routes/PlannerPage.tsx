import { useState } from 'react'
import CalendarView from '@/components/calendar/CalendarView'
import type { Trip } from '@/types'

export default function PlannerPage() {
  const [_pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const [_editing, setEditing] = useState<Trip | null>(null)
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <CalendarView
        onRangeSelected={(start, end) => setPending({ start, end })}
        onTripClick={(t) => setEditing(t)}
      />
      {/* TripDrawer mounted in Task 14 using pending/editing */}
    </main>
  )
}
