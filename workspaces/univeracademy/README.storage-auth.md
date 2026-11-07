# Local storage/auth continuation

Checkpoint note: this describes the preceding17-test row/auth layer. The current
HTTP integration and fail-closed entrypoint are documented in
[README.persistent-http.md](README.persistent-http.md).

Base Backend commit: `8f863e645746159466e06dabb56db3b94f26be05`.
Only local files were changed. No DB, migration, provider, upload or deploy action.
The copied `BACKEND-SHA256SUMS` describes that base publication, not the new delta.
New/modified file hashes are in `BACKEND-CURRENT-SHA256SUMS` (excluding itself).

```sh
npm ci --ignore-scripts
npm run test:storage-auth
npm run typecheck
```

This adds the Postgres transaction/row adapter candidate and an offline-tested
staff JWT verification boundary. Existing HTTP handlers are not wired to a live
DB, and the existing synthetic listener still uses RAM. The adapter supports
existing-person session rotation, attempt/answer/ordinary writes and scoped row
reads; full start/admission/assignment/content/staff repositories are pending.
The test executor persists synthetic rows to a temporary file and dispatches
statements by name. It does not parse/execute PostgreSQL SQL or enforce RLS.
No actual PostgreSQL durability, DB race, schema constraint or provider liveness
claim follows from these tests.

New checks:12 storage tests +5 offline JWT tests,17 total. Typecheck exit0.
Known configuration/commit availability faults carry the existing native
SERVICE_UNAVAILABLE503; unexpected callback errors retain their identity. No
general catch-to503 or automatic command retry was added.

Schema/RLS, actual staff provider composition, remaining blockers and official
references are in
[the local proposal](docs/api/storage-auth-local-proposal-2026-11-06.md).
Session/numeric retention and large-value limits remain proposals where the
user has not decided them. API status remains PROVISIONAL / NOT ACCEPTED.
