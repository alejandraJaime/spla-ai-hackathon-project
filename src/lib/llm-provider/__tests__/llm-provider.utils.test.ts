import type { ModelCatalogEntry } from '../llm-provider.types'
import { isModelKeyConfigured } from '../llm-provider.utils'

const ENTRY: ModelCatalogEntry = {
  id: 'test-model',
  label: 'Test Model',
  provider: 'google',
  envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
  isDefault: false,
}

describe('isModelKeyConfigured', () => {
  it('reports true when the env var holds a non-empty value', () => {
    expect(isModelKeyConfigured(ENTRY, { GOOGLE_GENERATIVE_AI_API_KEY: 'secret' })).toBe(true)
  })

  it('reports false when the env var is absent', () => {
    expect(isModelKeyConfigured(ENTRY, {})).toBe(false)
  })

  it('reports false when the env var is an empty string', () => {
    expect(isModelKeyConfigured(ENTRY, { GOOGLE_GENERATIVE_AI_API_KEY: '' })).toBe(false)
  })

  it('reports false when the env var is undefined', () => {
    expect(isModelKeyConfigured(ENTRY, { GOOGLE_GENERATIVE_AI_API_KEY: undefined })).toBe(false)
  })

  it('ignores unrelated env vars', () => {
    expect(isModelKeyConfigured(ENTRY, { SOME_OTHER_KEY: 'secret' })).toBe(false)
  })

  it('has no side effects: repeated calls with the same input return the same result', () => {
    const env = { GOOGLE_GENERATIVE_AI_API_KEY: 'secret' }
    expect(isModelKeyConfigured(ENTRY, env)).toBe(isModelKeyConfigured(ENTRY, env))
  })

  it('does not mutate the env object it is given', () => {
    const env = { GOOGLE_GENERATIVE_AI_API_KEY: 'secret' }
    const snapshot = { ...env }
    isModelKeyConfigured(ENTRY, env)
    expect(env).toEqual(snapshot)
  })
})
