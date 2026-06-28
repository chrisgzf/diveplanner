import { Outlet } from 'react-router-dom'
import Nav from '@/components/Nav'

export default function App() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <Nav />
      <Outlet />
    </div>
  )
}
