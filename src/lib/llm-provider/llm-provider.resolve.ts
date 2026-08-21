/**
 * The module's only injection point. Resolves a catalog model id to a real
 * `LanguageModel` — every later ticket's tests substitute a mock language
 * model here and run everything else for real (spec.md "The seam").
 */
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

import { MODEL_CATALOG } from './llm-provider.catalog'
import { ModelKeyMissingError, UnknownModelError } from './llm-provider.errors'
import type { LlmProviderName } from './llm-provider.types'
import { isModelKeyConfigured } from './llm-provider.utils'

const PROVIDERS: Record<LlmProviderName, (modelId: string) => LanguageModel> = {
  google,
  anthropic,
}

/**
 * Resolves `modelId` to a `LanguageModel`. Reads `process.env` directly
 * rather than `~/env`, so this module stays free of the Next.js/database
 * config surface `~/env` also validates.
 */
export function getModel(modelId: string): LanguageModel {
  const entry = MODEL_CATALOG.find((candidate) => candidate.id === modelId)
  if (!entry) {
    throw new UnknownModelError(modelId)
  }
  if (!isModelKeyConfigured(entry, process.env)) {
    throw new ModelKeyMissingError(entry.id, entry.envVar)
  }
  return PROVIDERS[entry.provider](entry.id)
}
