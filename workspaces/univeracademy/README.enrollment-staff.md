# Production client + new identity/current staff readers — local candidate

This continues the local persistent-HTTP candidate, whose published Backend base
was8f863e645746159466e06dabb56db3b94f26be05. Current publication is limited to the
laboratory QA branch; the main project repository was not changed.
API remains PROVISIONAL / NOT ACCEPTED. Earlier checksum lists retain checkpoint
meaning; this delta is in BACKEND-CURRENT-SHA256SUMS.

The priority [production client handoff](CLIENT-PRODUCTION-HANDOFF.md) gives the
exact constructor export, configuration, file hash and unchanged API identity.

```sh
npm ci --ignore-scripts
npm run setup:validator
npm run test:production-client
npm run test:enrollment-staff
npm run typecheck
```

New checks:4 client tests +9 identity/staff tests PASS. Affected persistent HTTP
regression9/9 and storage regression12/12 also PASS. Typecheck exit0. The older
exact RAM10/132/128/135 suites and unrelated JWT-only tests were not rerun.

Student creation no longer requires a seeded person. New tests start with empty
people/memberships/proofs/grants/staff identity tables. The existing Telegram HTTP
login verifies HMAC before choosing its identity gate, then rechecks freshness
under that gate and after the person lock. A transaction-scoped advisory key is
the negative verified Telegram ID (one bigint, reserved namespace). On a new
identity, StudentIdentityRows inserts UUID + unique10-digit Qadam ID + student
profile and inactive groupless membership, then the unchanged HTTP handler issues
opaque session proofs and consumes replay in the same transaction. ACK follows
COMMIT; failed/expired/write-error paths roll back the new person too.

Existing people are never recreated, enabled or granted the student role by this
path. Verified Telegram mapping, people PK, Telegram uniqueness and Qadam
uniqueness must be enforced by the proposed schema. Qadam/UUID collisions use
ON CONFLICT DO NOTHING and bounded fresh candidates from the configured existing
identityCollisionAttempts policy. It does not overwrite another person. Concurrent
first login/same replay and unknown COMMIT recovery have local contract tests.
No default group, test grant, staff identity, Owner role or staff permission is
created by enrollment. No raw initData/access/refresh proof is stored.

StaffAccessRows now locates issuer+provider subject in the current identity table
and reads role/account/approval/capability/group/subject/Teacher approvals from
current normalized rows after the authoritative actor lock. The composition
overwrites any cached projection authority with this result and rejects changes
to it. Current account/approval/roles and mandatory provider-session liveness are
checked before private domain loading. Token metadata and a cached Owner cannot
grant authority. Missing/revoked mapping/access/session fails closed.

Admin test management and roster remain independent; assignment group AND subject
scope remains the existing policy A. Teacher content remains approved-subject-wide.
All-scope flags and explicit revocations are read from DB rows on every request.
Affected target-person hints from membership/assignment/transfer plus authoritative
actor are always included in the sorted person lock set; a trusted optional
resolvePersons port may add further resource-specific locks, not remove them.

Read [schema/locking/authorization details](docs/api/identity-staff-readers-2026-11-07.md)
before connecting a real driver. The local executor persists synthetic rows but
dispatches SQL by statement name; it is not PostgreSQL or an RLS engine. Staff
permission setup in tests is explicit synthetic administrative data after creating
the app person through HTTP; no person or permission is a runtime fallback.

Remaining blockers: actual schema/FK/unique/RLS/grants and SQL/isolation proof;
real provider identity mapping/onboarding and current session lifecycle permissions;
full staff content/roster/assignment/transfer/outbox relational repositories;
bounded history/proof loading and production session/numeric policy review;
deployment/TLS and Mini App production integration. No actual DB/provider calls,
migrations or deploy were performed. Source publication is only to the lab QA branch.
