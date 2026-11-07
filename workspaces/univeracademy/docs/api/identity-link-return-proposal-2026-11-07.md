# Identity linking and external browser return — protocol proposal

PROVISIONAL / NOT ACCEPTED. Review text only, based on F1 checkpoint
6329367b7346484f58e458f1b62396cfd764e6ec. No new route, SDK, linking implementation,
provider setting, credential, database migration or staff device policy is enabled.
Existing `/auth/telegram/link` still returns authenticated409
`IDENTITY_LINK_POLICY_UNRESOLVED`. This proposal does not supersede that block.

## Separate login from adding an identity

Normal Google sign-in through a reviewed Clerk integration ends with a verified
Clerk `issuer + user_…` identity. `/auth/clerk` reuses its existing internal UUID;
an unmapped identity creates an incomplete ungrouped student. Email text, even a
verified email, name, phone, organization and role claims never select another
account or authorize linking. The Backend does not accept a Google ID token at
`/auth/clerk` and must not infer a Google account merely from a Clerk email.
The tenant/SDK's upstream email-linking behavior also needs review; a Backend
no-merge rule does not prove Clerk itself will never associate Google identities
by email. No tenant setting was inspected or changed here.

Linking instead requires two independently verified account proofs and explicit
user confirmation. Proof A controls the current canonical UniverAcademy account;
proof B controls the specific Telegram or Clerk identity being added. Neither
email comparison nor possession of a public callback state is either proof.
An active opaque app proof alone is not evidence of fresh interactive reauth.

The current Clerk verifier does not establish a provider step-up/auth_time
protocol. Fresh reauthentication and its maximum age must be reviewed before
linking is enabled; do not silently downgrade this requirement to a cached JWT.
The proof-A verifier must resolve to the same canonical UUID as the initiating
family, with current provider liveness and enabled identity/account.

## Begin → provider proof → explicit confirmation → atomic commit

The following are logical operations, not new accepted API paths or DTOs.

1. **Begin.** Authenticate the current account A and check current origin/CSRF
   binding. Generate at least 32 random bytes of state. Store its digest, purpose
   (`login_return` or `link_identity`), canonical person/family A, initiator binding,
   expected provider/issuer, exact allowlisted callback, server creation/expiry,
   and proof challenge. An untrusted `person_id`, return URL or role is not stored
   as authority. Fixed callback URLs are configuration; no open redirect.
2. **Proof A.** Require fresh reviewed reauth of account A for linking, bound to
   this operation. Any provider evidence is signature/issuer/audience/azp/time/
   liveness verified and resolves server-side. Failure/cancellation creates no
   identity, group/grant, session replacement or profile mutation.
3. **Proof B.** Verify the target identity through its own authenticator, without
   running the normal login/exchange that would create a separate canonical user
   or replace the current app family. For
   Telegram use the exact server-verified HMAC launch protocol, freshness and
   one-use digest; no frontend `telegram_id`. A valid launch is authentication,
   not automatic consent to link. The launch/challenge binding must be proven
   (e.g. reviewed signed launch parameter or a separately verified bot challenge);
   current generic `init_data` support does not prove this binding. For Clerk use
   trusted issuer + case-sensitive `user_…`/`sess_…`, current provider session and
   a reviewed fresh reauth flow. No invented nonce claim is accepted.
4. **Confirmation.** Show which current account receives which identity, with
   minimal masked identity information. Explicitly confirm linking; a provider
   callback never confirms it by itself. Require both proofs, the same initiating
   family/purpose/challenge and a single-use confirmation nonce. This is identity
   association, not account-data merge, account switch or group transfer.
5. **Commit.** Lock challenge, both external identities, canonical person and
   current family in a consistent order. Read fresh server time after locks.
   Recheck enabled accounts, current proof-A family, both proof expiries, provider
   liveness and proof-use receipts. Expiry uses `now < expires_at`; equality fails.
   Atomically insert the unique external mapping, consume challenge/proofs and
   record a non-secret audit receipt. ACK follows confirmed commit only.

Track challenge phases explicitly: pending → provider-proved → confirmed/consumed,
or cancelled/expired. Provider callback state is consumed at its own transition;
the later confirmation has an independent nonce. Do not reuse callback state as
the confirmation credential or reset an expired/cancelled phase.

Do not hold raw provider tokens in a queue or durable record. Store digests and
minimal verified identity evidence only. Pending proof evidence must expire and
be revalidated at commit; a successful callback is not a durable authorization
cache. Namespace proof purpose and bind it to the challenge; additionally enforce
global provider proof-use fences so the same signed proof cannot be repurposed
across exchange/link/login-return operations. A new jti from an already retired
student provider session must not bypass the existing session fence.

| Current target mapping | Proposed result |
| --- | --- |
| Unmapped B, both current proofs valid | Associate B with the existing A UUID atomically |
| B already maps to A | Exact idempotent receipt after current authority checks; no rewrite |
| B maps to another UUID | Generic conflict, no auto-merge or reassignment |
| Disabled mapping/account, invalid proof, stale family, wrong purpose/binding | Deny without changing either account |
| Two concurrent links claim B | Uniqueness + transaction allow one; loser gets conflict |
| Commit outcome uncertain | No success ACK; inspect receipt safely, never repeat an unchecked mutation |

