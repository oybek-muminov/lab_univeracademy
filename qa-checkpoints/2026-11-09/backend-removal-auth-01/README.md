# REMOVAL-AUTH-01: local removal-specific authorization

Candidate: `REMOVAL-AUTH-01-local-v1`.
Base: `oybek-muminov/lab_univeracademy` at
`b3d86559a743e13dcca65f2f6d227227ef297abf`.
Base tree: `a77d06f483eb662913a5c7924ba6ed6040555475`.
Proposed publication branch only: `qa/current-flow-20261106`.

No publication has been attempted. This is author local evidence, not independent
QA or production acceptance. No real provider/DB, migration, deployment, PR/merge,
new route, final membership removal, receipt implementation or Mini repin/test.

## Exact source scope

Four files relative to the laboratory repository:

1. NEW `workspaces/univeracademy/supabase/functions/univeracademy-api/removal-authority.ts`
2. MODIFIED `workspaces/univeracademy/supabase/functions/univeracademy-api/membership-activity.ts`
3. MODIFIED `workspaces/univeracademy/supabase/functions/univeracademy-api/membership-preflight.ts`
4. MODIFIED `workspaces/univeracademy/tests/membership/preflight-adapter.test.mjs`

`source-manifest.json` binds final byte sizes/SHA256, exact baseline hashes and the
four-file `candidate.patch`. All other 346 archived baseline paths match base.
The isolated working copy is an archive of root AGENTS.md and the project subtree,
not a new git commit or a full repository checkout. All 349 original archive blobs
were compared to the exact remote base tree; `base-git-blob-parity.json` records
the matched paths, byte counts, SHA256 and Git blob IDs. Package/lock files are
included in before/after source snapshots. No dependency or lock was changed.

## Entry and authority behavior

Legacy `guardRemovalActiveTest` and `createMembershipPreflight` retain Admin/Owner
behavior and Teacher-only FORBIDDEN/403, including when capability is absent.
Separate `guardRosterRemovalActiveTest` and `createRosterRemovalPreflight` use
removal-specific authority. Each export hard-wires its private implementation
choice. There is no request/options/policy selector, role substitution or caller
continuation/reconciler callback. Unknown command fields are rejected before
verification; unrelated options fields do not change the selected entry.

After current identity, enabled and approval checks, Owner keeps its existing
authority. Admin needs manage_roster and current group scope. Teacher-only needs
manage_roster and an explicit current target-group ID in group_ids; all_groups,
subject approval and manage_content are not substitutes. Mixed roles use Owner,
then Admin, then Teacher precedence. Other roles receive FORBIDDEN/403.

Teacher/Admin without capability receives CAPABILITY_REQUIRED/403 before group
or target visibility. Missing Teacher grant receives NOT_FOUND/404. Current
identity, approval, disabled-account and expiry mappings are preserved. The new
authority helper has an explicit currentStaff precondition, enforced by both
public entry paths; it is not a credential verifier by itself.

Both guard exports begin with literal singleton identity checks before clock,
state, context or authority access. They then use the same private domain body:
current rights, target privacy, group-before-membership CAS, C04/R03 validation,
canonical elapsed maintenance and active-test waiting. The adapter rechecks
current rights after prepareAndRefresh and calls the corresponding guard with
the module's real CONTINUE singleton. Its existing port/receipt contract and
immutable E(a)-only flush/transaction behavior are unchanged.

Inactive same-affinity preflight may CONTINUE; it is not the future final command
and does not implement MEMBERSHIP_STATE_CONFLICT/409. Historical receipt replay,
IDEMPOTENCY_CONFLICT and final removal are not implemented. Product B only
revokes unstarted recovery atomically with future successful final removal.
Wait, clean denial and CONTINUE preserve those rights in this candidate.

## Final affected checks

Cwd for both recorded commands:
`/tmp/univeracademy-removal-auth01-pkdmbgxh/repo/workspaces/univeracademy`.

```sh
UA_R1_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/affected-03-cases.json UA_1A_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/affected-03-legacy-traces.json UA_R03_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/affected-03-legacy-r03-traces.json npm_config_cache=/tmp/univeracademy-removal-auth01-pkdmbgxh/npm-cache npm_config_update_notifier=false node --unhandled-rejections=strict --test tests/membership/preflight-adapter.test.mjs tests/membership/removal-active.test.mjs
```

UTC `2026-11-09T19:40:28.471703+00:00` to
`2026-11-09T19:40:31.528683+00:00`, exit 0:
**247 PASS / 0 FAIL / 0 skipped**. This is 97 new authorization cases, the existing
91 adapter/port cases and 59 unchanged guard tests. Log SHA256:
`a5456c81f18e4f6fa3c8034e2de584a97093f60dabc5fba2c80a4a41efdf8092`.

```sh
UA_R1_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/typecheck-final-cases.json UA_1A_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/typecheck-final-legacy-traces.json UA_R03_TRACE_PATH=/tmp/univeracademy-removal-auth01-pkdmbgxh/evidence/typecheck-final-legacy-r03-traces.json npm_config_cache=/tmp/univeracademy-removal-auth01-pkdmbgxh/npm-cache npm_config_update_notifier=false npm run typecheck
```

UTC `2026-11-09T19:41:22.372152+00:00` to
`2026-11-09T19:41:24.585480+00:00`, exit 0. Log SHA256:
`e4013abb72157734e39e32f023561333a9b407824cb68b45acb8a18f78d576cc`.
The trace environment variables are recorded but tsc creates no case traces.
Both complete run metadata records are embedded unchanged in verification.json.
Their separate local originals are retained without proposed publication.

