# Backend student runtime/context/HTTP review overlay

Publication proposal only. Author tested; independent Architect/QA review pending.
No activation, deployment, provider or DB readiness is granted by this package.

Lab destination: oybek-muminov/lab_univeracademy, new Backend-owned branch
backend/student-runtime-context-01-20261111, based exactly on
qa/current-flow-20261106@d54d19cb9ba78a13187362afdb2178e90430cefe.
The lab parent is an exchange container, not the application source base.
All existing lab paths/branches, including the comparator branch, remain intact.

Application source base: oybek-muminov/UniverAcademy commit
 de2adf023428a374f075faa421ece9e1deafaf36
with Git tree bc891240798d9bf56ee52c4a0f0ecede8ed33552.
The read-only GitHub commit check confirmed that identity. Reviewers must use
THEIR OWN isolated exact copy of this base, then copy the 15 candidate_overlay
files listed in publication-manifest.json into it, preserving the paths after
this checkpoint prefix. No application history or full source bundle is added
to the lab branch. Do not substitute lab workspaces/univeracademy as an unverified
application base. No author's /workspace or /tmp path is a runtime dependency.

The 15-file overlay alone is not standalone. All unchanged dependencies come
from the exact base, including tests/backend/http-fixture.ts, the API/storage
modules, runtime/local-cors.mjs, runtime/vercel-node.mjs and package.json.
The complete base tree is the dependency pin; no dependency bytes are guessed,
fetched at runtime or borrowed from another owner's workspace.

Offline reproduction, from the resulting application-copy root:

    node --version
    node --test --test-reporter=tap tests/backend/student-prepared/flow.test.mjs tests/backend/student-prepared/clerk.test.mjs tests/vercel-node/production-options.test.mjs

Author runtime: Node v24.22.1. This command ran at
2026-11-11T12:53:51.955496+00:00 and exited 0, 141/141 PASS: 30 focused
flow/auth/context checks plus 111 composition checks (109 retained cases and
2 student-only cases replacing obsolete missing-staff denial expectations).
The checks need Node 24 only; no npm install, network, listener, provider,
database, SQL engine, Worker, controller or cleanup is required. Named statement
responses are test-only in-memory dispatch. They do not prove PostgreSQL/RLS.
With jose absent the malformed-JWT check expects unavailable; with it present it
expects invalid-token denial. Neither branch claims a successful JWT exchange.

For syntax checks, run node --check on each of the 15 overlay paths after copying.
Semantic TypeScript typecheck, AJV validation, full JOSE signature exchange,
real SDK/provider/pool/TLS, browser, PostgreSQL/RLS/concurrency/durability and
primary apply/activation were NOT_RUN. No dependency was installed. package.json
retains jose6.2.15, @clerk/backend3.27.0, typescript5.9.3 and ajv8.20.0; those are
required for their separate fuller validation/integration scopes, not these 141
checks. Do not run npm test, server/driver fixtures or DB actions as part of this
publication review scope.

The five review artifacts are unchanged original author evidence. verification.json
contains commands, cwd, UTC, exit, output hashes and preservation claims; its
absolute paths are historical provenance only. offline.final.log supplies the
actual complete test output. candidate-inventory.json pins all author-run overlay
inputs. REPORT.md records source changes and limitations. remote-source-identity.json
records the exact base receipt. All syntax/replay outputs referenced by the report
were zero bytes and are represented by their SHA/exit records. The nine-byte Node
version output is already quoted exactly by verification.json. Full patch,
command-journal duplicates, empty logs, original input archives and transports
are omitted. Reviewers can derive the source diff against their pinned base;
the original patch and all omitted author artifacts remain retained unchanged.

Addendum limitation: the carried summary digest had 62 hex characters and remains
UNVERIFIED. The current read-only observation was 32391 bytes/SHA256
06b611e412bb158c2d8d2d2e7d10da7dd06e66762f922e1c8fbd380ade62751c;
this is not a repaired or recovered authoritative pin. The verified lab parent
and retained 19-file index provided no authoritative addendum pin. Its bytes are
not needed to run these 141 checks and are not selected for publication.

Default API bootstrap is still unbound. The DB-verifiable scope issuer/verifier,
transaction descriptor, concrete driver binding, Clerk lock authority and
invariant visibility remain open. Submit has no expected revision in the accepted
contract; stale-tab submit prevention belongs to Mini's accepted client. UI and
API contracts are unchanged. Primary writes/activation and G01-G11 remain HOLD.

Screened selected bytes contain source code, explicit synthetic test identifiers/
canaries and author evidence only; no real credentials, personal/student records
or actual provider/database observations are selected. External SHA256 of the
publication manifest is supplied separately for approval; it does not self-pin.

Static screening found one email-shaped substring in an existing negative test
URL with synthetic userinfo (production-options.test.mjs:160, .synthetic.invalid).
It is an explicit invalid-origin fixture, not a personal address or real credential.
Its exact match hash is recorded in the manifest; candidate bytes were not edited.
