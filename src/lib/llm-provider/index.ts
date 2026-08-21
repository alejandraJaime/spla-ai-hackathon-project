/**
 * The llm provider module's public surface: the model catalog, model
 * resolution, the usable-models query, and the errors resolution can throw.
 * The key-presence check is internal, consumed directly by `getModel` and
 * by `getUsableModels` within this module.
 */
export type { LlmProviderName, ModelCatalogEntry, ProviderEnvVar } from './llm-provider.types'

export { MODEL_CATALOG } from './llm-provider.catalog'
export { ModelKeyMissingError, UnknownModelError } from './llm-provider.errors'
export { getModel } from './llm-provider.resolve'
export { getUsableModels } from './llm-provider.usable'
export type { UsableModels } from './llm-provider.usable'
