import { FreeformDictionaryFieldError, UnknownDictionaryFieldError } from '~/lib/translation/errors'

import {
  dictionaryValues,
  FIELD_DICTIONARY,
  KNOWLEDGE_DOCUMENTS,
  readKnowledgeDocument,
} from '../index'
import type { DictionaryFieldName, FieldDictionary, KnowledgeDocumentName } from '../types'

const documentNames = Object.keys(KNOWLEDGE_DOCUMENTS) as KnowledgeDocumentName[]

describe('domain-knowledge documents', () => {
  it.each(documentNames)('%s is readable at runtime', (name) => {
    expect(readKnowledgeDocument(name).length).toBeGreaterThan(0)
  })

  it('covers the field dictionary, the campaign-spec and the three step prompts', () => {
    expect(documentNames).toEqual([
      'fieldDictionary',
      'campaignSpec',
      'extractorPrompt',
      'translatorPrompt',
      'editorPrompt',
    ])
  })

  it('asks the extractor for the spaced dictionary size form', () => {
    const prompt = readKnowledgeDocument('extractorPrompt')

    expect(prompt).toContain('`WIDTH x HEIGHT`')
    expect(prompt).toContain('`300 x 250`')
    expect(prompt).not.toMatch(/300x250|WIDTHxHEIGHT/)
  })

  it('points the campaign-spec at the field dictionary asset that exists', () => {
    const campaignSpec = readKnowledgeDocument('campaignSpec')

    expect(campaignSpec).toContain('taxonomy-fields.json')
    expect(campaignSpec).not.toContain('taxonomy-fields.md')
  })
})

describe('the field dictionary', () => {
  it('parses into fields that each carry at least one allowed value', () => {
    expect(FIELD_DICTIONARY.length).toBeGreaterThan(0)
    for (const field of FIELD_DICTIONARY) {
      expect(field.allowedValues.length).toBeGreaterThan(0)
    }
  })

  it("reads a field's allowed values straight out of the dictionary", () => {
    expect(dictionaryValues('Campaign Type')).toEqual(['Display', 'Standard Tracking', 'YouTube'])
  })

  it('derives from whichever dictionary it is given', () => {
    const dictionary: FieldDictionary = [
      { name: 'Country', allowedValues: ['US', 'ZZ'], isFreeform: false },
    ]

    expect(dictionaryValues('Country', dictionary)).toEqual(['US', 'ZZ'])
  })

  it('rejects a field it does not define', () => {
    expect(() => dictionaryValues('Language' as DictionaryFieldName)).toThrow(
      UnknownDictionaryFieldError,
    )
  })

  it('rejects a freeform field, which has no hard-constrained values', () => {
    const dictionary: FieldDictionary = [
      { name: 'Country', allowedValues: ['US'], isFreeform: true },
    ]

    expect(() => dictionaryValues('Country', dictionary)).toThrow(FreeformDictionaryFieldError)
  })
})
