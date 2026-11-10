# R1-TX-BRIDGE-01-r2 — derived-ID single-read correction

Local author revision, not publication or independent acceptance. Exact base remains `8bc48c4647099355a046bb395de5486e6afd251f`, tree `0fb5e8bde38df528ebe763c93eb015f111af0a15`. The frozen v1 14-file package and its inventory remain byte-identical. This revision is a separate copy; no upload, commit/push, provider, real DB, settings, SQL, schema, dependency, entry or other-worker environment action occurred.

The only production correction captures each own derived-ID element once, validates that captured value, then copies the same value. V1 read a getter-backed own array element in typeof, UUID validation and copy separately. A changing getter could send an unvalidated value to context/lock/work. This is a validated-snapshot contract defect; the scripted client does not execute PostgreSQL UUID casting or prove a PostgreSQL exploit.

Allowed paths only:

- `workspaces/univeracademy/supabase/functions/univeracademy-api/storage/postgres-transaction.ts`: 9,620 bytes, SHA256 `fca20362989fe6abecabcff80ffd7787fc6e573379268a7af6236e141856f96f`.
- `workspaces/univeracademy/tests/membership/protection-postgres-transaction.test.mjs`: 33,274 bytes, SHA256 `49db7421e71cd71966bbf1bd24e952539b8f5062f0621fd349db38f22eca6beb`.

`v1-to-r2-runner.diff` contains the complete narrow production delta. Reversing it reconstructs the exact 9,563-byte v1 runner SHA256 `4fec2ee626f46f0eaf9b97c94a6c485bd228b20c95991fbb9dc217b366f8ca7c` with the final r2 test unchanged. That reconstruction was actually checked in a separate directory. Full candidate.patch applies against the accepted 8bc base.

## Genuine red-before and same-byte green

The exact final test bytes above were used for red-before, green-targeted and focused-final. Three new controls were appended; removing only their contiguous block restores the original 31,040-byte v1 test SHA256 `b3691200bd6ef130881c1f788b7857a5e39e3772ca89a8f638f44fe9ec31b905`. Existing 97 oracles, harness and metadata are byte-identical, without normalization.

| Control | V1 red | R2 green |
|---|---|---|
| B39 valid first, then invalid | read2, unexpected500, work0/COMMIT0 | read1, captured P in context/lock/work, COMMIT1 |
| B39 valid twice, then invalid | read3, not-a-uuid reaches context/lock/work, COMMIT1 | read1, captured P only, COMMIT1 |
| B40 invalid first, then valid | read3, unexpected success, context/lock/work/COMMIT1 | read1, invariant500; context/lock/work/COMMIT0; ROLLBACK1 |

Red is **0 PASS / 3 FAIL, exit1**, genuine product-contract failures, not fixture or harness errors. Green-targeted is 3 PASS, exit0. Full exact query arguments, read counts and work/COMMIT counters are retained in raw red cases and the verification mapping. The first red assertion to fail is read-count equality, but the recorder independently preserves all execution observations even after assertion failure.

The coordinator relayed architect reproduction and independent QA v1 45 PASS / 1 FAIL. Their original files were not accessed/copied. The relayed defect-witness exit0 asserts a v1 defect and is not counted as r2 acceptance. It was not rerun or silently substituted for author tests.

## Final validation and bindings

Cwd for every run is `/tmp/univeracademy-r1-tx-bridge01-r2-zox4akeb/repo/workspaces/univeracademy`. All exact commands, environment overrides, source IDs, before/after boundaries, UTCs, exits and log SHA256 values are embedded in verification.json. The executable driver is run.py. Red/green-targeted retain their original task-family candidate label; final records use the r2 label. Actual cwd and source hashes distinguish each run; none was relabelled retroactively.

| Run | UTC 2026-11-10 | Result |
|---|---|---|
| red-before | 13:41:17.604890–13:41:17.878590 | 3 FAIL / exit1 |
| green-targeted | 13:41:28.714483–13:41:28.943411 | 3 PASS / exit0 |
| focused-final | 13:41:43.603120–13:41:44.103915 | 100 PASS / exit0 |
| affected-final | 13:42:01.993827–13:42:03.979686 | 241 PASS / exit0 |
| typecheck-final | 13:42:01.993827–13:42:04.287217 | exit0 |

