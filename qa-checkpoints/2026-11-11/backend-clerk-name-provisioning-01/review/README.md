# Clerk display-name provisioning: local review candidate

Author offline checks only; independent review is pending. No provider request,
SQL execution, credential action, installation, upload or deployment occurred.
The published profile-context package at04ef1ddd0316ec9f03a09eec14feae3a326aa1c9
and all frozen SQL/evidence remain unchanged. The coordinator separately reported
that package's independent477-check and TypeScript acceptance; this candidate's
unrun checks are not covered by that earlier acceptance.

## Behavior and scope

The existing fixed Clerk Backend User read now retains nullable first/last names
through the Worker transport and provider validation. The legacy Node SDK worker
also retains those two fields instead of stripping them. This is one additional
small source seam beyond the initial four-file checkpoint, with no new SDK,
endpoint, configuration key or dependency. Names are display data, not evidence
for person selection, identity linking, role or access authority.

The existing JWT verifier, configured issuer, exact user/session matching,
mandatory account flags, uncached liveness, cancellation and earliest expiry
guards remain. New-person creation alone consumes the validated provider names.
Repeat login preserves every stored/edited name and the existing UUID, roles,
qadam and group. Client body/JWT name claims, email, full-name splitting and
metadata do not supply names or authority. Missing, null or blank names become
empty platform fields; partial names remain partial. Initial registration remains
incomplete, with the existing student-only/inactive-membership/null-group rules.

Names use the existing API's maximum100 Unicode code points, without truncation
or normalization. Nonblank provider strings are preserved exactly. Nonstrings,
overlength strings, NUL and unpaired UTF-16 surrogates fail safely before JSONB
storage. Provider errors, identity mismatches, disabled mappings and expiry cannot
leave a partial registration. A later provider lease cannot extend an earlier one.

`exchangeClerkSession` is an exported internal post-verification transaction
operation for focused tests; the HTTP route still obtains its proof exclusively
from the unchanged JWT verifier. There is no verifier override, success flag or
public route bypass. Synthetic proof/provider-port tests are not JWT integration
proof. A separate conditional test exercises the real JOSE/provider/HTTP exchange
when the already-pinned dependency is available; it is NOT_RUN here.

No Mini UI, public API contract, package/lock, default bootstrap, Worker entry,
pool, schema or existing policy is activated or re-pinned. The unchanged Mini
HTML inputs use maxLength100, which counts UTF-16 units; the server's100-code-point
bound can therefore admit an astral string that exceeds that existing form bound.
Mini's separate Continue/form integration must account for this; no UI edit is
included here.

## Inactive SQL derivative

Input: labff75be9908bf5b29f64c0c067b631b8161d688c7,
qa-checkpoints/2026-11-11/backend-managed-registration-sql-01/review/clerk-registration.delta.review.sql,
12176 bytes, SHA2568ae3afbd90b5e079dbf5b35513414263cf3174f8547fc27c3ac717a801e738ae.

Only three INSERT predicates change: the people row and its membership/identity
companion checks allow string names of0..100 PostgreSQL characters. Exact profile
shape, incomplete initial profile, exchange context, person/singleton scope,
Clerk binding, student role, inactive membership and immutable identity constraints
stay intact. Profile UPDATE/domain policies, grants and all other bytes are
unchanged. This is the full replacement REVIEW delta, not an additive operation
to apply over an already installed registration policy. It retains its raising
review guard and terminal ROLLBACK. Frozen baseline/activation inputs are untouched.

The preserved input header's old PATCH-context HOLD is historical text. The source
correction lives separately in the04ef1ddd base; preserving that header avoids
silently changing a fourth portion of the derivative. This artifact has not been
compiled, evaluated against PostgreSQL, installed or approved for execution.

## Reconstruct and reproduce offline

Use your own exact application assembly: de2adf023428a374f075faa421ece9e1deafaf36
plus accepted overlays80ee858,3f6e3a6,1273852,ea0c3cd9,e0ad56df,d33088c5,
77e04d13,5689c7f2,9a567971,04ef1ddd. That base is289 files/3679262 bytes;
overlay only the eight application files in this publication manifest. Result:
289 files/3693661 bytes;281 base files unchanged. Laboratory review files are not
application source. Full commit identities and each modified file's preimage are
in verification.json. No full archive or duplicate application patch is needed.

With Node24.22.1 and Python3.12.14, from your reconstructed application root:

```sh
node --test tests/clerk-auth/scoped-store.test.mjs tests/cloudflare/clerk-worker-bindings.test.mjs
node --test tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/backend/student-prepared/routing-receipts.test.mjs tests/backend/student-prepared/trusted-server-context.test.mjs tests/backend/student-prepared/profile-context.test.mjs tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs tests/vercel-node/postgres-pool-factory.test.mjs tests/cloudflare/api-postgres.test.mjs
python /your/checkpoint/review/check_registration_names.py --registration-input /your/original/clerk-registration.delta.review.sql -v
```

The existing trusted-context static regression additionally requires the frozen
activation r2 text as sibling ../review/first-student-trusted-server.activation.review.sql,
60363 bytes/SHA256e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd,
available at lab8be232eff22c2608b55f7f5513d8752a0307977a,
qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r2/review/.
It is a test dependency, not a runnable migration or replacement of current SQL.

Observed:108 focused PASS/1 explicit JOSE skip;399 regression PASS; six SQL
static checks PASS; eight changed-source/test syntax checks PASS. Logs, exact
commands, timestamps, exits, input identities and preservation results are bound
by verification.json and author-checks.log. Static reversal/diff checks establish
the exact three-predicate source derivation, not PostgreSQL/RLS behavior.

Real JOSE/HTTP integration, the existing SDK binding/provider suites, and root
semantic TypeScript are NOT_RUN locally: jose6.2.15, @clerk/backend3.27.0 and
TypeScript5.9.3 are absent, and no installation was authorized. Reviewers with
the approved exact dependencies can run the conditional Worker integration plus
`node --test tests/clerk-auth/sdk-binding.test.mjs tests/clerk-auth/provider-adapter.test.mjs`
and the unchanged root `npm run typecheck`. Those commands are not author PASSes.

The unchanged119-path source guard FAILS: its first stale pin is now
runtime/clerk-sdk-worker.mjs2133 vs2062, plus earlier stale Backend targets.
No guard was disabled or weakened. Re-pin, real TLS/driver/DB/RLS/Clerk/Workers
validation and any SQL/runtime activation remain separate review/run gates.

## Future publication proposal only

Repository oybek-muminov/lab_univeracademy; branch
backend/clerk-name-provisioning-01-20261111; sole parent
04ef1ddd0316ec9f03a09eec14feae3a326aa1c9, tree
a10d05f9afa1037d685f2e0d289952732838578a. Prefix:
qa-checkpoints/2026-11-11/backend-clerk-name-provisioning-01/.
All proposed paths are additions with mode100644. No publication is authorized.
Only source, inactive SQL, synthetic fixtures and necessary review evidence are
selected; no real credentials, person/student data, archives, dependencies or
private execution packet is included. Original test logs retain clearly synthetic
negative-test connection strings, including u:p@host and hyperdrive.invalid;
they are not live connection details. The manifest needs its external SHA256 pin;
its own contents are not a trust root.
