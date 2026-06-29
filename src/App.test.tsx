import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_SETTINGS } from '@/types'

// Mock heavy child components that need data/routing to work
vi.mock('@/components/Nav', () => ({ default: () => <nav /> }))
vi.mock('@/components/LeaveBalanceBar', () => ({ default: () => <div /> }))
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))
vi.mock('@/hooks/useHolidays', () => ({ useHolidays: () => {} }))

function makeMatchMedia(prefersDark: boolean) {
  return (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

describe('App theme effect', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    document.documentElement.classList.remove('dark')
    useAppStore.setState({ settings: DEFAULT_SETTINGS })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia })
    document.documentElement.classList.remove('dark')
  })

  it('adds dark class when theme is "dark"', () => {
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'dark' } })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when theme is "light"', () => {
    document.documentElement.classList.add('dark')
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'light' } })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('resolves "system" to dark when OS prefers dark', () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(true) })
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'system' } })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('resolves "system" to light when OS prefers light', () => {
    document.documentElement.classList.add('dark')
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(false) })
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'system' } })
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('attaches and cleans up OS preference listener for "system" theme', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: addListener,
        removeEventListener: removeListener,
        dispatchEvent: vi.fn(),
      }),
    })
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, theme: 'system' } })
    const { unmount } = render(<MemoryRouter><App /></MemoryRouter>)
    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
