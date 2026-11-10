# REMOVAL-HTTP-LOCAL-01-r2

FINALIZED LOCAL AUTHOR CANDIDATE. NOT UPLOADED. NOT INDEPENDENT QA ACCEPTANCE.

Base: f5c1446fd6820119e9d070cd58643af127fe277b
Tree: 2db3c4803b8e5e6489b4e760b1e0e679d9da66dd
Repository/branch proposal only: oybek-muminov/lab_univeracademy, qa/current-flow-20261106.

R2 follows the coordinator's relay of architect turn01a1c433-ccab-764d-a7c0-706f81f5adc5. The two exception oracles are resolved. Only the two new allowed source paths differ from the accepted base. No existing entry, configured handler, admission, transfer, domain command, authority/guard, storage port, dependency/lock or Mini pin changed.

## Local handler

createMembershipRemovalHttpHandler composes only explicit local_contract StaffTransactions, verifier callback, schema validator and the accepted full STAFF_CONTRACT_SHA. Missing/invalid binding/default/production mode503. No store/provider/SQL/production fallback or endpoint registration exists.

Only PUT /api/v1/admin/groups/{group_id}/members is mapped. Current post-lock identity/approval/capability/scope checks precede parser/schema/key validation; accepted removeRosterMember then owns target/current-affinity privacy, receipt, CAS/expiry/inactive/wait and B semantics. Existing parser fractional-lexeme protection, integer-equivalent forms, duplicate-key behavior, UUID normalization and canonical receipt identity remain.

MemberWrite active is not filtered before receipt logic: visible fresh active command422; historical removed receipt same key/changed status409. No admission/re-add/transfer is invoked.

Removed/replayed200 {data: MembershipMutation}; returned clean denial409; returned wait409 ACTIVE_EXAM_OR_RECOVERY. There is no queue or automatic mutation retry. All responses use no-store and fresh error request IDs. Tokens/stacks/peer state are not emitted.

## Final exception oracles

Success MembershipMutation validation occurs INSIDE the transaction callback. False throws RESPONSE_INVARIANT_FAILED500 before COMMIT; a thrown ApiFault keeps its code/status, unknown error becomes INTERNAL_ERROR500. These are exceptions, not clean returned denial outcomes.

Only a RETURNED clean denial/wait proceeds through the transaction Promise/ACK boundary before HTTP409. A THROWN ApiFault409 also renders409 but does not imply commit: the callback threw and the recording transaction follows rollback. Tests distinguish the ledger/control flow rather than inferring transaction success from the HTTP status.

Rollback ACK loss is not separately observable through existing StaffTransactions/driver. The original error mapping is retained; ledger records lost ACK/discard. Those cases deliberately omit committed/expected_committed fields and do not assert committedS0 or confirmed rollback. model_only_committed_snapshot is private fixture knowledge, not a handler/durability guarantee. This uncertainty is never renamed commit_unknown.

Both committed/uncommitted COMMIT-ACK-loss variants use StorageUnavailable(commit_unknown), return503 SERVICE_UNAVAILABLE, with no success, retry or rollback confirmation. A response-construction failure AFTER transaction resolution does not undo the committed command; a separate control confirms this.

The trusted composition still owes current mapping/provider liveness/rights/clock after waits, exhaustive target/peer/recovery projections and stable protection through transaction completion. This local generic interface does not establish those real-world guarantees.

## Actual final-byte checks

172 new HTTP cases PASS.
117 unchanged accepted removal-command regressions PASS.
29 focused first-test/persistent-http/enrollment staff/student regressions PASS.
Total318 author tests; fail0, skip0. Typecheck exit0.

Exact command/cwd/environment/UTC/exit/count/log fingerprints are embedded in verification.json. Each of the four final runs has the same692-file source/lock before/after content:
f1bd3736f17188d0758abcf16660d099cb287a3a1099710502c3369e6574435a.

Two-file forward/check and reverse/check replay ran in a separate directory after typecheck. Four commands exit0; applied bytes match the source manifest, reverse removes both added paths, all690 accepted blobs remain identical. This is local Git patch parity, not SQL or independent acceptance.

## Coverage and measurement

