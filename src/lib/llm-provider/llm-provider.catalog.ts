/**
 * Every model the app knows how to offer. Adding a model is a one-line edit
 * here — nothing else in the module hand-copies provider or key knowledge.
 *
 * Gemini Flash is the default: the cheap iteration path is the zero-effort
 * path (docs/prod-domain-docs/decisions-status.md §1 #15).
 */
import type { ModelCatalogEntry } from './llm-provider.types'

export const MODEL_CATALOG: readonly ModelCatalogEntry[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini Flash',
    provider: 'google',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini Pro',
    provider: 'google',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    isDefault: false,
  },
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    provider: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    isDefault: false,
  },
]
