import { describe, expect, it } from 'vitest'
import type { AppData } from '@/shared/types'
import { CURRENT_VERSION } from './migrations'
import {
  BACKUP_KEY,
  backupRawData,
  loadData,
  saveData,
  STORAGE_KEY,
  type StorageLike,
} from './storage'

const data: AppData = {
  categories: [{ id: 'c1', name: 'Groceries', monthlyBudgetCents: 60000 }],
  transactions: [
    { id: 't1', amountCents: 1250, date: '2026-10-08', categoryId: 'c1' },
  ],
}

function store(value: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  },
  setItem: () => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  },
}

describe('loadData', () => {
  it('reports empty when nothing has been stored', () => {
    expect(loadData()).toEqual({ status: 'empty' })
  })

  it('loads data that was saved', () => {
    saveData(data)

    expect(loadData()).toEqual({ status: 'loaded', data })
  })

  it('reports corrupt for invalid JSON, with the raw stored text', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    expect(loadData()).toMatchObject({ status: 'corrupt', raw: '{not json' })
  })

  it('reports corrupt when the schema version is missing', () => {
    store({ data })

    expect(loadData()).toEqual({
      status: 'corrupt',
      error: 'Missing schema version',
      raw: JSON.stringify({ data }),
    })
  })

  it('reports corrupt for data from a newer app version', () => {
    store({ version: CURRENT_VERSION + 1, data })

    expect(loadData()).toMatchObject({ status: 'corrupt' })
  })

  it('reports corrupt when the data has the wrong shape', () => {
    store({ version: CURRENT_VERSION, data: { transactions: 'nope' } })

    expect(loadData()).toMatchObject({ status: 'corrupt' })
  })

  it('leaves corrupt data in place', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    loadData()

    expect(localStorage.getItem(STORAGE_KEY)).toBe('{not json')
  })

  it('reports unavailable when storage cannot be read', () => {
    expect(loadData(throwingStorage)).toEqual({
      status: 'unavailable',
      error: 'The operation is insecure.',
    })
  })
})

describe('saveData', () => {
  it('stores the data under the app key with the current schema version', () => {
    expect(saveData(data)).toEqual({ ok: true })

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      version: CURRENT_VERSION,
      data,
    })
  })

  it('reports a failure instead of throwing when storage is full', () => {
    expect(saveData(data, throwingStorage)).toEqual({
      ok: false,
      error: 'Quota exceeded',
    })
  })
})

describe('backupRawData', () => {
  it('copies the raw text to the backup key without touching the main key', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    expect(backupRawData('{not json')).toEqual({ ok: true })

    expect(localStorage.getItem(BACKUP_KEY)).toBe('{not json')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{not json')
  })

  it('reports a failure instead of throwing when storage is full', () => {
    expect(backupRawData('x', throwingStorage)).toEqual({
      ok: false,
      error: 'Quota exceeded',
    })
  })
})
