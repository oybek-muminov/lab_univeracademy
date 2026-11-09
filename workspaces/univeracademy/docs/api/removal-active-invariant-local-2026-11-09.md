# C04-IDKEY local correction and Backend continuation handoff

Repository: `oybek-muminov/lab_univeracademy`, baseline branch
`qa/current-flow-20261106`. Exact published base:
`21b8ee4a49fb02fbdb4b12de5139549caa277d64`.
Local work branch: `backend/c04-idkey-20261109`, same original executor.
PROVISIONAL / NOT ACCEPTED / NOT UPLOADED. This handoff is self-contained with
the GitHub baseline; no old /tmp file or another agent's environment is needed
to resume. The local correction is not yet in the published baseline.

## Current work and bounded correction

The coordinator authorized only a local C04 correction in membership-activity.ts,
its test file and this document. No commit/upload/push is authorized for these
new bytes. The older 15-file permission is exhausted by publication 21b8ee4a and
does not authorize this delta. The denied separate agent-guide upload is not
retried. Main/project repository, HTTP/schema, UI/pin, real DB/provider, migration,
credential, domain and deployment remain out of scope.

C04-IDKEY: series[P/D].currentAttemptId=A but attempts[A].id=B, A!=B, with valid
actor/scope/CAS and matching person/demo/generation. Published 21b8ee4a validates
the row reached by key A without checking its stored id. Its later expiry and
active predicates compare B to A, skip that row, and return CONTINUE. At deadline
it leaves the corrupt current attempt in_progress. With another valid elapsed
series first, that other series can expire and commit partially while invalid
current context passes. This is not evidence of a working removal HTTP route.

The entire production-source correction is the extra consistency condition:

```diff
 const record = s.attempts[series.currentAttemptId];
-if (!record || record.personId !== studentId || key !== seriesKey(studentId, record.published.demoId) ||
+if (!record || record.id !== series.currentAttemptId ||
+    record.personId !== studentId || key !== seriesKey(studentId, record.published.demoId) ||
     record.generation !== series.generation) fail("RESPONSE_INVARIANT_FAILED", 500);
```

It runs in checkCurrentAttemptContext before any materialization/reconciliation,
does not repair/rekey data, and changes neither shared transfer maintenance nor
the active predicate. staff-http.ts remains exactly 16079 bytes/SHA256
`76dab2bc435a9d79a6983ec47c3800876856daeed3a806f45a7b33c8a65bb4e2`.

## New tests, independent oracle and trace limits

C04-IDKEY-BEFORE/EQUALITY/AFTER require technical failure, exact S0 and zero
maintenance-node set operations. C04-IDKEY-MIXED creates a second valid current
series through the existing synthetic student HTTP start/save flow, puts that
valid elapsed series/record first, and corrupts the other record id. It still
requires exact S0 and no partial maintenance. Existing matching-id controls
require wait before deadline and the explicit fixture expiry at equality.

The prior v2 canonical() oracle reused materializeElapsedAttempts and internal
reconciliation. That was a circular-oracle limitation: those tests established
consistency, not independent correctness of E(a). This correction removes both
helper imports from expected-state construction. expectedFixtureExpiry uses
only a lossless pre-call clone and explicit properties of the pinned fixture:
two questions 100/101, individual grading disabled, one saved correct answer,
earned 1/max 2/percentage 50 as exact bigint ratios, calculatedAt=now,
completedAt=original deadline, state/series revision+1, official current attempt,
and the stated existing gate counters/barrier. It also checks answer/deadline/
ordering/generation preservation and every unrelated field by full deep equality.
It does not call production expiry, grading, membership or reconciliation code
to generate expected state. No changed-field count is hardcoded.

write_paths is a before/after state diff, **not a transient write-operation
trace**. It cannot detect mutate-and-restore alone. Distinct C04 test counters
observe Proxy set operations only on the attempt map, series fields and review
gates; they are limited local operation observations, not global/DB tracing.
Identity/callback rejection also records separate invocation, external-writer,
clock and state-access counters. Their zero values and identity-first source
ordering support pre-execution rejection; they are not dirty writes followed
by rollback or inferred from an empty net diff.

Red provenance is immutable: v2 manifest
`87e6ed033439d3ced27231d0a2b09e399ccc6ed816f31ddcdbe3bfe44687edec`,
published 21b8ee4a, the original four-case C04 red run and the corrected six-case
red run. The six-case run has 2 positive controls PASS and 4 safety assertions
FAIL. One earlier mixed-case harness attempt omitted a setup token (401);
it is retained only as a harness failure, excluded from source-defect evidence.
The final mixed-case red run records real partial fixture maintenance. Nothing
in old approved evidence is edited or relabelled green.

## Existing callback-free contract retained

guardRemovalActiveTest(tx, studentId, decision, context) accepts only the module's
frozen CONTINUE/DENY_GROUP_REVISION/DENY_MEMBERSHIP_REVISION identities. Strict
identity comparison is first: no payload property/destructuring/spread/coercion/
await/log precedes it. Hostile getter, Proxy/revoked Proxy, callable, thenable
and copied/arbitrary 409 values fail technically without executing capabilities.
The former nextPolicy and injected reconciler functions are not accepted.

A singleton is neither authority nor freshness. The guard checks the verifier-
produced proof, current account/approval/roles, existing Admin/Owner roster
capability, group scope, retained target affinity and current group/member CAS
after locks and server time. CONTINUE cannot bypass stale CAS or an active
current attempt. A supplied denial hint must match the authoritative conflict.
Incomplete current person/demo/generation/key/id context fails closed.

