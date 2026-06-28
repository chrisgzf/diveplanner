import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareButton from './ShareButton'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'
import { decodeShare } from '@/lib/share'

beforeEach(() => {
  useAppStore.setState({ trips: [{ id: 'a', label: 'A', startDate: '2026-05-15', endDate: '2026-05-20', type: 'fun-dive', status: 'planned', bookings: [] }], siteOverrides: [], settings: DEFAULT_SETTINGS })
})

describe('ShareButton', () => {
  it('copies a decodable share URL to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<ShareButton />)
    await userEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledOnce()
    const url: string = writeText.mock.calls[0][0]
    const hash = url.split('/share/')[1]
    expect(decodeShare(hash)?.trips[0].label).toBe('A')
  })
})
