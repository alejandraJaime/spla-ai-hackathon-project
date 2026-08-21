import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'

import { MODEL_CATALOG } from '../llm-provider.catalog'
import { ModelKeyMissingError, UnknownModelError } from '../llm-provider.errors'
import { getModel } from '../llm-provider.resolve'

jest.mock('@ai-sdk/google', () => ({ google: jest.fn() }))
jest.mock('@ai-sdk/anthropic', () => ({ anthropic: jest.fn() }))

const GOOGLE_ENTRY = MODEL_CATALOG.find((entry) => entry.provider === 'google')
const ANTHROPIC_ENTRY = MODEL_CATALOG.find((entry) => entry.provider === 'anthropic')

if (!GOOGLE_ENTRY || !ANTHROPIC_ENTRY) {
  throw new Error('Test fixture assumes the catalog has both a google and an anthropic entry.')
}

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  jest.clearAllMocks()
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('getModel', () => {
  it('throws UnknownModelError for an id not in the catalog', () => {
    expect(() => getModel('not-a-real-model')).toThrow(UnknownModelError)
  })

  it('throws ModelKeyMissingError when the required key is absent, without calling the provider SDK', () => {
    delete process.env[GOOGLE_ENTRY.envVar]

    expect(() => getModel(GOOGLE_ENTRY.id)).toThrow(ModelKeyMissingError)
    expect(google).not.toHaveBeenCalled()
  })

  it('reports the missing model id and env var on the thrown error', () => {
    delete process.env[ANTHROPIC_ENTRY.envVar]

    try {
      getModel(ANTHROPIC_ENTRY.id)
      throw new Error('expected getModel to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ModelKeyMissingError)
      const missingKeyError = error as ModelKeyMissingError
      expect(missingKeyError.modelId).toBe(ANTHROPIC_ENTRY.id)
      expect(missingKeyError.envVar).toBe(ANTHROPIC_ENTRY.envVar)
      expect(missingKeyError.code).toBe('MODEL_KEY_MISSING')
    }
  })

  it('substitutes a mock language model through the seam and drives a real generateText call end-to-end, with no real provider SDK involved', async () => {
    process.env[GOOGLE_ENTRY.envVar] = 'test-key'
    const mockModel = new MockLanguageModelV4({
      doGenerate: async () => ({
        finishReason: { unified: 'stop' as const, raw: undefined },
        usage: {
          inputTokens: { total: 3, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 5, text: 5, reasoning: undefined },
        },
        content: [{ type: 'text' as const, text: 'mock response' }],
        warnings: [],
      }),
    })
    jest.mocked(google).mockReturnValue(mockModel)

    const model = getModel(GOOGLE_ENTRY.id)
    const result = await generateText({ model, prompt: 'hello' })

    expect(result.text).toBe('mock response')
    expect(google).toHaveBeenCalledWith(GOOGLE_ENTRY.id)
    expect(anthropic).not.toHaveBeenCalled()
  })
})