Canonical maintenance uses existing internal functions. A recognized clean
CAS denial returns after E(a), so only maintenance may commit. CONTINUE means
only that this preflight does not block, never successful removal or permission
to skip later policy. Receipt handling and actual removal remain unimplemented.
Unstarted ready recovery is left unchanged for its separate open removal policy.
Started recovery keeps existing terminal semantics. No registered_at, cursor,
grant, bonus, new capability, wire DTO or background queue is added.

Exceptions/storage failures roll back technically; they are not clean denials.
Lost COMMIT response stays commit_unknown with no success/rollback claim or
automatic retry. The recording pool's committed/uncommitted simulations are not
real PostgreSQL COMMIT, RLS, isolation or persistence proof.

Trusted source-review preconditions remain: upstream verifier/provider-session
liveness, complete authoritative state, current server clock and all relevant
writers using the same transaction locks. The guard cannot authenticate a
public proof-shaped object, sandbox arbitrary caller code or undo external
effects performed before invocation. Production has no caller of this preflight;
current callers are synthetic tests. Transfer uses only the shared exports.

## Resume from GitHub without previous local files

1. Read root AGENTS.md. Use the lab repository/QA branch above, not the stale
   lab main or production `oybek-muminov/UniverAcademy`. Pin an exact commit;
   do not assume this local C04 fix has been uploaded. If the coordinator supplies
   a later approved commit, inspect its diff before replacing this baseline.
   Check your own attached cloud status, shell/file reads and GitHub read
   separately; connector access alone does not prove executor readiness. Do not
   reuse a previous environment ID or delete/replace a failed original task.
2. Read the base's membership-activity.ts, its tests, tests/backend/staff-fixture.ts,
   tests/backend/http-fixture.ts, staff-http.ts and the API contract. Published
   validation/history is under
   `qa-checkpoints/2026-11-09/backend-1a-callback-free-v2/` at 21b8ee4a. These are
   accessible GitHub inputs, not files required from another executor.
3. On 21b8ee4a apply only the condition above. Add the three malformed key/id
   deadline tests and ordered mixed-series regression described here. The expected
   invalid state is simply S0 plus an invariant error, not helper-generated E(a).
   For valid expiry use the explicit pinned fixture fields above. Keep hostile
   identity, authority/CAS, current-generation, recovery, repeated-expiry and
   commit_unknown cases. Do not copy old PASS to newly written bytes.
4. Node requirement is >=24 <25; known version 24.22.1. Use committed root and
   validator locks: `npm ci --ignore-scripts --no-audit --no-fund --cache /tmp/ua-backend-npm-cache`,
   then the same command with `--prefix tests/backend/validator/tooling`. This
   creates a new cache if needed, not a dependency on old /tmp files. Exact versions:
   @clerk/backend 3.27.0, jose 6.2.15, TypeScript 5.9.3, Ajv 8.20.0. A new environment
   can install these; existing symlinks or scratch artifacts are not needed.
5. Run from workspaces/univeracademy:

```sh
node --unhandled-rejections=strict --test tests/membership/removal-active.test.mjs tests/local-content-pilot.test.mjs tests/first-test/http.test.mjs tests/clerk-auth/domain-http.test.mjs
npm run typecheck
```

Current author result: 72/72 PASS (41 preflight including 4 C04 regressions plus
31 affected existing tests), zero skipped; typecheck exit 0. These are author
checks, not independent QA or closure of R1/C04/source/Mini readiness.

Optional UA_1A_TRACE_PATH writes JSON evidence to a path chosen in that agent's
own scratch directory; no prior /tmp path is required. Report source hashes,
exact diff, test counts and the before/after versus operation-counter boundary.
Only three source paths may differ from 21b8ee4a. Do not change staff-http.ts,
published v2 evidence, inventory, dependency locks, clients or Mini App guard.
Any new publication requires a new exact inventory and user authorization.

## Roles, scope and continuation decisions

Backend is the sole API owner; architecture controls scope and dot coordinates
messages. Current thread references: dot 01a1a66a-63e1-773e-a918-702b2292e0f7,
architect 01a1ac6c-1f1b-709a-a130-409097ce1007,
QA 01a1accc-f6d4-768d-9451-08b5f0801026,
Mini App 01a1aca7-495f-7199-ac3a-80bd9801f032.
Do not enter another agent's executor. QA's failed/offline revision 13 was
reported by the coordinator; author tests here are not that independent QA.

First product flow is physics, then mathematics. Supabase is database-only;
Clerk handles registration/verification/email; Brevo is not connected. Existing
form is test/backup and real Clerk form connects later. No new UI without user
agreement. Single-active-device restriction is student-only; staff sessions are
parallel. Existing Admin assignment A (manage_content plus group AND subject)
stays separate from roster, Teacher approved-subject content rights and Owner
authority stay unchanged. Rasch remains deferred; ordinary and nullable optional
statistical bonus rights/computation are not changed.

The inaccessible old Backend 29-file roster candidate remains NOT_RECOVERED.
Its manifest/51-test history is not a source backup. Broad roster/Teacher CRUD,
relational transfer/removal, original registration timestamp provenance/backfill,
cursor model and ready-recovery removal policy remain separate work, not this
one-condition correction. No real DB/migration/provider/device/deploy or load
proof is supplied. HTTP 409 mapping/response schema and Mini pin readiness stay
open; the existing guard still rejects staff-http.ts 16079 versus pinned 17079.
R1/C04 closure and source acceptance require independent review at a later exact
approved source; author PASS alone does not close them.
