import { useLeaveByYear, type YearLeave } from '@/hooks/useLeaveByYear'
import { cn } from '@/lib/cn'

function tone(remaining: number): { bar: string; text: string } {
  if (remaining <= 0) return { bar: 'bg-poor', text: 'text-poor' }
  if (remaining <= 5) return { bar: 'bg-fair', text: 'text-fair' }
  return { bar: 'bg-good', text: 'text-good' }
}

function Gauge({ y }: { y: YearLeave }) {
  const pct = y.total > 0 ? Math.max(0, Math.min(100, (y.remaining / y.total) * 100)) : 0
  const t = tone(y.remaining)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="font-mono text-sm text-muted">{y.year}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full transition-[width]', t.bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('whitespace-nowrap font-mono text-sm font-medium', t.text)}>
        {y.remaining} left <span className="text-muted">/ {y.total}</span>
      </span>
    </div>
  )
}

export default function LeaveBalanceBar() {
  const years = useLeaveByYear()
  return (
    <div className="sticky top-14 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-6">
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Leave</span>
        {years.map((y) => <Gauge key={y.year} y={y} />)}
      </div>
    </div>
  )
}
