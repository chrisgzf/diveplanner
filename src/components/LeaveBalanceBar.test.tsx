import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LeaveBalanceBar from './LeaveBalanceBar'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

beforeEach(() => {
  useAppStore.setState({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS, holidays: {}, holidaysLoading: false, holidaysError: false })
})

describe('LeaveBalanceBar', () => {
  it('shows a gauge per year spanned by the rolling window with full balance when no trips', () => {
    render(<LeaveBalanceBar />)
    // default leaveBudget = 25 per year
    expect(screen.getAllByText(/25/).length).toBeGreaterThan(0)
  })
})
