import { useMergedLocations } from '@/hooks/useMergedLocations'

export default function LocationPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const locations = useMergedLocations()
  return (
    <div className="space-y-1">
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <select id="location" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm">
        <option value="">— none —</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.country}</option>)}
      </select>
    </div>
  )
}
