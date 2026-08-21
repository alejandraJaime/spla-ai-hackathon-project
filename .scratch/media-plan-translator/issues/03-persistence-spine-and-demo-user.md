# 03: Persistence spine and the demo user

**What to build:** A Job and its whole version history survive a page reload, and the demo has no login step. Five tables: the Job (owner, platform, source-file reference, the model id that produced it, the extracted Plan as `jsonb`), append-only Hierarchy Versions keyed by (job, Campaign Type) with version numbers counted independently per Campaign Type, Plan Versions holding a pointer map from Campaign Type to Hierarchy Version id rather than a duplicated copy of hierarchy data, messages carrying *plural* resulting version ids because one message fans out to N campaigns, and the single seeded demo user.

The plan and hierarchy stay `jsonb` blobs; the entity graph is deliberately not normalised into relational tables. Append-only versions are what give version history for free. Auth is stubbed: a fixed demo-user id resolved server-side, never from a session.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A generated migration applies cleanly against the Dockerized Postgres, and the tables use the scaffold's existing table-prefix helper
- [ ] Seeding creates exactly one demo user, and re-running the seed doesn't duplicate it
- [ ] A Job round-trips with its platform, model id and Plan `jsonb` intact
- [ ] Two Campaign Types each get their own Hierarchy Version numbering: writing Display v1, Display v2 and Tracking v1 leaves Tracking at 1
- [ ] A Hierarchy Version stores exactly one campaign, its status (`ok` | `needs_clarification`), its structured validation errors when the status is `needs_clarification`, and the change summary of the message that produced it
- [ ] A Plan Version's pointer map resolves back to exactly the Hierarchy Versions it was written with, including a type pointing at a prior unchanged version
- [ ] A message persists with zero, one and many resulting version ids
- [ ] Tests follow the existing DB-backed integration pattern (Jest, real Postgres, connection closed after) with per-test data isolation, since these write more than one row
- [ ] The module's table definitions are re-exported from the db schema barrel, appended at the end of the list