All 350 final source/lock fingerprints were equal before/after both commands:
`804b1ed57a2dbae817c0ba4cadab21e3a057a58a1e08513eac08cc3bc3886509`.
Read-only modes were set on the four final candidate files after these checks;
the recorded hash equality, rather than mode alone, proves byte stability.

## New controls and measurement

| Group | Cases | Oracle |
|---|---:|---|
| New factory / direct guard authority matrix | 26 | Explicit Teacher grant/capability, privacy/capability precedence, no all_groups/subject/content substitution, mixed roles and current account state |
| Legacy factory/direct guards | 6 | Teacher denial with/without capability; existing Admin/Owner active-test behavior |
| Identity-first | 12 | Both exports reject getter/Proxy/revoked/callable/thenable/lookalike decisions with all payload/clock/state/context hooks zero |
| Factory input/mode | 3 | Invalid command before verifier; no production/default mode |
| Options cannot select policy | 2 | Fake policy/role/guard options change neither entry nor authority |
| Post-wait rights/account changes | 4 | Revoked grant/capability/approval and disable, before guard/maintenance/flush |
| Proof expiry | 4 | Equality/after for Teacher and Owner+Teacher before guard |
| Target privacy | 4 | Missing/disabled/incomplete/foreign-affinity target; no maintenance |
| Inactive preflight | 1 | CONTINUE preserves S0; no final-removal409 inferred |
| Shared transfer/authority | 3 | Teacher transfer HTTP/RAM denial with both grants; unchanged Admin/Owner shared-authority controls |
| Domain / transaction through Teacher entry | 29 | C04/R03 before/equal/after and four insertion orders, corrupt-before-CAS, clean CAS, literal expiry, E(a), rollback and both commit_unknown variants |
| Ready-right preservation | 3 | Wait, denial and CONTINUE keep future unstarted recovery unchanged |

The existing 91 adapter cases and 59 guard tests keep their behavioral assertions.
Only necessary source fingerprints, public-entry breakpoints and evidence base
metadata were changed in their harness. No accepted oracle was weakened.

Debugger breakpoints are bound to each public guard's full identity-check line.
The paused frame name must be exactly guardRemovalActiveTest or
guardRosterRemovalActiveTest. guardEntries records which real export ran and
directGuard counts those actual invocations; V8 async function entry counts are
not used as a replacement. Factory success verifies frame.return immediately
precedes guard.enter in the external-port ledger.

The state observer is attached only when the paused decision is one of the three
real singleton identities. This keeps hostile-decision state/clock/context and
payload hooks at zero. Its recursive Proxy observes reachable JS set,
defineProperty, deleteProperty, setPrototypeOf and preventExtensions operations
after probe attachment. Attachment itself is excluded. A separate Proxy records
port-draft write attempts. Snapshot/net-delta comparisons are not transient traces.

The Teacher literal-expiry positive control observes roster direct entry 1,
maintenance 1, reconcile 1, guard write attempts 7, port write attempts 13 and
flush 1. Same-value gate assignments count as attempts. C04/R03 negative controls
enter the roster guard once but maintenance/reconcile/writes/flush remain zero.
Post-wait factory denial reaches neither guard. The independent literal oracle
uses two questions and one correct answer: earned1, maximum2, percentage50;
expected expiry/revisions/gate state are not copied from candidate helpers.

Direct-guard cases are labeled DIRECT_DOMAIN_GUARD_NO_SQL_TRANSACTION. Their
error-side committed S0 is a caller-rollback model, not a real transaction claim.
The existing transfer HTTP/RAM and pure shared-authority tests are separately
labeled. acknowledgements counts caller success resolutions; the commit.ack
ledger separately records the double transaction acknowledgement.

case-results.json contains all 188 adapter case records with original UTC,
command/source fingerprints, outcomes, exact entry, ledger, expected/actual
staged/committed state and separate observations. State pooling preserves every
JSON value and state-map insertion order; expansion of all records was checked
against the unchanged 13.6MB local raw trace. It is not a raw-whitespace copy.
The 52 legacy supplementary net-diff records and 18 legacy R03 instrumented cases
are also retained. Their measurement limits remain explicit.

## Replay, history and unresolved boundaries

Patch replay runs only in a separate local tree. It starts with the exact three
base file byte sequences and one absent new-helper path. Apply/check with
whitespace=error-all, applied four-file byte parity, reverse/check, restoration
of three baseline byte sequences and the new path's absence are recorded in
replay-verification.json with explicit cwd, argv, UTC and exit. This happened
after typecheck; the test/typecheck source copy was not mutated by replay.

Original red runs remain unchanged:

- affected-01: imported decision alias D collided with existing demo ID D;
  adapter module failed to parse, 59 guard tests PASS and one test-module FAIL.
- affected-02: debugger selector matched two public identity checks plus a
  private CAS check (3 != 2); setup failed before adapter cases, again 59 guard
  tests PASS and one test-module FAIL.

Only the test alias and exact breakpoint selector were corrected. All three
production files have identical hashes across these two red runs and final
green. Original logs and metadata identify their own test hashes/commands/UTC;
they are not overwritten or relabeled as final acceptance.

The shared port contract, staff-state authority, staff-http transfer caller,
shared expiry, SQL/configured/production entries, HTTP/contracts, packages/locks,
Mini pins and historical candidate/evidence bytes are unchanged. The changed
guard and new helper create an unaccepted dependency/pin delta for later review;
Mini was not repinned or retested. No claim of combined readiness is made.

Truthful exhaustive projection, current live mapping/revocation, common stable
grant/authority/peer-writer protection and real SQL locks/RLS/CAS/durability remain
unproven port obligations. R1 integration OPEN; final removal HTTP/DB E2E BLOCKED.
Independent QA for this exact new candidate is pending. A new exact user approval
is required before any publication of the proposed inventory.
