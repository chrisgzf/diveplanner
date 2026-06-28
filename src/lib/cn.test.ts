import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges class names and dedupes conflicting tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-ink', false && 'hidden', 'font-body')).toBe('text-ink font-body')
  })
})
