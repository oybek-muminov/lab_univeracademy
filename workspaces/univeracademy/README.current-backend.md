# Current Backend publication — SDK-CANCEL-1 correction candidate

PROVISIONAL / NOT ACCEPTED. Laboratory QA candidate based on
6f2dbee78ba5545bd07ce759a9f0a6dde5514e60. This delta only changes the two Clerk
SDK bridge runtime files and adds their cancellation regression test, handoff
and frozen verification evidence. Existing Mini App files/evidence, dependency
lock, schema, auth policies and other work are preserved.

Caller abort/provider timeout/SDK timeout now cancel that call's transport.
Worker fetches carry the public call ID via AsyncLocalStorage, including
concurrent calls for the same session. Finished calls cannot start transport;
late replies are discarded and their bodies cancelled. Timer/listener/reader
cleanup and idempotent close are exercised. Arbitrary transports can ignore
abort internally; this is cooperative cancellation, not forcible execution stop.

Author evidence:65/65 PASS (10 new cancellation checks +55 prior affected),
typecheck exit0, exact source hashes retained. No redundant test rerun on upload.
The new regression failed on the unmodified base before the correction. Actual
Clerk/socket cancellation and production deployment remain NOT_RUN; independent
QA has not accepted this correction. No real provider/database/deploy operation.

See docs/api/clerk-sdk-cancel-2026-11-07.md and
evidence/clerk-sdk-cancel-2026-11-07/source-manifest.json for commands and hashes.
Frozen local NOT_UPLOADED labels describe preparation provenance; the separate
publication verification describes the authorized lab upload.

---

# Current Backend publication — pinned Clerk SDK and scoped auth storage candidate

PROVISIONAL / NOT ACCEPTED. Approved laboratory QA upload based on branch HEAD
9bed5e04bf54f04f2e5f7d2441dcacb2017f7505. All 108 Mini App files and15 UI evidence
files are preserved byte-identically; they are not Backend-owned manifest entries.

Architect/coordinator delegations set the scope, safety boundaries and review
criteria; Backend implemented and locally tested the candidate. This records
collaboration, not an independent architect acceptance of this new source.

The root lock pins @clerk/backend3.27.0. Its actual Session/User model conversion
is used behind an injected, worker-isolated transport. Raw actor/deprovisioned
presence and security types are checked before SDK defaults could invent null/
false. The application-process global fetch is unchanged. GET-only pinned BAPI
reads, bounded JSON/errors, no redirect/cookie, explicit secret binding and no
native-fetch fallback remain technical boundaries. Tests use synthetic replies
and key strings; no real credential, tenant or provider call is included.

ClerkScopedAuthStore is an auth-only exchange row-port candidate: exact external
identity gate, canonical person lock/scope, nullable Telegram, F1 origin/binding,
retired sid, replay/proof digests and fresh DB-time checks with commit-before-ACK.
Its SQL statements are exercised only by a global-queue statement double, not an
actual database. It is not yet a full-domain HTTP storage adapter or a drop-in
replacement for current production storage.

The schema/RLS diff in contracts/clerk-storage.schema-rls.proposal.json is a
non-executable review JSON proposal. No DDL/migration is created or applied.
Actual database role, effective RLS/grants/index/constraint/lock behavior and all
legacy reader/writer cutovers remain review/test prerequisites. No automatic
legacy provenance backfill, identity merge or retention GC is enabled.

Author checks:55/55 PASS (7 SDK,7 scoped-store,41 prior affected auth checks),
typecheck exit0. Exact10 source files and5 evidence files retain frozen bytes.
Current instructions: docs/api/clerk-sdk-scoped-storage-2026-11-07.md. The iframe,
fresh reauth/challenge and retention options are text only in
clerk-callback-reauth-retention-2026-11-07.md. Linking remains blocked409 (invalid/
expired proof401); no factor, challenge TTL or GC policy was silently selected.

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/sdk-binding.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

