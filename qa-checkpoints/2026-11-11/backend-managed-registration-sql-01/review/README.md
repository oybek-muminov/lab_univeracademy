# Managed bootstrap and Clerk registration: inactive local review

Status: HOLD for integration; two SQL source derivations prepared, 11 static
checks PASS. No SQL compilation/execution, provider action, installation, upload
or application source change occurred. These files are not runnable migrations.
Both SQL files retain an unconditional review exception and terminal ROLLBACK.

## Exact source dependencies

- SQL A, 34366 bytes, SHA256
  `3a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4`:
  [original30-table bootstrap](https://github.com/oybek-muminov/lab_univeracademy/blob/036beb26e7a6940827daa8691bc04f0326c7df6f/qa-checkpoints/2026-11-11/architect-local-http-pg-flow01/bootstrap.review.sql).
- Activation r3, 60365 bytes, SHA256
  `165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d`:
  [corrected inactive activation](https://github.com/oybek-muminov/lab_univeracademy/blob/4924d64333a4348bfcfa2e632cb6a1d8ccaae6b3/qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r3/review/first-student-trusted-server.activation.review.sql).
- Accepted `clerk-auth-rows.ts`, 23067 bytes, SHA256
  `3a90df4cdb0f106ff7ec84413a4fe6f5569315fdf466557cf3e9f3b5eacb42a0`,
  and `clerk-domain.ts`, 12978 bytes, SHA256
  `a251fafaad42995e298a9a1c62bec4ee37e6889d9ea68aeac2faaffbbea5c8ef`:
  both under commit77e04d13d38054135d0520a04a01c7ff9012bde8,
  `qa-checkpoints/2026-11-11/backend-trusted-server-context-01/`, retaining
  `supabase/functions/univeracademy-api/storage/` relative paths.

All original bytes remain unchanged. The earlier29-file project-source promotion
proposal is retained separately and is not part of this seven-file SQL proposal.

## Derivation and authority window

`bootstrap-managed-operator.review.sql` adds only three marked blocks to SQL A:
operator preflight after BEGIN; a self-attributed owner membership immediately
before CREATE SCHEMA; and exact revocation/postconditions before ROLLBACK.
Removing these blocks reconstructs the original34366-byte SHA256 exactly. The
included unified diff is the complete bootstrap derivation diff. All30 table
definitions, constraints, functions, indexes and triggers are unchanged.

The operator must be the session user, a NON-superuser with CREATEROLE, database
CREATE authority and empty createrole_self_grant. No operator attribute changes.
The temporary grant is ADMIN FALSE, INHERIT TRUE, SET TRUE, GRANTED BY CURRENT_USER.
The matching REVOKE uses GRANTED BY CURRENT_USER and RESTRICT. A final catalog
check rejects remaining self-granted membership, effective SET/USAGE, runtime
owner membership or changes to the two inert application role attributes.
These are SQL assertions, not evidence they have executed successfully.

A future approved single-transaction packet may place the reviewed activation
and registration bodies at the marked point after SET LOCAL ROLE NONE but before
the owner self-grant is revoked. This document does not strip any review guard,
BEGIN or ROLLBACK, compose an executable packet, or authorize COMMIT. Applying a
standalone activation after the window has closed still lacks its prerequisite.

PostgreSQL17 requires SET authority for another role's ownership and separates
SET from INHERIT privileges. See [GRANT](https://www.postgresql.org/docs/17/sql-grant.html)
and [role membership](https://www.postgresql.org/docs/17/role-membership.html).
A true cluster superuser would mask these prerequisites; this preflight rejects
that path. The actual primary metadata is supplied by Architect, not re-queried.

## Registration delta

`clerk-registration.delta.review.sql` is an additive delta against activation r3;
the activation dependency itself has no diff. It adds exactly four policies and
four column ACL grants: INSERT on the three accepted adapter column sets in
people/memberships/clerk_identities, and UPDATE(profile) on people only.

Creation requires exchange phase, canonical singleton person context, exact
case-sensitive verified Clerk identity context and empty Telegram context.
Only a fresh enabled student with empty names/incomplete profile/null group,
inactive zero-revision membership and enabled matching Clerk mapping is allowed.
The accepted adapter's authoritative disabled/absent lookup, identity advisory
lock, existing-person locks, current liveness checks, generated UUID and atomic
insert order remain dependencies. No UPDATE identity/roles/membership authority,
auto-link path, broad table grant, new helper, seed, LOGIN or BYPASSRLS is added.
Database RLS/GUC assertions do not authenticate a holder of the DB credential.

Profile UPDATE requires domain phase, own enabled student, enabled matching Clerk
mapping and a complete bounded profile. Immutable fields derive from non-writable
columns and the unchanged membership projection. Existing SELECT policies and
deferred consistency triggers are retained. PostgreSQL applies SELECT policies
to RETURNING too; see [CREATE POLICY](https://www.postgresql.org/docs/17/sql-createpolicy.html).

## Two explicit unresolved integration gates

1. PostgreSQL17.11 creates an implicit ADMIN TRUE/SET FALSE/INHERIT FALSE creator
   membership for each new role, attributed to the bootstrap superuser. Activation
   r3 rejects every membership involving ua_runtime, including that implicit
   creator membership. Revoking our self-granted owner window does not remove it.
   A non-superuser cannot assume privileges of the bootstrap grantor to revoke it.
   No such grantor is guessed and the activation check is not relaxed here.
   Source: [PostgreSQL17.11 user.c](https://github.com/postgres/postgres/blob/REL_17_11/src/backend/commands/user.c).
   Architect decision needed: review a narrowly witnessed ADMIN-only creator
   exception in activation preflight (no SET/INHERIT/runtime authority), or obtain
   a separately authorized privileged role-bootstrap/removal path. The first is
   the smaller source proposal; neither is implemented or accepted here.
2. Accepted PATCH /me reaches clerk-domain.ts's legacy `perform` at lines92–101,
   which never sets domain phase or verified Clerk context before authRows.flush.
   It remains in auth phase from PostgresTransactions. Enabling auth-phase profile
   UPDATE would weaken the phase boundary and is explicitly rejected. A narrow
   reviewed source correction must route profile writes through current-session
   and Clerk authorization, locks, domain transition and the final earliest-expiry
   guard. No application source was edited in this SQL task.

Actual corrected-activation compilation and primary registration execution remain
NOT_RUN. This package does not establish operational readiness.

## Static reproduction

Python3 standard library only; author used3.12.14. From this package root run:

```sh
python review/test_sql_derivations.py --activation-input /your/lab/qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r3/review/first-student-trusted-server.activation.review.sql --auth-source /your/lab/qa-checkpoints/2026-11-11/backend-trusted-server-context-01/supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts --domain-source /your/lab/qa-checkpoints/2026-11-11/backend-trusted-server-context-01/supabase/functions/univeracademy-api/storage/clerk-domain.ts -v
```

The script pins these three data inputs, reverses the bootstrap additions to the
original hash, checks exact column grants, context fields, policy shapes, immutable
profile bindings and unchanged source authority/lock/rollback ordering. It also
asserts the two known gates remain explicit. It does not interpret SQL predicates,
compile PL/pgSQL, run a policy model, open sockets or use a database driver.

## Required PostgreSQL/HTTP acceptance cases — ALL NOT_RUN

| Case | Required result |
|---|---|
| Non-superuser CREATEROLE, empty self-grant, exact empty baseline | Owner window works; all30 empty tables preserved |
| Superuser control, nonempty self-grant, missing database CREATE or CREATEROLE | Preflight denies; superuser success cannot mask prerequisites |
| Existing role/schema or unexpected grantor/options | Reject collision/drift; no adoption or permanent authority expansion |
| Error after grant or halfway through DDL | Whole transaction rolls back; no partial privileges/schema |
| Future approved transaction completion | Exact self-grant gone; no effective owner SET/INHERIT or runtime owner membership |
| Activation implicit creator ADMIN membership | Current r3 denies; resolve and independently test exact decision first |
| Verified fresh Clerk exchange, correct server context | Person→membership→identity plus existing session writes commit atomically |
| Missing/malformed/empty context, deny/auth/domain phase at creation, cross-person/multi-person scope | Creation denies; no partial registration |
| Caller identity/roles override, teacher/admin/owner roles, enabled=false, Telegram link or completed initial profile | Deny; only server-derived fresh student shape allowed |
| Active/nonzero membership or another person's membership | Deny |
| Wrong-case/wrong issuer or subject; existing enabled/disabled mapping | No reassignment/auto-link; disabled is revoked, not absent |
| Concurrent exchange, UUID/qadam collision, repeated token | Existing lock/unique/replay semantics; no duplicate or partial row |
| Valid authorized own profile with future source correction | Only names/completion change; own bounded profile returned |
| Profile write during auth/exchange, other person, disabled person/mapping, expired/revoked provider | Deny/rollback; no acknowledgment |
| UPDATE id/telegram_id/qadam_id/enabled/roles, identity/membership update, extra profile key or changed group/roles | Column ACL or CHECK/RLS rejects |
| Missing membership/inconsistent profile or forced deferred-trigger failure | Whole transaction rejects; complete invariant visibility retained |
| Commit uncertainty, final expiry equality, cancellation or sequential pooled request | Existing503/commit_unknown, no retry/ACK; no inherited scope |

No provider/DB/credential operations are included. No tools were installed. The
publication proposal is lab review only and requires a new exact user approval.
