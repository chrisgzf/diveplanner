import { Trash2, Plus } from 'lucide-react'
import { randomUUID } from '@/lib/uuid'
import type { BookingItem, BookingCategory } from '@/types'

const CATEGORIES: BookingCategory[] = ['dive-shop', 'flight', 'transfer', 'accommodation', 'insurance', 'equipment', 'other']

const PLACEHOLDERS: Record<BookingCategory, string> = {
  'dive-shop': 'e.g. Eco-diver Scuba',
  flight: 'e.g. Singapore Airlines SQ123',
  transfer: 'e.g. Airport pickup van',
  accommodation: 'e.g. Blue Corner Homestay',
  insurance: 'e.g. DAN dive travel insurance',
  equipment: 'e.g. Prescription dive mask',
  other: 'e.g. Private dive guide',
}

export default function BookingChecklist({ items, onChange }: { items: BookingItem[]; onChange: (items: BookingItem[]) => void }) {
  const update = (id: string, patch: Partial<BookingItem>) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const add = () => onChange([...items, { id: randomUUID(), category: 'other', label: '', booked: false }])
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))

  return (
    <div className="space-y-3">
      <span className="text-base font-medium">Booking checklist</span>
      {items.map((it) => (
        <div key={it.id} className="space-y-1.5 py-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <input type="checkbox" checked={it.booked} onChange={(e) => update(it.id, { booked: e.target.checked })} aria-label={`booked ${it.label || it.category}`} />
              <select value={it.category} onChange={(e) => update(it.id, { category: e.target.value as BookingCategory })} className="rounded-md border border-line bg-surface-elevated px-2 py-1 text-base">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => remove(it.id)} aria-label="remove item"><Trash2 className="h-4 w-4 shrink-0 text-muted" /></button>
          </div>
          <input value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} placeholder={PLACEHOLDERS[it.category]} className="w-full min-w-0 rounded-md border border-line bg-surface-elevated px-2 py-1 text-base" />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-base text-primary"><Plus className="h-4 w-4" /> Add item</button>
    </div>
  )
}
