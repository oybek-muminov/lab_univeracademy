# Clerk exchange review + local listener handoff

PROVISIONAL / NOT ACCEPTED. Local candidate only. Base lab checkpoint:
`6329367b7346484f58e458f1b62396cfd764e6ec`. Candidate directory:
`/workspace/qa-clerk-http-review-20261107/workspaces/univeracademy`.
No upload, commit/push, real Clerk/Google/DB/provider action or deploy in this task.

## Review contract and the existing client

The baseline `contracts/review-only.openapi.json` stays byte-identical (SHA256
`9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`).
New `contracts/clerk-review.openapi.json` is an exchange-only derived review view,
version `0.3.0-clerk-exchange-review.1`. It has 60 paths/206 schemas. It adds only
`POST /auth/clerk`, `ClerkSessionBearer`, empty `ClerkExchangeRequest`, five student
error enum values, version/status/provenance metadata. All 59 old path definitions
(including staff security) and all old payload fields remain unchanged.

Five implemented student codes added to the review `Error` enum:
`CLERK_TOKEN_INVALID`, `CLERK_SESSION_REVOKED`, `CLERK_IDENTITY_REVOKED`,
`CLERK_SESSION_SUPERSEDED`, `CLERK_TOKEN_REPLAY`. The older unapplied proposal
omitted them; the first new HTTP response-schema test exposed that mismatch.
All original error codes are retained. Linking/staff-policy/CORS-specific error
codes remain outside this student exchange-only schema review; their protocols
are not accepted here. Six staff security edits in the older proposal are NOT
applied to this derived view.

The student projection is 13 paths/48 schemas. Existing files
`packages/api-client/student-client.ts` and generated `student-types.d.ts` are
extended in this isolated candidate; there is no second client or SDK dependency.
The shared local/production constructors retain their existing signatures and
require the new explicit full-schema hash. Production construction describes
request transport behavior, not acceptance or activation of this draft API.

```ts
type StudentSchema = components["schemas"];
exchangeClerkSession(
  clerkSessionToken: string,
  input?: StudentSchema["ClerkExchangeRequest"], // Record<string, never>; defaults {}
): Promise<StudentSchema["SuccessSession"]>;
```

It sends `POST /api/v1/auth/clerk`, `Authorization: Bearer <Clerk session JWT>`,
JSON `{}`. Provider JWT does not go in the URL/body. The response remains the
existing `SuccessSession` with opaque app access/refresh proofs and canonical
profile. Use opaque proofs for me/exams/save/refresh afterwards, not the Clerk
JWT. No automatic exchange retry, proof persistence or provider redirect inside
the API transport. Production transport keeps redirect:error, credentials:omit
and cache:no-store. No wire exposure of authProvider, family binding, internal
identity maps, correct-option keys or exact-ratio/BigInt records.

## Start and use the local listener

Node 24 and the unchanged lockfiles pin jose 6.2.15, openapi-typescript 7.13.0,
TypeScript 5.9.3; validator tooling pins Ajv 8.20.0 and ajv-formats 3.0.1.
On a receiver with this base + reviewed delta:

```sh
npm ci --ignore-scripts
npm run setup:validator
node runtime/clerk-review-server.mjs 8797 http://127.0.0.1:5198
```

It listens only on 127.0.0.1; API base `http://127.0.0.1:8797/api/v1`.
Only the explicitly listed local UI origins pass CORS/OPTIONS. No wildcard or
credential cookies. CLI prints status/address only, never a proof/private key.
There is no HTTP fixture/control/proof-issuing endpoint. Start the listener via
the exported function inside a trusted local harness to obtain synthetic proof
inputs in memory (no token copy through URLs/logs):

```js
import { startClerkReviewServer } from "./runtime/clerk-review-server.mjs";
const local = await startClerkReviewServer({ port: 0 });
try {
  const client = local.lab.client(local.baseUrl);
  const proof = await local.lab.sign(local.lab.actors.existing);
  const session = (await client.exchangeClerkSession(proof)).data;
  const exams = await client.exams(session.access_token);
  console.log({ status: "LOCAL_SYNTHETIC", exams: exams.data.length });
} finally { await local.close(); }
```

Synthetic actor arguments:

