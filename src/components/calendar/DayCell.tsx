import { cn } from '@/lib/cn'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Trip } from '@/types'
import type { DayMeta } from '@/lib/dayMeta'

const fill: Record<Trip['type'], string> = {
  'fun-dive': 'bg-fun-dive/80 text-white',
  liveaboard: 'bg-liveaboard/80 text-white',
  course: 'bg-course/80 text-white',
  'non-dive': 'bg-non-dive/60 text-ink',
}

export default function DayCell({ iso, day, inRange, isStart, isEnd, isHoliday, coveredByTrip, isToday, readOnly, onMouseEnter, onClick, meta }: {
  iso: string; day: number; inRange: boolean; isStart: boolean; isEnd: boolean
  isHoliday: boolean; coveredByTrip?: Trip; isToday: boolean; readOnly: boolean
  onMouseEnter: () => void; onClick: () => void; meta?: DayMeta
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
  const hasTooltip = !!meta && (!!meta.holidayName || !!meta.trip || meta.goodLocs.length > 0 || meta.fairLocs.length > 0)
  const button = (
    <button
      type="button"
      aria-label={`day ${iso}`}
      disabled={readOnly || isCovered}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'relative aspect-square text-base transition-colors disabled:cursor-default',
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
  if (!hasTooltip) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1 text-sm">
        {meta!.goodLocs.length > 0 && (
          <div><div className="font-semibold text-good">Good for diving</div><div className="text-muted-foreground">· {meta!.goodLocs.join(' · ')}</div></div>
        )}
        {meta!.fairLocs.length > 0 && (
          <div><div className="font-semibold text-fair">Fair</div><div className="text-muted-foreground">· {meta!.fairLocs.join(' · ')}</div></div>
        )}
        {meta!.holidayName && <div>Holiday: {meta!.holidayName}</div>}
        {meta!.trip && <div>Planned: {meta!.trip.label.slice(0, 30)}</div>}
      </TooltipContent>
    </Tooltip>
  )
}
