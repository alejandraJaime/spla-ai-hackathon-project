/**
 * The query the model picker (05c) calls: which catalog models are usable
 * given the keys actually present, and which one to default to. Builds on
 * `isModelKeyConfigured` (04a) — no knowledge of the resolution seam (04b).
 */
import type { ModelCatalogEntry } from './llm-provider.types'
import { isModelKeyConfigured } from './llm-provider.utils'

export type UsableModels = {
  /** Catalog entries, in catalog order, whose provider key is configured. */
  readonly models: readonly ModelCatalogEntry[]
  /**
   * The id to preselect: the catalog's default entry if it's usable,
   * otherwise the first usable model. Undefined when nothing is usable.
   */
  readonly defaultModelId: string | undefined
}

export function getUsableModels(
  catalog: readonly ModelCatalogEntry[],
  env: Record<string, string | undefined>,
): UsableModels {
  const models = catalog.filter((entry) => isModelKeyConfigured(entry, env))
  const defaultEntry = models.find((entry) => entry.isDefault) ?? models[0]

  return { models, defaultModelId: defaultEntry?.id }
}
