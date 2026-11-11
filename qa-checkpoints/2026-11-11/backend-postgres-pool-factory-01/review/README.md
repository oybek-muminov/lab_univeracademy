# Private pool factory: local source candidate

Author-tested only; independent implementation review is pending. No publication,
driver installation, connection, TLS handshake, SQL or bootstrap activation ran.

Reconstruct an application copy in this order, preserving relative source paths:

1. `oybek-muminov/UniverAcademy` at `de2adf023428a374f075faa421ece9e1deafaf36` (270 files).
2. Backend15 from lab commit `80ee858fefde0b1d3d08b7ef3c07d780b7e41ea3`, checkpoint `qa-checkpoints/2026-11-11/backend-student-runtime-context-01/`.
3. Backend5 from `3f6e3a6bf1a6c2e96fca02aef06712a5d6924391`, checkpoint `qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/`.
4. Mini2 from `1273852e29919f18aaecbe0c2b439fcd3153ff9e`, checkpoint `qa-checkpoints/2026-11-11/mini-first-student-flow-offline/`.
5. Guard3 from `ea0c3cd9c41a465bd5e5205b91f0141710a435fa`, checkpoint `qa-checkpoints/2026-11-11/mini-student-runtime-r2-guard/`.

Copy only the source groups selected by each immutable manifest, never lab reports
into application source. This accepted assembly has 279 files. Its unchanged
selected closure is 119 paths / 2,135,406 bytes. Both candidate paths must be
absent before applying these two additions. No existing guard or pin is changed;
coverage of the additions by a future guard is a separate reviewed task.

Interface: `createPostgresPool(Pool, {host, port, database, user, password, ca})`
returns a private `{pool, close}` resource. `pool` has only the accepted transaction
port's `connect()` interface. `Pool` is a trusted injected constructor; no driver
package is imported. No caller-controlled settings or callbacks are forwarded.

Configuration requires six own data fields. `ca` is a nonempty PEM bundle of
parseable CA certificates; approving and provisioning its trust is the owner's
job. This initial adapter accepts DNS hosts, rejecting IP literals and sockets:
pg8.16.3 sets normal TLS `servername` only on its DNS path. Caller TLS objects,
servername overrides, custom verifiers and connection strings are rejected.
The constructor receives exactly `ssl: {ca, rejectUnauthorized: true}`, max1,
min0, connectionTimeoutMillis5000 and idleTimeoutMillis10000. Any ambient `PG*`
name denies construction; values are never read, logged or cleared.

The factory keeps its idle-error listener throughout the resource lifetime. An
idle error closes new acquisition without reclassifying checked-out work. Late
clients after an idle error or close are discarded once. The composition owner
must drain requests and await close. Close blocks acquisition immediately and
caches one end promise; a throw, rejection or non-Promise result is not successful
closure. A pending end remains unconfirmed. No retry, force kill or process hook
is installed. Returned private resources must never be logged or sent to clients.

Reproduce from the assembled application root with existing Node24 (author:
v24.22.1). No npm packages or external test data are needed for these commands:

```sh
node --check runtime/postgres-pool-factory.mjs
node --check tests/vercel-node/postgres-pool-factory.test.mjs
node --test tests/vercel-node/postgres-pool-factory.test.mjs
node --test tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs
```

Author results: 110 focused tests and 114 existing regressions passed, plus both
syntax checks. Regression tests preceded the two-file implementation and their
entire accepted dependency closure remains byte-identical. Focused tests ran on
the final candidate. Raw command outputs are retained separately. The new tests
use inert EventEmitter constructors/clients, public CA certificates bundled with
the installed Node, and calibrated connection/logging tripwires. Fake environment
name tests replace and restore process.env only inside that isolated test process;
they neither load values nor clear the inherited environment.

Root semantic TypeScript5.9.3 check: NOT_RUN, matching compiler absent in this
owner copy. No installation was performed. Mini's accepted suites were not rerun.
These results establish no real-driver, certificate-chain/hostname handshake,
DB, RLS, signed-envelope authority, provider, concurrency or durability acceptance.
The default API configuration is still undefined/503. SQL-callable Ed25519
verification and the later approved driver/private bootstrap remain external
prerequisites. No backup work was performed.

Future lab proposal: seven additions under this checkpoint on a separate Backend
branch. The manifest pins source and original test evidence; its own SHA256 is
supplied externally. Git can derive the two-file diff; a duplicate patch, archive,
encoded transport, source-base copy and dependencies are omitted. The immutable
lab manifests above provide the reconstruction provenance. Separate exact user
approval is required before any publication.
