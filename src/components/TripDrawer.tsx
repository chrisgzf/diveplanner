import { useEffect } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import TripPanel from './TripPanel'
import type { Trip } from '@/types'

// iOS Safari only locks scroll on <body>, but document.scrollingElement is
// <html> in standards mode — without this, the page behind the sheet can
// still be dragged/scrolled while the sheet is open.
function useLockHtmlScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = overflow }
  }, [locked])
}

export default function TripDrawer({ open, mode, initialRange, trip, defaultLocationId, onClose }: {
  open: boolean
  mode: 'create' | 'edit'
  initialRange?: { start: string; end: string }
  trip?: Trip
  defaultLocationId?: string
  onClose: () => void
}) {
  useLockHtmlScroll(open)
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex h-[100svh] w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{mode === 'edit' ? 'Edit trip' : 'New trip'}</SheetTitle>
        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
          {open && (
            <TripPanel mode={mode} initialRange={initialRange} trip={trip} defaultLocationId={defaultLocationId} onClose={onClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
