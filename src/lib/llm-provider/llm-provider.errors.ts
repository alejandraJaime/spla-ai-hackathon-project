/**
 * Errors thrown while resolving a catalog model id to a `LanguageModel`
 * (llm-provider.resolve.ts). Every consumer switches on `code`, never on
 * class identity (docs/CODING_STANDARDS.md §3).
 */
import { AppError } from '~/server/errors/app-errors'

/** `getModel` was asked for an id that isn't in `MODEL_CATALOG`. */
export class UnknownModelError extends AppError {
  readonly code = 'UNKNOWN_MODEL' as const

  constructor(modelId: string) {
    super(`"${modelId}" is not a model in the catalog.`)
  }
}

/**
 * `getModel` was asked for a model whose required env var isn't set. Thrown
 * before any provider SDK call, since the SDKs themselves only look up the
 * key lazily, at request time.
 */
export class ModelKeyMissingError extends AppError {
  readonly code = 'MODEL_KEY_MISSING' as const

  constructor(
    readonly modelId: string,
    readonly envVar: string,
  ) {
    super(`Model "${modelId}" requires ${envVar} to be set, but it isn't configured.`)
  }
}
