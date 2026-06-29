import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'
import { Toaster } from '@/components/ui/sonner'
import { useHolidays } from '@/hooks/useHolidays'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  useHolidays()
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => document.documentElement.classList.toggle('dark', mql.matches)
      apply()
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <LeaveBalanceBar />
      <Outlet />
      <Toaster />
    </div>
  )
}
