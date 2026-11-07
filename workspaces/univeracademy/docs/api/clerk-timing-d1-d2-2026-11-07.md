# Fresh authorization time, D1/D2 and approved staff sessions

LOCAL CANDIDATE — PROVISIONAL / NOT ACCEPTED. Based on lab b9efa5978498d9150db43531da89820e80dc51ee
plus the previous local provider candidate (manifest 416f93f817b7a6669050b5f20fa1c3a382c33107f2db1d8d5ea1f07467a164e1).
No upload, commit/push, provider write, real database/SQL/migration or deploy.

## Timing fix and boundary

The old exchange captured transaction time, checked JWT, awaited the provider and
then created/revoked families using that old time. A delayed valid provider reply
could therefore create a new profile/proofs at JWT exp or later. Opaque refresh
could similarly use the captured pre-provider time, and linking/staff paths did
not recheck the JWT after their provider await. The red check reproduced five
failed test groups (two passing) before the fix.

`clerk-http.ts` now uses a common `verifyCurrentClerk` guard for exchange, blocked
linking and staff. It checks JWT before the provider read, reads a fresh trusted
server clock afterwards, then checks JWT and the provider expiry again. No grace
or rounding: `now < exp` and `now < providerExpires` are required; equality denies.
The same monotonic server clock is used for the following core operation. It
must be a safe nonnegative millisecond integer, not behind the lock-time floor
or earlier checked time; invalid/regressing clock fails503 without mutation.

Exchange also performs the replay-digest await before account creation or old
family supersession. A final recheck after proof hashing/issuance throws on late
expiry, causing the transaction clone to roll back; no response proofs or new
profile/identity/replay/family records commit. App proof expiry is checked too.
The root F1 provenance/binding and retired-student-sid checks remain intact.

Opaque me/refresh/save delegation receives the fresh post-provider server clock,
not the captured transaction clock. Revoked/expired-family core and tombstone
logout behavior remain separate. Staff work also checks time after async work
before returning the draft state to the transaction port.

`clerk-provider.ts` checks the returned session and user models again after the
last provider await and fresh clock read: session/user identity, active/actor,
enabled flags, expireAt and abandonAt. This prevents retaining an earlier active
decision even if a supplied mutable SDK object changes while User is pending.
This is validation of the latest returned evidence, not a second network polling
loop or a promise that remote state cannot change after its last observation.

Production still needs coherent fresh DB time after waits and at the actual
commit boundary. The local helper uses the explicitly configured server clock;
the RAM transaction and its captured lock floor are not durable Postgres proof.
Provider and DB remain separate systems; instantaneous cross-system revocation
cannot be guaranteed by these sequential reads. No real provider call was made.

## Approved device rule

The user confirmed: only students are limited to one active device. Teacher,
Admin and Owner may use parallel devices. The local staff device gate and its
previous unresolved-policy503 branch are removed. Missing actual staff config
still returns503; invalid/expired/revoked provider proof still denies401; current
canonical role/account/approval/capability/subject/group checks stay in force.

Staff authentication uses its current Clerk bearer on existing scoped staff
operations. It creates no opaque student family and does not retire another staff
sid. There is no new staff login endpoint or new capability. `/auth/clerk` remains
the student opaque-session exchange and rejects a staff-only account403. This is
not a completed staff browser login UI or a change to the old Supabase-JWT path.

A successful new student exchange revokes the prior student app family and
retires its old student sid; failure does neither. Staff auth never reads that
student fence as a staff-device gate and never invokes global provider logout.
Saved answers/revision, attempt generation, server deadline and history persist.
Current staff revocation/role removal still defeats old idempotent command replay.
Owner's existing global authority and Admin/Teacher capability rules are reused,
not expanded. No identity or scope is chosen from token role/email claims.

## D1 — distinct server purposes and state machines

These are protocol states for review, not newly enabled endpoints or DTOs.

| Purpose | Proposed states | Current implementation and invariant |
| --- | --- | --- |
| Student sign-in | initiated → provider-verified → exchange-committed; failed/expired are terminal | `/auth/clerk` strict{} body; verified mapped UUID reused, or incomplete ungrouped student created only after valid final checks. One active student family. |
| Staff sign-in | provider session active → current authority authorized; independently revoked/expired | Existing staff bearer path; another staff sign-in does not close this sid. No student exchange/family or inferred role. |
| Add Telegram/Clerk identity | authenticated A → fresh A reauth → prove B → explicit confirmation → association committed; conflict/cancel/expiry terminal | Linking stays409, except invalid/expired proof401; no login, account creation, session supersession or link mutation. |

