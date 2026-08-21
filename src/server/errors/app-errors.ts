/**
 * Cross-cutting application error base (docs/CODING_STANDARDS.md §3).
 *
 * Every error a user sees rendered with a specific, helpful message is an
 * `AppError` subclass carrying a literal `code`. The client switches on `code`,
 * not on class identity, because class identity does not survive serialization
 * across the network boundary. Anything that is not an `AppError` is
 * unexpected: it gets a generic client-facing message and a full server log.
 */
export abstract class AppError extends Error {
  abstract readonly code: string

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
  }
}
