import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMergedLocations } from '@/hooks/useMergedLocations'
import { useAppStore } from '@/store/useAppStore'
import SeasonalityGrid from '@/components/SeasonalityGrid'
import AddLocationDialog from '@/components/AddLocationDialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft } from 'lucide-react'

export default function LocationsPage() {
  const locations = useMergedLocations()
  const overrides = useAppStore((s) => s.siteOverrides)
  const navigate = useNavigate()
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selectedId, setSelectedId] = useState(locations[0]?.id)
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list')

  const filtered = useMemo(
    () => locations.filter((l) => (!country || l.country === country) && (!difficulty || l.difficulty === difficulty)),
    [locations, country, difficulty],
  )
  const selected = locations.find((l) => l.id === selectedId) ?? filtered[0]
  const countries = [...new Set(locations.map((l) => l.country))].sort()

  const exportOverrides = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'diveplanner-overrides.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobilePanel('detail')
  }

  const listPanel = (
    <aside className="space-y-3">
      <div className="flex gap-2">
        <Select value={country || 'all'} onValueChange={(v) => setCountry(v === 'all' ? '' : v)}>
          <SelectTrigger className="flex-1" aria-label="filter country">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty || 'all'} onValueChange={(v) => setDifficulty(v === 'all' ? '' : v)}>
          <SelectTrigger className="flex-1" aria-label="filter difficulty">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="beginner">beginner</SelectItem>
            <SelectItem value="intermediate">intermediate</SelectItem>
            <SelectItem value="advanced">advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ul className="divide-y divide-line rounded-md border border-line">
        {filtered.map((l) => (
          <li key={l.id}>
            <button onClick={() => handleSelect(l.id)} className={`w-full px-3 py-2 text-left text-base ${selected?.id === l.id ? 'bg-line/50 font-medium' : ''}`}>
              {l.name} <span className="text-muted">· {l.country}</span>
            </button>
          </li>
        ))}
      </ul>
      <AddLocationDialog />
      {overrides.length > 0 && <Button variant="outline" className="w-full" onClick={exportOverrides}>Export my overrides</Button>}
    </aside>
  )

  const detailPanel = selected ? (
    <section className="space-y-4">
      <button onClick={() => setMobilePanel('list')} className="flex items-center gap-1 text-base text-muted hover:text-ink md:hidden">
        <ChevronLeft className="h-4 w-4" /> All locations
      </button>
      <div>
        <h1 className="font-display text-3xl font-bold">{selected.name}</h1>
        <p className="text-muted">{selected.country} · {selected.difficulty}</p>
      </div>
      {selected.highlights.length > 0 && (
        <div><h3 className="text-base font-semibold">Highlights</h3><p>{selected.highlights.join(', ')}</p></div>
      )}
      <div><h3 className="mb-2 text-base font-semibold">Seasonality</h3><SeasonalityGrid seasonality={selected.seasonality} /></div>
      {selected.currentNote && <p className="rounded-md border border-line bg-surface-elevated p-3 text-base text-muted">{selected.currentNote}</p>}
      <Button onClick={() => navigate(`/?location=${selected.id}`)}>Plan a trip here →</Button>
    </section>
  ) : null

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Desktop: always side-by-side */}
      <div className="hidden gap-6 md:grid md:grid-cols-[280px_1fr]">
        {listPanel}
        {detailPanel}
      </div>
      {/* Mobile: one panel at a time */}
      <div className="md:hidden">
        {mobilePanel === 'list' ? listPanel : detailPanel}
      </div>
    </main>
  )
}
