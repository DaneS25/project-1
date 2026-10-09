import { loadData, type StorageLike } from '@/shared/storage/storage'
import type { AppData, Id } from '@/shared/types'
import { createDefaultData } from './defaultData'

export type Startup =
  | { status: 'loaded' | 'empty' | 'unavailable'; data: AppData }
  | { status: 'corrupt'; data: AppData; raw: string }

/**
 * Decides the app's starting data. Anything other than valid stored data
 * starts from the defaults; `raw` is kept for corrupt data so it can be
 * backed up before it's overwritten. Reads storage but never writes.
 */
export function loadStartup(
  storage: StorageLike | undefined,
  createId: () => Id,
): Startup {
  const result = loadData(storage)
  switch (result.status) {
    case 'loaded':
      return { status: 'loaded', data: result.data }
    case 'empty':
    case 'unavailable':
      return { status: result.status, data: createDefaultData(createId) }
    case 'corrupt':
      return {
        status: 'corrupt',
        data: createDefaultData(createId),
        raw: result.raw,
      }
    default: {
      const unhandled: never = result
      return unhandled
    }
  }
}
