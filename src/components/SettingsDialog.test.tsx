import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsDialog from './SettingsDialog'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => useAppStore.setState({ settings: DEFAULT_SETTINGS }))

describe('SettingsDialog', () => {
  it('updates leave days for current year immediately', async () => {
    const currentYear = new Date().getFullYear()
    render(<SettingsDialog />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    const input = screen.getByLabelText(new RegExp(`${currentYear} leave days`, 'i'))
    await userEvent.clear(input)
    await userEvent.type(input, '30')
    expect(useAppStore.getState().settings.leaveBudget[currentYear]).toBe(30)
  })
})
