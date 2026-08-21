/**
 * The static config surface the rest of the llm provider module builds on:
 * which providers exist, and the shape of one catalog entry. No resolution
 * logic and no querying logic lives here — just the data model.
 */

/** A model provider this app can call, identified by AI SDK package name. */
export type LlmProviderName = 'google' | 'anthropic'

/**
 * The provider key env vars declared in `src/env.js`'s server schema. Kept
 * as a literal union, not a bare `string`, so a typo in a catalog entry's
 * `envVar` is a compile error rather than a model that's silently always
 * "not configured."
 */
export type ProviderEnvVar = 'GOOGLE_GENERATIVE_AI_API_KEY' | 'ANTHROPIC_API_KEY'

/** One model the app can offer, and what it takes for that model to be usable. */
export type ModelCatalogEntry = {
  /** The id passed to the provider SDK when resolving a `LanguageModel`. */
  readonly id: string
  /** Human-readable name shown in the model picker. */
  readonly label: string
  readonly provider: LlmProviderName
  /** The env var that must hold a value for this model to be usable. */
  readonly envVar: ProviderEnvVar
  /** Exactly one catalog entry is the default; see `MODEL_CATALOG`. */
  readonly isDefault: boolean
}
