import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { enumerateDays, formatShortDate } from '@/lib/dates'
import type { Segment } from '@/lib/leave'

const fmt = formatShortDate
const rangeLabel = (s: Segment) => (s.startDate === s.endDate ? fmt(s.startDate) : `${fmt(s.startDate)} – ${fmt(s.endDate)}`)

// Fixed-width leading/trailing slots so checkbox rows and non-checkable rows
// (weekend/holiday) line up on the same left edge, and the leave/weekend
// labels line up on the same right edge regardless of whether the expand
// arrow is present.
const LEADING_SLOT = 'inline-block h-4 w-4 shrink-0'
const TRAILING_SLOT = 'inline-flex h-4 w-4 shrink-0 items-center justify-center'

function LeaveSegmentRow({ segment, excludedSet, onToggleDay, onToggleSegment }: {
  segment: Segment
  excludedSet: Set<string>
  onToggleDay: (day: string, excluded: boolean) => void
  onToggleSegment: (segment: Segment, excluded: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const days = enumerateDays(segment.startDate, segment.endDate)
  const excludedCount = days.filter((d) => excludedSet.has(d)).length
  const allExcluded = excludedCount === days.length
  const someExcluded = excludedCount > 0 && !allExcluded
  const countedDays = days.length - excludedCount

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 py-1.5">
          <Checkbox className={`${LEADING_SLOT} cursor-pointer`} checked={someExcluded ? 'indeterminate' : !allExcluded}
            onCheckedChange={(checked) => onToggleSegment(segment, !checked)} />
          <span className={allExcluded ? 'text-muted line-through' : 'text-ink'}>{rangeLabel(segment)}</span>
        </label>
        <span className="flex items-center gap-2">
          <span className="text-muted">{countedDays} day{countedDays === 1 ? '' : 's'} leave</span>
          {days.length > 1 ? (
            <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse days' : 'Expand days'}
              className={`${TRAILING_SLOT} text-muted hover:text-ink`}>
              {open ? '▾' : '▸'}
            </button>
          ) : (
            <span className={TRAILING_SLOT} aria-hidden="true" />
          )}
        </span>
      </div>
      {days.length > 1 && open && (
        <div className="ml-6 space-y-0.5 border-l border-line pl-2">
          {days.map((d) => (
            <label key={d} className="flex items-center gap-2 py-1">
              <Checkbox className={`${LEADING_SLOT} cursor-pointer`} checked={!excludedSet.has(d)}
                onCheckedChange={(checked) => onToggleDay(d, !checked)} />
              <span className={excludedSet.has(d) ? 'text-muted line-through' : 'text-ink'}>{fmt(d)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LeaveBreakdown({ segments, excludedLeaveDates, onChange }: {
  segments: Segment[]
  excludedLeaveDates: string[]
  onChange: (dates: string[]) => void
}) {
  const excludedSet = new Set(excludedLeaveDates)

  const toggleDay = (day: string, excluded: boolean) => {
    const next = new Set(excludedSet)
    if (excluded) next.add(day); else next.delete(day)
    onChange([...next])
  }

  const toggleSegment = (segment: Segment, excluded: boolean) => {
    const next = new Set(excludedSet)
    for (const d of enumerateDays(segment.startDate, segment.endDate)) {
      if (excluded) next.add(d); else next.delete(d)
    }
    onChange([...next])
  }

  if (segments.length === 0) return <div>Leave: 0d</div>

  return (
    <div className="space-y-0.5">
      {segments.map((s) => {
        if (s.kind !== 'leave') {
          const label = s.kind === 'holiday' ? `Holiday${s.label ? ` (${s.label})` : ''}` : 'Weekend'
          return (
            <div key={s.startDate} className="flex items-center justify-between gap-3 py-1.5">
              <span className="flex items-center gap-2">
                <span className={LEADING_SLOT} aria-hidden="true" />
                <span className="text-muted">{rangeLabel(s)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-muted">{label}</span>
                <span className={TRAILING_SLOT} aria-hidden="true" />
              </span>
            </div>
          )
        }
        return (
          <LeaveSegmentRow key={s.startDate} segment={s} excludedSet={excludedSet}
            onToggleDay={toggleDay} onToggleSegment={toggleSegment} />
        )
      })}
    </div>
  )
}