Student-only single active family and parallel Teacher/Admin/Owner sessions stay
unchanged. Existing signature verifier/expiry/F1 handler, client/types, OpenAPI,
Vercel entry and all Mini App source are byte-identical. No proof or answer key
is added to public URLs/logs; no secret, real data, dependency cache/build or old
source archive is added. Node modules are reproduced from locks, not uploaded.

Real provider/DB/RLS, full scoped HTTP/domain composition, worker production
bundling, browser callback/fresh reauth and independent QA are NOT_RUN. Main
project, real provider, database, migration and deploy remain untouched.

BACKEND-CURRENT-SHA256SUMS covers Backend-owned files only. Mini App's guard still
pins prior Backend a36d41a/149 files, so UI owner must repin for this new candidate;
it is not edited/bypassed. Frozen local/unuploaded metadata remains preparation
provenance. Current publication intake:
docs/api/clerk-sdk-storage-publication-verification-2026-11-07.json.

## Prior Backenda36d41a publication — historical provider/timing/staff candidate

PROVISIONAL / NOT ACCEPTED. Approved lab QA candidate, based on branch HEAD
829b2585fc5bfd04feea34d028db8dd76dea27ce. Mini App107 files plus15 UI evidence files
from that commit are preserved byte-for-byte and excluded from Backend ownership.
No production/provider/database/deployment activation is included.

This publishes the tested local provider adapter, strict production-settings
example, fresh post-provider JWT/session expiry checks, approved student-only
single-device rule and parallel Teacher/Admin/Owner authentication. Provider
reads are injected; tests use synthetic RSA/JWKS/Session/User replies. The real
Clerk SDK/tenant/secret transport and durable storage remain unconfigured.

At/after JWT exp or provider session expiry the login denies401, with no new
profile/proof/replay/family commit or old-session disturbance. Fresh server time
also reaches opaque access/refresh and staff work. Regressing/invalid clock denies
503. The current provider/user models are rechecked after awaits; this is not a
promise of an atomic provider/DB snapshot or instantaneous later revocation.

Only a successful student exchange supersedes its old student family. Staff uses
current provider bearer, canonical roles, approval, capabilities and scope on
existing staff operations; no student fence, global provider logout or new staff
login DTO is introduced. Staff-only accounts cannot use the student exchange.

Author evidence:41/41 PASS plus typecheck exit0; the exact tested11 source files
and8 evidence files are preserved, with no redundant test rerun during upload.
`evidence/clerk-provider-2026-11-07/timing-tests.log` and `timing-typecheck.log` are
current. The pre-fix timing log retains the failure with six synthetic proofs
redacted. Earlier9-test logs/LOCAL_NOT_UPLOADED metadata remain historical
preparation provenance, not claims of current QA acceptance.

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

`docs/api/clerk-timing-d1-d2-2026-11-07.md` explains timing, staff policy and D1/D2
states; `clerk-provider-candidate-2026-11-07.md` describes auth bindings and strict
configuration; `clerk-atomic-storage-plan-2026-11-07.md` is unapplied design only.
Linking remains409 for valid proof and401 for invalid/expired proof; no association,
email auto-merge, callback bridge or new product permission is enabled.

Original OpenAPI/client/types, crypto verifier, production/Vercel entries and
locks remain unchanged. Old unmarked active families still deny503 without
implicit backfill. Nullable-Telegram/F1 durable mapping/fence/replay, real SDK
bindings, actual fresh DB clock/commit boundary, real provider/DB/RLS/browser/
deployment and independent QA remain pending/NOT_RUN. No SQL/migration is created.

`BACKEND-CURRENT-SHA256SUMS` covers Backend-owned files only. The Mini App guard
still pins Backend b9efa597/133 files; UI owner must repin it for this candidate
before combined QA. It is neither edited nor bypassed. Publication intake and
privacy evidence: `docs/api/clerk-provider-publication-verification-2026-11-07.json`.

