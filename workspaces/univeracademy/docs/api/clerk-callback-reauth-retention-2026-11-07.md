# Callback isolation, fresh reauth and retention — options for review

PROVISIONAL / NOT ACCEPTED. Design only; no callback route, factor/tenant setting,
link endpoint, header deployment or retention GC is enabled. The current SDK
binding is Session/User reads, not a browser reauthentication implementation.

## Callback iframe protection

Prefer a dedicated top-level server callback, separate from the frameable Mini
App document. Proposed HTTP response profile:

```text
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Cache-Control: no-store
```

This is a proposed callback profile, not a blanket CSP change to Telegram Mini
App or all SDK documents. Deliver frame-ancestors in an HTTP header, not a meta
tag. Do not allow a Telegram/foreign framing exception merely because the Mini
App itself is framed. Where Fetch Metadata is available, reject frame/iframe
destinations before processing a callback; missing headers still require all
state/proof checks and do not establish top-level identity. A JS top!=self guard
may display failure but is not the main defense and must not perform frame-busting
navigation carrying OAuth data. A dynamic callback needing JS needs a reviewed
nonce-based script policy rather than unsafe-inline or third-party scripts.

If product UX requires an embedded callback, open the fixed callback externally
instead; do not remove framing protection to make it work. Callback UI browser
tests must cover nested frames, sandbox/opaque origin, response headers and both
native external browser and Telegram WebView. These are NOT_RUN. This design is
informed by [CSP frame-ancestors](https://www.w3.org/TR/CSP3/#directive-frame-ancestors)
and [OAuth security BCP §§4.16–4.17](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.16),
not a claim of a configured Clerk/Google callback today.

Exact redirect/state/purpose/issuer/PKCE/nonce checks remain mandatory independent
of iframe protection. No ID/access/refresh/Clerk/app token in query, fragment,
deep link or postMessage. A provider code is exchanged before fixed return;
prefer supported form-post where possible. No raw query/body logging, third-party
analytics or credentials in URLs/referrers. Status-only browser messages require
exact origin/source. A public correlation ID never redeems a login or link.

## Fresh reauth choices — none accepted or wired

An exp-valid or newly minted JWT proves current authentication, not a recent
interactive factor challenge. Neither iat, lastActiveAt, email text nor a frontend
"verified" flag is sufficient. Current ClerkProof deliberately carries no factor
freshness evidence, so the linker must remain blocked rather than assume it.

| Option | Basis and benefit | Tradeoff/blocker |
| --- | --- | --- |
| A: Clerk-supported step-up | Use verified factor-age/action reverification evidence on the same current issuer/user/sid, then bind it to our pending action. Reduces custom credential code. | Must review actual signed evidence/API/SDK support; no automatic factor downgrade for linking. No setting change or implementation here. |
| B: explicit A+B reauthentication | Reauthenticate account A and independently prove target B inside one purpose-bound, explicitly confirmed operation. Retains existing canonical profile/history. | More UX work; exact Telegram challenge binding and Google/Clerk account-switch behavior remain unverified. Do not run B through student login first. |
| C: accept cached session or fresh iat alone | Simple integration. | Rejected technical option: no fresh interactive proof; cannot enable sensitive association. |

Recommendation for review: A when exact evidence/factor semantics are established,
with B's two-account/action binding; otherwise keep linking blocked. This is not
approval of a factor level, age window, provider method or recovery fallback.
Clerk's [reverification guide](https://clerk.com/docs/guides/secure/reverification)
documents supported factors, helpers and potential downgrade behavior. Do not
assume the helper's retry behavior is safe for an uncertain committed link. The
[auth-object reference](https://clerk.com/docs/reference/backend/types/auth-object)
also labels reverification support as beta; real tenant/SDK behavior needs review.

The A proof must resolve to the same enabled canonical account and initiating
family at confirmation. The B proof must identify the target independently; an
existing mapping to a different UUID is conflict, not automatic merge. Match
purpose, one-use challenge and current family after all waits, with server time
strictly before both proofs' expiries. Show explicit account/identity confirmation.
Failed step-up/cancel/expiry does not create a person, link or student replacement.

## Challenge lifetime alternatives

All values below are candidates, not application defaults or approved TTLs.

| Candidate | Benefit | Cost |
| --- | --- | --- |
| 2 minutes | Narrower theft/replay opportunity. | External browser/OTP/poor connectivity may expire frequently. |
| 5 minutes | Proposed review starting point balancing the browser round trip and exposure. | Requires matching fresh reauth bounds and evidence under delayed-return tests. |
| 10 minutes | More time to complete the explicit challenge. | Larger exposure window; must not inherit a provider/helper default without review. |

Whatever value is chosen, bound it by the earliest current A family, provider
and proof expiry; check now<expiry, equality denies. Use separate callback-state
and final-confirmation nonces, store digests, retain purpose/issuer/initiator/
PKCE binding and phase. Retries never extend original expiry or resurrect a
cancelled/expired/consumed state. SDK factor-age granularity is not a substitute
for exact server challenge expiry. Authenticated login and identity association
remain separate D1 state machines; callback return is not automatic confirmation.

## Retention alternatives and safe bounds

| Record | Proposed safe basis | Open decision |
| --- | --- | --- |
| Exchange jti receipt | Keep beyond every valid-use/retry window for that issuer/user/sid/jti; raw proof is never stored. | Need actual mint/reuse/expiry guarantees and clock/retry bounds before finite GC. |
| Retired student sid fence | Retain until no future token can be minted for that sid and all family/replay/tombstone/retry windows close. | Old JWT exp alone is insufficient; provider terminal/absolute-bound semantics unverified. |
| Consumed/cancelled callback challenge | Keep terminal phase through its expiry and reviewed provider-proof/code/retry window; an unknown/purged state always rejects. | Extra diagnostic retention, e.g. 1 day versus 7 days, is a privacy/storage decision, not selected. |
| Current logout tombstone | Preserve the existing first-revoke/receipt policy. | Do not replace it with the new challenge lifetime or extend it on retries. |

Conservative local proposal: `retain_until_ms=null` means no GC until a proven
finite bound is reviewed. This prevents guessed cleanup reopening replay, but
unbounded storage is not a production scalability result. Once a finite policy
is accepted, delete through a separately scoped maintenance path, not ordinary
identity/session runtime CRUD. Logical expiry must reject even before physical
purge; after purge never recreate a terminal item from a caller-supplied state ID.

No challenge/link/retention worker is implemented. Before enabling one, independently
test before/equal/after expiry, wrong-purpose/sid/family/state, factor downgrade,
swapped account, iframe/nested contexts, code/token leakage, replay/re-signing,
callback races, cancellation and commit uncertainty. Linking stays blocked 409;
this proposal does not bypass it with the installed SDK.
