Local content + Admin A + transfer candidate, 2026-11-06. PROVISIONAL / NOT ACCEPTED.

This candidate continues the available policy135 source with the existing content132
question/duration/publish operations. The original checkpoint sources are preserved.
It is not a reconstructed MAIN118 or a new laboratory package.

The new assignment content loader reads the immutable snapshot saved by HTTP
publication. It copies the published test, duration, instructions and student-safe
prompts/options into a new assignment under the same RAM transaction. It does not
expose answer keys, exact Ratio/BigInt records or explanation blocks in student HTTP
responses. Authoritative demo title/subject metadata is server-loaded state, not a
new AssignmentCreate field. Missing metadata is 503; a mismatched snapshot identity
is an invariant failure, 500, with no partial assignment, grant or receipt.

The synthetic pilot starts with one demo and one empty draft. There are no ready
published versions or assignment templates in this fixture. Teacher HTTP writes
two new questions, PATCHes duration/instructions/grading, then publishes. Admin
assignment uses the version ID returned by that publish response, not a seed
published version. The new version is 00000000-0000-4000-8000-000000000031;
the old seed published version ending 030 is absent. Demo/group/student and draft
creation remain synthetic fixture setup, not implemented creation endpoints.

Admin A remains manage_content + current group AND subject scope for assignment.
Membership/transfer retain separate manage_roster authority. New question/publish
operations retain the content132 Owner/approved-subject Teacher implementation;
Admin question/publish and future Teacher assignment remain pending. No new product
capability or wire DTO is added. The transfer branch is byte-identical to policy135:
only a started active attempt blocks transfer; an unstarted recovery permission is
cancelled and retained in audit, while past answers/results/history remain.

Full contract remains 9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4.
The regenerated staff slice contains six operations and 23 schemas, each checked
against the exact full source; types use the existing openapi-typescript 7.13.0.
No full contract assertions, numeric policies or validator profiles were changed.
The legacy loader can still read previously loaded matching-version assignments;
the new pilot exercises only the publishedSnapshot branch.

New integration verification:

```sh
node --test tests/local-content-pilot.test.mjs
npm run typecheck
```

Executed result: new integration suite 10 PASS / 0 FAIL / 0 SKIP, exit0;
typecheck exit0. Final suite duration was 1195.416615ms. Initial test-harness
method/key mismatches were corrected before the final passing run.

The ten new loopback HTTP tests cover registration/empty exams, question/duration/
publish, Admin assignment, save/clear/stale CAS/resume/submit/result/history, exact
grading and closed response fields, independent Admin capabilities/current scope/
revoked replay, unchanged content authority, snapshot isolation/idempotent retries,
publish-assignment race, failed commit/lost ACK, active transfer before deadline,
deadline equality with expiry surviving stale-CAS409, unstarted future recovery
revocation/history preservation, start-transfer race, and missing/mismatched
authoritative content. Recovery eligibility is seeded by a test-only state fixture;
there is no claimed recovery activation HTTP implementation. The older exact
132/128/135 test suites were not rerun. The minimal repository publication includes
only the ten current integration tests and their required fixture/validator sources.

The exact score for one correct answer is 1/8 of 1/4 maximum. Student display is
0.1 / 0.3 and 50.00%, using the approved one-decimal half-up point display; exact
calculation is preserved. Both synthetic questions have the same weight, so the
one-answer expectation is independent of server question shuffle. This is not a
new numeric output range or precision decision.

For local use, start a fresh RAM listener, register the synthetic pupil through
the student client, then run the staff driver:

```sh
node runtime/content-pilot-server.mjs 8792 > /tmp/ua-content-pilot-run.json
# A separate process, after student profile registration:
node runtime/content-pilot-driver.mjs /tmp/ua-content-pilot-run.json
```

The listener is bound to 127.0.0.1. Stop with Ctrl-C; RAM state is discarded.
The staff driver contains only synthetic proofs and must run outside the student
browser. Tests use real loopback HTTP with a local synthetic staff verifier, not
real JWT/provider authentication. Actual browser testing, durable transactions,
DB/RLS, media validation, full admin creation/reporting, real questions/keys,
production session/numeric policy acceptance, capacity and deployment remain
unverified/pending. No SQL, real DB/provider operation, upload or deploy is included.