## Prior Backendb9efa597 publication — historical Clerk exchange review

PROVISIONAL / NOT ACCEPTED. Approved laboratory upload, based on current branch
HEAD d1bdd0e6f43ae465eef53b3e0ac7b60520eeeb68. All 83 Mini App files and its F1
Backend guard repin are preserved. This does not enable production/provider auth.

The existing student client now exposes exchangeClerkSession(ClerkJWT, {}) using
POST /api/v1/auth/clerk, bearer header and strict empty JSON. The response retains
SuccessSession and opaque app proofs; no second client or provider SDK was added.
The review-only full schema is contracts/clerk-review.openapi.json, version
0.3.0-clerk-exchange-review.1, SHA256
f6226aa1cea63ae1fbc603b80aed9232bc4dd5213c4cc081cc13300ee0179b28.
It adds only the student exchange/security/request and five implemented student
error codes; all old paths/staff security remain exact. The original OpenAPI,
F1 runtime/verifiers, production entry points and dependency locks are unchanged.

The ephemeral-RSA/current-liveness fixture uses the F1 handler via the existing
127.0.0.1 Node transport. No HTTP fixture proof/control routes, raw token logs,
real provider credentials, cache/build or historical source archives are added.

```sh
npm ci --ignore-scripts
npm run setup:validator
node runtime/clerk-review-server.mjs 8797 http://127.0.0.1:5198
```

Actor arguments, the in-memory proof helper, client signature, schema/client/types
hashes, exact test commands and limits are in
`docs/api/clerk-review-handoff-2026-11-07.md`. Author validation: 23/23 PASS,
206 review components compile with strict formats, both typecheck commands exit0,
4/4 generated artifacts reproduce byte-for-byte, CLI/TCP start/stop PASS.
Exact tested source/log bytes are preserved; old local-preparation metadata says
unuploaded and remains frozen provenance. The current publication intake is
`docs/api/clerk-review-publication-verification-2026-11-07.json`.

`docs/api/identity-link-return-proposal-2026-11-07.md` is text only: two independent
account proofs, one-use state, PKCE/bound external-browser return, conflict/replay
checks and profile/history preservation. No email-text auto-merge. Real linking,
upstream Clerk email-association review, fresh reauth, TTL/retention and staff
device policy remain open. Linking stays409; staff without reviewed device gate
stays503; old unmarked active families stay503, without implicit backfill.
Real Clerk/Google/browser OAuth/DB/RLS/deploy and independent QA remain NOT_RUN.

BACKEND-CURRENT-SHA256SUMS covers this Backend publication. Mini App's current guard
still pins the prior F1 Backend117 snapshot and needs UI-owner repinning for this
candidate before combined QA; it is neither changed nor bypassed here. No main
project, real database/provider, migration, credential/OAuth, domain or deploy change.

## Prior Backend6329367 publication — historical F1 family-context fix

Based on branch HEADd94cf2feb5d6050bae04d80d530fc02201caae36. This publication
contains the approved local F1 fix and regression evidence, preserving all current
Mini App and other work. No main-project, real Clerk/DB/provider, migration,
credential/OAuth, domain or deployment operation is included.

F1 was reproduced on the exact base with synthetic server-state deletion: a
revoked provider session returned401 with its binding, but deleting that binding
made /me and refresh200 and emitted a new proof. The cause was !binding returning
early from the provider guard. The fix records explicit server auth provenance;
missing/unknown/conflicting active context now fails503 without proof or mutation.
Refresh guard now follows the same body proof as the core, even with invalid or
unrelated Authorization; logout's bearer-first/no-fallback behavior is unchanged.

**Compatibility limit:** old unmarked active families are denied503, even with a
binding. No absence-based Telegram inference or automatic backfill is performed.
A reviewed trusted migration or fresh verified login is required for such records.
No migration is applied by this update. Real storage must preserve origin/binding
atomically; current Clerk durable integration is still pending.

