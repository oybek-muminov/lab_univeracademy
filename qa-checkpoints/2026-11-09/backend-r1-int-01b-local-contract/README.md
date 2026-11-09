# R1-INT-01b: local explicit-port preflight candidate

Base: `oybek-muminov/lab_univeracademy` at
`9dee2eaeb9e2c4833ab3c1f03a06e387121f7b17`.
Proposed branch only: `qa/current-flow-20261106`.
All artifacts remain local. No commit, upload, external write, real provider,
database, migration, deployment or Mini test/repin was performed.

Exactly three NEW implementation paths, relative to the lab repository:

1. `workspaces/univeracademy/supabase/functions/univeracademy-api/membership-preflight.ts`
2. `workspaces/univeracademy/supabase/functions/univeracademy-api/storage/membership-preflight-port.ts`
3. `workspaces/univeracademy/tests/membership/preflight-adapter.test.mjs`

The complete diff is `candidate.patch`; all three paths are absent at the base.
`source-manifest.json` binds their sizes/SHA256 to this patch and base.
The original accepted guard, shared expiry, staff HTTP, existing loaders,
contracts, package/locks, Mini pins and historical evidence remain unchanged.
The working copy is an isolated exact-base archive, not a new git commit.

## Behavior and boundary

The adapter accepts only credential, student/group IDs and expected group and
membership revisions. Trusted verifier/mapping and transaction ports are bound
at construction. Only explicit `local_contract` mode works; no production or
default binding exists. Server-verified canonical identity and a fresh protected
frame are required. Current authority, proof expiry and provider liveness are
checked before coverage and the accepted guard.

Coverage checks bind transaction/protection/frame/scope, separate executed empty
enumerations from missing queries, and check all nine row collections plus
target/assignment/participant/recovery references. Off-group peers are included
for gate calculation and never returned in the adapter outcome. No port operation
is awaited between the final frame and guard invocation. The detached guard state
is never exposed as a mutable continuation or external writer.

Only a deeply frozen E(a) delta can be flushed: canonical attempt completion,
ordinary/revisions, corresponding series completion/recovery markers and gate
CAS fields. Empty E(a) skips flush. Clean recognized CAS denial can commit E(a).
Other guard/loader/flush/storage faults take the port's technical rollback path.
COMMIT-ACK loss has no success or automatic retry: committed and uncommitted
double variants both return `commit_unknown/503`. Lost rollback ACK discards the
double connection and does not claim confirmed rollback.

This is Admin/Owner internal preflight only. Teacher authorization is not expanded.
`CONTINUE` means this guard did not block; it is not final removal permission.
Product answer B applies to future successful final removal. This adapter
preserves unstarted ready-recovery rights for wait, denial and CONTINUE.

## Final recorded checks

Both commands ran sequentially, with cwd:
`/tmp/univeracademy-r1-int-01b-9dg4wbqf/repo/workspaces/univeracademy`.

```sh
UA_R1_TRACE_PATH=/tmp/univeracademy-r1-int-01b-9dg4wbqf/evidence/frozen-final-cases.json npm_config_cache=/tmp/univeracademy-r1-int-01b-9dg4wbqf/npm-cache npm_config_update_notifier=false node --unhandled-rejections=strict --test tests/membership/preflight-adapter.test.mjs tests/membership/removal-active.test.mjs
```

UTC: `2026-11-09T17:30:24.090710+00:00` to
`2026-11-09T17:30:26.089327+00:00`; exit 0.
150/150 PASS, 0 FAIL, 0 skipped: 91 new adapter/port controls and 59 unchanged
accepted-guard regressions. `frozen-final.log` SHA256:
`3923885a73dcb6a19e955735348f90d5c1f9054443b8e94a556e8b390fa7e685`.

```sh
UA_R1_TRACE_PATH=/tmp/univeracademy-r1-int-01b-9dg4wbqf/evidence/frozen-typecheck-cases.json npm_config_cache=/tmp/univeracademy-r1-int-01b-9dg4wbqf/npm-cache npm_config_update_notifier=false npm run typecheck
```

UTC: `2026-11-09T17:30:26.281944+00:00` to
`2026-11-09T17:30:28.179748+00:00`; exit 0.
`frozen-typecheck.log` SHA256:
`e4013abb72157734e39e32f023561333a9b407824cb68b45acb8a18f78d576cc`.
The typecheck trace environment variable is recorded for completeness; tsc does
not emit a cases file. Metadata contains actual argv, cwd, timestamps and hashes.

All 349 archived baseline-plus-candidate file fingerprints are identical before
and after each final run. All 346 baseline paths still match exact base bytes.
The shared snapshot is `frozen-final-source-before.json`, SHA256:
`6c021cf6ceff91e45e4e9daee184463f8aa88c2f6cf9d746bf0b7e2fcd016f06`.
Local before/after copies remain available. Read-only file modes were set before
the final commands; hash parity, rather than file mode alone, is the evidence.

