# REMOVAL-DOMAIN-01 local review candidate

AUTHOR LOCAL EVIDENCE. Not independent QA. Nothing uploaded.

Base: c458d7b9867323adbd970e5732cad152dab01211
Base tree: b6d34db2c9430c36fe5604e9953be9d50497ab50
Repository/branch for context only: oybek-muminov/lab_univeracademy, qa/current-flow-20261106.
This directory is a verified source archive, not a Git checkout claiming a local branch HEAD. All 674 base files matched the exact remote Git blob IDs. Only the four assigned paths differ; final archive has 676 regular files.

## Domain behavior and boundaries

membership-removal.ts exports removeRosterMember(tx, proof, groupId, MemberWrite, idempotencyKey). tx/state and verifier-produced proof are INTERNAL trusted server values; this is not an HTTP handler or credential verifier. The future caller must load complete protected target/peer state and hold the established authority/membership/assignment/series writer protection through commit. No new protection/SQL protocol or production binding is supplied.

Current identity/enabled/approval and removal-specific capability/scope checks run first. Current visibility covers original group G and current affinity H. Teacher needs explicit grants; all_groups never substitutes. Owner/Admin precedence and existing transfer authority remain unchanged.

Receipt key is canonical actor + PUT + canonical group-members path + raw idempotency key; payload is the canonical typed MemberWrite. Matching receipt is detached historical data, returned before old CAS/guard/expiry/revocation. Later valid same-affinity re-add, epoch9 grant/recovery and an elapsed current generation2 recovery survive replay. Changed visible payload conflicts. Fresh removal still requires current affinity G.

For new commands the accepted removal-specific guard runs internally with its true CONTINUE singleton and one captured post-lock clock frame. It checks current context/C04/R03, materializes E(a), and derives CAS. Recognized CAS denial wins. Then inactive membership conflicts before active wait; equality/after preserves canonical expiry before the returned inactive denial. No accepted guard, authority helper, preflight port or HTTP route is edited.

Successful removal preserves affinity, canonical person/profile/history, attempts/answers/order/deadline/ordinary/bonus, official result and global normal usage. It advances group revision, membership revision and epoch once, makes membership inactive and profile active group null. Old unstarted assignment grants including scheduled future grants are revoked by epoch. revoked_unstarted_count counts only assignment grants (literal fixture:2).

Policy B clears current unstarted ready/future-ready recovery eligibility only on success, retaining window/anchor/generation/old-epoch/actor/time in recoveryRevocations. Waiting, clean denial and replay do not revoke a new right. Started active recovery waits. No transfer lapse helper is reused.

New removed effect cancels every target/old-epoch queued notice, including a completed assignment outside the affected barrier set. Sent/other-person/other-epoch notices remain. Old pending approvals become stale; completed decisions remain. Affected barriers count all protected peers, including off-group active/future-ready participants. Closed admission with zero unresolved completes the barrier; an open admission does not. Review release/status/window and bonus do not open/change.

The original transferred effect branch is BYTE-IDENTICAL to the accepted base; transfer-branch-parity.json records its digest. staff-state.ts changes only MembershipEffect's removed variant. Configured entries, transfer handler, accepted guard/authority, ports, contracts, client/types, dependencies/locks and Mini files are unchanged.

## Exact final verification

verification.json embeds complete original metadata for all final commands: argv, literal environment overrides, cwd, UTC, exits, logs and source/lock before-after measurements.

Final membership run:487 PASS =117 new domain +247 accepted membership +123 accepted shared-expiry.
Final affected staff/student run:39 PASS across local-content-pilot, first-test/http, persistent-http/http and enrollment/identity-staff.
Total across TWO test commands:526 PASS,0 FAIL,0 SKIP; typecheck exits0.
No Mini QA or unrelated broad auth suite was repeated.

All final before/after source/lock snapshots are the same 676-file snapshot, cdb3c145e1534a60fa02bddbcc0e648b6c96bb9d72772e653b5343616d18d6ee. No source changed during those runs. Four-file forward/reverse git apply verification ran after typecheck in distinct patch-replay directory; applied4 exact files, reversed2 baseline files and2 absent files. --whitespace=error-all checks passed.

