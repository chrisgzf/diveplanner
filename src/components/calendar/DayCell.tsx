import { cn } from '@/lib/cn'

export default function DayCell({ iso, day, inRange, isStart, isEnd, isHoliday, isCovered, isToday, readOnly, onMouseEnter, onClick }: {
  iso: string; day: number; inRange: boolean; isStart: boolean; isEnd: boolean
  isHoliday: boolean; isCovered: boolean; isToday: boolean; readOnly: boolean
  onMouseEnter: () => void; onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`day ${iso}`}
      disabled={readOnly || isCovered}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-md text-sm transition-colors',
        'disabled:cursor-default',
        isCovered ? 'bg-line/40 text-muted' : 'hover:bg-line/60',
        inRange && 'bg-primary/15',
        (isStart || isEnd) && 'bg-primary text-white hover:bg-primary',
        isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-primary',
      )}
    >
      {day}
      {isHoliday && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-poor" aria-hidden />}
    </button>
  )
}
