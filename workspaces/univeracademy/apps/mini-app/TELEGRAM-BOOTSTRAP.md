# Telegram/API bootstrap: local consumer candidate

Current composition: Backend laboratory commit `1335762a8e133311849b2dad1ddc6be3ccf9bb53`.
Status: PRODUCTION_OWNER_CONNECTED_LOCAL_REVIEW; REAL_TELEGRAM_WEBVIEW_NOT_RUN.
Publication is review source only. No bot/hosting/provider or deployment is connected.

## Prepared code

`src/telegram-bootstrap.ts` reads an already-provided official Telegram WebApp
bridge, forwards its exact raw `initData` string to the owner connection's login,
then loads server profile/exams into the existing `StudentFlow`. It does not read
`initDataUnsafe`, parse Telegram identity/roles, verify HMAC in the browser, or
construct HTTP endpoints/wire DTOs. The existing Backend client remains the sole
owner of HTTP operations and server validation remains authoritative.

Only a nonempty raw string is required locally; server freshness/signature/replay
validation must succeed before its returned identity is used. The post-login
profile must match the connection's authenticated person. No profile is invented
from the bridge. Registration-incomplete and registered students hydrate to the
existing profile/exams screens respectively.

`ready()` invokes the bridge method with its proper receiver, once per bridge
instance, when the UI host has mounted its essential elements. It does not load
the SDK, expand/close a real app, or contact a bot. The production host must provide
the official SDK before app initialization. Telegram's primary documentation is:
https://core.telegram.org/bots/webapps#initializing-mini-apps

## Connection boundary, not a new server contract

```ts
const runtime = createTelegramBootstrap({
  apiBaseUrl: approvedHttpsApiBaseUrl,
  contractSha256: STUDENT_CONTRACT_SHA256,
  readBridge: () => readTelegramBridge(window),
  createConnection: backendApprovedProductionConnector,
});
```

The constructor validates explicit HTTPS `/api/v1`, no URL userinfo/query/fragment,
and the exact current Backend contract SHA256. It has no endpoint default or
relative/native-fetch fallback. `createConnection` receives:

```ts
{ mode: 'production', baseUrl, contractSha256 }
```

and must return the already-reviewed UI `StudentPort` plus:

```ts
auth: {
  login(rawInitData: string): Promise<string>;
  logout(): Promise<void>;
  person(): string | null;
}
```

This is a proposed consumer adapter boundary. It grants no server permission and
does not declare a new Backend DTO, route or production session policy.
Each new constructor call must return a fresh, unauthenticated auth context. A
singleton/reused or silently preauthenticated context is rejected; the bootstrap's
own existing RAM context is reused only through its explicit hydration-retry path.

Backend1335762 now supplies createProductionStudentClient with the same reviewed
operations/types. main.tsx supplies createProductionConnection at compile time;
owner-port.ts uses that constructor with production mode, explicit HTTPS/api/v1,
contract pin and Request transport. The local constructor/entry retains its own
mode/host checks. See PRODUCTION-ENTRY.md for exact source hashes, CORS preparation,
SDK opt-in, new guard and remaining real-service limitations.

## Session and late-response handling

- Concurrent bootstrap starts share one login/hydration task. Other client
  operations are not globally locked.
- An authenticated RAM session is reused; a temporary initial profile/list read
  can retry through it, including the existing owner refresh behavior, without
  replaying Telegram initData.
- Launch fingerprints are SHA256 digests held only for this document lifetime.
  This merely avoids replaying the identical attempted string locally; it is not
  HMAC verification and cannot replace server replay protection. No raw launch,
  access/refresh proof or answer is persisted or exposed by bootstrap snapshots.
- A launch is marked attempted before an ambiguous login result. The same raw
  string cannot be automatically retried after failure or logout. A fresh bridge
  launch is required; no new launch is forged by the client.
- Logout immediately retires the old connection/flow from visible state. Its
  captured owner receipt operation remains separate from a fresh connection.
  Neither a late ACK nor an old 401/body may replace the new session's UI. The
  existing F1/receipt transport code is unchanged.
- Each new authenticated context gets its own flow. Pending registration/save
  callbacks can settle only on a retired flow, not a newly logged-in person.
- Disposal conceals local context; it does not pretend that server logout was
  acknowledged. Logout during an unconfirmed login can also lack a server receipt;
  that state is reported as an error, never a confirmed logout.

This candidate adds no proof-storage TTL, receipt retention or operation-key
persistence policy. Full reload loses RAM state and may receive the same Telegram
launch value; SDK presence does not guarantee a new proof. Fresh-launch/reload
behavior, ambiguous pending-login server-family ordering and durable start/submit
key recovery need Backend/architect review before a real pilot. No successful
reload recovery is claimed for this unconnected production bootstrap.

## New checks only

```sh
npm run test:bootstrap
npm run check
npm run build
```

25 bootstrap tests now use the actual pinned production constructor, fake SDK
and injected RAM Request transport on a reserved example.test HTTPS origin. They
cover exact raw forwarding, unsafe identity rejection, profile/exams/registration,
ready receiver/once, concurrent start, RAM read/refresh reuse, launch non-replay,
profile/person matching, body-only logout, late200/401/body after fresh login,
pending registration/login isolation, disposal, constructor context reuse and
synchronous logout-hook rejection. No native API or real SDK is contacted.

Affected app regressions and the Backend constructor checks are recorded in
PRODUCTION-INTEGRATION-QA.json. This does not claim real
Telegram/iOS/Android WebView, bot launch URL, production API/CORS, durable DB,
provider authentication, load or deployment validation.
