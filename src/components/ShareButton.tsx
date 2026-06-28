import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { encodeShare } from '@/lib/share'

export default function ShareButton() {
  const { trips, siteOverrides, settings } = useAppStore()
  const share = async () => {
    const hash = encodeShare({ trips, siteOverrides, settings })
    const url = `${window.location.origin}/share/${hash}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch {
      toast.error('Could not copy link')
    }
  }
  return (
    <button onClick={share} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink" aria-label="Share">
      <Share2 className="h-4 w-4" /> Share
    </button>
  )
}
