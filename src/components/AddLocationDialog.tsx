import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      id: `user-${crypto.randomUUID().slice(0, 8)}`, name: name.trim(), country: country.trim() || 'Unknown',
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="location name" className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" aria-label="country" className="w-full rounded-md border border-line px-2 py-2 text-sm" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Location['difficulty'])} className="w-full rounded-md border border-line px-2 py-2 text-sm">
            <option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option>
          </select>
          <div className="grid grid-cols-6 gap-2">
            {ratings.map((r, i) => (
              <select key={i} aria-label={`month ${i + 1} rating`} value={r}
                onChange={(e) => setRatings((prev) => prev.map((x, j) => (j === i ? (e.target.value as MonthRating) : x)))}
                className="rounded border border-line px-1 py-1 text-xs">
                {RATINGS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            ))}
          </div>
          <Button onClick={save} className="w-full">Save location</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
