/**
 * The size rule of the Plan/Hierarchy contracts. Sizes are stored in exactly one
 * canonical form, the dictionary spelling "WIDTH x HEIGHT"; this is the only
 * sanctioned way to get numbers out of one, so no second representation is ever
 * stored. Part of the module's public surface, not an internal helper.
 */
import type { CanonicalSize, ISizeParts } from './translation.types'

export function splitSize(size: CanonicalSize): ISizeParts {
  const [width, height] = size.split(/\s*x\s*/i).map(toDimension)
  return { width: width ?? 0, height: height ?? 0 }
}

/** A non-numeric part reads as 0 rather than NaN, so arithmetic downstream is safe. */
function toDimension(part: string): number {
  const parsed = Number.parseInt(part, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}
