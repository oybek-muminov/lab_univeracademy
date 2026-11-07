# Clerk identity/auth candidate — local review only

Base checkout: `9a9dd43cd0f565bac8f8b333b044f54650919531` (Mini App guard repin to
Backend47ed6f8). No upload/commit, DB/schema/migration, Clerk/Google/provider,
credential/OAuth or deployment change was made. No Clerk SDK/client credentials
were installed or read. Existing jose6.2.15 performs offline signature checks.

The source API, generated client/types and dependency locks are unchanged.
`contracts/clerk-auth.proposal.patch.json` is an **unapplied, NOT ACCEPTED**
proposal for `0.3.0-clerk-auth-proposal.1`, based on API SHA256
`9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`.
It adds an exchange operation and candidate Clerk security for the six implemented
staff commands. It does not confer any new role/capability/group/subject right.

## Proposed consumer handoff

```http
POST /api/v1/auth/clerk
Authorization: Bearer <Clerk session JWT>
Content-Type: application/json

{}
```

Success200 uses the existing `SuccessSession` envelope: data.access_token,
refresh_token, expires_at, refresh_expires_at, token_type and profile. These are
opaque application proofs, not a reflected Clerk token. Existing student API
operations keep using the opaque bearer. A Clerk JWT is not accepted as an opaque
proof and body/query/cookie credentials do not replace the Authorization header.
Current generated client does not yet expose this new operation; consumer/client
generation and full contract/profile acceptance remain pending.

## Verified external identity and current authority

`createClerkVerifier` accepts the explicit local supported profile: configured exact
HTTPS issuer, trusted backend key resolver, RS256, v2, required sub/sid/iat/nbf/exp/
azp/jti/v and integer NumericDates. `user_…` and `sess_…` IDs are case-sensitive,
with nonempty alphanumeric suffixes; fixed lengths are not guessed. Trailing
newlines and UUID/other prefix substitutions are rejected. Signature/algorithm,
issuer, expiry equality, future dates, exact authorized party, pending status and
impersonation are checked. Audience is explicit: required configured value, or a
selected default-profile mode requiring aud to be absent. Unexpected audience is
never silently ignored. Missing azp is rejected by this supported browser profile;
native/privacy cases needing another profile require review.

The existing UUID/Supabase staff verifier is unchanged; its UUID/session_id,
issuer/audience/role checks were not widened to fit Clerk IDs. Clerk proof contains
only identity/time/session fields. JWT custom/organization role, permission, email
and name claims do not authorize or link accounts.

`ClerkLiveness` is a required normalized server port returning the exact issuer/
user/session tuple, active status, enabled provider account and session expiry in
UTC milliseconds. Revocation/mismatch denies401; source outage returns503. Actual
SDK/API response normalization (including expireAt units/account flags), bounded
freshness, availability and permission setup remain to be implemented and tested.
No real Clerk network call occurs in this candidate.

The authoritative server mapping `(issuer,userId) -> internal UUID` must be current
and enabled. Existing internal person identity, roles, profile, roster and history
are reused. Staff roles come from the current internal person; current staff
enabled/approval/capabilities and group/subject scope remain mandatory. A cached
Owner projection or a valid signed token cannot restore a revoked role or scope.

## Existing/new account and optional Telegram

An absent Clerk mapping creates a UUID student with a unique Qadam ID, empty names,
incomplete registration, null Telegram/group and inactive revision0/epoch0
membership. No grant/staff authority is created. Existing disabled/unmapped-revoked
identities are not recreated or enabled. No email/phone/name matching merges a
Telegram or Google/Clerk identity. Google authentication itself stays upstream;
Google ID tokens do not become a separate trusted backend proof.

`Person.telegramId` is nullable in the internal local type; no fabricated Telegram
ID is used. Existing profile wire schema already permits empty names while
registration is incomplete. The earlier SQL readers/schema are **not adapted for
nullable Telegram or Clerk auth metadata**; this is a concrete persistence blocker,
not claimed relational readiness.

Existing trusted mappings may represent an already-linked Telegram account in the
synthetic harness. Legacy HMAC login can be explicitly supplied through the existing
optional port for compatibility tests, default unavailable; it does not establish
a link. `POST /auth/telegram/link` authenticates Clerk/current mapping/liveness and
then returns409 IDENTITY_LINK_POLICY_UNRESOLVED without mutation. It is intentionally
not added as a usable OpenAPI link operation. Two-proof linking, ownership/nonce/
expiry/replay, conflict/transfer/unlink and the UI protocol require a product/security
decision. No link timeout or automatic merge decision is invented here.

