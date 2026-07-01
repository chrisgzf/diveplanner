import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings as SettingsIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SUPPORTED_COUNTRIES } from '@/data/countries'
import { calendarWindow } from '@/lib/dates'

export default function SettingsDialog() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const years = [...new Set(calendarWindow(new Date()).map((m) => m.year))]
  // Raw in-progress text per year, so the field can go through an empty
  // state while editing instead of snapping back to "0" on every keystroke.
  const [leaveDrafts, setLeaveDrafts] = useState<Record<number, string>>({})

  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-base font-medium text-muted hover:text-ink md:px-3" aria-label="Settings">
        <SettingsIcon className="h-4 w-4" /> <span className="hidden md:inline">Settings</span>
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="theme" className="text-base font-medium">Theme</label>
            <select id="theme" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' | 'system' })} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-base">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="country" className="text-base font-medium">Country (for public holidays)</label>
            <select id="country" value={settings.country} onChange={(e) => updateSettings({ country: e.target.value })} className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-base">
              {SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          {years.map((year) => (
            <div key={year} className="space-y-1">
              <label htmlFor={`leave-${year}`} className="text-base font-medium">{year} leave days</label>
              <input id={`leave-${year}`} type="number" min={0}
                value={leaveDrafts[year] ?? String(settings.leaveBudget[year] ?? 0)}
                onChange={(e) => {
                  const raw = e.target.value
                  setLeaveDrafts((d) => ({ ...d, [year]: raw }))
                  const n = Number(raw)
                  if (raw !== '' && !Number.isNaN(n)) updateSettings({ leaveBudget: { ...settings.leaveBudget, [year]: n } })
                }}
                onBlur={() => {
                  if (leaveDrafts[year] === '') updateSettings({ leaveBudget: { ...settings.leaveBudget, [year]: 0 } })
                  setLeaveDrafts((d) => { const next = { ...d }; delete next[year]; return next })
                }}
                className="w-full rounded-md border border-line bg-surface-elevated px-2 py-2 text-base" />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
