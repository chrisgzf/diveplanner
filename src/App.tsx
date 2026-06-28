import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'
import SettingsDialog from '@/components/SettingsDialog'
import ShareButton from '@/components/ShareButton'
import { Toaster } from '@/components/ui/sonner'
import { useHolidays } from '@/hooks/useHolidays'
import { useAppStore } from '@/store/useAppStore'

export default function App() {
  useHolidays()
  const theme = useAppStore((s) => s.settings.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav actions={<><SettingsDialog /><ShareButton /></>} />
      <LeaveBalanceBar />
      <Outlet />
      <Toaster />
    </div>
  )
}
