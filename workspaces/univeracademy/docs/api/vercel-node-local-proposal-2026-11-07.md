# Vercel Node transport and transaction-pool plan — LOCAL CANDIDATE ONLY

Base: `29217c3a0ad8fad1140435c752857a60ef71b441`, laboratory QA branch.
No upload/commit/deployment, real DB query, schema/migration, domain or provider
configuration was performed. Existing API and authorization are unchanged;
API remains PROVISIONAL / NOT ACCEPTED.

## What is ready locally

`api/index.mjs` exports a Node Web Standard `{ fetch(Request):Promise<Response> }`
entrypoint. `runtime/vercel-node.mjs` reuses `createConfiguredHttpHandler` directly;
it does not create a second API, framework, server listener or RAM state store.

```js
const entry = createVercelNodeFunction({
  apiOrigin: configuredHttpsApiOrigin,       // origin only, no /api/v1
  allowedOrigins: approvedHttpsUiOrigins,  // explicit exact origins, JSON array in env
  configuration: reviewedHttpConfiguration,
});
// entry.fetch(request): Promise<Response>
```

Only production HttpConfiguration is accepted. Raw request bytes/URL/proofs are
passed to the existing strict parsers and handlers. The64KiB local transport
boundary is retained; errors stay400/401/403/409/500/503 as applicable, with no
input/secrets in messages. A configured public URL origin is required even for
OPTIONS; Host/X-Forwarded-* do not reconstruct or override it. Responses prohibit
browser and CDN caching. Exact HTTPS CORS shares the existing local CORS response
logic; old loopback CORS behavior is retained. No wildcard/preview suffix match,
null origin or cookie credential grant. OPTIONS204 performs no DB/auth work and
does not imply readiness.

**The default entry is deliberately unconfigured for real business work.**
It currently reads only public transport settings and passes
`configuration:undefined`; API requests return503. Supplying env variables alone
does not make the app deploy-ready. A reviewed production bootstrap must supply
the existing complete HttpConfiguration at that call site. No test policy, seed
user, fixture, guessed DB host or invented provider-session implementation fills
the gap. Tests separately inject synthetic ports into the fully working factory.

## Routing / existing Vercel project

The local `vercel.json` proposal has `framework:null` and exactly one rewrite:

```json
{"source":"/api/v1/:path*","destination":"/api/index"}
```

The function's business router accepts the original `/api/v1/...` pathname;
direct `/api/index`, `/api/v10`, bare `/api/v1` and other paths do not become new
API endpoints. It does not trust route query parameters or client routing headers.
Keep API routing ahead of any frontend SPA fallback. No frontend file/build
configuration was changed. A function project rooted at
`workspaces/univeracademy` is the assumption of this proposal, not a change to
the user's existing Vercel project.

Actual project ID/root/framework/build output, UI coexistence, Node build tracing,
and Vercel's original URL delivery through this rewrite have NOT_RUN status.
The local routing test checks the proposal and original-URL function boundary;
it is not a Vercel routing emulator or hosted preview proof. Verify those exact
paths on a later authorized preview before enabling any real pilot. Do not add a
fallback that takes an arbitrary route/origin from headers if the host differs.
Use Node24.x consistent with current package engines, not Edge. Region/function
duration/concurrency and deployment protection/preflight behavior remain to be
reviewed for the existing project; no plan/limits or current Vercel setup is assumed.

## Configuration required before a real preview

| Setting or port | Status / purpose |
| --- | --- |
| UA_API_ORIGIN | Implemented public env reader; one canonical HTTPS API origin, no path/query/userinfo |
| UA_ALLOWED_ORIGINS | Implemented public env reader; JSON array of explicit HTTPS browser origins; no implicit *.vercel.app |
| VITE_API_ORIGIN / VITE_MINI_APP_ORIGIN | Existing Mini App public build settings; must agree with approved API/UI origins; no secret belongs in VITE_* |
| HttpConfiguration.storage | Production postgres pool port; actual driver constructor/secret/SSL bootstrap is not supplied |
| HttpConfiguration.botToken | Server secret from approved settings; never chat/source/client/public env |
| sessionPolicy / numericPresentation / now | Explicit reviewed existing ports; never import fixture test-policy values into production |
| staff.jwt | Approved issuer/audience/asymmetric trusted JWKS and clock; no token metadata roles |
| staff.liveness | Actual current provider-session check and its reviewed permission boundary still required |
| staff.domain | Existing first_test_relational candidate; pinned validator and newAssignmentId also required |
| schema / constraints / backend role / RLS | Proposed prior repositories still need actual DB/schema/isolation/security proof |

Actual secret values and hostnames are not read, written or selected by this task.
Preview and production use separate explicit settings. Changing the existing
project configuration or deploying is a separate authorized action.

