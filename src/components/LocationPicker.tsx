import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMergedLocations } from '@/hooks/useMergedLocations'

const NONE = '__none__'
const OTHER = '__other__'

export default function LocationPicker({ value, customValue, onChange }: {
  value?: string
  customValue?: string
  onChange: (id: string | undefined, custom: string | undefined) => void
}) {
  const locations = useMergedLocations()
  const [isOther, setIsOther] = useState(value === undefined && customValue !== undefined)
  const [localCustom, setLocalCustom] = useState(customValue ?? '')

  useEffect(() => {
    setIsOther(value === undefined && customValue !== undefined)
    setLocalCustom(customValue ?? '')
  }, [value, customValue])

  const selectValue = isOther ? OTHER : (value ?? NONE)

  return (
    <div className="space-y-1">
      <label htmlFor="location" className="text-sm font-medium">Location</label>
      <Select value={selectValue} onValueChange={(v) => {
        if (v === OTHER) { setIsOther(true); setLocalCustom(''); onChange(undefined, '') }
        else if (v === NONE) { setIsOther(false); onChange(undefined, undefined) }
        else { setIsOther(false); setLocalCustom(''); onChange(v, undefined) }
      }}>
        <SelectTrigger id="location" className="w-full text-sm">
          <SelectValue placeholder="— none —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>— none —</SelectItem>
          {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} · {l.country}</SelectItem>)}
          <SelectItem value={OTHER}>Other…</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <input aria-label="custom location" value={localCustom} placeholder="Custom location name"
          onChange={(e) => { setLocalCustom(e.target.value); onChange(undefined, e.target.value) }}
          className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-sm" />
      )}
    </div>
  )
}
