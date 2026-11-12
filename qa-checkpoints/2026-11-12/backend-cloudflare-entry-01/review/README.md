# Cloudflare API registration entry: local candidate

Three application additions only: runtime/cloudflare-entry.mjs,
wrangler.api.jsonc and tests/cloudflare/entry.test.mjs. Author offline checks are
complete; independent acceptance, bundling and deployment are not. No installation,
upload, DB/SQL, provider, credential, account or deployment action occurred.

## Source boundary and behavior

Use your exact accepted application assembly through Cloudflare r2
9a5679712b838a9ede1136926770a7914c3203bf plus accepted profile context
04ef1ddd0316ec9f03a09eec14feae3a326aa1c9, based on main source
de2adf023428a374f075faa421ece9e1deafaf36 and preceding accepted overlays. The base
is289 files/3679262 bytes; these three additions yield292 files/3706430 bytes.
All289 originals are unchanged. Laboratory reports are not application source.
The separate frozen15-file name-provisioning candidate is unchanged and is not
imported, accepted or blended into this candidate. No bot, Mini UI, historical
api/index.mjs, SQL, guard, pool, existing Worker adapter or package/lock is edited.

The default export is an inert Web Worker entry. Trusted composition alone can
inject the lazy Client loader, Clerk-adapter constructor, Web transport and clock
for offline checks. Environment/request data cannot register those functions.
The default uses the accepted real Clerk Worker adapter/provider/JOSE path and
lazily imports pg.Client; it supplies no alternative verifier or RAM store.

Every request owns its Clerk binding and existing createCloudflareApi composition.
The accepted request-scoped PostgreSQL adapter owns the sole lazy Client. The
entry awaits its response/disposal, then awaits Clerk close in finally. Disposal
failure produces sanitized503 with the allowed-origin CORS header; no ACK, raw
exception/secret, SQL retry, shared client or background waitUntil is introduced.
Import and factory construction make no connection/provider read. Module imports
are awaited normally; abort is checked before/after them. They are not forcibly
cancelled by an invented loader timeout.

This registration-only entry allows POST auth/clerk, auth/refresh, auth/logout;
GET/PATCH me; and required GET exams. Shared CORS handles OPTIONS. Other API
operations, including scoring/attempt writes, return503 before private setup.
GET exams traverses the real configured handler, current session/provider guards
and domain rows; the offline positive test returns a real nonempty fixture list,
not a canned response. The numeric presentation seam always throws503 rather than
importing testNumbers or inventing a rounding policy. A reviewed production numeric
policy and wider route scope are separate work before test/scoring activation.

## Explicit future server bindings

No live values are included. The Worker expects exactly these server-owned keys:

| Binding | Value and validation |
|---|---|
| UA_API_ORIGIN | Explicit public HTTPS origin, existing validator |
| UA_ALLOWED_ORIGINS | JSON HTTPS-origin array, existing CORS validator |
| UA_SESSION_POLICY | JSON with exactly the existing seven SessionPolicy fields; existing policy validator, no defaults |
| UA_CLERK_PROVIDER_SETTINGS | JSON existing issuer/authorizedParties/audience/cache/timeout/JWKS-limit settings; accepted Clerk adapter validates it |
| UA_CLERK_SECRET_KEY | Server secret, nonempty and no CR/LF/NUL; never a request header/body binding |
| HYPERDRIVE | Trusted platform binding with credentialed connectionString, explicit port, no query/hash or caller overrides |

Top-level accessors/inherited/unknown fields cannot silently supply configuration.
HYPERDRIVE.connectionString may itself be a native platform accessor, as the
official binding requires. The Clerk Web transport receives the configured timeout,
fixed65536-byte response bound, request signal and trusted fetch/clock. API bodies
retain the existing65536-byte limit/cancellation behavior. A syntactically valid
binding is not proof of cache settings, TLS, database role, RLS or live authority.

wrangler.api.jsonc proposes only univeracademy-api, this entry, compatibility date
2026-11-11 and nodejs_compat. workers_dev and preview_urls are disabled. No account,
domain/route, real Hyperdrive ID, vars, credential, binding creation or deploy
automation is present. It does not touch univeracademy-bot.

## Offline reproduction and actual evidence

Node24.22.1 built-ins suffice for the inert constructor/transport tests:

