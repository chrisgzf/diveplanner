import { Trash2, Plus } from 'lucide-react'
import { randomUUID } from '@/lib/uuid'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
              <Checkbox checked={it.booked} onCheckedChange={(checked) => update(it.id, { booked: checked === true })} aria-label={`booked ${it.label || it.category}`} />
              <Select value={it.category} onValueChange={(v) => update(it.id, { category: v as BookingCategory })}>
                <SelectTrigger className="h-auto min-w-0 rounded-md border-line bg-surface-elevated px-2 py-1 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={() => remove(it.id)} aria-label="remove item"><Trash2 className="h-4 w-4 shrink-0 text-muted" /></button>
          </div>
          <Input value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} placeholder={PLACEHOLDERS[it.category]} className="w-full min-w-0 rounded-md border-line bg-surface-elevated px-2 py-1 text-base" />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-base text-primary"><Plus className="h-4 w-4" /> Add item</button>
    </div>
  )
}
