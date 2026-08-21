import type { ModelCatalogEntry } from '../llm-provider.types'
import { getUsableModels } from '../llm-provider.usable'

const CATALOG: readonly ModelCatalogEntry[] = [
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

describe('getUsableModels', () => {
  it('returns only the Gemini options when only the Gemini key is configured', () => {
    const result = getUsableModels(CATALOG, { GOOGLE_GENERATIVE_AI_API_KEY: 'secret' })

    expect(result.models).toEqual([CATALOG[0], CATALOG[1]])
  })

  it('reports Gemini Flash as the default when it is usable', () => {
    const result = getUsableModels(CATALOG, { GOOGLE_GENERATIVE_AI_API_KEY: 'secret' })

    expect(result.defaultModelId).toBe('gemini-2.5-flash')
  })

  it('reports no usable models when no keys are configured, without throwing', () => {
    expect(() => getUsableModels(CATALOG, {})).not.toThrow()

    const result = getUsableModels(CATALOG, {})
    expect(result.models).toEqual([])
  })

  it('reports no default when no keys are configured', () => {
    const result = getUsableModels(CATALOG, {})
    expect(result.defaultModelId).toBeUndefined()
  })

  it('includes Anthropic models when the Anthropic key is configured', () => {
    const result = getUsableModels(CATALOG, { ANTHROPIC_API_KEY: 'secret' })

    expect(result.models).toEqual([CATALOG[2]])
  })

  it('falls back to another usable model as default when Gemini Flash is not usable', () => {
    const result = getUsableModels(CATALOG, { ANTHROPIC_API_KEY: 'secret' })

    expect(result.defaultModelId).toBe('claude-sonnet-5')
  })

  it('includes every usable model across providers when all keys are configured', () => {
    const result = getUsableModels(CATALOG, {
      GOOGLE_GENERATIVE_AI_API_KEY: 'secret',
      ANTHROPIC_API_KEY: 'secret',
    })

    expect(result.models).toEqual(CATALOG)
    expect(result.defaultModelId).toBe('gemini-2.5-flash')
  })
})
