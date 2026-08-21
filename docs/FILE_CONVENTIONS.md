# FILE_CONVENTIONS.md

## Module Structure

```
app/web/src/lib/moduleName/
├── subModule/
│   ├── __tests__/index.test.ts
│   ├── errors.ts
│   ├── index.ts
│   └── types.ts
├── moduleName.repository.ts
├── moduleName.router.ts
├── moduleName.schema.ts
├── moduleName.service.ts
├── moduleName.validation.ts
├── moduleName.types.ts
└── errors.ts
```

- `app/web` is the main application folder; all modules live under `app/web/src/lib/`.
- Top-level modules expose `.router.ts`, mounted in `app/web/src/server/api/root.ts`.
- Top-level modules with a `.schema.ts` are re-exported from `app/web/src/server/db/schema.ts`, the file `drizzle.config.ts` points to for migrations. These are two separate wiring points — a module's router and its schema are registered in different places.
- Sub-modules use `index.ts` as the implementation file (no `.service.ts`).

---

## File Suffixes

| Suffix                    | Purpose                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `.types.ts`               | Interfaces, enums, type aliases, and types inferred from Zod schemas                 |
| `.schema.ts`              | Drizzle schemas (tables, relations, DB-level constraints)                            |
| `.validation.ts`          | Zod validation schemas                                                               |
| `.repository.ts`          | Data access (CRUD/queries)                                                           |
| `.service.ts`             | Business logic/orchestration for a module; delegates data access to `.repository.ts` |
| `.query.ts`               | Immutable query/specification builder for composable, filtered repository reads      |
| `.router.ts`              | tRPC router (one per top-level module)                                               |
| `errors.ts`               | Custom error classes                                                                 |
| `index.ts`                | Core implementation/orchestration logic                                              |
| `.events.ts`              | Event payload types + name constants                                                 |
| `.rules.ts`               | Declarative config (state transitions, resolution rules)                             |
| `.factory.ts`             | Construction/selection logic for interchangeable implementations                     |
| `.mapper.ts`              | Internal model ↔ external API payload transform                                      |
| `.validator.ts`           | Non-schema validation (business/cross-field rules)                                   |
| `.config.ts`              | Static/env-driven configuration                                                      |
| `.client.ts`              | Thin wrapper around raw SDK/HTTP client                                              |
| `.adapter.ts`             | Platform-specific implementation of a common interface                               |
| `.processor.ts`           | Per-job/message execution logic                                                      |
| `.worker.ts`              | Queue consumer entrypoint                                                            |
| `.kms.ts`                 | Encryption helper wrappers                                                           |
| `__tests__/index.test.ts` | Colocated unit tests                                                                 |

---

## Folder Conventions

| Folder                            | Purpose                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `app/web/`                        | Main application folder; root of the codebase                                                        |
| `app/web/src/lib/`                | Root location for all modules                                                                        |
| `app/web/src/server/api/`         | tRPC root router + setup (`root.ts`, `trpc.ts`)                                                      |
| `app/web/src/server/db/schema.ts` | Re-exports every module's `.schema.ts`; the single file `drizzle.config.ts` points to for migrations |
| `app/web/src/server/db/seeders/`  | DB seed scripts                                                                                      |
| `__tests__/`                      | Colocated tests, never centralized                                                                   |
| `resolvers/`                      | Pluggable strategy implementations                                                                   |
| `channels/`                       | Delivery mechanisms (email, Slack, etc.)                                                             |
| `adapters/`                       | Per-platform implementations (`cm360/`, `dv360/`)                                                    |
| `provider/`                       | Interchangeable external providers (LLM, etc.)                                                       |
| `seeders/`                        | DB seed scripts (`server/db/seeders/`)                                                               |

---

## Naming Conventions

### General Casing

| Element                             | Convention                                  | Example                                  |
| ----------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Files & folders                     | `camelCase`                                 | `moduleName.repository.ts`, `subModule/` |
| Classes                             | `PascalCase`                                | `class UserRepository {}`                |
| Functions/variables                 | `camelCase`                                 | `getUserById()`, `userId`                |
| Constants (module-level, immutable) | `SCREAMING_SNAKE_CASE`                      | `MAX_RETRY_COUNT`                        |
| Type aliases                        | `PascalCase`                                | `type UserRole = 'admin' \| 'member'`    |
| Enums                               | `PascalCase` (name), `PascalCase` (members) | `enum OrderStatus { Pending, Complete }` |

### Zod Schemas — `Schema_` prefix, inferred types live in `.types.ts`

All Zod schema exports live in `.validation.ts`, prefixed `Schema_` with `PascalCase` for the descriptive part. Their **inferred types** are exported from the module's `.types.ts` (never colocated in `.validation.ts`).

