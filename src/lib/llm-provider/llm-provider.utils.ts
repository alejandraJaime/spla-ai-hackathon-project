/**
 * Pure helpers, internal to the module. `isModelKeyConfigured` is the one
 * piece of "is this model usable" logic — the resolution seam and the
 * usable-models query both reuse it instead of re-deriving it.
 */
import type { ModelCatalogEntry } from './llm-provider.types'

/**
 * Whether `entry`'s required env var is present. Takes `env` as an explicit
 * argument rather than reading `process.env` itself, so the check stays a
 * pure function with no side effects.
 */
export function isModelKeyConfigured(
  entry: ModelCatalogEntry,
  env: Record<string, string | undefined>,
): boolean {
  const value = env[entry.envVar]
  return typeof value === 'string' && value.length > 0
}
