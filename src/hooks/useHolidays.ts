import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { fetchHolidays, holidayKey } from '@/lib/holidays'

export function useHolidays() {
  const country = useAppStore((s) => s.settings.country)
  const setHolidays = useAppStore((s) => s.setHolidays)
  const clearHolidays = useAppStore((s) => s.clearHolidays)
  const setLoading = useAppStore((s) => s.setHolidaysLoading)
  const setError = useAppStore((s) => s.setHolidaysError)

  useEffect(() => {
    let cancelled = false
    const year = new Date().getFullYear()
    const years = [year, year + 1]
    clearHolidays()
    setLoading(true); setError(false)

    Promise.all(years.map((y) => fetchHolidays(country, y).then((dates) => ({ y, dates }))))
      .then((results) => {
        if (cancelled) return
        for (const { y, dates } of results) setHolidays(holidayKey(country, y), dates)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        toast.warning('Could not load public holidays — leave counts weekdays only.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [country, setHolidays, clearHolidays, setLoading, setError])
}
