# Pinned Clerk SDK and scoped auth storage — local review candidate

PROVISIONAL / NOT ACCEPTED. Base: a36d41ac52c2b12eda4f191020d7420edb5dd23f.
No upload, commit/push, real Clerk/Google/DB/provider call, migration or deploy.

## Exact SDK binding and security evidence

Root dependency `@clerk/backend` is exactly 3.27.0, Node requirement >=20.9; tests
use Node 24.22.1. Its npm package integrity is
`sha512-pmhVVP9EsAOL1rlRU4xR0XSL1BJczxGAJIqv8c+C9fRz7TYzCndGUMSSE/Zg7i2QOA24ExJbEJUiOjILdUL2EQ==`.
The root package-lock pins all resolved transitive dependencies. Existing jose
6.2.15 and its strict signature/issuer/azp/audience/expiry verifier are unchanged.

Inspection of this exact installed SDK found two security-relevant defaults:
Session constructor `actor=null` and User constructor `deprovisioned=false` when
their raw JSON fields are absent. Reading only the model would therefore guess
security evidence. Our binding validates the exact raw response before SDK
deserialization: `actor` must be present and null/object; `deprovisioned`, `banned`
and `locked` must be explicit booleans. Required ID/status/millisecond expiry
fields are also checked. Missing/invalid evidence denies 503; no default is inferred.

`runtime/clerk-sdk-bindings.mjs` exports async `createClerkSdkBindings({secretKey,
transport,now,timeoutMs,maxResponseBytes})`. It returns the existing provider-port
shape (`getSession`, `getUser`, `fetchJwks`, `now`) plus `close`/`sdkVersion`.
The factory requires injected transport and checks installed version 3.27.0.
It performs no credential/environment loading and has no native-fetch fallback.
Only synthetic key text is passed in tests; no real credential is read or changed.

The SDK captures global fetch during module import and offers no per-client
transport hook in this pinned API. A private Node worker pins a bridged fetch
before dynamic SDK import, leaving application-process fetch unchanged. The
parent validates GET-only exact BAPI Session/User paths at `https://api.clerk.com/v1`,
the expected authorization header, no redirects, response origin, MIME and bounded
UTF-8 JSON, then passes that response to the actual SDK. Arbitrary provider text
and extra model data are not returned. Telemetry is disabled. Public JWKS uses
the existing issuer-pinned no-cookie/no-bearer transport path.

The returned fields are actual 3.27.0 SDK model conversions, not a hand-written
claim that snake_case fields already are camelCase. Session/User reads are not
cached. 404 stays a resource denial for the existing adapter to map401; credential,
rate-limit, malformed or transport failures stay503. No retry is introduced.
Timeout/abort denies; cooperative transport is cancelled and late replies cannot
grant. `close()` terminates the worker and cancels pending work. The production
runtime must review worker lifecycle, asset bundling, transport/credential scope
and its fixed Clerk BAPI location; no Vercel bootstrap is changed here.

## Scoped exchange persistence candidate

`storage/clerk-auth-rows.ts` exports `ClerkScopedAuthStore({pool,liveness,newPersonId?})`
with `run(proof, work)`. This is an **auth-only exchange unit**, not a drop-in
`ClerkTransactions` full-domain port and not a new HTTP endpoint. Its proof must
come from the existing trusted signature verifier; a proof-shaped public JSON
body is never accepted. It does not itself verify a raw JWT.

The row port receives an injected PgPool and performs parameterized statements;
it creates no driver/pool/connection string. Test inputs use only a statement
double. Protocol:

1. BEGIN, DB clock/proof check, dedicated two-key identity gate (separate from
   numeric Telegram locks), transaction-local issuer/subject context.
2. Exact case-sensitive identity lookup. Reuse and lock the canonical UUID if
   mapped; otherwise reserve a server-generated UUID without creating a profile.
   Set transaction-local person scope, then re-read time after lock waits.
3. Check provider liveness, fresh DB time and JWT/provider expiry after its await.
   Load only this person's auth rows, including nullable Telegram, current roles,
   identity mapping, origin/binding, sid fences, replay and proof digests. Recheck
   DB time after row loading/digest work before invoking auth-state work.
