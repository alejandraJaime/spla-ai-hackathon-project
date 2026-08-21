/**
 * Domain knowledge as data.
 *
 * The field dictionary, the campaign-spec and the three step prompts are
 * versioned documents the server reads at runtime and loads into prompts as
 * context — never hard-coded logic. The dictionary is additionally the source
 * the hard-constrained Zod enums are *derived* from (see
 * `translation.validation.ts`), so the prompt and the schema cannot drift
 * apart: adding an allowed value to `documents/taxonomy-fields.json` is the
 * only edit needed for code to accept it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

import fieldDictionaryDocument from './documents/taxonomy-fields.json'
import { Schema_FieldDictionary } from './validation'
import type { DictionaryFieldName, FieldDictionary, KnowledgeDocumentName } from './types'
import {
  FieldDictionaryMalformedError,
  FreeformDictionaryFieldError,
  KnowledgeDocumentUnreadableError,
  UnknownDictionaryFieldError,
} from '../errors'

/** Filename on disk for each document, relative to `documents/`. */
export const KNOWLEDGE_DOCUMENTS: Record<KnowledgeDocumentName, string> = {
  fieldDictionary: 'taxonomy-fields.json',
  campaignSpec: 'campaign-spec.md',
  extractorPrompt: 's1-extractor-prompt.md',
  translatorPrompt: 's2-translator-prompt.md',
  editorPrompt: 's3-editor-prompt.md',
}

/**
 * Resolved from the working directory rather than `__dirname`, which a bundled
 * server chunk reports as its own chunk directory. Next runs from the project
 * root in dev, in `next start` and in the Docker image; `next.config.js` keeps
 * these files in the traced output.
 */
const DOCUMENTS_DIRECTORY = path.join(
  process.cwd(),
  'src',
  'lib',
  'translation',
  'knowledge',
  'documents',
)

function parseFieldDictionary(document: unknown): FieldDictionary {
  const parsed = Schema_FieldDictionary.safeParse(document)
  if (!parsed.success) {
    throw new FieldDictionaryMalformedError(parsed.error.message)
  }
  return parsed.data
}

/**
 * The field dictionary, parsed once at module load. Imported rather than read
 * through `readKnowledgeDocument` so the enums derive from it synchronously and
 * the bundler keeps it; `readKnowledgeDocument('fieldDictionary')` returns the
 * same file as text, for prompt context.
 */
export const FIELD_DICTIONARY: FieldDictionary = parseFieldDictionary(fieldDictionaryDocument)

/**
 * The allowed values for one hard-constrained dictionary field, as a non-empty
 * tuple ready for `z.enum`. `dictionary` is injectable so the derivation itself
 * can be exercised against a dictionary other than the one on disk.
 */
export function dictionaryValues(
  fieldName: DictionaryFieldName,
  dictionary: FieldDictionary = FIELD_DICTIONARY,
): [string, ...string[]] {
  const field = dictionary.find((entry) => entry.name === fieldName)
  if (!field) {
    throw new UnknownDictionaryFieldError(fieldName)
  }
  if (field.isFreeform) {
    throw new FreeformDictionaryFieldError(fieldName)
  }

  const [first, ...rest] = field.allowedValues
  if (first === undefined) {
    throw new FieldDictionaryMalformedError(`field "${fieldName}" has no allowed values`)
  }
  return [first, ...rest]
}

/**
 * A Zod enum derived from one dictionary field. This is the only way a
 * hard-constrained enum is built — no allowed value is ever hand-copied into
 * a schema.
 */
export function buildDictionaryEnum(
  fieldName: DictionaryFieldName,
  dictionary: FieldDictionary = FIELD_DICTIONARY,
) {
  return z
    .enum(dictionaryValues(fieldName, dictionary))
    .describe(`"${fieldName}" value, from the field dictionary. Use this exact spelling.`)
}

const documentCache = new Map<KnowledgeDocumentName, string>()

/** Reads one domain-knowledge document from disk, for use as prompt context. */
export function readKnowledgeDocument(name: KnowledgeDocumentName): string {
  const cached = documentCache.get(name)
  if (cached !== undefined) {
    return cached
  }

  const fileName = KNOWLEDGE_DOCUMENTS[name]
  try {
    const contents = readFileSync(path.join(DOCUMENTS_DIRECTORY, fileName), 'utf8')
    documentCache.set(name, contents)
    return contents
  } catch (cause) {
    throw new KnowledgeDocumentUnreadableError(fileName, { cause })
  }
}