| Actor | `userId` | `sessionId` | Starting state |
| --- | --- | --- | --- |
| Existing student | `user_StudentCaseA1` | `sess_StudentFirstA1` | Mapped internal UUID `00000000-0000-4000-8000-000000000001`, registered, physics grant |
| Fresh student | `user_StudentCaseB2` | `sess_FreshUngroupedB2` | No mapping; exchange creates incomplete profile, no group/grant, Telegram=null |

`local.lab.sign(local.lab.actors.fresh)` returns a fresh synthetic JWT for the
second actor; never print/store it. Existing physics assignment:
`00000000-0000-4000-8000-000000000010`. Questions/options/content are synthetic.
This listener uses the F1 handler unchanged, the existing Clerk verifier with
ephemeral process-only RSA keys, and an in-memory current-provider liveness map.
It calls no real issuer/JWKS/provider. Synthetic issuer/azp claims are
`https://clerk.example.com`/`https://student.example.com`; these are fixtures, not
requests or a production configuration. The fixture clock uses fresh wall time
after its queue lock for live use. RSA signing/proof controls are available only
to the importing trusted harness. The global queue/whole-state clone has a
single-process ceiling and proves no Postgres isolation/RLS or capacity.

## Checks and exact artifacts

```sh
node --test tests/clerk-auth/review-listener.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/http.test.mjs tests/enrollment/production-client.test.mjs
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --allowImportingTsExtensions --target es2023 --module esnext --moduleResolution bundler --lib es2023,dom,dom.iterable --strict packages/api-client/student-client.ts tests/clerk-auth/review-types.test.ts
```

23/23 PASS: 5 new checks + 18 affected existing fixture/client regressions. Both
typecheck commands exit 0. New strict wrapper pin is explicit; strict/schema/type
and uuid/date-time format checks remain enabled. All 206 review components compile.
This is component compilation, not a claim of independent full OpenAPI validation.
Tests exercise actual 127.0.0.1 TCP: existing account/save/CAS revision/new-login
resume/deadline/submit idempotency/result/history/body-only logout; fresh account
and empty exams; malformed/schema-invalid body; F1 deleted binding/unmarked origin
and provider revocation; staff device default 503; linking 409; CORS and no fixture
routes. Unknown routes require authentication first (401 without proof,404 with
a valid proof); the local test expectation was corrected to the existing router.

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `contracts/clerk-review.openapi.json` | 433064 | `f6226aa1cea63ae1fbc603b80aed9232bc4dd5213c4cc081cc13300ee0179b28` |
| `packages/api-client/student-openapi.json` | 86307 | `5bb3f266acd8f699ff10df8ef0522852b5d7657af0df349f95d7ac52440020cb` |
| `packages/api-client/student-client.ts` | 8952 | `61cf1d2d0681f3bf25a610c73eff7470159bca45679c5def42101e9a58017494` |
| `packages/api-client/student-types.d.ts` | 48905 | `bc658b13af2d2a75fb88af415637d4c4a63e33c3767f00120242099c86c637cc` |
| `runtime/clerk-review-server.mjs` | 2390 | `04941545a0f98e4fb0f52c490af3129c7fbbe44720b7ee6b199dc6dfed24db16` |

Regenerate without touching the baseline:

```sh
python3 -B tools/generate-clerk-review.py
node node_modules/openapi-typescript/bin/cli.js packages/api-client/student-openapi.json -o packages/api-client/student-types.d.ts
```

Delta source manifest and test/typecheck logs live under
`evidence/clerk-review-2026-11-07/`. The existing published
`BACKEND-CURRENT-SHA256SUMS` and Mini App guard still describe their pinned older
snapshots; they were not repinned or bypassed for this unuploaded candidate.

## Limits and next review

Old unmarked active families still fail closed with 503. No implicit migration or
fallback to Telegram. F1 runtime/verifier and production API/Vercel entry points,
original OpenAPI, provider configs and dependency locks stay byte-identical.
No real Clerk/Google, browser/Mini App OAuth return, persistent DB, RLS, staging or
deploy verification. Real Clerk durable metadata/nullable-Telegram integration
remains pending. Optional association and cross-browser return are text proposals
in `identity-link-return-proposal-2026-11-07.md`; no endpoint is enabled. Staff
device policy, proof freshness protocol, challenge TTL/retention and actual SDK
return behavior require review. This is neither API acceptance nor F1 independent
QA closure. No new upload was made.
