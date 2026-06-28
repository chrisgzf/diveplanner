import { NavLink } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'

const links = [
  { to: '/', label: 'Planner', icon: CalendarDays, end: true },
  { to: '/locations', label: 'Locations', icon: MapPin, end: false },
]

export default function Nav({ actions }: { actions?: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur md:relative">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-bold text-primary">DivePlanner</span>
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink', isActive && 'bg-line/60 text-ink')}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          {actions}
        </div>
      </div>
      {/* mobile bottom tab bar */}
      <div aria-hidden="true" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted', isActive && 'text-primary')}>
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
