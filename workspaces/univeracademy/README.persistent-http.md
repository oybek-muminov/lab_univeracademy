# HTTP + scoped storage — local continuation, 2026-11-07

Checkpoint note: new identity enrollment/current staff authority readers now
continue this stage in [README.enrollment-staff.md](README.enrollment-staff.md).
The unavailable enrollment and injected staff-authority notes below describe the
preceding HTTP checkpoint, not the newer implementation.

Base: published Backend8f863e645746159466e06dabb56db3b94f26be05 plus the preceding
local17-test storage/auth candidate. No upload/commit/provider/DB/deploy action.
API remains PROVISIONAL / NOT ACCEPTED. The older BACKEND/STORAGE-AUTH checksum
lists describe their own checkpoints; this delta is in BACKEND-CURRENT-SHA256SUMS.

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:persistent-http
npm run typecheck
```

New HTTP tests9/9 PASS. Affected storage repository regression12/12 PASS;
typecheck exit0. The earlier exact RAM10/132/128/135 suites were not rerun.
No new dependency or lockfile change in this HTTP delta.

`npm start` now starts `runtime/configured-server.mjs`, bound only to127.0.0.1.
No production configuration is supplied by this candidate. Requests therefore
return503 SERVICE_UNAVAILABLE and the startup record says CONFIG_REQUIRED. A
separate NODE_ENV=production process smoke test confirmed503. The production
entrypoint's22-file relative import closure has no test fixture or RAM runtime.
The old RAM pilot is available only through the explicit `npm run start:local-ram`
or its explicitly named script. There is no environment-based memory fallback.

`createConfiguredHttpHandler(config)` / `startConfiguredServer({config,port})`
compose the existing student/staff HTTP handlers with PostgresTransactions. In
the tests `mode:local_contract` and `storage.kind:postgres_contract_double` are
explicit. This kind is rejected in production mode. The local SQL executor only
dispatches statement names and persists synthetic rows to a temporary file. It
does not execute SQL, run PostgreSQL or enforce RLS. No actual DB/client URL or
credentials were created. All provider keys used in tests are local ephemeral
ES256 keys; synthetic staff proofs are setup-only, never production fallback.

The student HTTP flow is connected for existing identities: Telegram login,
profile, exam/meta, start, save/clear/resume, submit/result/history, refresh/logout.
New published version31 is prepared through Teacher/Admin HTTP fixture setup,
then the student flow uses SQL row projection/flush. A separate child process
resumes the same stored answers/revision/deadline and opaque proof digests.
The setup RAM staff fixture is explicit test-only; its storage is not claimed to
be a completed relational staff implementation.

First-time identity enrollment has no implementation yet and returns503 for a
verified but unmapped Telegram identity. It never creates a RAM person. Full
relational staff content/roster/assignment/transfer repositories are also pending;
production staff routes require explicit load/flush/liveness ports and otherwise
return503. Staff HTTP integration tests use an explicitly configured, disk-backed
contract projection for Version PATCH, not a real Supabase staff database.

Review the [configuration/schema/RLS handoff](docs/api/persistent-http-review-2026-11-07.md)
before implementing a real connection. No executable migration or RLS/grant
change is included. Source hashes are in BACKEND-CURRENT-SHA256SUMS.
