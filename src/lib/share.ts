import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { Trip, Location, Settings } from '@/types'

export interface ShareState {
  trips: Trip[]
  siteOverrides: Location[]
  settings: Settings
}

export function encodeShare(state: ShareState): string {
  return compressToEncodedURIComponent(JSON.stringify(state))
}

export function decodeShare(hash: string): ShareState | null {
  if (!hash) return null
  try {
    const json = decompressFromEncodedURIComponent(hash)
    if (!json) return null
    const parsed = JSON.parse(json)
    if (!parsed || !Array.isArray(parsed.trips) || !Array.isArray(parsed.siteOverrides) || typeof parsed.settings !== 'object') {
      return null
    }
    return parsed as ShareState
  } catch {
    return null
  }
}
