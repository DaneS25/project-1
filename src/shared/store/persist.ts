import {
  backupRawData,
  saveData,
  type StorageLike,
} from '@/shared/storage/storage'
import type { AppData } from '@/shared/types'
import type { StorageNotice } from './AppDataContext'
import type { Startup } from './startup'

/** What happens to storage when the data changes. */
export type Persistence =
  | { kind: 'saving' }
  | { kind: 'unavailable' }
  /** Unreadable data is still in storage; back it up before the first save. */
  | { kind: 'backupPending'; raw: string }
  | { kind: 'backedUp' }
  /** Unreadable data couldn't be backed up, so it must never be overwritten. */
  | { kind: 'backupFailed' }

export type StoreState = {
  data: AppData
  persistence: Persistence
  saveFailed: boolean
}

export function createStoreState(startup: Startup): StoreState {
  return {
    data: startup.data,
    persistence: initialPersistence(startup),
    saveFailed: false,
  }
}

function initialPersistence(startup: Startup): Persistence {
  switch (startup.status) {
    case 'loaded':
    case 'empty':
      return { kind: 'saving' }
    case 'unavailable':
      return { kind: 'unavailable' }
    case 'corrupt':
      return { kind: 'backupPending', raw: startup.raw }
    default: {
      const unhandled: never = startup
      return unhandled
    }
  }
}

/**
 * Saves changed data and returns the new store state. Backs up unreadable
 * data before the first save replaces it, and skips saving when storage is
 * unavailable or the backup failed.
 */
export function persist(
  state: StoreState,
  data: AppData,
  storage?: StorageLike,
): StoreState {
  let { persistence } = state
  if (persistence.kind === 'backupPending') {
    persistence = backupRawData(persistence.raw, storage).ok
      ? { kind: 'backedUp' }
      : { kind: 'backupFailed' }
  }
  if (
    persistence.kind === 'unavailable' ||
    persistence.kind === 'backupFailed'
  ) {
    return { data, persistence, saveFailed: false }
  }
  return { data, persistence, saveFailed: !saveData(data, storage).ok }
}

export function getNotice(state: StoreState): StorageNotice | null {
  if (state.saveFailed) return 'saveFailed'
  switch (state.persistence.kind) {
    case 'saving':
      return null
    case 'unavailable':
      return 'unavailable'
    case 'backupPending':
    case 'backedUp':
      return 'corruptBackedUp'
    case 'backupFailed':
      return 'corruptNotBackedUp'
    default: {
      const unhandled: never = state.persistence
      return unhandled
    }
  }
}
