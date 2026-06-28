import { useAppStore } from '@/store/useAppStore'
import { leaveUsedByYear } from '@/lib/leave'
import { holidaySetFromCache } from '@/lib/holidays'
import { monthsWindow } from '@/lib/dates'

export interface YearLeave {
  year: number
  total: number
  used: number
  remaining: number
}

export function useLeaveByYear(): YearLeave[] {
  const trips = useAppStore((s) => s.trips)
  const settings = useAppStore((s) => s.settings)
  const holidays = useAppStore((s) => s.holidays)

  const holidaySet = holidaySetFromCache(holidays)
  const used = leaveUsedByYear(trips, holidaySet)
  const years = [...new Set(monthsWindow(new Date()).map((m) => m.year))]

  return years.map((year) => {
    const total = settings.leaveBudget[year] ?? 0
    const usedThisYear = used[year] ?? 0
    return { year, total, used: usedThisYear, remaining: total - usedThisYear }
  })
}