```ts
// moduleName.validation.ts
import type { CreateUser, UpdateUserInput } from './moduleName.types';

export const Schema_CreateUser = z.object({ ... });
export const Schema_UpdateUserInput = z.object({ ... });
```

```ts
// moduleName.types.ts
import type { z } from 'zod'
import type { Schema_CreateUser, Schema_UpdateUserInput } from './moduleName.validation'

export type CreateUser = z.infer<typeof Schema_CreateUser>
export type UpdateUserInput = z.infer<typeof Schema_UpdateUserInput>
```

- `.validation.ts` exports **only** `Schema_*` Zod objects — no `z.infer` calls, no type exports.
- `.types.ts` is the single source of truth for all types, including those inferred from Zod schemas.
- Sub-modules follow the same split: `subModule/validation.ts` (if present) → `subModule/types.ts`.
- Inferred type names drop the `Schema_` prefix, keep `PascalCase`, and must match the schema's descriptive name exactly (`Schema_CreateUser` → `CreateUser`).

### Interfaces — `I` prefix

All TypeScript `interface` declarations (in `.types.ts` files, or elsewhere) are prefixed `I`, using `PascalCase`.

```ts
// moduleName.types.ts
export interface ILogger { ... }
export interface IUserRepository { ... }
export interface IEmailChannel { ... }
```

- Applies to all interfaces: service contracts, DI-injected dependencies, config shapes, adapter/provider contracts.
- Does **not** apply to `type` aliases — only `interface` declarations use the `I` prefix.
- Implementing classes drop the prefix: `class UserRepository implements IUserRepository {}`.

### Errors — `Error` suffix

Custom error classes always suffixed `Error`, `PascalCase`.

```ts
export class UserNotFoundError extends Error {}
export class InvalidTokenError extends Error {}
```

### Router/Repository/etc. exports

Named exports matching the file's suffix convention, `PascalCase` for classes/objects:

```ts
// moduleName.router.ts
export const moduleNameRouter = router({ ... }); // camelCase — instance, not class

// moduleName.repository.ts
export class ModuleNameRepository implements IModuleNameRepository { ... }
```

---

## Repository / Service / Query Pattern

**Service holds business logic, repository holds data access.** `.service.ts` implements business rules and orchestration (validation against existing state, coordinating side effects, throwing domain errors) and only ever talks to persistence through the repository's interface — never `db`/`tx` directly. `.repository.ts` only knows about persistence (queries, inserts, updates).

```ts
// user.repository.ts
export class UserRepository implements IUserRepository {
  constructor(
    private db: DbClient,
    private logger: ILogger,
  ) {}

  async findById(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) })
  }

  async create(data: CreateUser) {
    const [user] = await this.db.insert(users).values(data).returning()
    return user
  }

  async execute(query: UserQuery) {
    return this.db.query.users.findMany({ where: query.toWhereClause() })
  }
}
```

```ts
// user.service.ts
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger,
  ) {}

  async registerUser(input: CreateUser) {
    const existing = await this.userRepository.findById(input.id)
    if (existing) throw new UserAlreadyExistsError(input.id)
    return this.userRepository.create(input)
  }
}
```

**Repository methods: fixed-shape vs. composable.** Fixed-shape operations (`findById`, `create`, `update`) stay as their own named methods — clearer and more discoverable than forcing a single obvious lookup through a query builder. `execute(query)` is reserved for reads that need an arbitrary combination of filters (search, dashboards, admin tooling).

**Query objects (`.query.ts`) are immutable.** Every filter method returns a _new_ instance rather than mutating internal state:

```ts
// user.query.ts
export class UserQuery {
  private constructor(private conditions: SQL[] = []) {}

  static create() {
    return new UserQuery()
  }

  whereOrg(orgId: string) {
    return new UserQuery([...this.conditions, eq(users.orgId, orgId)])
  }

  whereActive(active: boolean) {
    return new UserQuery([...this.conditions, eq(users.active, active)])
  }

  toWhereClause(): SQL | undefined {
    return this.conditions.length ? and(...this.conditions) : undefined
  }
}
```

Mutating a shared builder in place (`this.conditions.push(...)`, returning `this`) is unsafe the moment a base/cached query object is reused across concurrent callers — two calls building on the same instance can interleave their filters onto one shared array before either executes, corrupting both queries. Returning a new instance per filter call means a cached "base" query can be branched off safely by any number of callers.

**Transactions.** Repositories are typed against a `DbClient` that accepts either the main db or a Drizzle transaction, so the same repository and query objects work unchanged inside or outside a transaction:

