import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationPicker from './LocationPicker'
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
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {} })
})

describe('LocationPicker', () => {
  it('reveals a custom input when "Other…" is selected and emits customValue', async () => {
    const onChange = vi.fn()
    render(<LocationPicker onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Location'), '__other__')
    expect(onChange).toHaveBeenLastCalledWith(undefined, '')
    const input = await screen.findByLabelText(/custom location/i)
    await userEvent.type(input, 'Secret Reef')
    expect(onChange).toHaveBeenLastCalledWith(undefined, 'Secret Reef')
  })
})
