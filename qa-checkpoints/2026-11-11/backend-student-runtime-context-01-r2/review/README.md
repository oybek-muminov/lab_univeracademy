# Backend student runtime r2: three confirmed P2 corrections

Author offline PASS; independent re-review pending. Original Backend/combined
verdict remains HOLD until this exact revision is independently reviewed.
This supersedes the unsubmitted two-fix proposal; its original bytes remain
retained locally. Published source/evidence are unchanged. No runtime readiness.

Proposed Backend-only branch backend/student-runtime-context-01-r2-20261111 in
oybek-muminov/lab_univeracademy, from exact parent
80ee858fefde0b1d3d08b7ef3c07d780b7e41ea3 / tree
e5d482497a224d100d1bf6beedc66cd0fb7225b5.
All additions live under this new checkpoint. The original branch/checkpoint,
Mini branches, lab main and QA branch are preserved.

Reconstruct in the reviewer's OWN isolated copy, in this order:
1. UniverAcademy commit de2adf023428a374f075faa421ece9e1deafaf36,
   tree bc891240798d9bf56ee52c4a0f0ecede8ed33552 (270 accepted source blobs).
2. Apply the 15 candidate_overlay paths from the parent commit's original
   qa-checkpoints/2026-11-11/backend-student-runtime-context-01/ checkpoint,
   preserving application-relative paths. Original manifest: 9641 bytes/SHA256
   58fcac2b8f6bfef64ea414f2df48e8fa7e30e7bbceb94aa67b81f5026bfdfedf.
   This is the exact 275-file published application composition.
3. Copy only the five revision_overlay paths in this manifest, removing this
   checkpoint prefix. Four replace source files; one adds a test. Result: 276 files.
Do not apply r2 directly to the accepted base without step 2. All unchanged test
helpers/runtime/API dependencies come from that base plus original overlay.
No other worker's /workspace or /tmp path is a dependency. The lab tree itself
is a source/evidence exchange container, not the application base.

P2 routing: unsupported method/path combinations previously fell through into
native/Clerk legacy domain loaders. An explicit implemented-legacy gate now
terminates unsupported combinations with existing NOT_FOUND/404 before checkout
or private domain loading. Implemented legacy operations retain their existing
adapters; no broader legacy-authority redesign is claimed. Tests cover 40 request
cases across current/revoked native/Clerk sessions, revoked GET controls and CORS.
No response disclosure or successful unauthorized write was demonstrated in the
original routing finding; the defect is preauthorization private reading.

P2 UUID receipts: start/submit receipt paths now use canonical lowercased UUID
captures, matching the accepted handler. Opaque idempotency key case and existing
internal separators remain exact. Letter-bearing UUID tests cover first use,
lower/mixed/upper replays without extra writes/receipts, and distinct key case.

P2 shortened Clerk expiry: each successful validated authority check restricts
one shared request/commit lease to the minimum expiry seen. The later HTTP check
now updates the existing commit guard. Equality is expired; a later longer value
cannot extend the earlier lease. Tests cover shortened expiry before commit,
exact equality, shortened-unexpired success, no extension and normal success.
Denied saves show 401 without data, mock ROLLBACK/no COMMIT, no persisted answer
and unchanged attempt revision. This is the established JS lease boundary, not
a new authority scheme or a DB-verifiable capability implementation.

Offline command from the reconstructed application root, Node v24.22.1:

    node --test --test-reporter=tap tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/backend/student-prepared/routing-receipts.test.mjs tests/vercel-node/production-options.test.mjs

At 2026-11-11T13:54:28.377879+00:00: exit 0, 159/159 PASS, including all 141 published
checks plus 18 new targeted tests. The identical final test on the original
published composition has 18 tests: 5 PASS/13 FAIL; red-before.log is that output.
To reproduce red, perform steps 1-2 and copy only the new test before applying
four corrected source files. Then apply the full r2 overlay for green.
An additional author-only retained two-fix isolation run has 16 PASS/2 FAIL,
confirming the shortened-expiry regressions independently of the first two fixes;
its identity is recorded in verification.json, not used as published-source proof.

The full green output and command/cwd/UTC/exit/input identities are included.
Five syntax checks and four text patch replay steps pass. Absolute evidence paths
are historical provenance only. The full patch, zero-byte syntax/replay outputs,
duplicate journals, full composition inventory and intermediate test-draft logs
are omitted but retained locally; reviewers derive the delta from pinned source.
Initial test-only receipt separator/initial revision assumptions were corrected
against accepted code. No implementation/schema was changed to fit those errors.

Only Node 24 is needed for these in-memory named-statement checks; no install,
network, listening server, provider, DB/SQL engine, Worker, controller or cleanup.
They do not prove SQL/RLS or durability. commit_unknown/503 checks still pass.
Matching root TypeScript 5.9.3 semantic typecheck is NOT_RUN: no installed tsc.
Successful JOSE/provider/browser/PostgreSQL/RLS/concurrency/durability/activation
are NOT_RUN. No dependencies, SQL, UI, contracts or provider settings changed.
Signed DB verifier/pool/private bootstrap and primary gates remain HOLD.
Mini target manifests/source guards are untouched; no mismatch is weakened.
The malformed historical addendum pin remains UNVERIFIED, not repaired.

Selected bytes contain code, synthetic identifiers and author evidence only;
no real credentials, personal/student records or provider/DB observations.
Publication needs separate exact approval. Manifest identity is externally pinned.
