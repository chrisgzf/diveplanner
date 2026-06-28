import { cn } from '@/lib/cn'
import type { Trip } from '@/types'

const fill: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive/80 text-white',
  liveaboard: 'bg-liveaboard/80 text-white',
  course: 'bg-course/80 text-white',
  'non-dive': 'bg-non-dive/60 text-ink',
}

export default function DayCell({ iso, day, inRange, isStart, isEnd, isHoliday, coveredByTrip, isToday, readOnly, onMouseEnter, onClick }: {
  iso: string; day: number; inRange: boolean; isStart: boolean; isEnd: boolean
  isHoliday: boolean; coveredByTrip?: Trip; isToday: boolean; readOnly: boolean
  onMouseEnter: () => void; onClick: () => void
}) {
  const isCovered = coveredByTrip !== undefined
  // Trip-edge rounding: round the start day on the left, the end day on the right.
  let rounding = 'rounded-md'
  if (isCovered) {
    const isTripStart = coveredByTrip.startDate === iso
    const isTripEnd = coveredByTrip.endDate === iso
    if (isTripStart && isTripEnd) rounding = 'rounded-md'
    else if (isTripStart) rounding = 'rounded-l-md rounded-r-none'
    else if (isTripEnd) rounding = 'rounded-r-md rounded-l-none'
    else rounding = 'rounded-none'
  }
  return (
    <button
      type="button"
      aria-label={`day ${iso}`}
      disabled={readOnly || isCovered}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'relative aspect-square text-sm transition-colors disabled:cursor-default',
        rounding,
        isCovered ? fill[coveredByTrip.type] : 'rounded-md hover:bg-line/60',
        inRange && !isCovered && 'bg-primary/15',
        (isStart || isEnd) && 'bg-primary text-white hover:bg-primary',
        isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-primary',
      )}
    >
      <span className={cn(isHoliday && 'border-b-2 border-fair')}>{day}</span>
    </button>
  )
}
