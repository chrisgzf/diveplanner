import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'
import { Toaster } from '@/components/ui/sonner'
import { useHolidays } from '@/hooks/useHolidays'
import { useSyncTheme } from '@/hooks/useSyncTheme'

export default function App() {
  useHolidays()
  useSyncTheme()
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <LeaveBalanceBar />
      <Outlet />
      <Toaster />
    </div>
  )
}
