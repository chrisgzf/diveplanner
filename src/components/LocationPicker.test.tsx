import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationPicker from './LocationPicker'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

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
