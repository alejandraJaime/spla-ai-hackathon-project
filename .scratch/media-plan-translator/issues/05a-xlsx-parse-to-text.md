# 05a: Parse an `.xlsx` to CSV-ish text, header block included

**What to build:** The xlsx-parsing module. A planner's workbook — non-tabular header block, merged and inconsistent columns — is accepted exactly as sent and turned into CSV-ish text. Absorbing the missing schema is the model's job in ticket 06, not a pre-processing step's, so the header block is preserved rather than stripped. Anything that isn't an `.xlsx`, and any workbook that can't be parsed, throws a named app error whose message makes clear the problem is the file and not the tool.

This ticket is the parse function and its errors only. No Route Handler, no UI, no job creation. The module has no knowledge of tRPC, Next.js or the database — same isolation as the llm-provider and hierarchy-validation modules.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A parse function accepts the real `docs/prod-domain-docs/media-plan-greenfield.xlsx` fixture and returns text that still contains the header block and every line item
- [ ] A non-`.xlsx` input throws a named unsupported-file-type `AppError` subclass with a literal code
- [ ] A corrupt or unparseable workbook throws a named parse-failure `AppError` subclass with a literal code
- [ ] The module's `errors.ts` is the home of those two classes; consumers switch on `code`, not class identity
- [ ] The module has no knowledge of tRPC, Next.js or the database
