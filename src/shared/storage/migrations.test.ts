import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION, migrate } from './migrations'

describe('migrate', () => {
  it('returns current-version data unchanged', () => {
    const data = { categories: [], transactions: [] }

    expect(migrate(CURRENT_VERSION, data)).toEqual({ ok: true, value: data })
  })

  it('refuses data from a newer version of the app', () => {
    expect(migrate(CURRENT_VERSION + 1, {})).toEqual({
      ok: false,
      error: `Data is from a newer version (${String(CURRENT_VERSION + 1)}) of the app`,
    })
  })

  it.each([0, -1, 1.5, Number.NaN])('refuses version %s', (version) => {
    expect(migrate(version, {}).ok).toBe(false)
  })

  it('applies each migration in order up to the target version', () => {
    const migrations = {
      1: (data: unknown) => ({ from1: data }),
      2: (data: unknown) => ({ from2: data }),
    }

    expect(migrate(1, 'v1', migrations, 3)).toEqual({
      ok: true,
      value: { from2: { from1: 'v1' } },
    })
  })

  it('starts from the stored version, skipping earlier migrations', () => {
    const migrations = {
      1: () => 'should not run',
      2: (data: unknown) => ({ from2: data }),
    }

    expect(migrate(2, 'v2', migrations, 3)).toEqual({
      ok: true,
      value: { from2: 'v2' },
    })
  })

  it('fails when a migration step is missing', () => {
    expect(migrate(1, {}, {}, 2)).toEqual({
      ok: false,
      error: 'No migration from version 1',
    })
  })
})
