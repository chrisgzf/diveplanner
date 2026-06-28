export type ISODate = string // ISO 8601 date, e.g. "2026-05-15"
export type TripStatus = 'wishlist' | 'planned' | 'confirmed'
export type TripType = 'fun-dive' | 'course' | 'liveaboard' | 'non-dive'
export type MonthRating = 'good' | 'fair' | 'poor' | 'closed'

export type BookingCategory = 'dive-shop' | 'flight' | 'transfer' | 'accommodation' | 'other'

export interface BookingItem {
  id: string
  category: BookingCategory
  label: string
  booked: boolean
}

export interface Trip {
  id: string
  label: string
  startDate: ISODate
  endDate: ISODate
  type: TripType
  status: TripStatus
  locationId?: string
  bookings: BookingItem[]
  notes?: string
  estimatedDives?: number
}

export interface LocationMonthRating {
  month: number // 1-12
  rating: MonthRating
}

export interface Location {
  id: string
  name: string
  country: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  highlights: string[]
  seasonality: LocationMonthRating[] // exactly 12, Jan-Dec
  currentNote?: string
  isUserAdded?: boolean
}

export interface Settings {
  country: string // ISO 3166-1 alpha-2
  leaveBudget: Record<number, number> // days available per calendar year (includes any carryover)
}

const _year = new Date().getFullYear()
export const DEFAULT_SETTINGS: Settings = {
  country: 'SG',
  leaveBudget: { [_year]: 25, [_year + 1]: 25 },
}
