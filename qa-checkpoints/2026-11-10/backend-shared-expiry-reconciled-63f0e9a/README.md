# R03-SHARED-EXPIRY-01-reconciled-63f0e9a

LOCAL AUTHOR CANDIDATE. No publication is authorized or attempted by this package.

Repository: oybek-muminov/lab_univeracademy
Proposed branch: qa/current-flow-20261106
Exact base: 63f0e9a557d689f775dfe7a1c5aab8c87d27acd5
Exact base tree: 22a3dc84ba98c647c9c8b7827e85e483888fd8fb
Proposed evidence prefix: qa-checkpoints/2026-11-10/backend-shared-expiry-reconciled-63f0e9a/

## Source and reconciliation

Only attempts.ts and new tests/membership/shared-expiry-invariant.test.mjs differ from the exact base. All 653 accepted base blobs were matched to their remote Git blob identities before editing this new local copy. The final copy contains 654 files: 652 base files unchanged, one modified production file, one new test. Dependency/lock files and accepted Teacher authority/guard/port/HTTP/Mini files are unchanged.

attempts.ts remains the reviewed 9727-byte fix, SHA256 b95d33d535d37ee1beeef6123985771b5c05e921ed3a4f9e0694eafaea381721. Private expire() checks the clock, rejects in_progress with non-null ordinary using RESPONSE_INVARIANT_FAILED/500, then retains existing deadline handling. No repair, clearing ordinary, complete()/scorer rewrite or shared C04 expansion.

The new test is exactly the reviewed 18548-byte test except one after-hook base metadata literal, b3d86559a743e13dcca65f2f6d227227ef297abf -> 63f0e9a557d689f775dfe7a1c5aab8c87d27acd5. New test SHA256 9de546a587d6b3aac367f9f17db704c9d54c318694c58c89cfbf6963abc3ab68. test-base-metadata-only.diff shows the only change from the reviewed test; no oracle, assertion, setup or legacy historical trace tag was changed.

## Final local checks and reproduction

All actual runs use cwd:
 /tmp/R03-SHARED-EXPIRY-01-reconciled-63f0e9a/repo/workspaces/univeracademy

verification.json embeds all four complete original final run metadata objects, including literal commands, environment overrides, actual cwd, UTC, exits, counts and log hashes. source-manifest.json binds their exact source/lock snapshot and two source hashes. No omitted run JSON is required: the originals remain local, embedded contents are complete.

123 shared tests PASS, 247 accepted membership tests (including Teacher controls) PASS, 30 student HTTP regressions PASS. These are three separate runs totaling 400 PASS / 0 FAIL / 0 SKIP. Typecheck exits 0. Prior 303 passes remain b3 evidence and are not renamed to the latest base. No Mini QA was repeated.

On another local clone of the exact base with pinned existing dependencies, apply candidate.patch and run the same argv in verification.json. Set the trace-output environment paths to a separate local evidence directory. The runtime/test fixtures are synthetic. The historical absolute paths in run metadata are provenance, not required input paths.

sources-locks.frozen.json is the one content-addressed snapshot shared by all eight actual before/after measurements (four commands). The original local snapshot basename is its SHA256; the proposed destination uses the readable name. No duplicate before/after file needs publication. scope-verification.json records full base parity, frozen-package fingerprints and exact allowed paths. Real forward/reverse git apply commands, distinct cwd, UTC and two-file byte parity appear in replay-verification.json; replay occurred after typecheck.

## Acceptance and measurement limits

123 shared cases cover six public transition functions at deadline before/equal/after; valid active/null ordinary, literal expiry and terminal ordinary; auth/current generation/clock precedence; both series and attempt insertion orders; positive write calibration; and five synthetic student HTTP routes. Expected states are literal and do not call the candidate scorer or expiry helper.

Mixed-series helper recording double:
- Valid elapsed attempt visited first: materialize1/expire2/complete1/ordinaryScore1, two staged JS set attempts, then technical500 and model rollback to committed S0.
- Corrupt attempt visited first: materialize1/expire1/complete0/ordinaryScore0, zero staged sets, technical500 and model committed S0.
- Positive calibration: two valid completions, four set attempts, model commit to literal expected state.
Thus this shared helper result is not general maintenance0. The recording model is not PostgreSQL rollback/durability.
- Separate accepted removal-preflight R03 controls still record direct guard invocation, maintenance0/reconcile0/guardWrites0/portWrites0/flush0.
- Pure input fixtures are deeply frozen/net comparisons; HTTP fixtures compare full net RAM state. Transient input/HTTP writes are NOT_INSTRUMENTED.
- Proxy observations cover reachable JS set/define/delete operations, not external I/O or all possible object mutations.

shared-final-shared-cases.json retains all 123 final cases including literal before/staged/committed states and counters. regression-summary.json is a compact derived record of all 188 adapter trace rows and 18 legacy R03 rows; the 247-case log also includes 59 accepted guard tests. Its state digests/equality fields are net observations, not operation traces. The 13.6 MB full adapter trace and other raw regression outputs remain local and are excluded to avoid unnecessary duplication. Unchanged regression trace base tags are historical; verification.json binds the actual execution base.

## Original failure provenance

history/baseline-red.log and baseline-red-run.json are unchanged originals: old b3 attempts.ts (9616 bytes, b4bc54e39fef6799b6ff83a4be3c474471afd2e4c76e888767e999064a4d9e20), original test (18145 bytes, 52b971232574a53be430eff1d1f5be721b39ea2ec10a6aa9e53bb154f4ea92bd), focused 30 FAIL / 1 positive PASS. These establish the original product invariant gap, not a new latest-base failure.

history/shared-green.log and shared-green-run.json are unchanged originals from the first fixed run: production hash already equals final b95d33..., test still initial 18145 bytes. 108 PASS / 15 FAIL were HTTP setup failures: the synthetic access proof had expired (15-second TTL; clock advanced about 60 seconds), so correct auth returned APP_SESSION_EXPIRED/401. The reviewed test already fixed setup by obtaining fresh synthetic login before capturing S0/injecting corrupt state. Production/auth policy was not changed. These runs were not repeated.

history/red-green-mapping.json links original 31 focused cases to the new latest-base cases. Original raw red and first-fixed traces remain untouched in the original shared package; their hashes are referenced, not falsely claimed as newly run or original bytes regenerated here.

Two local metadata assembly attempts assumed optional order/expected_staged fields on positive calibration. Both failed before verification.json was written. The final assembler copies only recorded optional fields and marks the absent positive staged oracle as NOT_RECORDED; its committed literal oracle remains checked. No source/test change or retest resulted. verification.json records the failed script digests. This is packaging history, not a product or test failure.

## Scope and publication boundary

Both original packages/inventories remain unchanged:
- Frozen REMOVAL-AUTH-01 inventory: 14062 bytes, e40072fd2cd4ced6e095eadba9d754817e87914bd73311e015692d17805e7da8.
- Original shared local-review-inventory: 11747 bytes, 1df5641f28e375f21feede075127dfad549af3e2486192071783886fde2139e7.

Original full before/after package snapshots, complete remote tree/base-materialization records, package assembly scripts and full raw regression traces remain local. publication-inventory.json is a proposal only and is excluded from its own proposed publication list. Exact source/evidence count, bytes, local-to-remote mapping and hashes are in that new inventory. No destination has been written.

Independent QA for these two new bytes is PENDING. R1 integration OPEN; final removal HTTP/DB E2E BLOCKED. Real SQL/DB/RLS/provider/migration/deploy NOT_RUN. No Teacher expansion, final removal mutation, HTTP route, Mini pin or real service change is included.