The same account's names, Qadam ID, group/subject grants, answers, revisions,
server deadline, results, bonus attribution and history stay attached to the
original UUID. Do not copy names/photos from provider claims. Conflicting UUIDs
need a separately approved recovery/merge process; this proposal provides none.
Unlink, reassignment and replacing the sole login identity remain separate
unapproved product decisions. Linking itself must not silently change sessions;
any new successful student login still follows the approved one-active-family
rule and preserves the current attempt/deadline.

## Google in an external browser, then return to Mini App

The UI may initiate the provider flow explicitly in the system browser. Do not
perform Google password/OAuth entry in an embedded Telegram WebView. For a web
Mini App this is a proposed application of the external-agent security model;
RFC8252 directly specifies native applications, not a Telegram integration.

Prefer the reviewed Clerk-managed authorization flow instead of implementing a
second Google OAuth verifier here. Its actual redirect/state/PKCE/nonce semantics
and two-account linking behavior must first be demonstrated for the selected SDK
and tenant. Do not append arbitrary `state` parameters and assume the SDK binds
or preserves them. In a flow controlled by us, require authorization code + S256
PKCE, a one-use state bound to the initiating user agent, exact redirect matching,
expected issuer and transaction-specific OIDC nonce when OIDC is used. Provider
codes are redeemed through their documented confidential channel; access, refresh,
ID, Clerk JWT and opaque app tokens never go in a URL/query/fragment/deep link.

Use a fixed HTTPS callback with no third-party scripts and no proof/body/query
logging. A code-only callback can briefly contain a short-lived code; prefer
provider-supported form-post where available. Do not confuse authorization code
with an app token, and never forward even that code to a Telegram deep link.
Consume callback state once, exchange/verify before redirect, set no-store and
no-referrer, and clear callback parameters before further navigation. Provider
error or cancellation must also settle the challenge so it cannot be replayed.

An external browser and Telegram WebView can have separate cookies/storage. Do
not assume login automatically appears back in the Mini App. Proposed bridge:

* Mini App starts a return challenge, retaining an independent random redeem
  secret/PKCE verifier in its own RAM. The server stores its digest/challenge and
  the purpose and initiating family where applicable. A public correlation ID is
  insufficient to redeem it.
* External browser proves provider identity and confirms the intended return.
  Server records short-lived verified evidence against that challenge, not raw
  tokens. It does not yet replace a student app family on an unattended callback.
* Mini App resumes through a fixed return URL containing at most a public
  correlation ID/status, then POSTs its redeem secret/verifier through TLS.
  `postMessage` may signal status only after exact origin/source checks; it never
  transfers credentials. A Telegram deep link likewise carries no proof.
* Server rechecks provider liveness, challenge, expiry, purpose, proof receipts
  and initiating family when linking, then consumes the return once. For login,
  issue opaque app proofs and supersede the old student family in one commit.
  Return app proofs only in the no-store HTTPS response to the bound requester.
  No GET redeem, no unbound polling, no localStorage proof handoff.

This bridge needs a reviewed request/response contract and provider evidence
port; it is NOT implemented by the present `/auth/clerk` exchange. If the WebView
loses its RAM verifier or a return expires, restart verified sign-in rather than
recovering from a public state ID. If the success response is lost, use a safe
new verified login or reviewed receipt protocol; never reuse consumed proofs.

## Expiry, retention and open decisions

No TTL is approved here. Challenge lifetime, proof reauth age, failed-attempt
limits, expiry cleanup, retry receipts and retention are review decisions. A
challenge may not outlive the earliest applicable proof/initiator expiry. No
retry extends its original expiry. Retain consumed digests until every replay
or retry window they protect is closed; physical purge must not reset logical
one-use semantics. Explicitly test before/equal/after expiry and delayed GC.

Staff device policy is still unresolved; existing default503
`STAFF_DEVICE_POLICY_UNRESOLVED` stays. The student one-device decision does not
apply a new rule to staff. Actual Google/Clerk configuration, callback ownership
and the reserved but unpurchased domain are not verified or changed here.

## Required tests before any implementation is accepted

All of the following are expected-case proposals, NOT_RUN: swapped state/nonce;
wrong origin/issuer/purpose/initiator; token or proof in query; expired/equal-boundary
challenge; repeated/parallel callback and confirmation; re-signed same jti;
cross-purpose proof replay; logout/new-device login while linking; disabled
identity/account; target already belongs to another UUID; uniqueness race; provider
outage; delayed GC; commit-before/after uncertainty; WebView losing its verifier;
callback cancellation; and exact preservation of profile, answers/revision,
deadline/history/bonus attribution. Failure must leave both accounts unchanged.

Primary security references: [RFC9700 §§2.1,4.3,4.7,4.8](https://www.rfc-editor.org/rfc/rfc9700.html)
for redirect, CSRF, code/PKCE and URL leakage; [RFC8252 §§4,7,8](https://www.rfc-editor.org/rfc/rfc8252.html)
for external user agents and return binding in native OAuth. Account association,
Mini App bridging and lifecycle above are our unaccepted design proposal, not
claims that these RFCs prescribe our product policy.
