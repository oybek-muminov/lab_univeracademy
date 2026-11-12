# P2-NAMES-01: creation-only display-name validation

Local correction of published name package88a523bd813e44350a5b2005a813e2f5830ea89d.
Author offline checks only; independent acceptance is pending. No upload,
installation, SQL execution, provider/credential action or deployment occurred.

## Exact correction and boundary

The common liveness guard now validates only identity, enabled/status and expiry
and returns the same numeric lease as the accepted pre-name behavior. A shared
private validator projects that lease synchronously before leaving its checked
frame, so the refactor adds no await over a mutable security model. Common
liveness never reads optional display fields, including getters.

The Worker transport and provider adapter retain only raw firstName/lastName as
unknown display data. They no longer reject, normalize or validate those fields
as part of authentication. Existing transport byte/time/cancellation bounds and
mandatory identity/account/session checks remain. No full provider model, email,
role metadata or client profile is carried into platform authority.

Only the locked authoritative platform mapping selects creation. Exchange with
an existing mapping uses ordinary liveness and the existing mapped person;
disabled mappings remain mappings and never become absence. The NEW branch uses
the creation-only profile projection and existing strict name validator before
any person/member/identity mutation. Valid/partial/null/missing names retain their
previous behavior, max100 Unicode code points, empty missing values and initial
registration_complete=false. Invalid type/overlength/NUL/unpaired-surrogate names
still reject new provisioning503 before inserts. Existing edited names, UUID,
roles, qadam and group are not overwritten. Link/staff/session/profile paths use
ordinary liveness, with unchanged current authorization and expiry guards.

Application scope is four source replacements and three existing test replacements
listed in the manifest. Reconstruct your exact289-file/3693661-byte application
through88a523bd on accepted main source de2adf023428a374f075faa421ece9e1deafaf36,
accepted overlays through04ef1ddd and the published name overlay; apply only these
seven paths. Result:289 files/3699598 bytes,282 original files unchanged. All
preimages and full input commit identities are recorded in verification.json.
No new endpoint, public contract, dependency, Mini/UI, Node SDK, storage adapter,
pool, original SQL or guard/pin change is included.

The original three-hunk registration SQL remains source-compatible and byte-exact:
12794 bytes/SHA256331b42435ac4efc3c0e37a9fe49b8c0d68402f875df851967c25d4e44aafc223
in the88a523bd checkpoint. No SQL derivative is needed or included. The frozen
15-file name publication and unapproved seven-file Worker-entry proposal were
reverified unchanged. The Worker-entry proposal remains local and separate.

## Reproduce the offline checks

With existing Node24.22.1, from your reconstructed application root:

```sh
node --test tests/cloudflare/clerk-worker-bindings.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/backend/student-prepared/profile-context.test.mjs
node --test tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/backend/student-prepared/routing-receipts.test.mjs tests/backend/student-prepared/trusted-server-context.test.mjs tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs tests/vercel-node/postgres-pool-factory.test.mjs tests/cloudflare/api-postgres.test.mjs
```

148 focused PASS/1 explicit dependency skip;363 regression PASS; seven changed-file
syntax checks PASS. Existing new-user valid/partial/null/invalid-name and no-partial
registration checks still pass, together with disabled/mismatched identity,
provider failure, async expiry equality, shortened lease and COMMIT uncertainty.
New controls prove numeric expiry2000 for existing users with invalid names,
unchanged Edited/Platform relogin and ordinary opaque-session GET/profile saves.

For red-before, use your unchanged published88a523bd application source and overlay
only the final three test files, then run:

```sh
node --test --test-name-pattern=P2-NAMES-01 tests/cloudflare/clerk-worker-bindings.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/backend/student-prepared/profile-context.test.mjs
```

All four controls FAIL there (expected exit1), and all four PASS within the final
focused suite. Exact final test/input identities, commands, UTC, exits and original
output byte ranges are in verification.json/author-checks.log. No SQL or provider
execution occurred. Synthetic trusted liveness ports do not substitute for JWT
verification or prove live provider/DB behavior.

The real Worker/provider/JOSE test was extended to retain malformed/overlong names
through the actual provider adapter and accept existing-user relogin with a real
valid JWT, preserving Edited/Platform. It remains explicitly NOT_RUN here because
jose6.2.15 is absent. SDK integration and root semantic TypeScript5.9.3 are also
NOT_RUN: @clerk/backend and compiler are absent; no installation was authorized.
The actual verifier, issuer/authorized-party rules and default dependency failure
behavior remain unchanged. Independent QA's retained real-JWT probes are separate
evidence and are not claimed as author PASS results.

The unchanged context regression requires the existing frozen activation r2 text
as sibling ../review/first-student-trusted-server.activation.review.sql,
60363 bytes/SHA256e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd,
available at lab8be232eff22c2608b55f7f5513d8752a0307977a under
qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r2/review/.
This external dependency is text-only and is not duplicated in this package.

The119-path source guard remains FAIL on the already stale SDK-worker2133 vs2062
pin. No guard was weakened or re-pinned. Actual PostgreSQL/RLS, provider/driver,
Worker bundle/deployment and runtime readiness remain unproven by these checks.

## Future publication proposal only

Repository oybek-muminov/lab_univeracademy; branch
backend/clerk-name-provisioning-01-r2-20261112; sole parent
88a523bd813e44350a5b2005a813e2f5830ea89d/tree
5a3bec075fccaa30b0179d4106d5b3a240d3e0cd. Prefix:
qa-checkpoints/2026-11-12/backend-clerk-name-provisioning-01-r2/.
Branch/prefix absence was checked read-only. Eleven additions, mode100644:
seven application replacements as checkpoint data, this README, verification,
original author output and manifest. No source patch/archive, SQL, dependency,
private execution packet or Worker-entry content is selected. Source and synthetic
fixtures only; preserved logs contain dummy negative-test DSNs, no real credentials
or person/student data. Publication requires separate user approval and an external
manifest SHA256 pin; author tests are not independent acceptance.
