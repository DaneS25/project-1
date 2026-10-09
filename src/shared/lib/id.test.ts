import { describe, expect, it } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  it('returns a different UUID each time', () => {
    const first = createId()
    const second = createId()

    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(second).not.toBe(first)
  })
})
