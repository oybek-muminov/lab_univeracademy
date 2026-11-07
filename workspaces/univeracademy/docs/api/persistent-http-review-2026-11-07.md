# HTTP storage composition review — LOCAL / NOT ACCEPTED

Current delta connects the existing HTTP implementation to a scoped state
projection, not a second business-rule engine. The preceding storage/auth
proposal remains the schema/RLS starting point. This document supersedes its
statement that HTTP was not yet connected; it does not claim an actual DB test.

## Implemented request/transaction boundary

1. Ready configuration is mandatory. Production accepts only the configured
   postgres storage kind, never the local contract double or an implicit default.
   Missing/non-callable configuration503; unexpected errors500; malformed
   transport400. The generic transport imports no fixture and never constructs
   RAM storage. No incoming URL/header chooses a storage backend or JWT key URL.
2. Student locator verifies HMAC/shape for login or hashes an opaque proof for
   existing sessions. Its lookup is only a person hint. The authoritative current
   account, proof/family and freshness checks run again inside the existing
   student handler after person row locks and DB clock acquisition. Invalid
   bearer never falls back to a valid logout body. Initial identity enrollment
   is deliberately unavailable503 until identity uniqueness/gates are implemented.
3. StudentHttpRows loads only that person's profile, families/proofs/replays,
   grants, series, attempts/answers/results/receipts and visible assignments.
   Private frozen test keys remain backend-only. Current membership epoch and
   active membership come from the memberships join, not a stale grant copy.
   The existing HTTP authorization/schema/CAS/deadline logic is reused.
4. The row flusher rejects foreign/new people and changes to identity/role/group,
   grants, assignment content, bonus/cancellation projections. It writes profile,
   unique replay, family/proof, new attempt, series, answer/ordinary and receipt
   rows on the same client/transaction. Clear keeps the answer row/revision.
   Existing AttemptRows persists CAS and exact result, preserving immutable
   start/deadline/frozen version/order. Returned expiry409 commits before render.
5. Student handler projections are rendered only after flush and COMMIT resolve.
   Unknown COMMIT returns native503 with no ACK or automatic rerun. A subsequent
   GET/reconcile exposes a committed answer revision; a stale save stays409.
   Login/refresh rotation writes only digests. A new login never edits answers,
   generation, deadline or membership. Raw access/refresh/initData are not stored.

## Mandatory configuration review

| Server-supplied configuration | Requirement / current state |
| --- | --- |
| mode / storage.kind | production+postgres only for production; local_contract+postgres_contract_double explicitly for tests |
| storage.pool | PgPool/PgClient driver port; connect/query/release, one checked-out client per transaction; no URL/env default or live pool created here |
| botToken | Explicit secret binding; no fixture/default key selected by production code |
| sessionPolicy | Explicit reviewed policy values; newLogin=revoke_previous; TTL/skew/retention not approved by this code |
| numericPresentation | Policy ID and exact-to-finite/display functions; no hidden question/total clipping or new numeric decision |
| now | Locator wall clock; authoritative transaction clock comes from DB after locks; freshness is rechecked there |
| staff.jwt | Pinned issuer/audience/allowed ES256/RS256, server trusted key resolver and clock; no incoming jku/x5u endpoint selection |
| staff.resolvePersons | Trusted issuer+sub directory -> internal actor/affected person IDs; caller UUIDs are hints, never authorization |
| staff.load / staff.flush | Actual scoped staff repositories must be supplied; no default state/projection; full relational implementation pending |
| staff.liveness | Mandatory current provider session lifecycle check on the supplied transaction; missing503; revoked401; provider permission/schema/expiry semantics need inventory |
| staff.validate / newAssignmentId | Current pinned schema validator and server UUID allocator; no default allow-all validator or fixed production ID |

`requireLiveStaff` runs after locks/current staff load. It rechecks proof expiry,
enabled/approval and mandatory session liveness. Existing StaffHttpHandler checks
current command capability/scope again. JWT role/user_metadata/app_metadata never
grant application authority. Admin A, independent roster capability, Teacher
approved-subject content scope and active-only transfer semantics are unchanged.
The configured composition uses the existing membership-effects business
transition, but implementing its relational load/flush and lock coverage remains
part of the full staff repository work. There is no claimed persistent transfer
or recovery activation endpoint in the current SQL student projection.