```ts
export type DbClient = typeof db | PgTransaction<any, typeof schema>
```

The service owns the transaction boundary — it constructs transaction-scoped repository instances inside `db.transaction(async (tx) => { ... })` when an operation needs atomicity across repositories, rather than threading `tx` through every method call.

---

## Audit Logging

Any service that performs a sensitive action — creating/deleting a resource, granting/revoking access, changing a credential, etc. — must record it to the audit log via `IAuditLogService`, injected the same way a repository is. See `credential.service.ts`, `invitation.service.ts`, or `auth.service.ts` for existing examples.

To add a new audited action:

1. Add a dot-namespaced constant to `AUDIT_ACTIONS` in `app/web/src/lib/auditLog/auditLog.events.ts` (e.g. `workspace.created`).
2. Once the mutation succeeds, call:

```ts
await this.auditLogService.record({
  actorUserId,
  action: AUDIT_ACTIONS.YOUR_ACTION,
  targetType: 'yourEntity',
  targetId: entity.id,
  workspaceId, // omit for platform-level actions
  metadata: {}, // identifying, non-secret fields only — never a secret value or ciphertext
})
```

No other wiring is required — every recorded entry is automatically visible on the global audit log page (`/settings/audit-log`) and pushed there live over the realtime broker. `record()` never throws; a failure to log is caught and logged internally rather than breaking the mutation it describes, so it's always safe to call without a try/catch of your own.

---

## Key Rules

**Application root** — `app/web` is the main application folder. All source code, modules, and server setup live within it.

**Module location** — every module (top-level or sub-module) lives under `app/web/src/lib/moduleName`. No modules outside `src/lib/`.

**Routers** — live inside their module under `src/lib/`, never a central `routers/` folder. All merged only in `app/web/src/server/api/root.ts`. `app/web/src/server/api/trpc.ts` stays the single source of tRPC setup.

**Schema registration** — every module's `.schema.ts` is re-exported from `app/web/src/server/db/schema.ts` (e.g. `export * from '~/lib/user/user.schema'`), which is the single file `drizzle.config.ts` points to for migrations. This is separate from router mounting — a new module needs both wired independently, in `root.ts` and in `server/db/schema.ts`.

**Minimizing merge conflicts in shared registries** — `root.ts`, `server/db/schema.ts`, `sidebar.config.ts`, `auditLog.events.ts`'s `AUDIT_ACTIONS`, and `rbac.config.ts`'s `PERMISSIONS` are edited by every new module. Always add new entries at the **end** of the list, never sorted/alphabetized into the middle — two branches appending at the end merge automatically; two branches inserting near the same alphabetical position conflict. Don't "clean up" these files by re-sorting them.

**Repositories** — colocated `.repository.ts` per module; optionally thin re-exported via `app/web/src/lib/repositories/<domain>Repository/index.ts` for lightweight consumers.

**Services** — `.service.ts` holds business logic/orchestration; it depends only on repository interfaces (`I<Module>Repository`), never on `db`/`tx` directly.

**Query objects** — composable/filtered repository reads go through a `.query.ts` specification object (`execute(query)` on the repository); its filter methods must be immutable (return a new instance) rather than mutate shared state, since a cached/reused query object mutated in place can be corrupted by concurrent callers.

**Schemas vs Validation** — `.schema.ts` is reserved exclusively for Drizzle ORM schema definitions (tables, columns, relations, indexes). `.validation.ts` is reserved exclusively for Zod schemas and validation logic used at API/input boundaries. These are never mixed in the same file, even when they describe the same entity.

**Errors** — every module has its own `errors.ts`; classes always suffixed `Error`.

**Logging** — every implementation class takes `logger: ILogger` as last constructor param, scoped via `logger.child({ module: '<ClassName>' })`. No raw `console.log`.

**Audit logging** — any service performing a sensitive action injects `IAuditLogService` and calls `record(...)` once its mutation succeeds; add the action to `AUDIT_ACTIONS` first. Never include a secret value or ciphertext in `metadata`.

**LLM fallback** — deterministic logic always attempted first; LLM agents (`lib/llm/agents/*`) only engage on low confidence/unresolved cases; all LLM output schema-validated before use.

**Zod naming** — every Zod schema export is prefixed `Schema_` (e.g. `Schema_CreateUser`), and lives in `.validation.ts`.

**Zod-inferred types** — types inferred via `z.infer<typeof Schema_X>` always live in the module's `.types.ts`, never in `.validation.ts`; name matches the schema minus the `Schema_` prefix.

**Interface naming** — every `interface` declaration is prefixed `I` (e.g. `IUserRepository`); implementing classes drop the prefix.
