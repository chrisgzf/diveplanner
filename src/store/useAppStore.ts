import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, type ISODate, type Location, type Settings, type Trip } from '@/types'
import type { ShareState } from '@/lib/share'

interface AppStore {
  settings: Settings
  trips: Trip[]
  siteOverrides: Location[]
  holidays: Record<string, ISODate[]>
  holidaysLoading: boolean
  holidaysError: boolean

  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  upsertOverride: (loc: Location) => void
  deleteOverride: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  setHolidays: (key: string, dates: ISODate[]) => void
  clearHolidays: () => void
  setHolidaysLoading: (b: boolean) => void
  setHolidaysError: (b: boolean) => void
  replaceAll: (state: ShareState) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      trips: [],
      siteOverrides: [],
      holidays: {},
      holidaysLoading: false,
      holidaysError: false,

      addTrip: (trip) => set((s) => ({ trips: [...s.trips, trip] })),
      updateTrip: (trip) => set((s) => ({ trips: s.trips.map((t) => (t.id === trip.id ? trip : t)) })),
      deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
      upsertOverride: (loc) =>
        set((s) => {
          const exists = s.siteOverrides.some((l) => l.id === loc.id)
          return { siteOverrides: exists ? s.siteOverrides.map((l) => (l.id === loc.id ? loc : l)) : [...s.siteOverrides, loc] }
        }),
      deleteOverride: (id) => set((s) => ({ siteOverrides: s.siteOverrides.filter((l) => l.id !== id) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setHolidays: (key, dates) => set((s) => ({ holidays: { ...s.holidays, [key]: dates } })),
      clearHolidays: () => set({ holidays: {} }),
      setHolidaysLoading: (b) => set({ holidaysLoading: b }),
      setHolidaysError: (b) => set({ holidaysError: b }),
      replaceAll: (state) => set({ trips: state.trips, siteOverrides: state.siteOverrides, settings: state.settings }),
    }),
    {
      name: 'diveplanner',
      partialize: (s) => ({ settings: s.settings, trips: s.trips, siteOverrides: s.siteOverrides }),
    },
  ),
)
