import type { AppData } from '@/shared/types'
import { CURRENT_VERSION, migrate } from './migrations'
import { isRecord, parseAppData } from './validate'

export const STORAGE_KEY = 'budget-app:v1'
export const BACKUP_KEY = 'budget-app:v1:backup'

/** The parts of `Storage` we use, so tests can pass a fake. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type StoredEnvelope = {
  version: number
  data: AppData
}

export type LoadResult =
  | { status: 'loaded'; data: AppData }
  | { status: 'empty' }
  | { status: 'corrupt'; error: string; raw: string }
  | { status: 'unavailable'; error: string }

export type SaveResult = { ok: true } | { ok: false; error: string }

/**
 * Reads app data from storage. Never throws and never writes: corrupt data
 * is left in place (and returned as `raw`) so it can be backed up.
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

  const corrupt = (error: string): LoadResult => ({
    status: 'corrupt',
    error,
    raw,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return corrupt(`Invalid JSON: ${describeError(error)}`)
  }
  if (!isRecord(parsed) || typeof parsed.version !== 'number') {
    return corrupt('Missing schema version')
  }

  let migrated: ReturnType<typeof migrate>
  try {
    migrated = migrate(parsed.version, parsed.data)
  } catch (error) {
    return corrupt(`Migration failed: ${describeError(error)}`)
  }
  if (!migrated.ok) return corrupt(migrated.error)

  const data = parseAppData(migrated.value)
  if (!data.ok) return corrupt(data.error)
  return { status: 'loaded', data: data.value }
}

/** Writes app data to storage. Never throws (storage may be full or blocked). */
export function saveData(data: AppData, storage?: StorageLike): SaveResult {
  const envelope: StoredEnvelope = { version: CURRENT_VERSION, data }
  return write(STORAGE_KEY, JSON.stringify(envelope), storage)
}

/** Keeps a copy of unreadable stored text before it gets overwritten. */
export function backupRawData(raw: string, storage?: StorageLike): SaveResult {
  return write(BACKUP_KEY, raw, storage)
}

function write(key: string, value: string, storage?: StorageLike): SaveResult {
  try {
    const store = storage ?? window.localStorage
    store.setItem(key, value)
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
