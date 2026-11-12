# Clerk refresh/logout: locked exchange context and refresh locator

LOCAL candidate, author-tested only. No upload or SQL execution. This package is
independent of metadata-only dependency locks. It changes no dependency, Mini UI,
bot, entry/config, pool, JWT verifier, schema baseline or frozen SQL composition.

## Source and behavior

Reconstruct the accepted 289-file / 3,699,598-byte application on main source
`de2adf023428a374f075faa421ece9e1deafaf36`, through the independently accepted
names-r2 overlay `d14dd93ca4f043510306f2de1d9a73b8cbdae210`. Use the immutable
preceding overlay mappings and reconstruction instructions in that checkpoint's
review/verification.json and review/README.md, never lab reports as app source.
Apply only this package's six application paths. Result: 290 files / 3,751,103
bytes; 284 existing application paths remain byte-exact. Five replacements and
one test addition are bound to exact preimages in verification.json. The already
accepted three-file Worker entry overlay 2d8f7a12b31c66f21c41d846644a903d36180d6f
can remain separate: this slice changes none of its files and did not run a
Worker bundle or entry integration. Its request composition still calls these
same configured/Clerk adapters.

POST refresh/logout dispatch before the legacy domain path, using runPrepared,
one client and one transaction. Each BEGIN resets six keys to deny-safe values,
then auth; an authoritative access/refresh locator provides only a person hint.
Ordered person locks precede snapshot loading, current proof/person checks and
provider work. Session loading selects only the proof's family; it loads no
exam/assignment/attempt rows and no exchange replay inventory. Runtime SELECT is
not expanded. Invalid/hidden relationships cannot become an absent identity for
provisioning. New helper output cardinality/shape/UUID is validated strictly.

Refresh selects only the body refresh proof, ignoring Authorization. The locked
persisted Clerk binding must match the selected person and configured issuer.
Enabled identity/person, current session and live provider checks remain. Every
provider expiry can only shorten the lease; local and provider clocks cannot
move backwards, and equality at expiry is invalid through the synchronous final
commit hook. Family expiry cannot extend. Successful rotation writes only this
family's access/refresh ledger. Consumed-proof reuse COMMITs its family revocation
before rendering REFRESH_REUSED/401. Later checks use immutable pre-mutation
authority rather than reauthenticating the deliberately revoked result.

Logout intentionally removes the previous live-provider prerequisite. It is a
LOCAL REVOCATION-ONLY behavior change, not a claim about prior source behavior.
Bearer is first with no fallback (including malformed/empty Authorization), and
retains local access expiry/supersession/family/person/role/mapping restrictions.
Only after bearer authentication is an optional body proof validated; both proofs
must bind the same family. Body-only refresh proof can be consumed. Its narrowly
tolerant loader accepts structurally valid disabled identity/person and retired
session records solely for revocation, never renewal/profile/domain authority.
Live-family writes require its locked persisted Clerk provenance. Missing or
inconsistent binding denies those writes. There are no logout provider calls or
provider expiry leases. The immutable local deadline remains enforced through
commit. Only selected-family revoke/tombstone DML is permitted; no new tokens,
profile/identity/membership/fence/replay writes, other-family change or extension.

Already-revoked refresh-proof tombstone repeats within logoutRetainUntil perform
NO DML, no Clerk-context promotion, and need no active provider metadata. They
must leave the whole auth snapshot unchanged; at the retention deadline equality
success is denied. Bearer authentication never gains this tombstone exception.
No claims in headers/body or mutated callback state supply context provenance.

Before any live-family session flush, setTrustedClerk receives the immutable
locked binding, then setTrustedPhase(exchange). The row adapter checks an explicit
session-write allowlist. SQL/commit failures roll back/discard as appropriate;
COMMIT uncertainty remains sanitized SERVICE_UNAVAILABLE/503, one attempt, no
rollback/retry after COMMIT was attempted. Default bootstrap remains unchanged.

## Separate inactive SQL proposal

`review/first-student-refresh-locator.review.sql` is review text ending ROLLBACK,
not a runnable migration. It adds only locate_student_refresh(text) returning
person_id under the same strict six-key reset/auth scope as the accepted access
locator. Consumed, expired and revoked records remain lookup hints. It reuses the
restricted NOLOGIN/NOBYPASSRLS access-locator owner, grants it only the two refresh
columns and a helper-only SELECT policy, and grants runtime only EXECUTE.

