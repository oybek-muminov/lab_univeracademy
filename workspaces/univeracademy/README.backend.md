# UniverAcademy — current local Backend flow

This is the current RAM/synthetic Backend candidate for QA. API status is
**PROVISIONAL / NOT ACCEPTED**. It is not a production deployment or a durable DB
implementation. Source is published under `workspaces/univeracademy/` on
`qa/current-flow-20261106`, based on laboratory main
`dc2bf835c7eee35e2471b2c14764957131543cfd`.

Requires Node **24.x** and npm. Install both committed lockfile dependency sets:

```sh
cd workspaces/univeracademy
npm ci --ignore-scripts
npm run setup:validator
npm test
npm run typecheck
```

`npm test` runs only the ten current content-pilot HTTP integration tests. The
clean intake installation passed10/10 tests (exit0) and typecheck (exit0), including
the launch-helper regression. The
minimal checkout deliberately excludes historical archives, old QA evidence,
unrelated tests, dependency caches and build output. Ajv8.20.0 and
ajv-formats3.0.1 are pinned in `tests/backend/validator/tooling/package-lock.json`;
strict/format validation remains enabled. The full current OpenAPI is a required
runtime validation input, not a historical archive. Its SHA256 remains
`9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`.

Start a fresh listener in terminal A:

```sh
node runtime/content-pilot-server.mjs 8792 > /tmp/ua-content-pilot-run.json
```

It binds only `127.0.0.1`; base URL is
`http://127.0.0.1:8792/api/v1`. Stop with Ctrl-C; RAM data is discarded. The fixture
seeds a demo, group, empty draft and unregistered student. No published version or
ready assignment is seeded. The old published version ending030 is absent.

Register the synthetic student through the Mini App, or use the local client in
terminal B:

```sh
node --input-type=module <<'JS'
import { readFileSync } from "node:fs";
import { ungroupedLaunch } from "./runtime/ungrouped-fixture.mjs";
import { createLocalStudentClient, STUDENT_CONTRACT_SHA256 } from "./packages/api-client/student-client.ts";
const run = JSON.parse(readFileSync("/tmp/ua-content-pilot-run.json", "utf8"));
const launch = ungroupedLaunch(run);
const client = createLocalStudentClient({ mode: "local_fixture", contractSha256: STUDENT_CONTRACT_SHA256,
  baseUrl: run.baseUrl, transport: (request) => fetch(request) });
const { data: session } = await client.telegramLogin({ init_data: launch.initData });
await client.updateProfile(session.access_token, { first_name: "Yangi", last_name: "Sintetik" });
console.log({ registrationComplete: true, exams: (await client.exams(session.access_token)).data.length });
JS
```

Expected initial exam count:0. Do not print/store raw session proofs in shared
evidence. Every launch creates fresh signed synthetic initData. One successful new
student login revokes the prior session family while preserving profile/attempts.

After registration, run the staff driver:

```sh
node runtime/content-pilot-driver.mjs /tmp/ua-content-pilot-run.json
```

It sends Teacher question PUTs, duration/instructions/grading PATCH and publish
POST, then Admin membership PUT and explicit assignment POST. The complete Version
returned by `publishContentPilot(run)` is passed to
`assignContentPilot(run, publishedVersion)`. Assignment `version_id` and `demo_id`
come from that HTTP publication response. Successful ACK:

```json
{"stage":"staff_added","confirmed":true,"assignmentId":"00000000-0000-4000-8000-000000000060","publishedVersionId":"00000000-0000-4000-8000-000000000031"}
```

Synthetic identities, never real credentials:

| Actor | Local argument |
| --- | --- |
| Teacher, approved physics subject | `Bearer synthetic-teacher-proof` |
| Admin, scoped roster/content capabilities | `Bearer synthetic-admin-proof` |
| Student | Telegram ID4000000002; fresh signed initData only |
| Student UUID | `00000000-0000-4000-8000-000000000002` |
| Group UUID | `00000000-0000-4000-8000-000000000041` |
| New published version UUID | `00000000-0000-4000-8000-000000000031` |

Staff proofs are fixed test verifier inputs and cannot authenticate to a real
provider. They stay in the staff driver, never the student browser.

For the existing Mini App worker, generate fresh launch arguments with:

```sh
node runtime/ungrouped-driver.mjs launch /tmp/ua-content-pilot-run.json http://127.0.0.1:5198/ 390 /tmp/ua-content-pilot-evidence
```

The shared launch helper now takes `answerLabel` and `expectedDisplay` from
`run.fixture`; its two-field fix is covered by new assertions in the ten-test
suite. For this fixture they are `Yangi A` and
`{"earned_points":"0.1","max_points":"0.3","percentage":"50.00"}`.
Both new questions have exact weight0.125; one correct answer earns1/8 of maximum1/4.
Duration is420seconds. Run fresh fixtures per independent browser scenario. A
browser frontend/worker is supplied separately by the Mini App agent; actual
browser verification is not claimed by this Backend source publication.

Admin assignment requires manage_content and current group AND subject scope;
manage_roster is independent for membership/transfer. Content authoring/publication
retains this batch's Owner/approved-subject Teacher implementation. Only a started
active attempt blocks transfer; unstarted recovery eligibility is revoked with
history retained. Recovery eligibility in the corresponding test is server-seeded;
no recovery activation HTTP endpoint is claimed. All transaction guarantees here
are RAM contract tests, not durable DB/RLS/concurrency capacity proof.

No real questions/keys/users, credentials, SQL/migrations, DB/provider changes,
production policy approval or deploy are included. File identities for this
Backend publication are listed in `BACKEND-SHA256SUMS` (excluding itself).
