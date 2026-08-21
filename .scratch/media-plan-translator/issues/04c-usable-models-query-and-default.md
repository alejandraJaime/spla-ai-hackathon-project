# 04c: Usable-models query and default reporting

**What to build:** The function the model picker (ticket 05c) will call: given the catalog and which keys are actually present in the environment (04a), report which models are usable right now, plus which one is the default. With only a Gemini key configured, it returns the Gemini options and nothing else — no Anthropic or other provider's models leak into the list just because they exist in the catalog. The reported default is Gemini Flash whenever it's usable.

This ticket has no dependency on the resolution seam (04b) — it only needs the catalog and the key-presence check from 04a.

**Blocked by:** 04a

**Status:** ready-for-agent

- [x] A query reports which catalog models are usable; with only a Gemini key configured it returns the Gemini options and nothing else
- [x] The reported default is Gemini Flash
- [x] With no keys configured at all, the query reports no usable models rather than throwing
- [x] The module has no knowledge of tRPC, Next.js or the database
