import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripPanel from './TripPanel'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

vi.mock('@/components/ui/select', async () => {
  const { Children } = await import('react')
  const SelectTrigger = (_props: any) => null
  const SelectValue = () => null
  const SelectContent = ({ children }: any) => <>{children}</>
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>
  const Select = ({ value, onValueChange, children }: any) => {
    const arr = Children.toArray(children)
    const trigger = arr.find((c: any) => c.type === SelectTrigger) as any
    return (
      <select id={trigger?.props?.id} value={value} onChange={(e: any) => onValueChange(e.target.value)}>
        {arr.filter((c: any) => c.type !== SelectTrigger)}
      </select>
    )
  }
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('TripPanel showClose', () => {
  it('renders no close button by default', () => {
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders a close button that calls onClose when showClose is true', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} showClose />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when showClose is false', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape when showClose is true', async () => {
    const onClose = vi.fn()
    render(<TripPanel mode="create" initialRange={{ start: '2026-05-15', end: '2026-05-23' }} onClose={onClose} showClose />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