## Proposed schema additions / RLS review gates

No DDL/migration/RLS/grant was executed or applied. Query target names/fields are
proposals, not a description of an inventoried live schema:

* people.profile JSON projection must agree with scalar ID/telegram/role columns;
  qadam/Telegram uniqueness and protected role/group mutation are DB constraints.
* assignments.record stores one assignment's private snapshot/content/admission
  projection; published ratios use decimal-string num/den. It is not a whole-DB
  JSON row. Visibility is restricted by own grants or historical own attempts.
* memberships(person_id,active,epoch) joins grants(person_id,assignment_id,
  rostered,grant_epoch). Derived current epoch is not an independently trusted
  copy in each grant. Staff writers must acquire the same person/membership gates.
* attempts scalar owner/assignment/demo/generation/state revision must agree with
  body fields; frozen_test/question_order are immutable. New attempt -> series
  linking needs reviewed unique(person,stable_demo,generation), deferred FK and
  current-attempt constraints, not just the simulated lock discipline.
* exam_series includes ID/current/generation/state revision, normal usage,
  official result pointer and recovery state/window. A new assignment/group never
  resets global normal usage. Own history and proof tables require retention and
  paging/load-bound review before production-scale use.
* answers and ordinary_results retain the preceding PK/FK/CAS/immutability and
  exact numeric constraints; selected option must belong to the pinned question.
* command_receipts are owner-scoped, unique by actor/operation/target/K, with safe
  canonical payload and attempt pointer. No raw session proof response is stored.
* families require partial unique at most one unrevoked family per person;
  first revocation/retention cannot be extended by retries. Access/refresh digest
  keys and family ownership/expiry are immutable; consumed/superseded monotonic.

Keep keys/proofs/private rows outside exposed Data API schemas; no direct anon/
authenticated table grants. Review least-privileged backend role, RLS ownership,
USING/WITH CHECK, private views/invoker mode and transaction-local verified actor
context. Student opaque proofs do not become auth.uid(). Staff JWT is identity,
not current application permission. No RLS bypass may replace these server checks.
Actual RLS, SQL syntax/type mapping, role grants, pool context isolation, unique/FK
behavior, SQL isolation/deadlocks, multi-worker races and provider session lookup
remain NOT_RUN. The statement-dispatch test double proves none of those.

## Verification and remaining blockers

New HTTP suite9/9 PASS: new published version31 -> login/profile/exam/start ->
save/clear/stale CAS -> restart and separate-process resume -> submit/result/
history; deadline equality persisted expiry before409; failed write rollback;
unknown COMMIT503 + reconciliation; successful/failed login and old refresh
isolation; missing production config/no fallback; invalid bearer/logout-body
priority; refresh replay; real offline ES256 staff proof/current scope/liveness/
post-lock expiry; transport400; current membership epoch and foreign attempt404.

Affected storage regression12/12 PASS after adding first-attempt insertion and
sharing the published-snapshot decoder. Typecheck exit0. Production CLI smoke:
NODE_ENV=production, default config ->503 SERVICE_UNAVAILABLE/CONFIG_REQUIRED.
Static relative import closure22 files, fixture/RAM runtime imports0. The old
exact RAM10/132/128/135 suites were not rerun; prior5 JWT-only tests are not
counted as new HTTP evidence.

Remaining blockers are concrete: initial identity enrollment/unique identity
gate; full relational staff content/roster/assignment/transfer/outbox repositories;
actual target schema/roles/RLS/grants review; Postgres query/constraint/isolation
tests; real issuer/JWKS rotation and provider session lifecycle permissions;
reviewed production session/numeric policy and bounded history/proof retention.
Actual Mini App browser integration with this persistence composition is NOT_RUN.
No current real DB/provider/deploy or upload operation was performed.

See the preceding proposal's official references for
[Postgres locks](https://www.postgresql.org/docs/current/explicit-locking.html),
[DB clock](https://www.postgresql.org/docs/current/functions-datetime.html),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [staff session lifecycle](https://supabase.com/docs/guides/auth/sessions).