## Shared Supabase transaction-pool plan

Current Supabase documentation recommends shared transaction pooling for short
serverless connections and says to disable named prepared statements. It explicitly
directs node-postgres callers to omit `name`. The new `transactionPoolPort(driver)`
keeps repository Statement.name internal and forwards only `{text,values}` to
each checked-out native client. SQL parameters stay bound, not concatenated.
No SQL PREPARE or simple-string parameter substitution is introduced.

Planned server bootstrap shape (review example only; `pg` is not installed or
constructed by this candidate):

```js
const nativePool = new Pool({
  connectionString: checkedServerConnectionString,
  max: 1,
  ssl: {ca: approvedServerRootCertificate, rejectUnauthorized: true},
});
const pool = transactionPoolPort(nativePool);
const configuration = {
  ...reviewedOtherHttpPorts,
  mode: "production",
  storage: {kind: "postgres", pool},
};
```

Use a reviewed pinned node-postgres dependency/lock later. Copy the actual
transaction-pool host/port/role string from the project's Connect settings; do
not construct it from the region or silently switch to direct/session/default
postgres credentials. Keep the DB URL server-only with an appropriate restricted
backend role. TLS must verify the server certificate. With the explicit ssl
object above, reject conflicting sslmode/sslcert/sslkey/sslrootcert URL parameters
so connection-string parsing cannot replace the approved TLS configuration.
No rejectUnauthorized:false or plaintext fallback.

Create one native pool in module scope, reuse it for warm invocations, and begin
with max1 per warm instance. This is not a project-wide connection cap or capacity
proof; many warm instances still consume many pooler clients. Review pooler client/
backend budgets and queue latency before raising limits. No connection URL, role,
pool size, timeout or TLS setting was applied here.

Every BEGIN/locks/clock/read/write/COMMIT uses **the same checked-out client**,
then release. Never use pool.query independently for the statements of one
transaction. Queries remain awaited sequentially, no pipelining. Existing
pg_advisory_xact_lock is transaction-scoped, so the identity gate ends with the
transaction. Do not depend on session SET/search_path, session advisory locks,
LISTEN, temporary state or a prepared-plan cache across requests. Any future RLS
context must be set/verified transaction-locally after identity verification;
current JWT roles/user_metadata do not become DB authorization automatically.

Review bounded acquisition and database statement/idle-in-transaction timeouts
against the later Vercel runtime budget. A caller Promise.race alone is not safe
SQL cancellation or permission to release a still-running transaction. Keep
the existing rollback/discard behavior. Unknown COMMIT stays503 and discards the
connection; do not automatically retry a write, login or submit. Reconcile with
the original command key / existing resume paths. No answer/revision/deadline or
one-active-device state is stored in the warm function itself.

## Local validation / NOT_RUN

```sh
npm run test:vercel-node
node --test tests/vercel-node/adapter.test.mjs tests/vercel-node/pool-port.test.mjs tests/first-test/cors.test.mjs
npm run typecheck
```

Final combined selection:12/12 PASS (9 new plus3 affected local-CORS regressions),
typecheck exit0. Existing handler over synthetic SQL rows passed Teacher
question/duration/publish → Admin add/assignment → new student start/save/CAS →
new function instance/login supersession → same deadline/answers → result/history.
Unicode split across UTF-8 chunks stayed intact; wire DTOs never gained private
keys/ratios. Pool-port checks cover name omission, bound parameters, one checked-out
client, transaction advisory locks, rollback, unknown COMMIT503/discard and no retry.
The native driver is a recording double and HTTP storage remains the explicit
file-backed statement double: not PostgreSQL, TLS, Supavisor or an RLS engine.

NOT_RUN: actual node-postgres package/driver connection, DB schema/RLS/locks/
isolation, TLS/pooler failover, real staff session/JWKS integration, Vercel build/
rewrite/preview/production, real domains/browser/Telegram launch, load/capacity.
Production bootstrap remains incomplete and the default function stays503.
Mini App files and its strict guard are unchanged; future shared Backend publication
will require a manifest repin before combined QA. No current acceptance is inherited.

## Primary sources checked

* [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js): Web fetch export, single function and rewrites.
* [Vercel rewrite config](https://vercel.com/docs/project-configuration/vercel-json#rewrites): proposal syntax.
* [Supabase connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres): transaction mode, serverless pool size and session-state limits.
* [Supabase named statement setting](https://supabase.com/kb/troubleshooting/disabling-prepared-statements-qL8lEL): node-postgres name omission.
* [node-postgres queries](https://node-postgres.com/features/queries), [transactions](https://node-postgres.com/features/transactions) and [TLS](https://node-postgres.com/features/ssl): parameterization, client ownership and SSL configuration.
