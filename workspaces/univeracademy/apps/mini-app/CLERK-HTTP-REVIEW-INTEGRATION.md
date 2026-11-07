# Local Clerk exchange / student entry candidate

Base: `b9efa5978498d9150db43531da89820e80dc51ee` in the laboratory.
LOCAL ONLY. No upload/commit/push, real provider, database, domain or deployment.
The API remains **PROVISIONAL / NOT ACCEPTED**, version
`0.3.0-clerk-exchange-review.1`. Original published checkpoints and QA reports
remain historical evidence; their acceptance is not transferred to this candidate.

## Composition and boundaries

`clerk-review-entry.ts` composes the existing common-entry controller with a fresh
owner connection for each explicit login. The injected Google/email provider is
synthetic. It does not install/call Clerk, Google, email delivery or a real SDK.
Only the Backend-owned `exchangeClerkSession` method exchanges the JWT. Subsequent
profile, test, save, refresh and logout operations use opaque app proofs in the
existing transport. No second HTTP client or server implementation is bundled.

The two browser client/type files are exact copies of Backend's new owner files:

* client SHA256 `61cf1d2d0681f3bf25a610c73eff7470159bca45679c5def42101e9a58017494`;
* types SHA256 `bc658b13af2d2a75fb88af415637d4c4a63e33c3767f00120242099c86c637cc`;
* full review contract SHA256 `f6226aa1cea63ae1fbc603b80aed9232bc4dd5213c4cc081cc13300ee0179b28`.

The strict Node-only guard pins all 133 Backend targets plus both owner copies.
Seven older manifests remain pinned as provenance. The size/hash verification
loops are unchanged, and a stale pin is not a fallback. Existing production main
still selects Telegram; the new review composition is imported only by an explicit
test fixture. Existing `dev:auth-prototype` remains the pure synthetic preview.
No production Clerk entry or real API origin is configured by this candidate.

| UI/action | Owner HTTP operations | Proof / retry behavior |
| --- | --- | --- |
| Synthetic Google/email success | POST `/auth/clerk` | Clerk bearer, empty JSON; no automatic exchange retry |
| Bootstrap/registration | GET/PATCH `/me` | Canonical profile must match the current app session |
| Test list/open/resume | GET `/exams`, `/exams/{id}`, `/attempts/{id}` | Opaque app access; server timer/deadline |
| Save/clear/reconcile | GET `/attempts/{id}`, PUT `/attempts/{id}/answers/{question}` | Existing generation/CAS queue; clear=null; server ACK required |
| Submit/result | GET `/attempts/{id}`, POST `/attempts/{id}/submit`, GET `/attempts/{id}/result` | Existing idempotency key; no automatic mutation replay |
| History | GET `/exams/{id}/history` | Existing lifecycle and lexical server-display projection |
| Logout | POST `/auth/logout` | Captured refresh in body; Authorization absent; no refresh/replay |

## Cancellation and session isolation

Each controller action has a generation. Reset/logout conceals the old flow
immediately; old provider/exchange/profile/ACK callbacks cannot publish into a new
generation. A local `transport.clear()` invalidates pending login/access callbacks
without claiming server logout. It does not alter existing body-read epoch checks,
refresh single-flight, CAS or receipt semantics.

If a canonical app proof is already known, retirement invokes existing body-only
logout eagerly, capturing the old refresh before clearing. Only the valid success
ACK produces a confirmed notice. A failed receipt stays locally signed out and
reports uncertainty. No retention interval or receipt retry policy is added.

If exchange is pending, cancellation clears the connection epoch and aborts its
request. A response body that ignores abort is still rejected after completion.
The JWT is fingerprinted in document memory before exchange and cannot be replayed
after an ambiguous result. Reload and recovery require a fresh verified provider
proof; no proof, OTP or launch is stored in local/session storage or a URL.

HTTP cancellation cannot retract a server commit or prove its final ordering.
An unknown exchange result is explicitly unconfirmed; local clearing is not a
server revocation guarantee. A new verified login uses Backend's single-device
rules. Tests of deliberately late response bodies prove local isolation; they do
not prove cancellation ordering in a real provider/network/database deployment.

## Local checks

Node24 and the existing pinned dependencies are required. No dependency/lockfile
change is introduced. From `apps/mini-app`:

```sh
node --unhandled-rejections=strict --test --test-reporter=tap --test-concurrency=4 tests/*.test.mjs
npm run build
node tests/clerk-review-browser.mjs /tmp/ua-clerk-review-screens
node tests/common-entry-browser.mjs /tmp/ua-common-entry-screens
node tests/production-entry-browser.mjs --production-gates
```

The new browser runner starts a fresh ephemeral-RSA/RAM Backend and Vite on
127.0.0.1:5218 (strict port). Only that exact local UI origin is allowed by the
existing CORS wrapper. The trusted Node harness passes synthetic JWTs through
stdin and document-memory test-provider callbacks. There is no HTTP proof/control
route, JWT URL, proof log, cookie or persistent token store. Browser widths are
320/390/1280. Existing Google/email success, literal reload with fresh proof,
saved answer/deadline, submit/result/history, body-only logout, fresh ungrouped
registration and late-provider cancellation are checked through actual TCP HTTP.
Browser answer choices are arbitrary synthetic options; result strings come
directly from the server. No answer key is sent to the browser.

11 new Node tests cover the above integration and cancellation after headers,
late profile payload, ambiguous exchange, logout during exchange, failed logout,
late logout ACK, provider revocation/new-session resume and transport invalidation.
The full Mini App Node suite is234/234 PASS. Build/typecheck pass. Browser results
and immutable source hashes are recorded separately in the local handoff evidence.

## Not implemented / not run

Real Clerk/Google/email, persistent identity/session storage, DB/RLS, deployment
and capacity are NOT_RUN. Telegram association, external-browser return and staff
device policy are not implemented/accepted here. No linking endpoint is enabled,
and WebView Google remains blocked. Old unmarked Backend families continue to
fail503; no migration/backfill is added. Independent QA of this combined candidate
is pending. Uploading these Mini App changes requires separate user approval.
