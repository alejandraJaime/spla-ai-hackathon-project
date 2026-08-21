import { MODEL_CATALOG } from '../llm-provider.catalog'

describe('MODEL_CATALOG', () => {
  it('lists at least one model', () => {
    expect(MODEL_CATALOG.length).toBeGreaterThan(0)
  })

  it.each(['id', 'label', 'provider', 'envVar'] as const)(
    'gives every entry a non-empty %s',
    (field) => {
      for (const entry of MODEL_CATALOG) {
        expect(typeof entry[field]).toBe('string')
        expect(entry[field].length).toBeGreaterThan(0)
      }
    },
  )

  it('gives every entry a unique id', () => {
    const ids = MODEL_CATALOG.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks exactly one entry as the default', () => {
    const defaults = MODEL_CATALOG.filter((entry) => entry.isDefault)
    expect(defaults).toHaveLength(1)
  })

  it('defaults to Gemini Flash', () => {
    const [defaultEntry] = MODEL_CATALOG.filter((entry) => entry.isDefault)
    expect(defaultEntry?.label).toBe('Gemini Flash')
    expect(defaultEntry?.provider).toBe('google')
  })
})