```sh
node --test tests/cloudflare/entry.test.mjs
node --test tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/backend/student-prepared/routing-receipts.test.mjs tests/backend/student-prepared/trusted-server-context.test.mjs tests/backend/student-prepared/profile-context.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs tests/vercel-node/postgres-pool-factory.test.mjs tests/cloudflare/api-postgres.test.mjs tests/cloudflare/clerk-worker-bindings.test.mjs
node --check runtime/cloudflare-entry.mjs
node --check tests/cloudflare/entry.test.mjs
```

Observed:42 focused PASS/1 explicit dependency skip;459 regression PASS/1 explicit
JOSE skip; two syntax PASS. The focused config test also parses/checks the JSONC
proposal. Commands, UTC, exits, source identities and original output byte ranges
are bound in verification.json/author-checks.log. The early run's one failure was
a test assertion using id instead of the accepted assignment_id response field;
the assertion was corrected without changing production behavior.

Most entry tests inject a clearly synthetic trusted provider port, with the real
bounded Worker Web transport. They do not prove JOSE, live Clerk or PostgreSQL/RLS.
A separate actual-provider-adapter opaque-session test is prepared, but skipped
because jose6.2.15 is absent. The existing real-JOSE signature regression is also
skipped. No verifier substitute is used in the default entry. Root semantic
TypeScript, actual driver/TLS/SQL/provider and Wrangler bundle/dry-run are NOT_RUN.

The unchanged context regression needs the already available frozen activation r2
text at sibling ../review/first-student-trusted-server.activation.review.sql,
60363 bytes/SHA256e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd,
from lab8be232eff22c2608b55f7f5513d8752a0307977a,
qa-checkpoints/2026-11-11/backend-trusted-server-context-01-r2/review/.
It is text-only test input, excluded from this package and never executed.
The119-path source guard remains FAIL on its prior clerk-auth-rows23067 vs22634
pin. It is unchanged, and does not automatically cover these new entry paths.

## Exact remaining dependency and activation gates

Cloudflare requires nodejs_compat and node-postgres minimum8.16.3 for Hyperdrive.
See the [official driver guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/).
The [pg8.16.3 manifest](https://github.com/brianc/node-postgres/blob/pg%408.16.3/packages/pg/package.json)
declares optional pg-cloudflare ^1.2.7; the same release's
[pg-cloudflare manifest](https://github.com/brianc/node-postgres/blob/pg%408.16.3/packages/pg-cloudflare/package.json)
is version1.2.7 and selects a workerd export. The retained Node-only13-package
closure omitted it, so that closure is insufficient evidence for Workers.

Minimal proposed later reviewed package change: pin pg8.16.3 and mandatory Workers
pg-cloudflare1.2.7 in production dependencies, retain existing jose6.2.15, generate
and review the exact root package-lock with registry/resolved/integrity and the
full runtime closure, including the optional package rather than omitting it.
No lock entries are fabricated here. Neither pg, pg-cloudflare, jose, TypeScript
nor Wrangler is installed in this candidate. A separately approved exact Wrangler
version/tool lock and dependency download scope are still required; no version
or integrity for that absent tool is silently selected in this three-file task.

After that approval, the required non-deploying packaging check is a reviewed
`wrangler deploy --dry-run --config wrangler.api.jsonc --outdir <owned-output>`
using that pinned tool. Review its module/dependency graph and workerd export
resolution, pg-cloudflare/cloudflare:sockets transport, dynamic pg import handling,
TS stripping and Node compatibility. This command has NOT_RUN and is not permission
to deploy. No Node SDK/worker_threads/fs or test fixture may enter the Worker bundle.

Future Hyperdrive query caching must be OFF, origin TLS verified, and the DB
identity dedicated/non-owner/NOBYPASSRLS with reviewed grants/RLS. API/frontend
origins, private Clerk bindings, credentials, current session/issuer behavior,
schema permissions, guarded source re-pin and actual Worker deployment/testing
remain action gates. No code publication alone establishes operational readiness.

## Future laboratory proposal only

Seven additions under qa-checkpoints/2026-11-12/backend-cloudflare-entry-01/ in
oybek-muminov/lab_univeracademy, branch backend/cloudflare-entry-01-20261112,
sole parent04ef1ddd0316ec9f03a09eec14feae3a326aa1c9/tree
a10d05f9afa1037d685f2e0d289952732838578a. Branch/prefix absence was checked
read-only. Only three application files plus this README, verification, original
author output and manifest are selected. No duplicate patch/archive, dependency,
frozen SQL, name package or private execution packet is included. All selected
data are source/synthetic fixtures; preserved logs contain dummy negative-test
connection strings, not real credentials or person/student data. No upload is
authorized; the manifest requires a separately recorded external SHA256 pin.
