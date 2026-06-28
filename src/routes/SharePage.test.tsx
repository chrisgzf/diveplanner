import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SharePage from './SharePage'
import { encodeShare } from '@/lib/share'
import { DEFAULT_SETTINGS } from '@/types'

function renderAt(hash: string) {
  return render(
    <MemoryRouter initialEntries={[`/share/${hash}`]}>
      <Routes><Route path="/share/:hash" element={<SharePage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('SharePage', () => {
  it('shows the shared banner for a valid hash', () => {
    const hash = encodeShare({ trips: [], siteOverrides: [], settings: DEFAULT_SETTINGS })
    renderAt(hash)
    expect(screen.getByText(/viewing a shared dive plan/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /make this mine/i })).toBeInTheDocument()
  })
  it('shows an error page for a malformed hash', () => {
    renderAt('!!!broken!!!')
    expect(screen.getByRole('button', { name: /start your own plan/i })).toBeInTheDocument()
  })
})
