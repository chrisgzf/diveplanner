import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings as SettingsIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SUPPORTED_COUNTRIES } from '@/data/countries'
import { monthsWindow } from '@/lib/dates'

export default function SettingsDialog() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const years = [...new Set(monthsWindow(new Date()).map((m) => m.year))]

  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink" aria-label="Settings">
        <SettingsIcon className="h-4 w-4" /> Settings
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="country" className="text-sm font-medium">Country (for public holidays)</label>
            <select id="country" value={settings.country} onChange={(e) => updateSettings({ country: e.target.value })} className="w-full rounded-md border border-line px-2 py-2 text-sm">
              {SUPPORTED_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          {years.map((year) => (
            <div key={year} className="space-y-1">
              <label htmlFor={`leave-${year}`} className="text-sm font-medium">{year} leave days</label>
              <input id={`leave-${year}`} type="number" min={0}
                value={settings.leaveBudget[year] ?? 0}
                onChange={(e) => updateSettings({ leaveBudget: { ...settings.leaveBudget, [year]: Number(e.target.value) } })}
                className="w-full rounded-md border border-line px-2 py-2 text-sm" />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
