import type { StorageLike } from '@/shared/storage/storage'

/**
 * In-memory storage for tests. Keys in `failingKeys` throw on write, and
 * `blocked` makes every read and write throw, like a browser with storage
 * disabled.
 */
export function createTestStorage(
  initial: Record<string, string> = {},
  options: { failingKeys?: string[]; blocked?: boolean } = {},
) {
  const items = new Map(Object.entries(initial))
  const writes: string[] = []
  const storage: StorageLike = {
    getItem: (key) => {
      if (options.blocked) throw new Error('Storage is disabled')
      return items.get(key) ?? null
    },
    setItem: (key, value) => {
      if (options.blocked) throw new Error('Storage is disabled')
      if (options.failingKeys?.includes(key)) throw new Error('Quota exceeded')
      writes.push(key)
      items.set(key, value)
    },
  }
  return { storage, items, writes }
}

/** Predictable ids: id-1, id-2, ... */
export function createTestIds() {
  let count = 0
  return () => `id-${String(++count)}`
}
