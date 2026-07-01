import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings as SettingsIcon, Check, ChevronsUpDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SUPPORTED_COUNTRIES } from '@/data/countries'
import { calendarWindow } from '@/lib/dates'
import { cn } from '@/lib/cn'

export default function SettingsDialog() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const years = [...new Set(calendarWindow(new Date()).map((m) => m.year))]
  // Raw in-progress text per year, so the field can go through an empty
  // state while editing instead of snapping back to "0" on every keystroke.
  const [leaveDrafts, setLeaveDrafts] = useState<Record<number, string>>({})
  const [countryOpen, setCountryOpen] = useState(false)
  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === settings.country)

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
            <Select value={settings.theme} onValueChange={(v) => updateSettings({ theme: v as 'dark' | 'light' | 'system' })}>
              <SelectTrigger id="theme" className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="country" className="text-base font-medium">Country (for public holidays)</label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button id="country" variant="outline" role="combobox" aria-expanded={countryOpen}
                  className="w-full justify-between border-line bg-surface-elevated font-normal">
                  {selectedCountry?.name ?? 'Select country…'}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search countries…" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <CommandItem key={c.code} value={c.name} onSelect={() => { updateSettings({ country: c.code }); setCountryOpen(false) }}>
                          <Check className={cn('mr-2 h-4 w-4', settings.country === c.code ? 'opacity-100' : 'opacity-0')} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {years.map((year) => (
            <div key={year} className="space-y-1">
              <label htmlFor={`leave-${year}`} className="text-base font-medium">{year} leave days</label>
              <Input id={`leave-${year}`} type="number" min={0}
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
                className="w-full rounded-md border-line bg-surface-elevated px-2 py-2 text-base" />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
