# First-test relational command candidate — local only

Baseline Backend publication: `1335762a8e133311849b2dad1ddc6be3ccf9bb53` on
`lab_univeracademy/qa/current-flow-20261106`. This delta is local and not uploaded.
API remains `9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`,
PROVISIONAL / NOT ACCEPTED. Existing client, generated types and permissions are unchanged.

## Run and configure

```sh
npm run test:first-test
npm run typecheck
```

The first command runs14 new tests. The affected prior enrollment/persistent HTTP
suites were also run in the same invocation:32/32 PASS, typecheck exit0.
Exact commands/logs/hashes are in `evidence/first-test-2026-11-07/`.

Configure the existing `createConfiguredHttpHandler` staff ports with
`domain: "first_test_relational"` instead of caller `load/flush` callbacks. Still
required: explicit JWT issuer/audience/asymmetric trusted keys and clock, current
provider-session `liveness`, pinned schema `validate` and `newAssignmentId`.
The existing injected pool, verified Telegram/session policies and exact numeric
presentation ports are still required. No pool, account, provider or policy is
invented. Custom `load/flush` ports remain compatible for existing callers.

The local listener accepts explicit allowed UI origins:

```js
const local = await startConfiguredServer({
  config, port: 8793,
  allowedOrigins: ["http://127.0.0.1:5198"],
});
// local.baseUrl; await local.close();
```

This example supplies configuration; it does not create one. `npm start` still
has no configured production DB and returns503. No implicit RAM/storage fallback.

## Connected command scope

Existing Teacher/Owner PUT question, PATCH duration/metadata and POST publish
commands now read/write individual version/question rows. The test begins with an
empty draft and demo metadata, not seeded published content. Publish returns the
same new version ID subsequently submitted to Admin assignment. Private exact
ratios are stored as numerator/denominator decimal strings; student DTOs retain
their existing display fields and never expose keys, explanations or ratios.

Admin membership and assignment reuse the current normalized staff readers and
existing handlers. Assignment is policy A: `manage_content` plus current group
AND subject scope; roster permission is independent. Membership needs its existing
roster authority. Teacher assignment or new Admin publish authority is not added.
Only explicit `student_ids` receive grants. No roster-wide implicit expansion.

Supported membership is the existing initial add from no group to an active
group. Transfer/removal/recovery, group/demo/draft creation, staff onboarding,
notifications, media validation and full CRUD are outside this repository. An
unsupported staff route fails503; it cannot fall back to a cached staff-state blob.
Existing active-only transfer/recovery-cancel logic and its custom ports are not changed.

## One transaction and concurrency boundary

One injected client performs BEGIN, all sorted actor/target person row locks,
group row lock where applicable, version row lock where applicable, fresh DB
`clock_timestamp()`, and current staff/session checks again. Only then are private
questions, selected people/memberships/grants, conflict assignments and the exact
actor/command receipt loaded. Other staff writers/revocation writers must use the
same person/resource gates; external writers bypassing them are not proven safe.

The existing handler applies permission checks, input schema, exact numeric
validation, revision CAS, frozen snapshot and canonical idempotency rules. Flush
writes version revision/question/snapshot, or group revision/membership epoch and
person group, or assignment and selected grants, followed by receipt and audit,
before the single COMMIT. ACK is generated only after COMMIT returns. Unexpected
exceptions roll back and remain500. Unknown COMMIT remains503/discards connection;
same original command/key can recover through the receipt without a second effect.

First-test writes never touch student sessions, attempts/answers/deadlines,
ordinary results, bonus or recovery state. Student start/save and membership/
assignment share selected person locks; published assignment snapshots are immutable.
Actual parallel PostgreSQL lock/isolation behavior has not been exercised.

## Proposed row interface, not applied schema

All tables are under `ua_private`; names and columns are query proposals, not a
live schema inventory. No SQL/migration file or real DB operation was created/applied.

| Rows | Fields relied on by this delta |
| --- | --- |
| groups | id PK, status, revision |
| demos | id PK, subject_id, title |
| test_versions | id PK, demo_id FK, revision, status, wire JSONB, published_snapshot JSONB |
| draft_questions | (version_id,id) PK, position, record JSONB per authored question/options |
| memberships | person_id PK, affinity_group_id, active, revision, epoch |
| people | existing scalar identity/roles/enabled plus profile.active_group_id |
| assignments | id PK, group_id, demo_id, version_id, revision, existing private record JSONB |
| grants | (person_id,assignment_id) PK, rostered, grant_epoch; current epoch is derived from membership |
| staff_receipts | (actor_id,key) unique, payload, response JSONB; no raw proof |
| staff_audit | command_key unique, actor_id, action, target_id, revision, at_ms |

Required review before actual DB integration: PK/FK/check constraints, current
one-assignment-per-group/demo uniqueness matching existing handler behavior,
version scalar/wire consistency, frozen snapshot immutability, valid question
positions/options and exact points, monotonic CAS revisions/epochs, transaction
isolation, least-privileged backend grants/RLS and private proof/key access. JSONB
is per question/version/assignment, never an entire mutable StaffState database.

## Local origin/CORS

`runtime/local-cors.mjs` only accepts exact configured loopback HTTP/HTTPS origins
(127.0.0.1/localhost/[::1], port included). Empty allowlist denies any Origin-bearing
request. Wildcards, null/foreign origins, credentials and path-bearing config fail.
OPTIONS204 allows GET/POST/PUT/PATCH and Accept, Authorization, Content-Type,
Idempotency-Key. It performs no auth/storage work and does not imply readiness.
Unknown preflight method/header fails403 before application dispatch. Actual
success/error responses preserve status/body, set exact Allow-Origin, expose
Retry-After and Vary appropriately; no Allow-Credentials. API auth is still required.
This is a loopback listener configuration, not production domain/CORS approval.

## Evidence and limits

New checks cover end-to-end registration/Teacher publish/Admin assignment/student
result/history across server restarts; write-stage rollback; multi-person grants
with second-grant failure; unselected member exclusion; current Teacher approval
and Admin A capability/group/subject/session revocation; post-resource-lock proof
expiry/current scope; local CAS races; frozen/replayed version; unknown COMMIT
before/after persistence; exact origin/preflight and API-error CORS behavior.

The synthetic executor dispatches statement names into file-backed rows. It has
one global test queue, detached query rows and fsync/rename durability. It is not a
SQL parser/PostgreSQL engine and does not prove SQL syntax, RLS, real row locks,
isolation, real provider JWKS/session lifecycle, TLS or browser behavior. Browser
QA with the actual current Mini App is NOT_RUN. The source published earlier had
a stale Mini App client/Backend guard; this local delta does not modify that UI.
No real keys/users/tests, DB/provider/domain/deployment or remote writes are included.

References used for the lock/CORS design: [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
and [Mozilla CORS reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).
