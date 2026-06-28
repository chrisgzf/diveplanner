import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'
import LeaveBalanceBar from '@/components/LeaveBalanceBar'

export default function App() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <LeaveBalanceBar />
      <Outlet />
    </div>
  )
}
