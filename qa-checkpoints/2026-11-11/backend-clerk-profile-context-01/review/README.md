# Profile context and creator-ADMIN correction: local candidate

Author-only source candidate; no SQL compiled/executed, no primary/provider action,
installation or deployment. The previously approved seven-file package remains
unchanged at lab commitff75be9908bf5b29f64c0c067b631b8161d688c7.

## Exact application scope

Use your own accepted288-file application assembly through Cloudflare r2
9a5679712b838a9ede1136926770a7914c3203bf, based on main source
de2adf023428a374f075faa421ece9e1deafaf36 and its accepted preceding overlays.
Overlay only these two application paths:

- supabase/functions/univeracademy-api/storage/clerk-domain.ts
- tests/backend/student-prepared/profile-context.test.mjs

The other287 original application files, Mini UI/guards, frozen SQL, pool/Worker
modules and the clean project-promotion inventory are unchanged. No application
package/lock, public contract or configuration is changed. The default bootstrap
remains closed. The application is not the laboratory repository tree.

PATCH /me alone uses the new private profile transaction. It resets all six keys,
locates the exact opaque proof on the same client, locks the hinted person and
validates current proof/person/identity/fence/provider authority. The core callback
remains in auth. After its success, the pre-mutation locked snapshot supplies the
request proof's exact family and persisted Clerk binding. The adapter revalidates,
sets verified Clerk context while still auth, enters domain, revalidates and flushes
only the profile. No exam/answer data is loaded. Body/header identities are unused.
Only Clerk provenance may supply Clerk keys; missing/inconsistent authority fails.
The existing registration/relogin auth store remains in exchange phase.

The provider lease only shortens, including checks made inside the core callback.
The final synchronous runPrepared.beforeCommit guard checks clock/expiry and
cancellation. Immutable identity/roles/qadam/group and all non-profile snapshot
fields remain protected. Setter/flush failures roll back; uncertain COMMIT keeps
503/discard-once/no-retry behavior. GET/refresh/logout take their original paths.

## Separate inactive activation derivative

Input is unchanged activation r3 at4924d64333a4348bfcfa2e632cb6a1d8ccaae6b3,
60365 bytes/SHA256165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d.
Only its roles preflight block changes. All helper/ACL/RLS/ownership-transfer and
cleanup bytes outside that block, including guard and ROLLBACK, remain unchanged.

The derivative resolves the current session's postgres operator and requires its
known non-superuser CREATEROLE/BYPASSRLS attributes. It separately resolves the
reviewed bootstrap witness OID10/name supabase_admin/SUPERUSER. It requires exactly
one membership involving runtime: runtime as role, that operator as member, that
bootstrap role as grantor, ADMIN true, INHERIT/SET false. Runtime as a member,
missing/extra rows, wrong identities/options or usable authority fail closed.
No privileged revoke or new membership grant is introduced. Runtime's existing
NOLOGIN/NOBYPASSRLS/no-owner separation checks remain.

See PostgreSQL's [membership catalog](https://www.postgresql.org/docs/17/catalog-pg-auth-members.html).
OID10/name binding is the explicit Architect decision, not an inferred primary
mapping. The synthetic case IDs50001/50002/50003 are test data only.

## Reproduction and observed results

Node24 built-ins suffice for the focused tests; author Node24.22.1. From the
reconstructed application root:

```sh
node --test tests/backend/student-prepared/profile-context.test.mjs
```

36 focused PASS. Existing325 Backend regressions plus98 Cloudflare checks PASS;
one real-JOSE branch is explicitly skipped because jose6.2.15 is absent here.
Both changed-file syntax checks PASS. Exact commands, UTC, exits and byte/hash
identities of the original logs are in verification.json and author-checks.log.
Root semantic TypeScript5.9.3 is NOT_RUN here; no compiler was installed.

Two key tests using this final test file and frozen original clerk-domain.ts both
FAIL (expected exit1); they PASS with the correction. Early development failures
were corrected: the strict test double needed both existing exact clock-statement
spellings, and snapshot comparison needed canonical snapshot field ordering.

Existing context regression text check still needs the external, inactive SQL r2
at8be232eff22c2608b55f7f5513d8752a0307977a,60363 bytes/SHA256
e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd,
as sibling ../review/first-student-trusted-server.activation.review.sql. This is
text data only and is not replaced silently with the new derivative. It is
already available in the lab and is not duplicated in this package.

For the new activation preservation checks, Python3 standard library only:

```sh
python review/check_activation_derivative.py --activation-input /your/lab/qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r3/review/first-student-trusted-server.activation.review.sql -v
```

Six static checks PASS. Eleven membership rows/case sets plus catalog-identity
negatives are prepared in runtime-creator-membership.cases.json. Actual PostgreSQL
evaluation of those cases is NOT_RUN; static checks are not RLS/DDL acceptance.

The unchanged119-path guard still FAILS on its earlier clerk-auth-rows.ts pin
(23067 vs22634). No guard was changed or weakened; a separate reviewed re-pin is
needed. These fixes do not prove Worker packaging, real TLS/driver/Clerk or primary
readiness. SQL installation and a one-user test still require their reviewed run
packet and approval. No further publication is authorized by this local task.