The non-superuser managed operator/bootstrap and exact ADMIN-only creator row
are preconditions. A separate scoped SET/INHERIT + schema CREATE transfer window
is revoked before postflight. It does not grant runtime UPDATE/SELECT, LOGIN,
BYPASSRLS, broader ownership or usable helper membership. No SQL was compiled or
executed. The previous 75,031-byte da0a27b6 composition and every original SQL
remain unchanged and are NOT final activation-ready: this helper must be reviewed
and incorporated into a separately approved, exactly pinned execution packet.

## Reproduce author checks

Use already available Node v24.22.1 from the reconstructed application root.
Place the new locator review text at sibling ../review/first-student-refresh-locator.review.sql.
The unchanged trusted-context regression also needs the retained activation-r2
text at ../review/first-student-trusted-server.activation.review.sql: 60,363 bytes,
SHA256 e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd,
from lab commit 8be232eff22c2608b55f7f5513d8752a0307977a under
qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r2/review/.
It is text-only, already in lab, and deliberately not duplicated here.

```sh
node --test tests/backend/student-prepared/session-context.test.mjs tests/backend/student-prepared/profile-context.test.mjs
node --test tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/backend/student-prepared/routing-receipts.test.mjs tests/backend/student-prepared/trusted-server-context.test.mjs tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs tests/vercel-node/postgres-pool-factory.test.mjs tests/cloudflare/api-postgres.test.mjs tests/cloudflare/clerk-worker-bindings.test.mjs tests/clerk-auth/scoped-store.test.mjs
```

Final: 113 focused/profile PASS; 474 regressions PASS, one explicit no-JOSE skip;
six syntax checks PASS. Total 587 PASS / 1 SKIP. The new test is an inert exact-SQL
protocol double using actual configured handlers; it is neither an SQL/RLS engine
nor a replacement JWT verifier or real-provider integration. Existing same-answer
UPDATE/CAS/stale denial, profile/name preservation, pool lifecycle, rollback and
commit_unknown regressions pass. Text checks cover the inactive locator boundary.

For the two red controls, reconstruct unchanged d14dd93 source; copy only the new
test into it, cut the file before `const dml=`, remove the now-unused import of
locateStudentRefreshOnClient, and change its refresh-locator SQL expectation back
to the original direct SELECT. This recognition-only test-double adaptation lets
the assertions reach the old behavior rather than fail on a SQL spelling change.
Run node --test tests/backend/student-prepared/session-context.test.mjs. Retained
red result: two expected failures (refresh context 500 vs 200; provider-revoked
logout 401 vs 200). Final green controls additionally cover unavailable provider.
Earlier setup/empty-harness attempts and full failed broad-run logs are retained
locally and accurately summarized in verification.json, not claimed as red proof.

Root semantic TypeScript 5.9.3, AJV contract integration and actual JOSE/Clerk SDK
suites are NOT_RUN successfully: these packages/compiler are absent in this own
copy; no installation occurred. An initial broad attempt recorded dependency
load errors. The missing retained SQL test input was restored byte-exact before
the successful final regressions. The unchanged 119-path source guard remains
FAIL at the already stale SDK-worker pin (2133 vs 2062); no repin/weakening.
Real PostgreSQL compilation/RLS, driver/TLS, Worker bundling/deployment and primary
readiness are NOT established. Independent source and SQL review are pending.

## Exact future publication proposal

Repository oybek-muminov/lab_univeracademy; new Backend branch
backend/clerk-session-context-01-20261112; sole proposed parent
d14dd93ca4f043510306f2de1d9a73b8cbdae210, tree
b7070e5cc8f0b026c2e9e6e1a49adb824884843c. Destination prefix
qa-checkpoints/2026-11-12/backend-clerk-session-context-01/.
Parent and branch/prefix absence were checked read-only. Eleven additions, mode
100644: four source replacements, two tests (one replacement/one addition), one
inactive SQL derivative, this README, verification, original author output and
manifest. No full patch/archive, dependencies, private execution packet, old SQL
copy or metadata locks are selected. All examples/persons/proofs are synthetic;
selected bytes contain no real credentials or student data. A separate approval
is required before publication. Author PASS is not independent acceptance.
