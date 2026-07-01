import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { decodeShare } from '@/lib/share'
import { useAppStore } from '@/store/useAppStore'
import { useSyncTheme } from '@/hooks/useSyncTheme'
import { mergeLocations } from '@/lib/locations'
import CalendarView from '@/components/calendar/CalendarView'
import TripDetailDialog from '@/components/TripDetailDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import type { Trip, Location } from '@/types'

export default function SharePage() {
  useSyncTheme()
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const replaceAll = useAppStore((s) => s.replaceAll)
  const shared = useMemo(() => (hash ? decodeShare(hash) : null), [hash])
  const [overwriting, setOverwriting] = useState(false)

  if (!shared) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">This link can't be read</h1>
        <p className="mt-2 text-muted">The shared plan is missing or corrupted.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>Start your own plan</Button>
      </main>
    )
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="bg-primary px-4 py-2 text-center text-base font-medium text-white">
        You're viewing a shared dive plan
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-2 px-4 py-3">
        <Dialog open={overwriting} onOpenChange={setOverwriting}>
          <DialogTrigger asChild><Button>Make this mine</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Overwrite your local plan?</DialogTitle></DialogHeader>
            <p className="text-base text-muted">This replaces your current trips, locations, and settings with the shared plan. This can't be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverwriting(false)}>Cancel</Button>
              <Button onClick={() => { replaceAll(shared); navigate('/') }}>Overwrite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => navigate('/')}>Plan my own</Button>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SharedCalendar trips={shared.trips} siteOverrides={shared.siteOverrides} />
      </main>
    </div>
  )
}

function SharedCalendar({ trips, siteOverrides }: { trips: Trip[]; siteOverrides: Location[] }) {
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null)
  const locations = mergeLocations(siteOverrides)
  return (
    <>
      <CalendarView readOnly trips={trips} holidays={{}} onTripClick={setViewingTrip} />
      <TripDetailDialog trip={viewingTrip} locations={locations} onClose={() => setViewingTrip(null)} />
    </>
  )
}
