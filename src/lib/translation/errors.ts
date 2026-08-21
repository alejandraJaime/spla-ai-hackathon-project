import { AppError } from '~/server/errors/app-errors'

/** The field dictionary on disk does not match the shape the module expects. */
export class FieldDictionaryMalformedError extends AppError {
  readonly code = 'FIELD_DICTIONARY_MALFORMED' as const

  constructor(detail: string) {
    super(`The field dictionary is malformed: ${detail}`)
  }
}

/** A field was requested that the field dictionary does not define. */
export class UnknownDictionaryFieldError extends AppError {
  readonly code = 'UNKNOWN_DICTIONARY_FIELD' as const

  constructor(fieldName: string) {
    super(`The field dictionary has no field named "${fieldName}".`)
  }
}

/** A freeform field has no hard-constrained value list, so no enum derives from it. */
export class FreeformDictionaryFieldError extends AppError {
  readonly code = 'FREEFORM_DICTIONARY_FIELD' as const

  constructor(fieldName: string) {
    super(`Field "${fieldName}" is freeform; it has no hard-constrained list of allowed values.`)
  }
}

/** A domain-knowledge document could not be read from disk at runtime. */
export class KnowledgeDocumentUnreadableError extends AppError {
  readonly code = 'KNOWLEDGE_DOCUMENT_UNREADABLE' as const

  constructor(fileName: string, options?: ErrorOptions) {
    super(`Could not read the domain-knowledge document "${fileName}".`, options)
  }
}
