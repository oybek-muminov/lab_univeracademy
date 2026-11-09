# Removal 1A callback-free preflight — new local candidate

Base: `e25aa562198cde41eb890fb541a538722117f8a0`, repository
`oybek-muminov/lab_univeracademy`, remote baseline branch
`qa/current-flow-20261106`. Local branch: `backend/continuation-20261109`.
PROVISIONAL / NOT ACCEPTED / NOT UPLOADED. Author checks are not independent QA.

This is only the active-test domain invariant, not removal HTTP or a working
removal feature. Existing unsupported removal 503 is not a 1A PASS. The old
29-file roster candidate remains NOT_RECOVERED and its 51 tests are not reused.
All supplied architect, previous Backend, QA and Mini App addenda were read;
their denied docs publication was not retried or claimed as uploaded.

## Red provenance and changed classification

Previous four-file manifest:
`5675512dabf829249c39534d7ae106cb651c085ac66a36cbcd32a78c3191dbfc`.
Its 48 tests passed, but adversarial R1-DIRTY later exposed six continuation
writes committed with a 409 denial. The original 13-case scratch run has 12 PASS /
1 FAIL and remains red. Snapshot equality misses write-and-restore; a later
Proxy misses previously captured raw aliases and captured external writers.
The original manifest, patch, logs, oracle, boundary probes and all four red
source files are preserved outside the repository. They are not overwritten
or relabelled as a successful dirty-denial rollback test.

The approved correction removes the continuation capability. The old callback
ABI now rejects before callback/reconciler execution and before maintenance.
No six dirty writes are first applied and then rolled back in this new test:
they never execute. The API/classification change is explicit.

## Interface, identity first and fresh context

`guardRemovalActiveTest(tx, studentId, decision, context)` takes a direct unknown
decision value and a trusted server context. It accepts only exact identities
of the module-created frozen objects:

- `REMOVAL_DECISION.CONTINUE`
- `REMOVAL_DECISION.DENY_GROUP_REVISION`
- `REMOVAL_DECISION.DENY_MEMBERSHIP_REVISION`

The first operation is strict identity comparison. There is no prior parameter
destructuring, property read, spread, stringify, coercion, await or payload log.
Lookalikes/arbitrary 409, getter objects, ordinary/revoked/callable Proxies,
callables, thenables and coercible objects reject with technical invariant
failure without invoking their hooks. Both old function arguments are removed.
Canonical reconciliation uses the existing internal module, not an injected
writer. This eliminates the callback write channel; it does not sandbox code
that the caller executed outside the guard.

Context fields are verifier-produced `proof`, `groupId`, `expectedGroupRevision`
and `expectedMembershipRevision`. The singleton grants no authority/freshness.
After locks, the helper reads trusted server time, checks current staff proof,
account/approval/role, the existing Admin/Owner roster capability and current
group scope, and verifies the target's retained affinity against the group.
It derives group then member CAS from the current authoritative rows. CONTINUE
with a stale CAS returns the internally derived recognized denial. An explicit
denial hint must match the authoritative first conflict or fails technically
before maintenance. No arbitrary 409 object is promoted to a recognized denial.

Authoritative current target series must resolve to the matching person/demo/
generation record. Incomplete or inconsistent current context fails closed.
Historical generations and foreign-person records are not completed or changed.
The existing shared expiry/predicate exports used by transfer retain their
previous behavior; `staff-http.ts` stays byte-identical to the red candidate.

## Outcomes and transaction semantics

- `wait_for_active_test`: current started normal/recovery attempt is
  `in_progress` with `now < deadline`. No continuation executes.
- `recognized_denial` with group/member revision reason: only canonical E(a)
  and its existing derived gate maintenance commit. The field count is not
  hardcoded; tests compare full lossless state against canonical maintenance.
- `continue_existing_policy`: this active-test preflight does not block. It is
  neither successful removal nor permission to skip later policy/CAS checks.

At/equal/after deadline, existing completion preserves answers, ordering,
generation and original deadline and records the ordinary result/official
attempt once. Existing terminal semantics for started recovery are retained.
Unstarted ready recovery, including an elapsed ready window, is left unchanged
for the separately undecided removal policy. No grant, receipt, audit, identity,
registration timestamp, cursor, bonus or queue is introduced by this guard.

Unrecognized callback/payload is a pre-execution contract violation, not a clean
business denial. Actual maintenance/storage exceptions propagate and roll back
the enclosing transaction. The actual coordinator keeps a failed COMMIT reply
as 503 commit_unknown/discard with no ACK, rollback claim or automatic retry.
Caller-visible outcomes require confirmed COMMIT. Real COMMIT behavior has not
been tested; before/after persistence in the tests is only a recording double.

## Enforced versus source-reviewed boundary

Mechanically enforced: decision identity before all other reads; no callable/
thenable/getter payload execution; no injected continuation/reconciler; current
auth/scope/CAS/current-attempt checks; only existing internal maintenance writes.
The state trace covers the whole state losslessly with structuredClone and deep
equality; changed JSON pointers are supplementary evidence, not a nine-field cap.

Source-review contract: proof is actually verifier-produced with required
upstream session-liveness checks, the transaction
port supplies locked authoritative complete state and a fresh server clock,
authorization/revocation writers use the same locks, and the existing internal
reconciler remains free of external I/O. The helper cannot authenticate an
arbitrary proof-shaped object or undo an effect already performed by a caller.
Actual relational flush/constraints/RLS/locks need separate integration proof.

Caller inventory: production has no caller of this preflight. Calls are limited
to its test adapter, hostile-argument controls and the recording-coordinator
harness; none uses real writer/provider I/O. Transfer imports only the shared
expiry/predicate exports. Final removal/receipt handling remains unimplemented.

## Verification and remaining work

```sh
UA_1A_TRACE_PATH=/tmp/univeracademy-backend-20261109/removal-active-callback-free-v2/accepted-traces.json node --unhandled-rejections=strict --test tests/membership/removal-active.test.mjs tests/local-content-pilot.test.mjs tests/first-test/http.test.mjs tests/clerk-auth/domain-http.test.mjs
npm run typecheck
```

New preflight selection: 37 tests. Affected regressions: 10 content-pilot,
11 first-test and 10 Clerk domain tests. Final affected run: 68/68 PASS,
zero skipped, typecheck exit 0, diff/whitespace PASS. Final raw logs, source
manifest, full patch, byte-parity replay and write traces are in the local
evidence folder shown above. Source changes are limited to this module, its
tests and this document; the fourth baseline-diff path is the unchanged red
`staff-http.ts` extraction. Root package/lock, API contracts/clients, Mini App,
Backend191 checksum inventory and guard are unchanged.

The Mini guard still rejects staff-http.ts 16079 versus pinned 17079 bytes. It is
not bypassed, softened or repinned. Combined Mini QA is BLOCKED until separate
source publication coordination and UI-owner repin; this candidate is not
deployed or independently accepted.

No 409 mapping/response schema is installed. The earlier proposed
ACTIVE_EXAM_OR_RECOVERY mapping remains unaccepted and requires its own review.
NOT_RUN: removal HTTP/Teacher CRUD/relational transfer or removal, actual
PostgreSQL SQL/constraints/RLS/isolation, real providers/devices, browser/deploy
and capacity. Ready recovery removal, registered_at, cursor and automatic queue
remain open/out of scope. No commit/upload/push/PR, real DB/migration/provider/
credential/domain or deployment action was performed. No approval request was
started by this agent.
