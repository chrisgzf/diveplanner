import { NavLink } from 'react-router-dom'
import { CalendarDays, MapPin, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store/useAppStore'
import SettingsDialog from '@/components/SettingsDialog'
import ShareButton from '@/components/ShareButton'

const links = [
  { to: '/', label: 'Planner', icon: CalendarDays, end: true },
  { to: '/locations', label: 'Locations', icon: MapPin, end: false },
]

export default function Nav() {
  const theme = useAppStore((s) => s.settings.theme)
  const updateSettings = useAppStore((s) => s.updateSettings)
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <span className="font-display text-xl font-bold text-primary">DivePlanner</span>
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-base font-medium text-muted hover:text-ink md:px-3', isActive && 'bg-line/60 text-ink')}>
              <Icon className="h-4 w-4" /> <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
          <SettingsDialog />
          <ShareButton />
          <button type="button" aria-label="Toggle theme"
            onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
            className="flex items-center rounded-md px-2.5 py-1.5 text-muted hover:text-ink md:px-3">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </nav>
  )
}
