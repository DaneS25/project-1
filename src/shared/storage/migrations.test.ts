import { describe, expect, it } from 'vitest'
import {
  CURRENT_VERSION,
  migrate,
  MIGRATIONS,
  migrateV1ToV2,
} from './migrations'

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

describe('migrateV1ToV2', () => {
  const v1 = {
    categories: [{ id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 }],
    transactions: [
      { id: 't1', amountCents: 1250, date: '2026-10-08', categoryId: 'c1' },
    ],
  }

  it('is the migration registered for version 1', () => {
    expect(CURRENT_VERSION).toBe(2)
    expect(MIGRATIONS[1]).toBe(migrateV1ToV2)
  })

  it('leaves version 1 data unchanged, with no emoji added', () => {
    expect(migrateV1ToV2(v1)).toEqual(v1)
  })

  it('drops any emoji field found on a version 1 category', () => {
    const withStray = {
      ...v1,
      categories: [{ ...v1.categories[0], emoji: '🛒' }],
    }

    expect(migrateV1ToV2(withStray)).toEqual(v1)
  })

  it('passes data of the wrong shape through for validation to reject', () => {
    expect(migrateV1ToV2('nope')).toBe('nope')
    expect(migrateV1ToV2({ categories: 'nope' })).toEqual({
      categories: 'nope',
    })
  })
})
