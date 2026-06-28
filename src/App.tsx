import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'
import SettingsDialog from '@/components/SettingsDialog'
import ShareButton from '@/components/ShareButton'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav actions={<><SettingsDialog /><ShareButton /></>} />
      <LeaveBalanceBar />
      <Outlet />
      <Toaster />
    </div>
  )
}
