/**
 * The llm provider module's public surface: the model catalog. The
 * key-presence check is internal, consumed directly by the resolution seam
 * (04b) and the usable-models query (04c) within this module. Those two
 * tickets add the module's actual external surface.
 */
export type { LlmProviderName, ModelCatalogEntry, ProviderEnvVar } from './llm-provider.types'

export { MODEL_CATALOG } from './llm-provider.catalog'
