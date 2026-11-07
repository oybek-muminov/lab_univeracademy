# Current Backend publication — first-test relational commands and local CORS

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
