# F1 local fix — missing Clerk family binding

Base: `d94cf2feb5d6050bae04d80d530fc02201caae36`. LOCAL ONLY; nothing committed,
uploaded or deployed. No real Clerk/DB/provider/schema/migration/credential change.
Independent QA retest is still pending. Existing contract/client/policies are not
accepted or changed by these local tests.

## Reproduction and root cause

The QA fault was independently reproduced on the exact base with a synthetic
student/session. After provider status was changed to revoked, the intact binding
made GET /me and POST /auth/refresh both401. Deleting only
state.familyBindings[familyId] made both200 and refresh issued a new access proof.
`repro-before.json` records statuses/boolean only; no token value is recorded.
This is server-state fault injection, not evidence of an external exploit path.

Root cause in guardBoundFamily was the combined early-return condition:

```ts
if (!family || family.revokedAt !== null || now >= family.expiresAt || !binding) return;
```

The absent binding was silently treated as an optional provider-less/legacy case.
The core opaque-proof ledger then authenticated or rotated the still-active app
family without invoking Clerk's current-session check. The JWT verifier itself
was not bypassed/modified; the post-exchange provider guard was skipped.

Review of the same guard found a related credential-selection mismatch:
familyHint preferred an Authorization header, but the core refresh operation uses
the body refresh proof. An invalid/unrelated bearer could select no/wrong family
for the provider guard while the core used the real body proof. The local fix also
makes refresh guard that exact body family. Logout retains bearer-first handling
and never falls back from an invalid bearer.

## Minimal source fix

Only clerk-http.ts and the internal Family type change; one new regression file.

* A successful Clerk exchange writes authProvider:"clerk" in the family and its
  immutable Clerk binding in the same injected transaction.
* Only a newly created family after the existing successful verified Telegram HMAC
  login in this wrapper gets authProvider:"telegram". No marker is inferred from
  a missing binding, linked account, Telegram ID, role, email or client header/body.
* An active Clerk family requires its binding. An active Telegram family requires
  explicit provenance, the configured legacy port and no conflicting Clerk binding.
  Missing/unknown/conflicting context returns503 SERVICE_UNAVAILABLE before core
  access/refresh. No proof, account state or retirement/retention value is changed.
* Refresh's locator follows the same body proof as its core handler. Unrelated
  Authorization no longer skips/misbinds the guard. Other bearer/logout semantics,
  current identity/scope checks and all cryptographic checks remain.

Expired/revoked ledger proofs still follow the existing core denial paths.
Recognizable revoked-family body-only logout inside its tombstone can still ACK200;
this cannot repair missing context, create/revive a proof, extend retention or
revoke the new family. This existing narrow ACK is not a successful /me or refresh.

| Synthetic condition | Before | After |
| --- | --- | --- |
| Revoked provider, intact Clerk binding | /me401, refresh401 | /me401, refresh401 |
| Revoked provider, binding deleted | /me200, refresh200/new proof | /me503, refresh503/no proof |
| Active family origin missing/unknown or conflicting | fallback possible | 503, no mutation |
| Valid explicit Telegram HMAC origin | normal opaque auth | normal opaque auth; marker required |
| Refresh body family blocked + invalid/unrelated bearer | guard/core could use different proof | body family guarded;401 or missing-context503 |

## Verification

The four initial regression cases were run before the fix:3 failed and1 passed,
including actual200 vs expected503 for the QA case. After the fix, those four
passed. A fifth regression covers refresh body proof selection with invalid and
unrelated bearer plus logout's no-fallback behavior.

Final command:

```sh
node --test tests/clerk-auth/family-context.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/verifier.test.mjs tests/clerk-auth/contract.test.mjs tests/storage-auth/staff-jwt.test.mjs
npm run typecheck
```

Result25/25 PASS (5 new,20 existing), typecheck exit0. Existing tests were not
edited. Clerk and legacy UUID verifiers, original OpenAPI, proposed contract,
client/types/locks, Vercel entry and all Mini App files remain byte-identical to
base. Before/after source hashes and exact red/final logs are in
`evidence/clerk-f1-2026-11-07/`.

## Limits / deployment gate

`authProvider` is optional in the shared legacy type for old standalone callers,
but the Clerk candidate requires explicit recognized provenance for every active
family. Existing unmarked families are denied503, even with a binding: no implicit
backfill guesses Telegram. A reviewed trusted migration or fresh verified login
is needed before using such persisted records with this adapter. This task performs
no migration/backfill. The existing standalone Telegram handler is unchanged.

Real persistence must atomically retain the provenance and binding and protect
their integrity/immutability under the same account/session transaction and access
controls. Current SQL Clerk persistence/nullable Telegram adaptation is still
unimplemented; a storage reader dropping the provenance must fail closed too.
This is not protection against arbitrary trusted-server writes forging all auth
records; external exploitability and actual DB permissions were not established.

The synthetic global-queue memory store is not PostgreSQL/RLS/isolation evidence.
Real Clerk session/JWKS, DB, provider latency/failover, browser/Vercel, deployment
and capacity remain NOT_RUN. Telegram linking and staff device-policy questions
remain open; Vercel default entry remains unconfigured503. No existing acceptance
or independent QA closure is claimed.
