import type { z } from 'zod'
import type { Schema_FieldDictionary, Schema_FieldDictionaryEntry } from './validation'

export type FieldDictionaryEntry = z.infer<typeof Schema_FieldDictionaryEntry>
export type FieldDictionary = z.infer<typeof Schema_FieldDictionary>

/**
 * The fields the field dictionary defines. Adding a *value* to an existing
 * field needs no code change; adding a whole new *field* means naming it here
 * and exporting a schema for it from `translation.validation.ts`.
 */
export type DictionaryFieldName =
  | 'Size'
  | 'Media Type'
  | 'Inventory'
  | 'Campaign Type'
  | 'Platform'
  | 'Tactic'
  | 'Campaign Objective'
  | 'Audience'
  | 'Publisher'
  | 'Media Format'
  | 'Device'
  | 'Country'
  | 'Region'

/** The versioned documents loaded into prompts as context. */
export type KnowledgeDocumentName =
  'fieldDictionary' | 'campaignSpec' | 'extractorPrompt' | 'translatorPrompt' | 'editorPrompt'
