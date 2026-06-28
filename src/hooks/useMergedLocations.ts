import { useAppStore } from '@/store/useAppStore'
import { mergeLocations } from '@/lib/locations'

export function useMergedLocations() {
  const overrides = useAppStore((s) => s.siteOverrides)
  return mergeLocations(overrides)
}
