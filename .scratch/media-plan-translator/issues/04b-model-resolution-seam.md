# 04b: Model resolution seam

**What to build:** The one and only test seam in the codebase. A single function turns a catalog model id into a real AI SDK `LanguageModel`, and it is the module's *only* injection point — every later ticket's tests substitute a mock language model here and run everything else (real tRPC procedures, real services, real repositories, real Postgres) for real. Nothing else in the codebase gets mocked, so a test proving substitution actually works through this seam matters more than the resolution logic's size suggests.

Asking for a model whose key is absent throws a named app error rather than failing at call time inside the provider SDK — the missing-key check (from 04a) happens before any SDK call is attempted, not after.

**Blocked by:** 04a

**Status:** ready-for-agent

- [ ] A single function resolves a catalog model id to a `LanguageModel`, and it is the module's only injection point
- [ ] A test substitutes a mock language model through this seam and drives a call end-to-end with no real provider involved
- [ ] Requesting a model whose key is absent throws a named app error (an `AppError` subclass with a literal code) before any provider SDK call is attempted
- [ ] The module has no knowledge of tRPC, Next.js or the database
