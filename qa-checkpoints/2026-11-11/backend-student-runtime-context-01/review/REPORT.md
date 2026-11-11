# Backend first-student-flow local candidate

Author offline PASS; independent review pending. No publication or runtime activation.
Base: oybek-muminov/UniverAcademy, mini/main-clean-import-r2,
de2adf023428a374f075faa421ece9e1deafaf36; tree bc891240798d9bf56ee52c4a0f0ecede8ed33552.
The read-only remote identity receipt and all 270 Git blob identities are retained.
Owner copy: ../repo. This is not a shared checkout or a remote branch.

The existing first-student request paths now use PostgresTransactions.runPrepared:
GET /me, /exams, /exams/{id}, /attempts/{id}, /attempts/{id}/result;
POST /exams/{id}/attempts and /attempts/{id}/submit; PUT /attempts/{id}/answers/{question}.
Lookup occurs after BEGIN on the same checked-out client as person locking,
current-session checks, row reads, flush and COMMIT. /me reads authentication only.
The transaction callback receives state/clock, not a raw client or an issuer key.
A private WeakMap record pins the captured method/URL/body/key/proof digests,
client, person and phase. Context reuse/forged receivers and escaped clocks fail.
Writes are checked against request target/body/key; auth rows stay immutable in
this bounded flow. Actual SQL scope signing/verification is not implemented here.

For Clerk app sessions, current auth metadata and provider liveness are checked
before exam/answer reads. A synchronous expiry/abort guard remains at COMMIT.
This does not establish DB-level identity-lock privileges or RLS visibility.
Clerk exchange remains the existing auth-only transaction; a real JWT exchange
was not run. The new tests seed an explicit synthetic Clerk app session and use
a synthetic liveness port; no production fallback or trusted HTTP flag exists.
The Telegram synthetic launch uses the actual existing HMAC verifier.

createProductionEntrypoint composes already prepared server options. The default
api/index.mjs still has configuration:undefined: no private bindings were invented.
Student-only composition no longer requires unrelated staff validators/writers;
admin calls remain unavailable without their own ports. JWT libraries are loaded
only when their verifier is called. Missing JOSE returns 503, never a verified
proof. No dependency versions, API contracts, UI, SQL or activation files changed.

Offline evidence: node v24.22.1; 2026-11-11T12:53:51.955496+00:00;
node --test --test-reporter=tap tests/backend/student-prepared/flow.test.mjs
 tests/backend/student-prepared/clerk.test.mjs tests/vercel-node/production-options.test.mjs
Exit 0: 141/141 (30 focused +111 composition checks (109 retained,2 new student-only cases)). All 15 changed/new
JS/TS files pass node --check. Four text patch replay steps exit 0; forward bytes
match the candidate, reverse bytes match the 270 original blobs. No listener,
SQL engine, database, provider, controller or browser is involved. The dispatcher
checks statement/control flow and records INSERT then UPDATE for the same answer;
it is not evidence that PostgreSQL compiled/executed the UPSERT or enforced RLS.

Covered: known-own positives; all read routes; 0->1->2 revisions on one answer;
stale revision1 ->409 REVISION_CONFLICT with no extra answer write; submit/result;
deadline/generation preservation; idempotent replay; expiry materialization;
revocation/disabled role/redirected locator before private reads; cross-person
read/write/result denial; Clerk metadata/fence/provenance/provider denial;
late provider expiry; abort; context forgery/reuse; request-write mismatch;
COMMIT before/after uncertainty ->commit_unknown/503 with discard and no retry.
Submit has no expected revision in the accepted contract (contracts/clerk-review.openapi.json:797;
student-http.ts:265). Stale-tab submit prevention belongs to Mini's accepted client;
this candidate does not invent another API field or claim server stale-tab detection.

Remaining actual source/integration blockers:
- api/index.mjs:8-11 remains unbound; runtime/production-entry.mjs:7 is only the
  explicit server-composition seam. A concrete server-owned PgPool adapter and
  prepared provider/key/policy/numeric settings are still absent from the entry.
  postgres-transaction.ts:3-12 defines the existing driver interface, not a driver.
- The retained ACTIVATION-BOUNDARY.md:78-114 leaves fixed issuer/verifier/library,
  key provisioning and DB-owned transaction descriptor unresolved. Recommend
  completing its existing fixed-algorithm signed-envelope design, with no new
  architecture or unsigned-GUC authority. This JS broker does not close that gap.
- ClerkAuthRows exchange's clerk_identities FOR UPDATE still requires the separately
  reviewed narrow UPDATE authority and immutable identity guard (addendum:146-159).
  Complete invariant visibility (addendum:161+) and RLS positive/negative evidence
  remain required. No SQL/policy/grant change was made to satisfy these gates.
- jose6.2.15, typescript5.9.3/tsc, ajv8.20.0 and @clerk/backend3.27.0 are not installed
  in this copy. No download/install was attempted. Full JWT, semantic typecheck,
  AJV, provider/driver/TLS, PostgreSQL/RLS/concurrency/durability and browser tests
  are NOT_RUN. Existing tests need only Node24 and the unchanged accepted source
  dependencies; their malformed-JWT test works both with and without JOSE.

Primary schema/roles absence and remaining hook/backup gates are coordinator
reports, not new queries here. The public-only ensure_rls hook is unchanged.
Primary writes, activation and G01-G11 remain HOLD/open. No real credentials/data,
other owner workspace, GitHub write/upload, remote branch, PR, merge or deploy.

Preservation: frozen source 270/270 and all 19 artifacts in the retained original
artifact index match; candidate has 10 modified originals,5 additions,260 unchanged
originals. All apps/UI files unchanged. The activation addendum was read only;
its observed identity is 32391 bytes/SHA256
06b611e412bb158c2d8d2d2e7d10da7dd06e66762f922e1c8fbd380ade62751c.
A carried summary's digest had only 62 hex characters, so it was not used as a
preservation pin or silently repaired; separate external-pin reverification is
not claimed. No mismatch exists in the accepted source or the19 indexed files.

Exact review selection is in candidate-inventory.json; full local diff is
candidate.patch; command/UTC/exit/output identities are in verification.json and
command-journal.json. These files are retained locally for a separately approved
lab review publication; no large source transfer or publication was performed.
