import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
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
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{mode === 'edit' ? 'Edit trip' : 'New trip'}</SheetTitle>
        <div className="flex-1 overflow-y-auto p-6">
          {open && (
            <TripPanel mode={mode} initialRange={initialRange} trip={trip} defaultLocationId={defaultLocationId} onClose={onClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
