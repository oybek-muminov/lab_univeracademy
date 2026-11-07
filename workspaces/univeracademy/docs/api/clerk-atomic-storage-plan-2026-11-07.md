# Clerk identity/session storage — local design, not applied

PROVISIONAL / NOT ACCEPTED. Base b9efa5978498d9150db43531da89820e80dc51ee.
No SQL/migration file is created, no database/connection/provider is used, and no
storage implementation or production activation is claimed by this document.

## Concrete gaps in the current source

* `configured-http.ts` has a Telegram/opaque-student Postgres path and the existing
  UUID staff JWT path. It does not bootstrap Clerk or its full candidate state.
* `storage/student-http-rows.ts` loads `telegramId: integer(p.telegram_id)`, which
  rejects null. Its family SELECT/INSERT/upsert omits F1 `authProvider` and the
  Clerk binding. Reusing it as-is would lose security metadata, not persist it.
* `PostgresTransactions.runIdentity` is explicitly a verified numeric Telegram
  identity gate. Do not cast/hash `user_…` into a fake Telegram number or UUID.
* `ClerkCandidateState` currently includes full domain state plus identity,
  provider-session fence, binding and replay maps, using the RAM test queue.
  The queue/clone proves neither relational atomicity nor cross-worker isolation.
* Existing `LockedTransaction.now` is a captured number. A production Clerk flow
  must refresh the DB clock after waits/provider reads and before mutation/commit.
  A valid JWT at initial verification can expire while a provider call is pending;
  the local handler now rechecks the proof using a fresh configured server clock.
  Actual DB-clock/commit-boundary integration is still not implemented or proven.

These are release blockers. Do not attach the new auth adapter to the old
Telegram storage path or relabel the RAM port as `postgres`.

## Proposed relational invariants

Names below are logical records, not DDL or authorization to deploy them.

| Record | Durable fields and integrity requirements |
| --- | --- |
| Canonical person | Existing UUID, enabled/current roles/profile, unique Qadam; nullable Telegram ID. Null is absence, never0 or a synthetic value. Existing UUID/history/profile remain authoritative. |
| External identity | Exact case-sensitive provider + issuer + subject → canonical UUID; enabled/revision. Unique mapping, no email/name/phone matching, no mutable claimed person ID. |
| Provider student session fence | Issuer + user + sid, canonical UUID, first-retired-at, generation/current marker. Retirement is monotonic; a new jti cannot revive a retired sid. |
| App family | Existing family ID/person/absolute expiry/revocation/tombstone plus explicit immutable auth-provider discriminant. One nonrevoked family per student; expiry still checked separately. Staff bearer sessions are parallel and do not use this fence. |
| Clerk family binding | One immutable family → exact issuer/user/sid/person; foreign-key/composite consistency with family and identity mapping. A Clerk family requires its binding. |
| Access/refresh proofs | Digests only, family FK, expiry/supersession/one-use status; consumed refresh and family revocation must commit together. |
| Exchange replay receipt | Collision-resistant digest of issuer/user/sid/jti with purpose/consumed-at and retained terminal decision. No raw JWT/access/refresh. Unique consume, independent of signature bytes. |
| Attempt/answer/command receipt | Existing person/assignment/attempt/generation, server deadline, per-answer revision and idempotency receipt. Login never rewrites these records. |

Use byte-exact/case-sensitive identity comparison, including issuer normalization
validated at configuration; no lowercasing external subjects/sids. Uniqueness of
nonnull Telegram IDs must coexist with multiple null Telegram values. Canonical
UUID and Qadam uniqueness handle independent creation races without overwrites.
Identity association/unlink/reassignment is a separate blocked protocol.

F1 decoding is strict: missing/unknown/conflicting active origin or a missing
Clerk binding fails503, with no implicit Telegram inference. A Telegram marker
may be created only by a successful server-verified HMAC login; it may not have
a Clerk binding. No reader silently omits origin/binding/fence/replay fields.
Old unmarked active records require trusted provenance migration or fresh login;
no automatic backfill is proposed. Recognizable revoked-family logout ACK is a
non-activating receipt and may not repair metadata or extend first retention.

Enforce the provider/family relationship with reviewed database constraints or a
deferred integrity mechanism as well as the decoder. A simple nullable FK alone
does not establish "every Clerk family has exactly one valid binding". Persist
provenance and binding atomically and prohibit later reassignment. Never use an
inconsistent data snapshot as an authorization grant.

## Transaction protocol

1. Verify JWT signature/issuer/azp/explicit audience and shape with the pinned key
   resolver. Derive trusted identity and replay digest; client request fields do
   not select accounts. Pre-lock lookups are hints, not authority.