Literal expected states/envelopes cover schema/key/routing, actual offline RSA JWT verification, current/post-wait rights and proof expiry, Teacher/Admin/Owner/privacy, historical replay across current affinities, valid re-add/new epoch/regrant preservation, stale CAS, inactive-before-wait, active/recovery wait, B/history/notices/approvals/peer barriers, C04/R03 before/equal/after deadline, canonical E(a)-only clean denial, fault/rollback/ACK uncertainty and detachment through the recording store.

Direct domain/guard/effect counters use debugger entry breakpoints, not async V8 coverage. The Proxy records reachable set/define/delete attempts, including failing attempts; raw aliases are not exhaustively observed. Net state snapshots remain distinct. Four native/plain success/replay/E(a)/rollback controls mark writes NOT_INSTRUMENTED. The test-only clone shim unwraps only registered observer proxies before real native structuredClone; unknown Proxy/function controls still fail.

ACK-loss tests observe one verifier, transaction, direct domain and COMMIT attempt. The retries field is an annotation, not a measured retry hook.

case-results.json contains172 final rows, four R2 fixture-failure rows and four historical superseded-oracle rows. All recorded state values reconstruct from its included72-state dictionary using SHA256(json.dumps(value,sort_keys=True).encode()) references. Case identity is (group,case_id); each group carries its actual source/run binding. It preserves captured JSON trees, not JS identity/prototype or unobserved mutations. Large raw traces remain local provenance references, not required inputs for the included captured states.

HTTP here means in-process Fetch Request/Response. Existing affected regression listeners use localhost and statement doubles. No new TCP/TLS/CORS or production endpoint was activated.

## Original failures and reclassification

1. Original v1 http-01 failed at module startup because the test pinned generated staff-openapi.json to the full contract's SHA. This was a harness pin-path mistake; no HTTP scenario ran. Exact failed test/handler and original metadata/log are retained.

2. Original v1 http-03 had151PASS/4FAIL against a provisional503 oracle for thrown ApiFault409. Its actual409/technical rollback behavior is consistent with the FINAL architect mapping. The earlier product-defect classification is superseded, not silently edited. The reported v1 subsequently remapped these errors to503 and unknown errors to503; R2 corrects that reported draft to final ApiFault passthrough/unknown500. Returned clean outcomes still commit only their accepted domain transitions.

3. First R2 run had168PASS/4FAIL because custom injected ApiFault error codes were outside the existing Error.code enum. HTTP passthrough matched the final exception mapping, but strict schema assertions rejected those fixture codes. Tests now use existing STATE_REVISION_CONFLICT/RESOURCE_REVISION_CONFLICT. The production handler SHA stayed66a13bd5396ea3f79b18fb5aa2345e8e978fd6878f8aabcf952303452287730b throughout that correction. No schema validator or transaction assertion was weakened.

history/failure-mapping.json retains full original/first-corrected run metadata, source fingerprints and exact failure classifications; case-results retains the captured failed rows. Original failed source pairs are available, with one shared initial v1 handler and the R2 failed handler identical to final by SHA. Random keys/request IDs/timings prevent byte-identical log replay. Historical intermediate green source not independently archived is identified rather than claimed recovered.

## Immutability and remaining gates

All690 accepted base blobs remain unchanged; exactly two new source paths, final692 files. The entire1432-file reported v1 draft is unchanged: before/after fingerprint records302685 bytes, SHA256820bb6b57536dd50f733b377ee548110142b9eb4f7c61d3c1e65ecd7ed9d6d4a. Its original8252-byte inventory SHA2563f67049ea29a6e1312e905ddc0326f80df2a1c512a321e0bab06d6f89d93f029 remains unchanged. Four other original packages also retain their recorded fingerprints.

local-review-inventory.json is a local review/publication proposal, excluded from its own selection and not upload approval. Selected full run records are embedded; raw/intermediate/frozen-row files stay local with explicit limits. No upload or remote mutation was attempted.

Independent QA on these new bytes is pending. R1 integration OPEN; removal HTTP/real-DB E2E BLOCKED. Authoritative SQL/protection, actual locks/isolation/RLS/durability, live provider, migration/deploy and Mini readiness remain separate NOT_RUN gates.
