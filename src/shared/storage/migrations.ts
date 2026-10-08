import type { Result } from '@/shared/types'

/** Bump this and add a migration whenever the stored data shape changes. */
export const CURRENT_VERSION = 1

export type Migration = (data: unknown) => unknown

/** `MIGRATIONS[n]` upgrades data stored at version n to version n + 1. */
export const MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {}

/**
 * Upgrades stored data from `version` to `targetVersion` one step at a time.
 * Data from a newer app version is refused rather than guessed at.
 */
export function migrate(
  version: number,
  data: unknown,
  migrations: Readonly<Partial<Record<number, Migration>>> = MIGRATIONS,
  targetVersion: number = CURRENT_VERSION,
): Result<unknown> {
  if (!Number.isSafeInteger(version) || version < 1) {
    return { ok: false, error: `Unknown schema version ${String(version)}` }
  }
  if (version > targetVersion) {
    return {
      ok: false,
      error: `Data is from a newer version (${String(version)}) of the app`,
    }
  }

  let current = data
  for (let from = version; from < targetVersion; from++) {
    const step = migrations[from]
    if (!step) {
      return { ok: false, error: `No migration from version ${String(from)}` }
    }
    current = step(current)
  }
  return { ok: true, value: current }
}