## Student session fence and transaction requirements

After a verified proof, locked server time and current provider/account checks, the
exchange consumes a hash of `(issuer,userId,sessionId,jti)` and creates a bound opaque
family in one transaction. Re-signing the same jti does not produce a second effect.
The family expires no later than the supplied app policy or provider session end.
Old active families are revoked using the existing helper; first revocation and
logout retention are not extended. Answers, attempt generation/revision, published
snapshot, deadline and history remain unchanged.

New successful student session S2 retires S1 for application access. S1 cannot reclaim
the account by refreshing its JWT or replaying a receipt. A fresh JWT for the still-
current session can recover an exchange whose COMMIT outcome was unknown; the same
consumed jti returns409. Failed/expired/revoked login rolls back without disturbing
the active session/account. Recognizable old-family body-only logout may still ACK
inside the existing tombstone window; it never activates or revokes another family.
Invalid bearer never falls back to a body proof. Provider liveness and the immutable
family binding are also checked on opaque access/refresh, not only at exchange.

Known retired provider sessions remain denied in this local fence. The explicit
interactive re-entry UX on the old device is pending; this adapter neither creates
new Clerk sessions nor revokes provider sessions. Do not implement a background
exchange loop that silently reinstates a retired device. No retired-session or
proof-digest cleanup TTL is chosen: retention must cover actual provider session
and JWT replay lifetimes before a persistent GC policy is accepted.

The injected transaction port has no default store. A future durable implementation
must lock external identity (including first signup), canonical person and applicable
session/family rows in a common order, use fresh locked DB time, recheck current
identity/role/provider state, and atomically persist new account/Qadam/membership,
provider mapping, consumed proof digest, retirement fence and family/access/refresh
digests. It must never store raw JWT/opaque proofs or a response containing them.
ACK follows COMMIT; unknown outcome stays503, no automatic write/login retry.

## Staff device rule remains open

Candidate staff routes use Clerk identity/time plus current mapped server authority,
then the existing staff handler and its scope/CAS/idempotency rules. A reviewed
`staff.deviceGate` is mandatory. Without it, valid staff requests fail503
STAFF_DEVICE_POLICY_UNRESOLVED; no one-device or multi-device staff rule is assumed.
Tests inject a narrow synthetic gate for known fixture sessions solely to exercise
current permission checks. That gate is not a production policy or implementation.

## Local entry and evidence

```ts
createClerkCandidateHandler({
  mode: "local_candidate", transactions, verifier, liveness,
  sessionPolicy, numericPresentation,
  // optional legacyTelegram; staff with validator/ID port and reviewed deviceGate
}); // (Request) => Promise<Response>
```

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:clerk-auth
npm run typecheck
```

Final selection20/20 PASS:15 new Clerk/contract checks plus5 old staff JWT regressions;
typecheck exit0. Cases include wrong signature/algorithm/issuer/audience/ID/time/
status/azp, current session/account source failure, fresh/existing mapping, empty
student rights, concurrent signup and replay, unknown COMMIT, preserved answers/
deadline, superseded-session denial, optional legacy Telegram association, blocked
linking, server role/capability/scope/device gate and revoked receipt replay.

The contract patch was applied only to an in-memory copy for pointer/reference/
scope checks; its new empty request schema was compiled with the existing strict
Ajv profile. The original OpenAPI/pins/client were not changed. Full new OpenAPI/
generated-client acceptance is NOT_RUN. No validator pin was bypassed.

`ClerkMemory` is a global-queue whole-state-clone transaction double, not a durable
DB or real concurrency/locking proof. RSA keys and provider sessions are synthetic.
Actual Clerk/Google SDK/JWKS/login/session API, database/schema/RLS/identity uniqueness,
nullable reader adaptation, Vercel bootstrap/auth routing, Mini App/browser/Telegram
link UX, provider revocation latency and capacity remain NOT_RUN. Vercel default
entry stays unchanged/unconfigured503. No current API acceptance is inherited.

Primary sources checked: [Clerk session claims](https://clerk.com/docs/guides/sessions/session-tokens),
[manual verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification),
[getSession](https://clerk.com/docs/reference/backend/sessions/get-session) and
[Backend Session](https://clerk.com/docs/reference/backend/types/backend-session).