Author validation:25/25 PASS (5 new plus20 existing auth checks), typecheck exit0.
Exact tested source/log bytes are published without redundant test reruns.
`evidence/clerk-f1-2026-11-07/` contains the status reproduction, expected pre-fix
red log and final passing log. Its original local-preparation metadata remains
frozen provenance; current publication intake is in
`docs/api/clerk-f1-publication-verification-2026-11-07.json`. The complete root cause
and limits are in `docs/api/clerk-f1-family-context-2026-11-07.md`.

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:clerk-auth
npm run typecheck
```

Cryptographic verifiers, core student handler, OpenAPI/proposed contract,
client/types/locks, package scripts and Vercel entry are unchanged. The existing
recognizable revoked-family logout ACK remains non-activating. No external exploit
is established by this fault-injection test, and independent QA closure is pending.
Real DB/RLS/Clerk/browser/deployment/capacity remain NOT_RUN; Telegram linking and
staff device policy stay open; default Vercel API remains503.

The Mini App guard still pins108 files from Backend39b2d92 and needs UI-owner
repinning before combined QA. No UI/guard file is changed or bypassed here.
BACKEND-CURRENT-SHA256SUMS identifies current Backend files; prior reports/sums
remain provenance. No secret, real user data, cache/build or old archive is added.

## Prior Backend39b2d92 publication — historical Clerk auth checkpoint

Based on branch HEAD9a9dd43cd0f565bac8f8b333b044f54650919531. This update publishes
the approved Clerk Backend candidate for laboratory QA; all current Mini App files
are preserved. No main-project, real Clerk/Google/DB/provider, credential/OAuth,
domain or deployment operation is included.

`createClerkCandidateHandler` uses the existing student/staff handlers with a
separate Clerk v2 RS256 verifier. `user_…`/`sess_…` remain case-sensitive external
identifiers mapped to an internal UUID; the old UUID/Supabase JWT verifier is
unchanged. Current server identity, role, approval, capability and scope are used;
JWT organization/custom role/email/name claims confer no authority or account merge.

The proposed `POST /api/v1/auth/clerk`, Bearer Clerk JWT plus `{}`, returns the
existing opaque SuccessSession envelope. Existing/new student account, replay/
provider-liveness checks and one active student family are covered locally.
Supersession preserves answers/revisions/deadlines. The contract JSON patch is
unapplied and NOT ACCEPTED; original OpenAPI/client/types/locks remain unchanged.

Author checks:20/20 PASS (15 new plus5 old staff JWT regressions), typecheck exit0.
Exact tested source/log bytes are preserved in `evidence/clerk-auth-2026-11-07/`.
Its preparation manifest/status and `docs/api/clerk-auth-local-proposal-2026-11-07.md`
remain historical local-preparation evidence; this README and
`docs/api/clerk-auth-publication-verification-2026-11-07.json` describe publication.
Tests were not redundantly rerun during this source upload.

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:clerk-auth
npm run typecheck
```

Open gates remain explicit: Telegram link returns409 without mutation; staff
device policy absent means503, and its synthetic test gate is not a product rule.
Durable Clerk identity/family-binding/fence/replay storage, nullable Telegram DB
schema/readers, real liveness/JWKS, consumer generation and Vercel auth bootstrap
are pending. The global-queue memory transaction double proves no actual DB/RLS/
isolation behavior. Existing Vercel default stays unconfigured503. No real origin
or provider settings are inferred from a planned/reserved domain.

Mini App's strict guard still pins95 files from Backend47ed6f8. UI-owner repinning
and combined repository QA are required; no guard/client/UI file is modified or
bypassed here. BACKEND-CURRENT-SHA256SUMS lists current Backend bytes; previous
sums/reports are provenance. No secret, real user data, cache/build or old archive
is added.

## Prior Backend47ed6f8 publication — historical Vercel transport checkpoint

