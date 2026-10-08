import type { AppData } from '@/shared/types'
import { CURRENT_VERSION, migrate } from './migrations'
import { isRecord, parseAppData } from './validate'

export const STORAGE_KEY = 'budget-app:v1'

/** The parts of `Storage` we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type StoredEnvelope = {
  version: number
  data: AppData
}

export type LoadResult =
  | { status: 'loaded'; data: AppData }
  | { status: 'empty' }
  | { status: 'corrupt'; error: string }
  | { status: 'unavailable'; error: string }

export type SaveResult = { ok: true } | { ok: false; error: string }

/**
 * Reads app data from storage. Never throws and never writes: corrupt data
 * is left in place so it isn't lost before the user makes a change.
 * `storage` defaults to `window.localStorage`, read lazily because even
 * accessing it can throw when storage is blocked.
 */
export function loadData(storage?: StorageLike): LoadResult {
  let raw: string | null
  try {
    raw = (storage ?? window.localStorage).getItem(STORAGE_KEY)
  } catch (error) {
    return { status: 'unavailable', error: describeError(error) }
  }
  if (raw === null) return { status: 'empty' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return { status: 'corrupt', error: `Invalid JSON: ${describeError(error)}` }
  }
  if (!isRecord(parsed) || typeof parsed.version !== 'number') {
    return { status: 'corrupt', error: 'Missing schema version' }
  }

  let migrated: ReturnType<typeof migrate>
  try {
    migrated = migrate(parsed.version, parsed.data)
  } catch (error) {
    return {
      status: 'corrupt',
      error: `Migration failed: ${describeError(error)}`,
    }
  }
  if (!migrated.ok) return { status: 'corrupt', error: migrated.error }

  const data = parseAppData(migrated.value)
  if (!data.ok) return { status: 'corrupt', error: data.error }
  return { status: 'loaded', data: data.value }
}

/** Writes app data to storage. Never throws (storage may be full or blocked). */
export function saveData(data: AppData, storage?: StorageLike): SaveResult {
  const envelope: StoredEnvelope = { version: CURRENT_VERSION, data }
  try {
    const store = storage ?? window.localStorage
    store.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return { ok: true }
  } catch (error) {
    return { ok: false, error: describeError(error) }
  }
}

/** Uses `message` from any error-like value (DOMException isn't always an Error). */
function describeError(error: unknown): string {
  if (isRecord(error) && typeof error.message === 'string') return error.message
  return String(error)
}
