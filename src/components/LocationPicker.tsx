import { useState, useEffect } from 'react'
import { useMergedLocations } from '@/hooks/useMergedLocations'

const OTHER = '__other__'

export default function LocationPicker({ value, customValue, onChange }: {
  value?: string
  customValue?: string
  onChange: (id: string | undefined, custom: string | undefined) => void
}) {
  const locations = useMergedLocations()
  const [isOther, setIsOther] = useState(value === undefined && customValue !== undefined)
  const [localCustom, setLocalCustom] = useState(customValue ?? '')

  // Sync internal state when controlled props change (e.g. edit mode loads customLocation)
  useEffect(() => {
    setIsOther(value === undefined && customValue !== undefined)
    setLocalCustom(customValue ?? '')
  }, [value, customValue])

  return (
    <div className="space-y-1">
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <select id="location" value={isOther ? OTHER : value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === OTHER) { setIsOther(true); setLocalCustom(''); onChange(undefined, '') }
          else { setIsOther(false); setLocalCustom(''); onChange(v || undefined, undefined) }
        }}
        className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm">
        <option value="">— none —</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.country}</option>)}
        <option value={OTHER}>Other…</option>
      </select>
      {isOther && (
        <input aria-label="custom location" value={localCustom} placeholder="Custom location name"
          onChange={(e) => { setLocalCustom(e.target.value); onChange(undefined, e.target.value) }}
          className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
      )}
    </div>
  )
}
