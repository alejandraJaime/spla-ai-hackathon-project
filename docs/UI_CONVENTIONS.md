# UI_CONVENTIONS.md

## Stack

- **Tailwind** for styling — config at `app/web/tailwind.config.ts`, theme tokens (colors, radius) as CSS variables in `app/web/src/styles/globals.css`. Default shadcn `slate` base color, no prefix.
- **shadcn/ui** for primitives — copied into the repo (not an npm dependency), so editing a file under `~/components/ui` changes that component everywhere it's used, permanently.

## Adding a component

Use the CLI rather than hand-writing primitives:

```
npx shadcn-ui@latest add <component>
```

This drops the file into `app/web/src/components/ui/` per `components.json` (`aliases.components: "~/components"`, `aliases.utils: "~/lib/utils"`). Only a few primitives exist so far (`toast`, `tooltip`) — others (`button`, `input`, etc.) need to be added via the CLI before use, not imported speculatively.

## Class merging

Use `cn()` from `~/lib/utils/tailwind.ts` (clsx + tailwind-merge) whenever a component accepts a `className` override, so caller classes win over defaults instead of colliding.

## Conventions

- Feature/page-specific components live alongside their feature, not in `components/ui` — that folder is reserved for shadcn primitives.
- Prefer theme tokens (`bg-primary`, `text-muted-foreground`, etc.) over raw Tailwind colors (`bg-slate-900`) so dark mode and re-theming stay centralized in `globals.css`.

## Data retrieval — server-side pagination, querying, filtering

Any list of entities backing a table (or table-like list) is paginated, searched, and filtered **server-side**. Never fetch a full table and slice/filter/sort it in the client — the client's job is state (`page`, `search`, `limit`, filters) and rendering, not data shaping.

**Backend** — every listable entity follows the query-object pattern from `FILE_CONVENTIONS.md` (`.validation.ts` → `.query.ts` → `.repository.ts` → service/router), e.g. `workspace.query.ts`/`WorkspaceQuery`, `auth.query.ts`/`UserQuery`:

- List input schemas share one shape, extended per-entity with named filter fields:
  ```ts
  z.object({
    query: z.string().trim().optional(), // free-text search
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
    // additional filter fields (status, role, etc.) go here per entity
  })
  ```
- The `.query.ts` builder exposes `withSearch()`/`paginate()` and a `withX()` method per additional filter, each returning a new instance (see the immutability rule in `FILE_CONVENTIONS.md`); `toWhereClause()` turns the accumulated state into the drizzle `where`.
- The repository's `execute(query)` runs the `findMany` and a `count()` in `Promise.all` and returns `{ <entities>: T[], total: number }` — that `{ items, total }` shape is what the router returns and what the frontend destructures.
- The router procedure takes the validation schema directly as `.input(...)`; no separate transformation layer.

Adding a new filter to an existing table means: a field on the validation schema, a `withX()` method on the query builder, a branch in `toWhereClause()` — not a new endpoint.

**Frontend** — every table page (`pages/workspaces.tsx`, `pages/settings/access.tsx`, `pages/settings/domains.tsx`) follows the same wiring:

- `page` and raw `search` live in local `useState`; `search` is debounced (~300ms) into a separate `debouncedSearch` before it's used in the query, and `page` resets to `1` whenever `debouncedSearch` (or any other filter) changes.
- `offset` is computed as `(page - 1) * limit`; the tRPC `useQuery` hook is called with `{ query: debouncedSearch || undefined, limit, offset, ...filters }` as input directly — no client-side post-processing of the result.
- **Limit selection**: pages use a fixed `PAGE_SIZE` constant today. Where the result set can reasonably grow large or a denser/sparser view is useful, add a page-size selector (e.g. 10/20/50) instead of hardcoding `PAGE_SIZE`, storing it in the same `useState` group and resetting `page` to `1` on change.
- Any non-search filter (status, role, date range, etc.) is additional `useState` passed straight into the query input, mirroring a `withX()` filter on the backend query builder — not a client-side `.filter()` over fetched rows.
- Render a pager footer only when `total > 0`: "Showing X–Y of Z `<entities>`" plus Previous/Next buttons disabled at the bounds. Use the shadcn `Table` component (`~/components/ui/table`) for the rows.
- No shared `DataTable`/`Pagination` component or `usePagination` hook exists yet — this convention is currently followed by copying the pattern per page. Extract a shared component/hook rather than copying a fourth time.

## Custom theming/branding

- Light mode already deviates from shadcn's default palette in `globals.css`: `--primary` is brand yellow (`48 100% 50%`) and `--secondary` is near-black (`0 0% 11.76%`), not the default slate. `.dark` still uses the unmodified shadcn defaults — if you theme dark mode, update `--primary`/`--secondary` there too so light/dark stay consistent.
- Brand assets (logo variants) live in `app/web/public/images/` (e.g. `company-logo.png`, `Paramount_Plus_white.svg`, `Paramount_Plus_blue.svg`); favicons are at `app/web/public/`.
- To retheme: edit the CSS variables in `globals.css` only — `tailwind.config.ts` just maps token names to `var(--token)` and shouldn't need changes for color updates.
