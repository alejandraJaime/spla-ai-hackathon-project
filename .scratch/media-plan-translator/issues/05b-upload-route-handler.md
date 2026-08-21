# 05b: Upload Route Handler — accept the file or say why not

**What to build:** Ingest over HTTP. Multipart file upload is a poor fit for tRPC's batching and superjson transport, so this is a Next.js Route Handler, not a tRPC procedure, and the two transports stay separate. The handler is thin: parse the request, call the 05a parse function, return the CSV-ish text. No job is created here — that is ticket 06.

Wrong extension and parse failure are rejected immediately with a readable message. There is no spinner to stare at and no recovery flow beyond the rejection. Because the tRPC `errorFormatter` does not run on a Route Handler, a shared unpack of `AppError` (literal `code` + message) is used by the handler's JSON response *and* by the tRPC `errorFormatter`, so later tickets don't grow a second unpacking path. Anything that is not an `AppError` gets a generic client message and a full server-side log.

**Blocked by:** 05a

**Status:** ready-for-agent

- [ ] POSTing the real greenfield `.xlsx` fixture to the Route Handler is accepted and the body is the parsed text from 05a
- [ ] POSTing a non-`.xlsx` is rejected with the named unsupported-file-type error surfaced as a readable message
- [ ] POSTing a corrupt or unparseable workbook is rejected with the named parse-failure error surfaced as a readable message
- [ ] The handler only parses input and calls the parse function — no job writes, no model calls, no business logic beyond that
- [ ] `AppError` unpacking lives in one place; the Route Handler and the tRPC `errorFormatter` both use it; anything unrecognised gets a generic client message plus a full server-side log
- [ ] Tests pin the accept case with the greenfield fixture and the reject case for a wrong extension at the HTTP boundary — enough to pin the rejection contract, not a parser test suite
