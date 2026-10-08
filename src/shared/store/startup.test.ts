import { describe, expect, it } from 'vitest'
import { saveData, STORAGE_KEY } from '@/shared/storage/storage'
import type { AppData } from '@/shared/types'
import { DEFAULT_CATEGORY_NAMES } from './defaultData'
import { loadStartup } from './startup'
import { createTestIds, createTestStorage } from './testStorage'

const stored: AppData = {
  categories: [{ id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 }],
  transactions: [],
}

describe('loadStartup', () => {
  it('uses stored data when it is valid', () => {
    const { storage } = createTestStorage()
    saveData(stored, storage)

    expect(loadStartup(storage, createTestIds())).toEqual({
      status: 'loaded',
      data: stored,
    })
  })

  it('seeds the default categories, with no budget set, when nothing is stored', () => {
    const { storage, writes } = createTestStorage()

    const startup = loadStartup(storage, createTestIds())

    expect(startup.status).toBe('empty')
    expect(startup.data.transactions).toEqual([])
    expect(startup.data.categories).toEqual(
      DEFAULT_CATEGORY_NAMES.map((name, index) => ({
        id: `id-${String(index + 1)}`,
        name,
        monthlyBudgetCents: 0,
      })),
    )
    expect(writes).toEqual([])
  })

  it('seeds defaults and keeps the raw text when stored data is corrupt', () => {
    const { storage } = createTestStorage({ [STORAGE_KEY]: '{not json' })

    const startup = loadStartup(storage, createTestIds())

    expect(startup).toMatchObject({ status: 'corrupt', raw: '{not json' })
    expect(startup.data.categories).toHaveLength(DEFAULT_CATEGORY_NAMES.length)
  })

  it('seeds defaults when storage is unavailable', () => {
    const { storage } = createTestStorage({}, { blocked: true })

    const startup = loadStartup(storage, createTestIds())

    expect(startup.status).toBe('unavailable')
    expect(startup.data.categories).toHaveLength(DEFAULT_CATEGORY_NAMES.length)
  })
})
