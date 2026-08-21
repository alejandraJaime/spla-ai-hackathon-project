# 04: The model picker offers only models whose key is configured

**What to build:** The trafficker can pick which model runs the translation, and can never select an option that will fail — the picker only ever offers models whose API key is actually present in the environment. Defaulting to Gemini Flash makes the cheap iteration path the zero-effort path.

This ticket also establishes the codebase's **one and only test seam**: model resolution in the llm provider module. Every later ticket's tests substitute a mock language model here and run everything else — real tRPC procedures, real services, real repositories, real Postgres — for real. Nothing else in the codebase gets mocked, so this module's shape matters more than its size suggests. There is no runtime API-key-entry UI; environment configuration only.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The environment schema gains optional provider key variables, and the app still boots with none of them set
- [ ] A query reports which models are usable; with only a Gemini key configured it returns the Gemini options and nothing else
- [ ] The reported default is Gemini Flash
- [ ] Model resolution is the module's only injection point, and a test proves a mock language model can be substituted through it
- [ ] Asking for a model whose key is absent throws a named app error rather than failing at call time inside the provider SDK
- [ ] The module has no knowledge of tRPC, Next.js or the database