4. Derive and consume issuer/user/sid/jti digest itself; the callback cannot omit
   it or insert an unrelated receipt. Work is auth state only: no grant, question,
   attempt, history or staff state is loaded/written. Existing mapping, roles,
   enabled state, Qadam, group/membership and Telegram association are immutable
   here; only the existing profile-update path's own fields may change.
5. Recheck fresh DB clock/proof/provider expiry before flush. Persist new student
   person+inactive membership+exact identity, replay, monotonic sid retirement,
   old-family revocation, new family+same-proof F1 binding and proof digests in one
   transaction. Revoke old families before new insert. No raw JWT/proof at rest.
6. Recheck time after writes and immediately before COMMIT. Return work's result
   only after confirmed commit. Unknown commit is503/discard, not an ACK/retry.

Missing/unknown active F1 context denies 503. No implicit Telegram marker, missing
binding repair, origin reassignment, foreign person, role escalation, consumed
proof reversal or retired-sid revival is allowed. Disabled account/current mapping
denies. A new person is student-only, ungrouped/incomplete, with Telegram=null.
New access families bind to the exact verified current sid, not an arbitrary own
identity. Staff remains parallel on its existing path and never uses this store's
student fence. Existing scopes/history outside auth are untouched by this port.

## Schema/RLS diff proposal and cutover blockers

`contracts/clerk-storage.schema-rls.proposal.json` is a precise machine-readable
review diff: nullable Telegram, explicit family origin, four new auth tables,
case-sensitive keys, composite foreign keys, immutable fields, one-current-family
and deferred F1 integrity, indexes, RLS predicates and grants. It is **not DDL**,
not a migration, and is not applied. Physical schema and backend role are unknown;
the role is explicitly PENDING_REVIEWED_BACKEND_ROLE rather than a guessed grant.

The new tables stay private/unexposed, with RLS+FORCE and no public/browser role
grants. A reviewed non-superuser/no-BYPASSRLS server role and transaction-local
context are required. Context alone is not authentication; only the trusted
signature-verified server path may establish it. A nullable FK alone does not
ensure every Clerk family has a binding: deferred same-person integrity is a
required real constraint, still unimplemented/unverified in SQL.

All existing relational Telegram writers/readers must be upgraded before cutover;
they still reject null Telegram or omit origin. An old unmarked active family
can block a scoped load with503 until reviewed revocation/expiry/provenance
migration; fresh login is not claimed as an automatic repair through this decoder.
No identity merge, unlink, retention GC or schema backfill is implemented.

This auth-only port has not yet been composed with scoped full-domain HTTP
student/staff loaders and idempotent exam mutations. Do not replace the existing
HTTP storage port with it or claim the whole student flow is durable. It does
not make the SDK and DB one distributed transaction. Actual lock/index/RLS,
pool-context cleanup, constraint races and commit timing still require isolated
Postgres tests; the double's global queue does not prove any of them. Qadam/UUID insertion collisions fail
closed/roll back; bounded allocation retry/cutover policy needs integration review. Large
per-person auth history scans/retention costs and actual serverless concurrency
have no measured capacity evidence.

## Checks and reproducibility

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/sdk-binding.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

55/55 PASS: 7 new exact-SDK tests, 7 new scoped-store groups and 41 affected prior
checks. Typecheck exits 0. New coverage includes real SDK deserialization, raw
missing-field defaults, abort/redirect/size/error boundaries and SDK→F1 exchange;
nullable create/reload, identity collision/case distinction, scope, F1 loss,
replay/retired sid, role/binding tampering, partial-write rollback, unknown commit
and fresh DB-clock before/equal/after expiry (all storage through a double).

No native provider HTTP, real credential, actual Pg connection, SQL/migration,
provider setting or deploy is used. Independent QA, real tenant claim/flag/units,
real DB/RLS, worker deployment, and full HTTP scoped-store integration are NOT_RUN.
Linking remains blocked 409 (invalid/expired proof 401). The earlier app/session
TTLs and source contract are not silently changed. Current SDK/cache/build files
are local dependencies only, excluded from the source manifest.

Sources: exact npm package3.27.0/lock and installed SDK `Session.fromJSON`/
`User.fromJSON`/runtime/request implementation; [official Backend Session](https://clerk.com/docs/reference/backend/types/backend-session)
and [User](https://clerk.com/docs/reference/backend/types/backend-user) docs.
Callback/reauth/retention options are separate in
`clerk-callback-reauth-retention-2026-11-07.md`; none enables linking.
