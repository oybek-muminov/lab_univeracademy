# Existing student client: production constructor

File: `packages/api-client/student-client.ts`. No second client or API was added.
The existing local constructor and the new production constructor call one shared
implementation with the same operations, DTOs, error parsing and refresh behavior.

```ts
export type ProductionStudentClientOptions = {
  mode: "production";
  contractSha256: string;
  baseUrl: string;
  transport(request: Request): Promise<Response>;
};
export type StudentClient = ReturnType<typeof buildStudentClient>;
export function createProductionStudentClient(
  options: ProductionStudentClientOptions
): StudentClient;
```

`buildStudentClient` is private, not another public constructor. Existing exports
`createLocalStudentClient`, `LocalStudentClientOptions`, `StudentSchema`,
`StudentApiError`, `StudentClientProtocolError` and contract constants remain.

```ts
import {
  createProductionStudentClient,
  STUDENT_CONTRACT_SHA256,
} from "./packages/api-client/student-client.ts";

const client = createProductionStudentClient({
  mode: "production",
  contractSha256: STUDENT_CONTRACT_SHA256,
  baseUrl: configuredHttpsApiBaseUrl, // explicitly configured deployment /api/v1
  transport: (request) => fetch(request), // explicit caller transport
});
```

Configuration requires absolute HTTPS `/api/v1` (optional single trailing slash),
no URL credentials/query/hash, exact source contract hash and explicit transport.
Named local/loopback/invalid fixture destinations are rejected. There is no
default hostname, environment sniffing, native-fetch fallback or guessed deploy
URL. This URL check is configuration validation, not a general network ACL.
Requests use redirect:error, credentials:omit and cache:no-store in production.
Session tokens remain explicit method arguments. No automatic login, timers,
persistent token storage or retry was introduced; refresh coalescing/one-attempt
behavior remains the existing implementation. Deployment TLS/DNS were not tested.

Client file:8521bytes, SHA256
`54c110d7736a2537e384bddaaab2e91a78e2e56fe3d365fd7d688fa51ab65fae`.
This is the implementation file hash, not the API hash.

API contract remains
`9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`,
version `0.2.9-admin-assignment-policy-a-candidate.1`, PROVISIONAL / NOT ACCEPTED.
OpenAPI, generated schema/types and backend DTOs were not changed.

```sh
npm run test:production-client
npm run typecheck
```

New constructor tests4/4 PASS. The empty-database enrollment HTTP tests also use
this production constructor with an explicit test transport mapping its HTTPS
request to loopback. No request reaches the illustrative production hostname.
This client is published as review source on the laboratory QA branch. It has
not been deployed or verified against a real production endpoint.
