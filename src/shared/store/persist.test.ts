import { describe, expect, it } from 'vitest'
import { BACKUP_KEY, STORAGE_KEY } from '@/shared/storage/storage'
import type { AppData } from '@/shared/types'
import {
  createStoreState,
  getNotice,
  persist,
  type StoreState,
} from './persist'
import { createTestStorage } from './testStorage'

const before: AppData = { categories: [], transactions: [] }
const after: AppData = {
  categories: [{ id: 'c1', name: 'Groceries', monthlyBudgetCents: 0 }],
  transactions: [],
}

function stateWith(persistence: StoreState['persistence']): StoreState {
  return { data: before, persistence, saveFailed: false }
}

function storedData(items: Map<string, string>): unknown {
  return JSON.parse(items.get(STORAGE_KEY) ?? 'null')
}

describe('createStoreState', () => {
  it.each([
    ['loaded', { status: 'loaded', data: before }, { kind: 'saving' }],
    ['empty', { status: 'empty', data: before }, { kind: 'saving' }],
    [
      'unavailable',
      { status: 'unavailable', data: before },
      { kind: 'unavailable' },
    ],
    [
      'corrupt',
      { status: 'corrupt', data: before, raw: 'x' },
      { kind: 'backupPending', raw: 'x' },
    ],
  ] as const)(
    'starts %s data with the right persistence',
    (_label, startup, persistence) => {
      expect(createStoreState(startup)).toEqual({
        data: before,
        persistence,
        saveFailed: false,
      })
    },
  )
})

describe('persist', () => {
  it('saves the new data', () => {
    const { storage, items } = createTestStorage()

    const next = persist(stateWith({ kind: 'saving' }), after, storage)

    expect(next).toEqual({
      data: after,
      persistence: { kind: 'saving' },
      saveFailed: false,
    })
    expect(storedData(items)).toMatchObject({ data: after })
  })

  it('flags a failed save, and clears the flag once a save works', () => {
    const full = createTestStorage({}, { failingKeys: [STORAGE_KEY] })
    const failed = persist(stateWith({ kind: 'saving' }), after, full.storage)
    expect(failed.saveFailed).toBe(true)

    const { storage } = createTestStorage()
    expect(persist(failed, before, storage).saveFailed).toBe(false)
  })

  it('backs up unreadable data before the first save replaces it', () => {
    const { storage, items, writes } = createTestStorage({
      [STORAGE_KEY]: '{not json',
    })

    const next = persist(
      stateWith({ kind: 'backupPending', raw: '{not json' }),
      after,
      storage,
    )

    expect(writes).toEqual([BACKUP_KEY, STORAGE_KEY])
    expect(items.get(BACKUP_KEY)).toBe('{not json')
    expect(storedData(items)).toMatchObject({ data: after })
    expect(next.persistence).toEqual({ kind: 'backedUp' })
  })

  it('backs up only once', () => {
    const { storage, writes } = createTestStorage()

    const first = persist(
      stateWith({ kind: 'backupPending', raw: 'x' }),
      after,
      storage,
    )
    persist(first, before, storage)

    expect(writes.filter((key) => key === BACKUP_KEY)).toHaveLength(1)
  })

  it('never overwrites unreadable data that could not be backed up', () => {
    const { storage, items } = createTestStorage(
      { [STORAGE_KEY]: '{not json' },
      { failingKeys: [BACKUP_KEY] },
    )

    const first = persist(
      stateWith({ kind: 'backupPending', raw: '{not json' }),
      after,
      storage,
    )
    const second = persist(first, before, storage)

    expect(second).toEqual({
      data: before,
      persistence: { kind: 'backupFailed' },
      saveFailed: false,
    })
    expect(items.get(STORAGE_KEY)).toBe('{not json')
  })

  it('keeps changes in memory without writing when storage is unavailable', () => {
    const { storage, writes } = createTestStorage()

    const next = persist(stateWith({ kind: 'unavailable' }), after, storage)

    expect(next.data).toBe(after)
    expect(writes).toEqual([])
  })
})

describe('getNotice', () => {
  it.each([
    [{ kind: 'saving' }, null],
    [{ kind: 'unavailable' }, 'unavailable'],
    [{ kind: 'backupPending', raw: 'x' }, 'corruptBackedUp'],
    [{ kind: 'backedUp' }, 'corruptBackedUp'],
    [{ kind: 'backupFailed' }, 'corruptNotBackedUp'],
  ] as const)('maps %o to %s', (persistence, notice) => {
    expect(getNotice(stateWith(persistence))).toBe(notice)
  })

  it('shows a failed save ahead of other notices', () => {
    expect(
      getNotice({ ...stateWith({ kind: 'backedUp' }), saveFailed: true }),
    ).toBe('saveFailed')
  })
})