Based on branch HEAD29217c3a0ad8fad1140435c752857a60ef71b441, preserving its full
Mini App subtree. This publication adds only the reviewed Vercel Node adaptation,
transaction-pool port and their tests/docs. No framework/API/client/schema change.
No real DB/provider/domain, migration or deployment operation is included.

`api/index.mjs` is the Node Web fetch entry. `vercel.json` proposes routing only
`/api/v1/:path*` to it; actual Vercel build/rewrite/project-root delivery is NOT_RUN.
The runtime reuses the existing configured handler, retains raw bodies and proof/
CAS/deadline/session behavior, and accepts explicit public HTTPS origins/CORS.
Required public settings: UA_API_ORIGIN and UA_ALLOWED_ORIGINS (JSON array).

**Production bootstrap is still incomplete.** The default entry passes undefined
HttpConfiguration and API requests remain503. Public env settings alone do not
enable the API. Reviewed real pool/TLS, bot secret, policy/numeric ports, validator,
current staff/session/JWKS and schema/RLS integration are still required.

Author validation:12/12 PASS (9 new plus3 affected local-CORS regressions),
typecheck exit0. Exact tested source/log bytes are published without rerunning
unchanged tests. See `evidence/vercel-node-2026-11-07/` and
`docs/api/vercel-node-local-proposal-2026-11-07.md`; their original local-preparation
status is frozen provenance. Current publication intake is recorded in
`docs/api/vercel-node-publication-verification-2026-11-07.json`.

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:vercel-node
npm run typecheck
```

`transactionPoolPort` forwards text/bound parameters without Statement.name to a
checked-out native-driver client. Real pg/Supavisor/TLS execution is NOT_RUN. The
plan specifies one client per transaction, module-scoped pool, TLS verification,
no query pipelining/session-state reliance or automatic retry after unknown COMMIT.

Mini App files/guard remain unchanged. Its manifest still pins83 Backend files
fromada6600b, so UI-owner repinning is required before combined QA. Current shared
client/types match its copies. All current Backend bytes are listed in
BACKEND-CURRENT-SHA256SUMS; previous reports/sums are historical provenance.
No secret, real data, cache/build or old archive is added.

## Prior Backendada6600b publication — historical first-test checkpoint

This update is based on branch HEAD2ef530bba05aa121479f93fdfca118b64fb61ae2,
preserving its complete current Mini App subtree. It adds Teacher/Owner
question/duration/publish, Admin initial membership/assignment relational writes
and explicit loopback CORS. API, generated types, student client and dependency
locks are unchanged. API remains PROVISIONAL / NOT ACCEPTED.

```sh
cd workspaces/univeracademy
npm ci --ignore-scripts
npm run setup:validator
npm run test:first-test
npm run typecheck
```

Author validation:32/32 PASS (14 new and18 affected enrollment/persistent HTTP
regressions), typecheck exit0. Publication source/dependency bytes match the tested
local candidate. Exact logs and frozen before/after hashes are in
`evidence/first-test-2026-11-07/`. Preparation documents/manifest there and
`docs/api/first-test-relational-local-2026-11-07.md` retain their original local
checkpoint status as provenance. Publication status is recorded in
`docs/api/first-test-publication-verification-2026-11-07.json`.

Use existing staff ports with `domain:"first_test_relational"` instead of custom
load/flush; JWT, liveness, validator and ID ports still must be explicitly supplied.
Current Admin policy A and Teacher scope remain unchanged. Group/version locks
are followed by fresh DB time and current proof/session/access checks. Grant,
revision, receipt and audit writes share one COMMIT; unknown COMMIT remains503.

```js
startConfiguredServer({config,port:8793,allowedOrigins:["http://127.0.0.1:5198"]});
```

Local CORS uses exact loopback origins, OPTIONS204, existing proof/idempotency
headers and Retry-After exposure. Default allowlist is empty; no wildcard/cookie
grant or implicit storage configuration. Preflight does not imply API readiness.
The executor remains a synthetic file ledger, not actual PostgreSQL/RLS proof.
Real DB/provider, migration, domain, deployment and current Mini App browser QA
remain NOT_RUN. Full CRUD/transfer/removal/recovery/media/onboarding are not added.

The latest Mini App client copy matches the unchanged shared client/types. Its
strict Backend manifest still pins71 files from1335762a and needs UI-owner repinning
before combined QA. No Mini App file or guard is modified/bypassed here.
BACKEND-CURRENT-SHA256SUMS identifies the current Backend; prior sums/reports are
historical provenance. No real credential/data, cache/build or old archive is added.

## Prior Backend1335762a snapshot — historical preparation and verification

Laboratory branch: `qa/current-flow-20261106`. This publication is based on branch
HEAD3d029d0e680ea2ddf93b0e702f252781b501dd13, preserving its Mini App subtree.
It combines the previously local storage/auth/HTTP/enrollment changes with the
existing student client production constructor. API is PROVISIONAL / NOT ACCEPTED.
No main repository, real DB/provider, migration or deployment change is included.

```sh
cd workspaces/univeracademy
npm ci --ignore-scripts
npm run setup:validator
npm run test:production-client
npm run test:enrollment-staff
npm run test:persistent-http
npm run test:storage-auth
npm run typecheck
```

Fresh installs on the combined branch intake:39/39 Backend tests PASS and
typecheck exit0. Exact scope and the stale Mini App guard result are recorded in
`docs/api/backend-current-verification-2026-11-07.json`.

The production constructor is in the same `packages/api-client/student-client.ts`:

```ts
createProductionStudentClient(options: ProductionStudentClientOptions): StudentClient
```

Options are `mode:"production"`, explicit HTTPS `/api/v1` baseUrl, exact
contractSha256 and explicit `transport(Request):Promise<Response>`. Local and
production factories share operations/wire behavior; no API, auto retry or default
endpoint was introduced. See CLIENT-PRODUCTION-HANDOFF.md for the full signature.
Client SHA256:54c110d7736a2537e384bddaaab2e91a78e2e56fe3d365fd7d688fa51ab65fae.
Shared student types SHA256:9e7c643f0a1788918e178732677dfa5a8a78209d3a2ba8f5d88d1396dad18c21.
Full API SHA256:9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4.

`npm start` is the fail-closed configured entrypoint, not a RAM pilot. No real
configuration is supplied here, so requests return503 CONFIG_REQUIRED rather than
falling back to fixtures. Explicit `start:local-ram` remains a local test tool.
The production import graph has no test/RAM runtime dependency.

New identities are created from empty people tables with verified Telegram HMAC,
identity gate/person locks, unique UUID/Qadam candidates, inactive membership,
replay and one active opaque family in one transaction. Staff identity mapping,
account/role/approval, capabilities, group/subject scope and Teacher approvals are
read from current normalized rows, never JWT metadata or cached Owner projections.
Current role/session checks precede private domain loading. Full relational staff
domain writers and real provider liveness permissions are still pending.

The local executor dispatches statement names and persists synthetic test rows;
it is not PostgreSQL or an RLS engine. SQL syntax, physical constraints/isolation,
RLS/grants, real JWKS/session lifecycle, deployment TLS and production browser
integration remain NOT_RUN. No live credential or real user/test data is included.

The existing `apps/mini-app/**` subtree is intentionally preserved byte-for-byte
by this Backend publication. Its internal client copy and strict Backend guard
still pin the prior8f863e6 snapshot. The Mini App owner must synchronize/repin its
client/guard before claiming combined UI QA on this newer Backend. Earlier browser
reports are checkpoint evidence, not acceptance of these persistence changes.

Current Backend source identities are in BACKEND-CURRENT-SHA256SUMS (excluding
itself and the Mini App subtree). BACKEND-SHA256SUMS is the older published baseline;
it is retained as provenance, not a current verification list. The separate
schema/RLS proposals and phase READMEs describe implementation boundaries; this
file is the publication entry point.