The complete diff is candidate.patch. source-manifest.json binds exact final source/base/patch/run fingerprints. scope-verification.json proves 672 unchanged base files, no extra paths, original transfer-branch parity and unchanged frozen older packages.

## Literal oracles, measurement and evidence format

Expected fixture state is assigned explicitly; no candidate guard/scorer/canonicalizer/reconciler supplies it. The fixture independently sets group4->5, member revision/epoch7/7->8/8, count2, exact receipts/audit/notices/approvals/barriers and history sentinels. Successful expired attempts use literal1/2 and50% results. Peer counters, ready history, CAS-only E(a) and all-or-nothing partial failure are independently asserted.

Direct guard and effect invocation counters use debugger breakpoints at actual entry statements; async precise coverage is not substituted for direct invocation. The call-order ledger records post-lock clock, staff/target reads, receipt lookup, guard/effect entry and attempted writes.

Recording Proxy counts reachable JS set/define/delete attempts, including failed writes. It does not represent SQL operations or every possible JavaScript mutation. Partial notification fault shows12 attempts, ready-right fault15, and a fault after earlier expiry19; staged differs from S0 but recording-double committed state remains S0. Arbitrary409 exceptions, receipt/audit faults and overflow remain technical rollback, not recognized clean denial. Domain return is not COMMIT ACK or proof of real durability.

Native structuredClone cannot clone an observer Proxy. Test-only cloneObserved unwraps ONLY registered harness proxies then delegates to real native clone. Unknown proxies/functions still fail. Three additional plain-state controls use the ORIGINAL native structuredClone; their writes are explicitly NOT_INSTRUMENTED. The candidate never installs or depends on this shim.

case-results.json contains all117 final records and all recorded initial/staged/committed/expected JSON states. Repeated state objects are content-addressed in its included states dictionary; reconstructing every row was verified equal to the raw JSON tree. It is self-contained for the captured JSON values; the9.85MB raw file is a provenance reference, not a required runtime input. JSON serializes nonfinite numbers as null; the source literal specifies the NaN fault case. This format does not turn state digests into transient-operation traces.

## Original failure and intermediate provenance

domain-01:64 PASS/5 FAIL, all five due observer Proxy/native structuredClone incompatibility in ready/replay paths. Original log, run metadata, trace and first source/lock snapshot remain untouched. history/harness-red-green-mapping.json binds these five IDs to domain-02 green and final records. The three production files were identical between domain-01 and domain-02; only harness compatibility/calibration/native controls changed. No plain-state product failure was demonstrated by this red run.

The exact initial test bytes are not claimed archived in the review selection; its size/hash, original command/UTC/log and outcomes are preserved. Historical exact harness replay therefore has a limitation; final source/runtime reproduction does not require those initial bytes.

domain-02..05 and other intermediate successful logs retain their actual byte bindings. Architectural clarifications changed the provisional inactive/replay rules before finalization. EOF-only normalization and the valid re-add/started-recovery replay fixture refinement are recorded; only final_runs in verification.json provide the final-byte PASS claim. Old successful runs are not relabelled.

## Review inventory and remaining gates

local-review-inventory.json is local metadata only, excluded from its own digest list. It identifies four source files and the coherent supporting local artifacts. It is NOT upload approval or a publication. Full raw accepted regression traces, intermediate source snapshots/logs, complete frozen before/after package rows and assembly scripts remain local.

Frozen original packages: shared393 files, REMOVAL-AUTH389 files, reconciled shared697 files all unchanged. No old inventory was overwritten.

New independent QA is pending. R1 integration OPEN; removal HTTP/real-DB E2E BLOCKED. Real authoritative SQL projection/writer protection/locks/isolation/RLS/durability, live provider, migrations/deployment and Mini compatibility are NOT_RUN here. No HTTP wiring/final removal route or preflight port expansion is implemented. No external write was attempted.

