import { useState } from 'react'
import { randomUUID } from '@/lib/uuid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import type { Location, MonthRating } from '@/types'

const RATINGS: MonthRating[] = ['good', 'fair', 'poor', 'closed']

export default function AddLocationDialog() {
  const upsertOverride = useAppStore((s) => s.upsertOverride)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState<Location['difficulty']>('beginner')
  const [ratings, setRatings] = useState<MonthRating[]>(Array(12).fill('good'))

  const save = () => {
    if (!name.trim()) return
    const loc: Location = {
      id: `user-${randomUUID().slice(0, 8)}`, name: name.trim(), country: country.trim() || 'Unknown',
      difficulty, highlights: [], isUserAdded: true,
      seasonality: ratings.map((rating, i) => ({ month: i + 1, rating })),
    }
    upsertOverride(loc)
    setOpen(false); setName(''); setCountry(''); setRatings(Array(12).fill('good'))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="w-full">+ Add location</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a location</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="location name" className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" aria-label="country" className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Location['difficulty'])}>
            <SelectTrigger className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">beginner</SelectItem>
              <SelectItem value="intermediate">intermediate</SelectItem>
              <SelectItem value="advanced">advanced</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-6 gap-2">
            {ratings.map((r, i) => (
              <Select key={i} value={r} onValueChange={(v) => setRatings((prev) => prev.map((x, j) => (j === i ? (v as MonthRating) : x)))}>
                <SelectTrigger aria-label={`month ${i + 1} rating`} className="h-auto rounded border-line bg-surface-elevated px-1 py-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            ))}
          </div>
          <Button onClick={save} className="w-full">Save location</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
