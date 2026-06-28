import { LOCATIONS } from '@/data/locations'
import type { Location } from '@/types'

export function mergeLocations(overrides: Location[]): Location[] {
  const byId = new Map<string, Location>()
  for (const loc of LOCATIONS) byId.set(loc.id, loc)
  for (const loc of overrides) byId.set(loc.id, loc)
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}
