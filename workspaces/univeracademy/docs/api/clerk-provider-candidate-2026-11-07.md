# Clerk provider adapter and production auth settings candidate

PROVISIONAL / NOT ACCEPTED. Local base b9efa5978498d9150db43531da89820e80dc51ee.
No upload/commit/push, real Clerk/Google/Supabase call, database mutation or deploy.

## Implemented locally

`supabase/functions/univeracademy-api/clerk-provider.ts` exports:

```ts
readClerkProductionAuthSettings(environment): ClerkProviderSettings;
createClerkProviderAdapter(settings, bindings): {
  verifier: ClerkVerifierConfiguration;
  liveness: ClerkLiveness;
};
```

These are auth dependencies, not a production HTTP bootstrap or another client.
The existing `createClerkVerifier`/jose 6.2.15 signature verifier stays byte-identical.
The F1-protected handler now rechecks fresh server time after provider reads;
see `clerk-timing-d1-d2-2026-11-07.md` for the timing fix and approved staff policy. No new dependency, Clerk SDK, environment sniffing, default fetch,
secret loader, provider write or RAM storage fallback is introduced.

Settings are one explicitly supplied server-side JSON value
`UA_CLERK_PROVIDER_SETTINGS`; the nonroutable placeholder example is
`contracts/clerk-provider-settings.example.json`. Required: exact HTTPS issuer,
authorized-party origins, explicit required-audience or no-audience profile,
finite public-JWKS cache/cooldown, timeout and size limit. Example 300s/30s/3s/64KiB
values are technical candidates, not approved app/session TTLs. Invalid/missing
configuration fails503 before I/O, without echoing config text.

Bindings are explicitly supplied trusted server functions: `now`, `fetchJwks`,
`getSession`, `getUser`. No secret value is read or stored by this module. The
session/user port accepts Clerk Backend SDK camelCase object shapes, not raw
REST snake_case JSON. The SDK itself/credential transport is not installed,
pinned or exercised here; server integrators must review that concrete binding.

JWT key lookup is fixed to configured issuer + `/.well-known/jwks.json`.
Token `jku`/`x5u` cannot select a URL. Fetch is GET, redirect:error,
credentials:omit, cache:no-store and no Authorization/cookie. Body is bounded,
JSON is strict UTF-8, public key material only; jose selects/imports/verifies it.
Known public keys may be cached for the explicit configured time. Unknown-kid
rotation remains issuer-pinned and rate-bounded by the configured cooldown.
No external cache input or stale-on-error fallback is accepted.

Signature algorithm RS256, issuer, azp, explicit audience, v2, required claims,
case-sensitive `user_…`/`sess_…`, expiry/not-before, pending and impersonation checks
remain unchanged. JWT roles/email/org claims are never added to verified authority.

## Liveness normalization and errors

Every check reads the current Backend Session and User; there is no local cache
of enabled/session state. Require exact session ID/user match, active status,
actor=null, safe millisecond expireAt/abandonAt and exact user ID. Require explicit
boolean banned/locked/deprovisioned; absent flags fail closed, never default false.
Check fresh local clock after reads and bound expiry by min(expireAt,abandonAt).
Actual tenant/SDK field support, units and account flags remain unverified; a
missing field produces503 until a trusted reviewed normalizer provides it.

| Provider outcome | Candidate behavior |
| --- | --- |
| Matching active session/user, all enabled flags false | Normalized current liveness; expiry min of provider bounds |
| Known session/user404, nonactive/impersonated session, ID mismatch, disabled flag or expired/equal boundary | Normalized denial → existing requireLiveClerk returns401 |
| Missing/malformed security field, SDK credential401/403,429/5xx, transport error, timeout or clock regression | 503; no offline grant or automatic retry |
| Invalid signature/issuer/azp/audience/JWT time/status/actor | Existing verifier401 |
| JWKS malformed/status/redirect/private material/oversize/timeout | 503 |

`requireLiveClerk` maps thrown read failures to503. The adapter therefore returns
a normalized revoked record for known resource/session denial, preserving that
helper's final401 branch; it does not throw a401 that would be misclassified503.
Arbitrary provider response text is never returned/logged. Timeout denies even
if a supplied port ignores cancellation. Actual transport must honor AbortSignal
to stop pending I/O; the adapter alone cannot force an uncooperative SDK to stop.

## Real/synthetic boundary and tests

Tests use real RSA signing/verification and jose remote-JWKS code with substituted
Response objects; getSession/getUser are synthetic port replies. No real HTTP
request is sent to a provider. A cached key never skips the fresh session/user
port reads. Integration tests attach these dependencies only to the existing
explicit `local_candidate` handler/RAM fixture, not the production route.

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

The original nine provider checks plus ten timing checks cover settings/no-I/O, fixed key transport/cached keys versus
uncached liveness, cryptographic/claim failures/key rotation/audience profiles,
malformed/public-JWKS boundaries, current session/user flags/expiry, read error
classification, timeout/fresh clock, nullable-Telegram new identity/replay/F1
binding loss and old/new-session save/deadline preservation. Test logs and exact
hash manifest are in `evidence/clerk-provider-2026-11-07/`. The initial failure log
is a test-fixture reset mistake: after key rotation the required-audience case
still served the rotated key while signing the old one. Only that fixture was
corrected; production verification was not weakened.

## Remaining production blockers

`docs/api/clerk-atomic-storage-plan-2026-11-07.md` specifies the proposed unique
mapping, nullable Telegram, immutable origin/binding, retired-sid/replay retention,
one-active-family, consistent locks/commit boundaries and RLS/grant test plan.
It is design only. Current SQL readers lose F1 context and reject null Telegram;
the existing configured HTTP/Vercel path does not integrate Clerk. No adapter is
represented as durable storage merely because its type/function name says so.

The local handler now rechecks JWT/provider expiry after remote waits with its
configured fresh monotonic server clock and before returning the transaction work.
Production still needs a fresh DB clock and actual commit-boundary integration;
the current local handler/RAM clock is not that durable proof. Provider session/user reads also are not a distributed atomic
snapshot with the DB; post-read revocation races need a reviewed freshness/fence
policy before promising instantaneous invalidation. SDK/key/issuer/azp/audience
and credential bindings must be checked against the actual tenant later.

The user approved parallel Teacher/Admin/Owner devices; only students have one
active app family. Current staff authority checks remain, without the old device
gate. No new decision on linking/unlinking/merging, challenge TTLs or provider
lifecycle is made. Existing link409, retired student sid fences and old-unmarked-
family503 remain. Missing real staff configuration still fails503. Real provider/DB/RLS, full production
HTTP bootstrap, independent QA, browser OAuth and deployment are NOT_RUN.

Primary references checked 2026-11-07:
[Clerk manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification),
[Backend Session](https://clerk.com/docs/reference/backend/types/backend-session),
[Backend User](https://clerk.com/docs/reference/backend/types/backend-user),
[getSession](https://clerk.com/docs/reference/backend/sessions/get-session).
Supabase's markdown changelog was unsupported by the browsing tool; its HTML
changelog/RLS docs were read instead. No new Supabase feature/SQL was implemented.