2. Begin a DB transaction; acquire a transaction-scoped external-identity gate
   for the exact issuer/subject before first-person creation. Add a dedicated
   identity namespace, not the existing Telegram numeric namespace. All writers
   agree on lock order: sorted external identity gates, sorted canonical UUIDs,
   then provider/family/receipt and domain resources in a reviewed common order.
   Hash collisions may serialize work but never define identity equality.
3. Under the gates, re-read current mapping/person/account and provider sid fence.
   If absent, allocate the student-only UUID/Qadam and inactive empty membership;
   Telegram stays null, profile incomplete, no group/grant/staff authority.
   Conflict resolves only to the exact same external identity's canonical person.
4. Read provider session/user with bounded current reads. Re-read fresh DB time
   after any lock/network wait; recheck JWT and provider absolute expiries and
   current server authority. Revalidate affected domain/CAS state before writes.
   Bounded provider failures must roll back, leaving the old session untouched.
5. Atomically consume exchange replay, retire other provider sessions, revoke old
   nonrevoked app families (including stale expired ones), insert new family and
   F1 binding, and insert proof digests. Minimize expiry to reviewed app/provider
   bounds without extending an existing deadline. A uniqueness guard on nonrevoked
   families is independent of wall-clock predicates; do not put `now()` in an
   index predicate. Expired but unrevoked families are revoked before new insert.
6. Confirm commit before success ACK. If outcome is unknown, do not retry the
   same unchecked write or replay a consumed JWT. Use a new verified proof plus
   durable receipt/current-family lookup as reviewed. Recreating the process
   cannot restore an old provider session or emit a second canonical account.

Refresh/save/login/submit must serialize through the same canonical-person and
attempt/family rules. If save commits before supersession, retain its revision;
if old-session save runs after new login commits, deny it. New login/refresh does
not reset attempt generation, answers, deadline, submission/history or bonus
attribution. Idempotency receipts never bypass fresh actor/capability/scope and
revocation checks. No commit ACK before durable command/grant/revision/receipt.

Provider state and PostgreSQL are not one distributed transaction. A provider
can revoke after its last read. Uncached checks reduce stale grants but do not
prove instantaneous revocation under every interleaving. Any freshness window,
webhook/version fence and accepted failure policy needs explicit review and
tests; do not claim the two sequential provider reads are an atomic snapshot.

## Retention and permissions

Approved staff device policy: Teacher, Admin and Owner may use parallel sessions.
New staff authentication must not revoke any other staff sid or invoke the student
one-family fence. Revoked/expired staff provider sessions and current role/scope
changes still deny. No new staff capability, login DTO or provider logout is added.
See `clerk-timing-d1-d2-2026-11-07.md` for the current local implementation.

No TTL is selected here. Never expire a sid retirement fence just because an old
JWT expired: that sid may mint a fresh jti while the provider session is active.
Keep the fence until provider terminal state/no-future-mint bound and all replay,
family, tombstone and retry windows are demonstrably closed; otherwise retain it.
Consumed-proof GC must not make replay acceptable. Logical expiry is enforced
even if physical purge has not run, and retries cannot extend first retention.

Keep identity/proof/binding/fence records in the private, unexposed schema; no
client `anon`/`authenticated` grant to read/mutate them. Review a least-privilege
server role and RLS as defense in depth. Clerk `user_…` is not a UUID `auth.uid()`;
the trusted Backend resolves the canonical UUID and current staff capabilities/
group AND subject scope. JWT/custom metadata and frontend person headers do not
grant roles. Existing Admin assignment policy A stays `manage_content` plus
current group/subject scope; roster permission remains independent.

Use transaction-local trusted context and reset it at pool boundaries; never
leak person/scope across reused connections. Test actual effective grants/RLS,
including privileged/bypass-role behavior, instead of assuming policy presence
enforces it. Reuse the existing pool port that strips named prepared statements
for transaction pooling. No service-role key or provider secret belongs in UI.

## Acceptance tests still required on a real isolated Postgres target

NOT_RUN: two independent connections creating the same identity; Qadam collision;
case-sensitive subject distinction; multiple null Telegram identities; conflict
with an already mapped UUID; origin/binding/fence loss on reload; partial-write
rollback at each stage; consumed jti after restart; re-signed same jti; new jti
for retired sid; login/login, login/refresh, login/save and submit races; queued
proof expiry after lock and after provider reads; provider outage; no success ACK
on commit-before/after uncertainty; stale family and delayed GC boundaries;
expired/null/unknown metadata decoder; no profile/answer/history rewrite; actual
RLS/grant separation and pool-context leakage. Mocks are not this evidence.

Current code test evidence covers the provider boundary with substituted replies
and existing RAM transaction behavior only. A future durable adapter/schema and
fresh-clock integration must be reviewed/tested before real deployment permission.

References: [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html)
for lock behavior/order and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
for grants/policies. These sources inform technical design, not our product
authorization decisions. No database query was run for this local design.
