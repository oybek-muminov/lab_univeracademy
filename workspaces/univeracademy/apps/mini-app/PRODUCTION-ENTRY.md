# Telegram entry and Backend production client integration

Backend base: `1335762a8e133311849b2dad1ddc6be3ccf9bb53` on laboratory branch
`qa/current-flow-20261106`. API is PROVISIONAL / NOT ACCEPTED. This is source for
review and local synthetic verification, not a deployed or real Telegram pilot.

## Connected entry

Production `src/main.tsx` imports `production-entry.tsx` and the compile-time
`createProductionConnection`. That composition uses the received Backend
`createProductionStudentClient({ mode:'production', baseUrl, contractSha256,
transport })` through one shared UI adapter in `owner-port.ts`. No alternate API,
local constructor fallback, window factory hook or server implementation is used.
`local-owner-port.ts` retains its runtime local_fixture boundary for local tests.

Browser owner files exactly match Backend1335762:

- student-client.ts: 8521 bytes, SHA256
  `54c110d7736a2537e384bddaaab2e91a78e2e56fe3d365fd7d688fa51ab65fae`.
- student-types.d.ts: 46340 bytes, SHA256
  `9e7c643f0a1788918e178732677dfa5a8a78209d3a2ba8f5d88d1396dad18c21`.
- Full API SHA256 remains
  `9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`.

The mounted shell calls official bridge ready() and passes exact raw initData to
owner login. Only matching server-confirmed profile/exams hydrate the UI; unsafe
SDK identity/roles, browser HMAC, URL proofs and persistent proof stores are absent.
A fresh login gets a new connection/flow. Existing F1 epoch, refresh single-flight,
CAS generation/revision, server timer, submit keys and body-only receipt protections
remain. Temporary initial read retry reuses a RAM session without login replay.

The production connection derives start-button affordance from server admission,
normal-use and recovery-window metadata. It grants no permission; the HTTP server
still decides admission. Meta has no group label, so no group name is fabricated.
Media is restricted to HTTPS URLs on the configured API origin until additional
media origins receive an explicit reviewed policy. Unreviewed media fails closed.

StudentApp is the extracted existing UI; active-test JSX and CSS remain identical
to the accepted source. DemoApp wraps it only for demo/fixture entry and controls.
Production output contains no synthetic launch/proof, staff credential or test key.

## Public configuration and SDK

Copy the reviewed public settings from production.env.example into the chosen
Vite build environment. VITE values are public; never store credentials there.

- VITE_MINI_APP_ORIGIN: explicit HTTPS app origin, no path/query/hash/userinfo.
- VITE_API_ORIGIN: explicit HTTPS API origin, deriving /api/v1.
- VITE_STUDENT_CONTRACT_SHA256: exact Backend contract pin, no fallback.
- VITE_TELEGRAM_SDK_ENABLED: false by default. true injects the fixed official
  https://telegram.org/js/telegram-web-app.js?64 script into the production head
  before app modules. No bot URL or hosting setting is changed by this code.

Actual page origin must match the configured app origin. Before SDK data is read,
configuration is checked by the Backend production constructor as well as the
consumer origin parser. Empty/HTTP/credentialed/path-bearing/stale-pin and owner-
rejected local/invalid API destinations fail closed. A Vite proxy is retained only
for local_fixture DEV; production has no proxy. SDK documentation:
https://core.telegram.org/bots/webapps#initializing-mini-apps

No real origins are set here. Tests use reserved example.test API names and
app.invalid pages with injected Responses or explicit loopback mapping. Those
illustrative hostnames are never resolved or contacted.

## Backend CORS review input (not applied to a server)

For different app/API origins, allow the exact reviewed app Origin and Vary: Origin
on varying responses. Handle OPTIONS preflight without an access proof, while
still authenticating the actual operation. The owner operations use GET, POST,
PATCH and PUT, with Authorization, Content-Type and Idempotency-Key. Expose
Retry-After for429. Include CORS headers on success and error responses including
401/403/429/5xx. Requests use credentials:omit, cache:no-store, redirect:error and
mode:cors. No wildcard/cookie/no-cors fallback or mutation replay is added.

This is consumer input only. Real CORS/preflight/TLS/CSP, real official SDK bytes,
bot launch URL and Telegram WebView are NOT_RUN. Intercepted browser Responses
and Node loopback mapping do not prove production server CORS or DNS behavior.

## Reproducible author checks

From workspaces/univeracademy, provision Backend's pinned validator tooling if
missing: npm ci --ignore-scripts --prefix tests/backend/validator/tooling.
From apps/mini-app, use its pinned dependencies and Node24:

    npm test
    npm run test:production-entry
    npm run test:production-build
    npm run check
    npm run build

Backend constructor-only checks: from workspaces/univeracademy,
node --test tests/enrollment/production-client.test.mjs.

The new production HTTP test uses the actual pinned constructor/adapter/bootstrap
and a fresh loopback RAM Backend: registration, server timer, CAS save/clear/resume,
submit, independent server result/history strings and body-only logout. Its Node-
only fixture key/answers never enter the browser. No actual DB/provider is used.
Browser entry cases cover the full UI plus missing/throwing SDK, temporary retry,
revocation and logout using the actual constructor with a RAM transport. Built
main cases check empty-config closure and fake SDK login/profile/exams/logout.
All external API/SDK requests are intercepted; real services remain untouched.
Historical wire fixtures supply common synthetic UI data only, not a new schema
acceptance claim. Independent QA of these combined source bytes remains pending.

## Integrity and unresolved pilot work

The Node guard preserves the raw historical259b675e and44-file manifests, then
checks the new raw71-file production manifest and every target size/SHA256. It
also checks browser owner copies against the pinned Backend bytes. No mismatch
is ignored; corruption, old-sized browser client, other dependency and historical
manifest mutations are negative controls. BACKEND-CURRENT-SHA256SUMS is read only.

Full-reload fresh-launch/durable start-submit-key policy and real host/provider/
SQL/RLS integration remain outside this source publication. Proofs/answers stay
in RAM; no receipt TTL or storage policy is invented. Existing historical QA
records are not rebranded as validation of the new persistence implementation.