Patch apply/check and reverse/check ran afterwards in a separate empty scratch
cwd, `/tmp/univeracademy-r1-int-01b-9dg4wbqf/patch-replay`. All three applied files
matched final source bytes; reverse restored their absence. Exact operations,
cwd, timestamps and results are in `replay-verification.json`. There was no
concurrent patch mutation of the typecheck/test checkout.

| Gate | New cases | Coverage |
|---|---:|---|
| L1 | 13 | Strict input, real offline JWT verification, forged key, bindings/mode, immutable scope |
| L2 | 9 | Post-wait mapping/liveness/authority/clock, revocation/disable/scope/expiry including equality |
| L3 | 22 | Receipt/row/reference failures, executed empty enumeration, explicit absence, off-group active/future-ready peers |
| L4 | 18 | C04/R03 before/equal/after plus independently permuted mixed orders; clean CAS denial; Owner/Teacher boundary |
| L5 | 15 | Literal E(a), recovery completion, forbidden fields, immutable flush delta, unsafe revisions |
| L6 | 6 | Loader/flush/CAS/partial faults, arbitrary 409, lost rollback ACK |
| L7 | 5 | Both COMMIT-ACK loss variants, ACK ordering/binding and callback reentry |
| B | 3 | Unstarted ready rights preserved for wait, CONTINUE and denial |

## Case evidence and instrumentation limits

`case-results.json` contains all 91 new cases, original per-case UTC/source pins,
outcomes, call ledger, literal expected state, guard staging, port staging,
committed double state, direct guard invocation, flush and write records. It
deduplicates repeated states through content-addressed references. The complete
raw JSON is preserved locally as `frozen-final-cases.json`; the pooled dataset
records its SHA256 and has been expanded and compared to every original JSON
record. State key insertion order is preserved. This transformation is not a
new test run or a byte-identical raw-whitespace copy.

Direct guard invocation is measured by a debugger pause at the unmodified
accepted guard's first identity-check line. A test-only recursive Proxy is
attached to that invocation's state argument. It records reachable JS `set`,
`defineProperty`, `deleteProperty`, `setPrototypeOf` and `preventExtensions`
attempts after attachment; the attachment itself is excluded. Separate proxies
record the transaction double's draft writes. Named function precise coverage
measures maintenance/reconcile calls. Direct guard invocation is not inferred
from async V8 coverage entry counts. No guard source bytes are instrumented.

The positive literal-expiry control observes direct guard 1, maintenance 1,
reconcile 1, seven guard JS write attempts and thirteen port-draft write attempts.
Same-value gate writes are counted. These two layers are not summed as physical
DB writes. C04/R03 negative controls have direct guard 1 but maintenance,
reconcile and guard writes 0. Coverage/input/authority failures occur before
guard, except explicit absent target deliberately reaches guard's 404 check.
Ten forbidden-delta cases invoke the pure delta whitelist directly; they are
labeled `DELTA_WHITELIST_UNIT_NOT_GUARD_RUN`, not claimed guard integrations.
Factory rejection tests assert 503 without calling the returned operation; no
caller outcome is invented where the raw case has none.

Expected scoring, expiry, gate and preserved states are literal fixture values,
not output of the candidate guard/scoring/expiry helpers. Snapshot comparisons
and the production delta whitelist are net comparisons, not transient traces.
The test probe does not observe SQL, a hidden external writer, or effects before
its attachment. No live provider/real DB COMMIT or rollback was exercised.

## Preserved failure and unfinished obligations

The first focused run failed (82 PASS/1 FAIL plus post-test inspector errors).
Its test-only pause listener awaited evaluation before sending resume, which
outlived the paused callback. The listener now dispatches evaluation and resume
synchronously and separately captures promise errors. Adapter and port bytes
were identical between focused-01 and focused-02. Original red log/run metadata
and traces remain unchanged; history is listed in `verification.json` and
`history-notes.txt`. Intermediate green runs are not attributed to final bytes.
An initial ad-hoc typecheck exit0 lacked UTC/log capture and is not release
evidence; the recorded final typecheck is the release check.

These are AUTHOR local-contract tests, not independent QA. Trusted ports still
owe truthful exhaustive projection, a stable protection protocol across all
authority/peer/membership writers, current provider/mapping data and real
PostgreSQL isolation/locking/RLS/CAS/durability. A consistently lying/omitting
trusted port is not disproved by internal receipt checks. No SQL implementation
or production default is supplied. R1 integration remains OPEN; final removal
HTTP/DB E2E remains BLOCKED. No new HTTP mapping/schema or removal mutation exists.

The local publication inventory lists exact source/evidence paths and proposed
destinations, separately from local-only originals. The inventory itself is
excluded from the proposed package and does not include its own hash. New exact
user approval is required before any publication.
