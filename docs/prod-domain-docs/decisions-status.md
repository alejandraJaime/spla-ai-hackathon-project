# Decisions Status — Media Plan → CM360 Hierarchy Translator (hackathon prototype)

_Living record of what's agreed, what still needs agreement, and which assets are in hand._
_Legend: ✅ agreed · 🟡 open (needs a call) · ✔️ asset in hand · 📝 drafted, pending your review · ⛔ not needed_

---

## 1. Decisions made (agreed)

| # | Area | Decision |
|---|---|---|
| 1 | **Approach** | Typed transformation pipeline of `generateObject` calls — **not** an autonomous agent / agent framework. |
| 2 | **Framework** | Vercel AI SDK (v6). |
| 3 | **Stack** | Existing T3 scaffold: Next.js, tRPC, Drizzle ORM, Postgres/Neon. TypeScript. Dockerized. **Local-only — no deployment.** |
| 4 | **Input format** | Single file type: `.xlsx`, parsed **server-side with SheetJS** into CSV/JSON text; raw grid (incl. header block) handed to the model as-is. |
| 5 | **Target platform** | CM360, as a **modeling target only** — the prototype produces hierarchy data and does **not** call the CM360 API. |
| 6 | **Data contracts** | Two Zod schemas: `plan-schema`, `hierarchy-schema`. CM360 entities stored as **flat arrays with id references** (mirrors CM360's relational model), not a strict tree. |
| 7 | **Size format** | One canonical `"WIDTH x HEIGHT"` string form (spaces, dictionary spelling) everywhere — plan, hierarchy, output. `splitSize()` helper when numbers are needed. No second representation. |
| 8 | **Persistence** | `jobs` + append-only `hierarchy_versions` + `messages`. Plan and hierarchy stored as `jsonb`; **not** normalized into relational tables. Append-only versions = free history. |
| 9 | **Editing model** | Hierarchy edited **only via chat** in v1 (no inline editing). Each chat message regenerates a **full new version** + a `changeSummary`. |
| 10 | **Domain knowledge** | Field dictionary + campaign-spec authored as versioned docs, loaded into prompts as context (not hard-coded logic). |
| 11 | **Campaign-spec scope** | CM360 **Standard Display** (§4A) + **Standard Tracking** (§4B) + a **minimal YouTube** pattern (§4C), all with fan-out rules. A 4th type was considered and deferred — see §2. |
| 12 | **Cardinality** | **Superseded by [ADR-0001](../adr/0001-one-campaign-per-campaign-type.md).** One CM360 campaign **per distinct Campaign Type** present in the plan, not one campaign per plan. Scope stays at the three §11 patterns only. |
| 13 | **UI components** | Use **shadcn + AI Elements** for the chat panel; hierarchy **version history maps to the AI Elements `checkpoint`** component. Hierarchy tree is a **custom** component. |
| 14 | **Users** | Single hard-coded **demo user** owns everything; auth stubbed. Multi-user is future scope. |
| 15 | **Model / provider** | Iterate on **Gemini Flash** (free tier); quality pass on **Gemini Pro or Claude Sonnet 5**. `.env` holds whichever provider keys exist; the model-picker UI feature-detects which models have a configured key and defaults to Flash. Model choice is **recorded per Job** for provenance. Runtime API-key-entry UI is future scope. |
| 16 | **Edit strategy** | **Full hierarchy regeneration** per chat edit, not structured edit-ops/JSON-patch. |
| 17 | **Chat mechanics** | **Custom tRPC mutation** returning `{version, changeSummary}` + local message list — not AI SDK `useChat` (responses are structured objects, not streamed text). |
| 18 | **Streaming** | `generateObject` (blocking + loading state) first; `streamObject` only as time-permitting polish. |
| 19 | **File-upload path** | Next.js **route handler / server action** for the upload + SheetJS parse; hand the resulting text to tRPC for the rest of the pipeline. |
| 20 | **Validation depth & retries** | Zod conformance **+ the §8 referential-integrity pass**, both in code. Shared retry budget: **2 retries (3 attempts total)** per step, covering both Zod failures and §8 failures — no special-casing by failure type. On exhaustion, persist a `needs_clarification`-status Hierarchy Version (raw model output + structured validation errors) rendered in the same tree UI with the failing parts flagged; the user resolves it by adding a natural-language clarification as input to the next attempt. |
| 21 | **Naming taxonomy order** | Campaign-spec **§3 accepted as final**; `taxonomy-fields.json` authored to match. |
| 22 | **Hierarchy tree UX** | One **collapsible card per Campaign Type**; fully expanded/nested internals within an open card — no further per-node collapsing. |
| 23 | **Versioning model** | Three distinct, non-interchangeable terms (see `CONTEXT.md`): **Job** (persistence record — id, owner, platform, source file), **Hierarchy Version** (per-Campaign-Type version number, independent per type), **Plan Version** (user-facing, job-wide counter — increments only on messages that produce ≥1 real per-campaign change; Plan Version 1 = the initial Step 1→2 output, before any chat). New `job_versions` table: `job_id`, `version_number`, `created_at`, `message_id`, plus a pointer map `{campaignType: hierarchyVersionId}` — no duplicated jsonb. |
| 24 | **Chat edit fan-out** | **One shared chat panel per Job** (not per Campaign Type card). Every message runs the Step-3 edit call once per existing Campaign Type hierarchy, each given the full instruction + that campaign's own current hierarchy; each independently decides relevance and returns unchanged (`changeSummary: "No change"`) if inapplicable. No-op results create no new Hierarchy Version row. `messages.resulting_version_id` becomes plural: `resulting_version_ids`. |
| 25 | **Assumptions panel** | One component with two visually distinct labeled children: "From your plan" (Step 1 data-gap assumptions) and "Structural inference" (Step 2+ modeling-choice assumptions). |
| 26 | **Invalid upload handling** | Reject-with-message at the route handler (wrong extension or SheetJS parse failure). No recovery flow beyond that. |
| 27 | **Sample plans** | Both wired into the demo: `media-plan-greenfield.xlsx` is the golden/happy-path sample; `media-plan-brownfield.xlsx` demonstrates the assumptions panel doing real work on a messier, more realistic plan. |

---

## 2. Decisions still open / deferred

| # | Area | Status |
|---|---|---|
| J | **4th Campaign Type** (e.g. a non-YouTube video pattern) | **Deferred.** Code-side lift is small (one dictionary/enum value + one §8 invariant), but it needs a real fan-out-axis decision (duration vs. device vs. size-like-Display) that isn't worth spending hackathon time on now. Revisit only if demo variety is needed later. |

All items previously listed here (A–I) are resolved — see §1, rows 15–27.

---

## 3. Assets

### In hand / delivered
| Asset | Status |
|---|---|
| Field dictionary (`taxonomy-fields.json`) | ✔️ delivered — format corrected: JSON, not `.md` as originally logged |
| Zod schemas (`schemas.ts`) | 📝 drafted, type-checks clean|
| Campaign-spec (`campaign-spec.md`) | 📝 drafted (§4A/§4B/§4C)|
| Step prompt `s1-extractor` | 📝 drafted |
| Step prompt `s2-translator` | 📝 drafted |
| Step prompt `s3-editor` | 📝 drafted |
| Sample media plans (greenfield + brownfield `.xlsx`) | ✔️ delivered — both confirmed in use, see §1 #27 |
| Flow diagram (`flow-diagram.mermaid`) | ✔️ delivered |
| Product description prompt (`product-prompt.md`) | ✔️ delivered |
| Domain glossary (`CONTEXT.md`) | ✔️ delivered |
| Cardinality ADR (`docs/adr/0001-one-campaign-per-campaign-type.md`) | ✔️ delivered |

### Still needed
| Asset | Notes |
|---|---|
| **Model API key** | Gemini AI Studio key (free, no card) at minimum; optionally Anthropic/OpenAI key with billing for the quality pass. **Have one at hand just needs to be wired into the .env** |
| **shadcn + AI Elements install** | Trivial; do at project setup. |

### Not needed (stated, to avoid wasted effort)
| Non-asset | Why |
|---|---|
| ⛔ CM360 platform access / OAuth | Prototype models the hierarchy as data; it does not push to CM360. |
| ⛔ Deployment infra | Local-only for the hackathon. |
| ⛔ A third/real-ish sample plan | Resolved — greenfield + brownfield together cover both the happy path and the assumptions story (§1 #27). |
| ⛔ Runtime API-key-entry UI | Future scope (§1 #15); `.env` is sufficient for the prototype. |

---

## 4. Immediate next step (unblocks a runnable demo)

Wire the pipeline: the tRPC procedure (or server action) that parses the xlsx, chains **s1 → s2** with the drafted prompts, runs the **§8 referential-integrity check** in code, and persists **Plan Version 1** across the resulting `campaigns[]` (one Hierarchy Version per Campaign Type, per ADR-0001). Then the chat mutation for **s3**, implementing the fan-out edit design (§1 #24) and the shared 2-retry budget with `needs_clarification` fallback (§1 #20).
