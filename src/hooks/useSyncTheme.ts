import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

// Applies settings.theme to <html class="dark">. Must run at the router root
// (not inside the <App> layout) so routes rendered outside that layout —
// e.g. /share/:hash — still respect the user's theme and system preference.
export function useSyncTheme() {
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
}
