# Identity enrollment and current staff readers — unapplied schema review

This supersedes the preceding HTTP checkpoint's unavailable new-identity path
and injected cached staff-authority projection. It adds no public endpoint/DTO.
Public contract/source identity remains9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4.

## Identity gate / atomic initial login

`locateStudent` now returns an internal tagged Telegram scope after actual HMAC
verification; it does not need an existing person lookup. The normal access/
refresh digest scope remains a person hint, reauthorized after locks.
`PostgresTransactions.runIdentity(telegramId, ensure, work)` uses the same checked
out client, BEGIN/COMMIT/error handling as existing-person transactions:

1. Validate verified positive safe integer Telegram ID; lock
   pg_advisory_xact_lock(-telegramId::bigint). Negative bigint keys are reserved
   for this namespace; no full-user/global identity lock is introduced.
2. Read DB clock after that gate; reverify HMAC/freshness/user-ID binding inside
   StudentIdentityRows.ensure. Find canonical people.telegram_id or attempt a new
   cryptographic UUID/Qadam pair, unique insert with ON CONFLICT DO NOTHING.
3. On actual insertion, create inactive membership with epoch/revision0 and no
   affinity group. On uniqueness conflict, resolve canonical Telegram identity or
   try a new UUID/Qadam within the existing configured bound. Exhaustion503, no
   overwrite or partial enrollment. Existing disabled/non-student is unchanged.
4. Acquire canonical person row lock; read DB clock again. Load the scoped rows
   and call the existing student HTTP login logic, which rechecks freshness,
   enabled/student role, consumes replay and rotates one active family. Flush and
   COMMIT precede any profile/token ACK. Any thrown error rolls back enrollment.

New raw user profile values follow the existing verified Telegram/profile
behavior. No additional numeric/role/time policy was chosen. Unknown COMMIT
means no ACK and no auto retry; a fresh signed launch resolves canonical identity
and replaces the active family. Reusing an actually consumed launch still409.
Qadam generation is shared with the existing in-process domain helper; the
production persistence path relies on DB uniqueness, not an in-memory directory.

Unapplied schema requirements: people UUID PK, Telegram ID unique, Qadam ID unique
and10digits; profile/scalar person ID/roles/Qadam agreement; membership person FK
and one-row uniqueness; digest/replay uniqueness and first-revoke constraints from
the preceding proposal. Every identity-creation writer must use the same advisory
namespace/ordering. No DDL, index or migration was executed here. Connection pool
transaction/session settings and actual advisory-lock behavior remain untested.

## Current staff read contract

`StaffAccessRows.locate(pool, proof)` looks up a non-revoked exact issuer+provider
subject mapping. The returned person is a hint. The transaction always locks that
actor plus affected-person hints. `StaffAccessRows.load(tx, proof, actorId)` repeats
the mapping/actor binding and joins current people+staff_access; it then reads
current group/subject scope and Teacher approvals. Readback field types are
checked; absent mapping/access401, disabled/unapproved403, no current staff role403.

Proposed private targets (not inventoried/applied real schema):

| Source | Required current fields / predicates |
| --- | --- |
| staff_identities | issuer,provider_subject,person_id FK,revoked_at_ms; active exact pair unique |
| people | id,enabled,roles; protected administrative writes under the person gate |
| staff_access | person_id PK/FK,approved,manage_roster,manage_content,all_groups,all_subjects; non-null booleans |
| staff_group_scope | person_id/group_id FK pair,revoked_at_ms IS NULL; indexed actor lookup |
| staff_subject_scope | person_id/subject_id pair,revoked_at_ms IS NULL; indexed actor lookup |
| teacher_subject_approvals | person_id/subject_id,approved=true,revoked_at_ms IS NULL |

Rows are projected to the existing StaffAccessRecord fields. No role/capability
is taken from user_metadata/app_metadata/JWT role or a cached StaffState.staff.
The composition replaces the latter with the current DB record. It checks proof
times/account/approval/current role and required provider liveness before loading
private domain data. Existing handler command gates still apply: Admin A
manage_content + group AND subject for assignment; separate manage_roster;
Teacher content via approved subject; existing Owner policy only if the protected
current role row actually says Owner. Nothing grants automatic Owner/Admin status.

Mapping/capability/role/scope/approval changes must acquire the same actor gate so
these reads form a coherent authorization decision. The optional domain locator
cannot remove the authoritative actor or explicit affected person locks. Domain
repositories must still load/lock the right version/group/admission barriers and
enforce their own CAS/constraints. Current code does not claim a complete staff
relational writer or an administrative onboarding API.

## RLS/provider limits and verification

These identity/authorization/proof tables remain private backend-only targets.
No anon/authenticated direct grants or student auth.uid() substitution are added.
Roles/capabilities/scope must have protected administrative writers, not public
profile updates. RLS USING/WITH CHECK, issuer/sub uniqueness and row visibility
need real schema/grant review. Staff JWT verification uses the prior trusted-key
boundary; a provider-valid JWT alone cannot create a staff mapping or grant role.
Actual staff onboarding/mapping/approval and session liveness read permissions are
still required inputs, not synthesized production defaults.

New tests: production constructor4/4; empty-storage identity/current staff9/9.
Affected persistence HTTP9/9 and storage12/12 regressions PASS; typecheck exit0.
The tests start with no people/staff mappings; users are created through HTTP.
Synthetic administrative rows are then explicitly added for scope/approval
tests. Provider ES256 keys are local ephemeral test keys only. No request reaches
a real deployment/provider. The SQL executor is a statement-name dispatcher with
a file ledger/global test queue; it neither parses SQL nor enforces real RLS,
isolation, FK/unique constraints or PostgreSQL advisory locks. There is no genuine
PostgreSQL execution/durability/concurrency proof in these results.

Official reference basis:
[transaction advisory locks](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS),
[INSERT/ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html),
[current application claims/RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[provider session lifecycle](https://supabase.com/docs/guides/auth/sessions).
