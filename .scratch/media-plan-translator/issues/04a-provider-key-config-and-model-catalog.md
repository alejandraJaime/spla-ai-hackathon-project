# 04a: Provider key config and a static model catalog

**What to build:** The foundation the rest of the llm provider module builds on. `src/env.js` gains optional environment variables for each model provider's API key, and the app still boots cleanly with none of them set — no provider is required to run the app, only to use its models. Alongside that, a static catalog enumerates every supported model: its id, its display label, which provider it belongs to, and which env var must be present for it to be usable. Exactly one catalog entry is marked as the default, and it's Gemini Flash. A pure helper reports whether a given catalog entry's key is currently present in the environment — the one piece of logic both the resolution seam (04b) and the usable-models query (04c) will reuse, so neither has to re-derive "is this model configured" on its own.

This ticket adds no resolution logic (no call into an AI SDK, no `LanguageModel`) and no querying/listing logic — just the config surface and the data model both later tickets read from.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The environment schema gains optional provider key variables, and the app still boots with none of them set
- [ ] A static catalog lists every supported model with its id, label, provider, and the env var required for it to be usable
- [ ] Exactly one catalog entry is marked as the default, and it is Gemini Flash
- [ ] A pure function reports whether a catalog entry's required key is present in the environment, with no side effects and no provider SDK involved
- [ ] The module has no knowledge of tRPC, Next.js or the database
