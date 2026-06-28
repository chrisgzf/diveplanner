import { cn } from '@/lib/cn'
import type { LocationMonthRating } from '@/types'

const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D']
const dot: Record<string, string> = { good: 'bg-good', fair: 'bg-fair', poor: 'bg-poor', closed: 'bg-closed' }

export default function SeasonalityGrid({ seasonality }: { seasonality: LocationMonthRating[] }) {
  return (
    <div className="inline-grid grid-cols-12 gap-1 text-center font-mono text-xs">
      {seasonality.map((s) => <div key={s.month} className="text-muted">{MONTHS[s.month - 1]}</div>)}
      {seasonality.map((s) => <div key={`r-${s.month}`} className={cn('h-4 w-4 rounded-sm', dot[s.rating])} title={s.rating} />)}
    </div>
  )
}
