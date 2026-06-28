import { Sheet, SheetContent } from '@/components/ui/sheet'
import TripPanel from './TripPanel'
import type { Trip } from '@/types'

export default function TripDrawer({ open, mode, initialRange, trip, defaultLocationId, onClose }: {
  open: boolean
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <TripPanel mode={mode} initialRange={initialRange} trip={trip} defaultLocationId={defaultLocationId} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}
