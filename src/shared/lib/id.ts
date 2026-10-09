import type { Id } from '@/shared/types'

/** Creates a new unique id. Wrapped so tests can inject a predictable one. */
export function createId(): Id {
  return crypto.randomUUID()
}