Bind server-side purpose to the challenge at initiation. A frontend `mode=link`,
person ID, callback string or token email cannot switch login into association.
The exchange rejects extra purpose/mode/person fields422 without consuming proof.
Link proof B is verified without running normal student exchange, which could
otherwise create an unwanted second account. Proof A must still control the same
canonical account/family at confirmation; a cached opaque proof alone is not
fresh reauthentication. Actual reviewed A/B reauth support is still pending.

If B maps to another UUID, return a generic conflict without merging, moving or
overwriting either profile/history. If B already maps to A, only a reviewed
idempotent association receipt may ACK after current authorization. Never copy
provider name/email into an existing profile. Both proofs, identity uniqueness,
challenge consumption and mapping change must eventually be one DB transaction.
No TTL, unlink/reassignment/merge process or implicit upstream email linking is
approved here. The tenant/SDK's own email-association behavior is still unverified.

## D2 — callback and external-browser protections

The callback is not a sign-in or link success by itself. All of the following
are design requirements; the callback/bridge is NOT implemented or tested here.

* Use an exact server-configured HTTPS callback allowlist (scheme, host, port,
  path and approved parameters). No arbitrary return URL, open redirect, wildcard
  origin or trust in forwarded headers. The reserved domain is not configured.
* State is random, one-use, stored as a digest and bound to purpose, expected
  provider/issuer, initiating user-agent/PKCE evidence and the current A family
  for linking. A public correlation ID alone grants nothing. Reject duplicate,
  missing or malformed state/code/issuer fields; do not use last-value-wins.
* For a controlled OAuth flow require authorization code + S256 PKCE and a
  transaction-specific OIDC nonce where applicable. For Clerk-managed redirects,
  verify actual SDK ownership/binding of state/PKCE/nonce before relying on it;
  do not invent a supported nonce claim or append an unverified state parameter.
* Verify expected issuer and token signature/audience/azp/time/status after code
  redemption. Check fresh server time after every provider wait and again before
  committing. A nonce/state match never excuses expired or revoked proof.
* Callback-state consumption and later explicit-link confirmation use different
  one-use nonces. Bind all transitions to the original challenge and disallow
  reset/extension after cancellation, expiry or replay. Concurrent callbacks must
  serialize to at most one successful terminal transition; unknown callbacks do
  not consume an unrelated valid challenge.
* No ID/access/refresh/Clerk/app token in URL, query, fragment, deep link or
  postMessage. A provider code is redeemed before a fixed return navigation;
  prefer provider-supported form-post if available. No proof-bearing deep link,
  query/body/token logging, referrer leakage or third-party scripts on callback.
  Consume and clear callback parameters before subsequent navigation.
* External browser and Telegram WebView do not share an assumed cookie session.
  A proposed return bridge requires the original Mini App's RAM-held redeem
  secret/PKCE verifier via POST/TLS, plus current initiating family for linking.
  Status messages require exact origin/source and carry no credentials. Lost
  verifier/expired challenge restarts verified sign-in, never public-ID recovery.
* Provider cancellation/failure settles only the correctly bound operation and
  creates no profile/proof/link or old-session revocation. Known resource404 maps
  to denial; provider outage/unknown commit never yields a success ACK. Inspect
  durable receipt before retrying uncertain mutations; do not replay raw proofs.

Before enabling D1 linking or D2 return, test swapped/wrong-purpose state, foreign
issuer/origin, duplicate parameters, public-ID redemption, PKCE/nonce mismatch,
repeated/concurrent callbacks, token-in-URL, exact expiry boundary, lost browser
state, cancellation and commit uncertainty. These protocol tests are NOT_RUN.
The older association proposal remains text only; this document clarifies its
state separation and supersedes its previously unresolved staff-device paragraph.

## Local evidence

Current result: 41/41 PASS plus typecheck exit0. The five-file test command is:

```sh
node --test tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

The 19 provider/timing tests include 10 new timing groups: JWT, expireAt and
abandonAt at -1/0/+1ms for fresh and existing accounts; delayed disabled/mismatched
User and revoked/changed Session; opaque family/access expiry; linking409 versus
expired401; live versus expired staff; server clock regression; purpose injection.
Three additional staff groups cover Teacher/Admin/Owner parallel sids, current
revocation/role/approval/capability/scope and student-only replacement. Fourteen
affected auth/F1 and five local TCP/schema/client checks also pass.

`timing-red.log` records the pre-fix/pre-staff-decision failure with six synthetic
proof values redacted; status/stack evidence is retained. `timing-tests.log` and
`timing-typecheck.log` describe this current source. Older 9-test logs are prior
phase evidence only. New source/runtime hashes are in `source-manifest.json`;
the old published Backend/schema provenance pins were not repinned or bypassed.
No actual provider/DB/RLS/browser callback/deploy or independent QA was run.