Final total is **341 author tests**, fail/cancel/skip/todo0. The targeted3 are included in final100 and are not double-counted. Affected selection is pool-port, storage-auth storage and staff-jwt, removal-active and protection-contract. No Mini or broad HTTP rerun occurred. Affected and typecheck ran concurrently with no source or replay mutation; their actual cwds are the candidate checkout. Replay used separate directories after both completed.

Every run has identical own before/after boundary. All green/final runs share 739-file boundary SHA256 `9298e654dfa93ccf939991c5ede926ddf6b06bca1cb0075be7bc07b9b8b0e9a1`. Red boundary is `108512105010d766f02cc1e6f2c6b73c6158e2ddb531182ecc77f42736f116bf`. The selected sources-locks.frozen.json is the exact final before/after byte array. Boundary covers all regular repository files, including source/locks and baseline evidence, excluding node_modules/.git/symlinks; Git modes are checked separately.

737 nonselected baseline blobs and all 738 original modes are unchanged; only the allowed runner changes and the allowed test is added. Frozen v1's 2,242 regular files were compared to the pre-revision fingerprint; all 14 selected rows and the original 5,341-byte inventory SHA256 `dafd7ba8281be8a3dde2a2e454f1999873ade65c7b3434e28ed381e65ff85ab3` still match. This comparison is author evidence; full local frozen-tree reproduction requires its unselected original before file and the original package.

Actual check/forward/reverse-check/reverse all exit0: full 739-file candidate and 738-file base byte/mode equality. Separate revision delta reverse/forward reconstructs exact v1/r2 runner bytes while retaining identical new test bytes. No Git objects/index/refs were written.

## Evidence selection and limits

The final raw case file contains all 100 recorded cases with full states and ledgers. The selected original red case file contains all three failures. Neither is a deduplicated state pack; no omitted state dictionary is required. The separate targeted-green raw file/log remain local because the final100 includes those same controls on identical source/test bytes; the targeted run metadata and observed mapping are embedded in verification.json. Duplicate per-run JSON files are fully embedded there. Source snapshots for the historical red run, full frozen-v1.before.json, base fingerprints, build-evidence.py and v1 originals remain local. Existing base plus final sources, revision delta and selected test suffice to recreate both red-source and fixed-source controls; exact old local-tree comparison requires its original local artifacts.

Absolute paths are provenance. Inventory aliases: final source-snapshots/9298e654...json → sources-locks.frozen.json; red-before-cases.json and red-before.log → history/ with the same basenames; root run.py → run.py. All other selected evidence basenames stay unchanged. Inventory itself is excluded. Reproduction needs an exact accepted base checkout, repo/evidence directory layout and existing pinned dependencies; runner placement beside published evidence alone does not construct that layout.

The existing actual-runner suite retains direct gate counts, query entry/settlement, immutable scope/writable now, callback capture, native rejected/pending Promise rejection, arbitrary then getter/method zero assertions, deferred ACK, original error identity, both commit_unknown states, observer phase/lease failure honesty, one-attempt release and legacy isolation. Previously disclosed coverage gaps remain: no intentionally sinks-disabled child negative calibration, no initially-pending gate Promise later rejected, no exhaustive Promise subclass/species/cross-realm matrix. They are not hidden as part of the single-read fix.

Explicit fixture write attempts, staged state, independent recordingCommitted and synthetic protection phase are distinct. This is not real SQL/RLS/locking/durability or a complete removal repository. A release invocation or synthetic discard does not prove physical cleanup. Rollback uncertainty preserves original error without confirmed rollback; both COMMIT-loss variants remain commit_unknown/503 with no automatic mutation retry. Raw trusted prepare is not a SQL sandbox. R1 integration OPEN; real-DB/production E2E BLOCKED. New independent QA and separate exact upload approval remain necessary.
