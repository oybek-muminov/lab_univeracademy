# Pool factory r2: lazy constructor boundary

Local author-tested revision; independent implementation review is pending.
The original package at lab commit e0ad56dfda167a34eb4e4dd2e74b2d700808b49e
and its evidence remain unchanged. This revision addresses only its confirmed P2.

Reconstruct the accepted279 application assembly using the original package's
immutable source mappings (de2adf ->80ee858 ->3f6e3a6 ->1273852 ->ea0c3cd9),
then apply the two original pool files from e0ad56df and replace only those same
two paths with this revision. The application still has281 files; all279 other
files and the selected119-path/2135406-byte closure remain unchanged. Do not copy
lab reports into application source, edit guards, or repin them for these files.

The private API is now createPostgresPool(Pool, Client, options). Both constructor
references come from trusted server composition. The six connection fields are
unchanged. Caller Client/TLS/callback/URI overrides remain rejected. The Pool must
store the internal GuardedClient as its own Client data property before exposure.

GuardedClient checks current PG* NAMES synchronously immediately before the real
Client constructor, covering queued and replacement creation. Initial factory and
acquisition checks remain additional defenses. Contamination or a real Client
constructor exception latches the resource unavailable. The guard does not throw
through pg-pool's asynchronous queue: a private inert EventEmitter failure client
reports one fixed error asynchronously through connect(callback), cannot query or
succeed, and has harmless completion-safe end(callback). It retains no private
cause. There is no environment clearing, value inspection, global constructor or
pg.defaults mutation, real driver import, connection, SQL or bootstrap wiring.

pg8.16.3 source selects options.Client at pg-pool/index.js:88 and constructs it at
:217, including the queue/replacement paths. These source bindings support the
design; inert tests do not establish real-driver compatibility.

Author results on final bytes, Node v24.22.1:

```sh
node --test tests/vercel-node/postgres-pool-factory.test.mjs
node --test tests/vercel-node/pool-port.test.mjs tests/vercel-node/production-options.test.mjs
node --check runtime/postgres-pool-factory.mjs
node --check tests/vercel-node/postgres-pool-factory.test.mjs
```

119 focused tests,114 existing regressions and both syntax checks passed. Focused
coverage includes first/queued construction, names-only zero-value-read denial,
queued constructor exceptions, no recursive failure loop or uncaught throw,
bounded disposal, constructor selection, TLS constants, idle/close races and
unchanged commit_unknown/503. No optional comparator or Mini suite was repeated.
Root semantic TypeScript check is NOT_RUN in this owner copy: matching5.9.3 is
absent; no installation occurred. QA's PASS on the original package is relayed
historical evidence, not this revision's independent acceptance.

Red-before reproduction uses a disposable original e0ad56df application assembly.
Append review/red-before.append.txt as exact bytes to the original focused test
(20244 bytes/SHA2569445e70dd533eb0a6e6c57884e6fbd6d2111a0766f798a288c83ca9459b154d6).
The concatenation must be24120 bytes/SHA256a08a2ceadce735012fd779ba697a42bf6cb6a88ec6927d36fa9bc76eac2c14b2.
Run node --test --test-name-pattern='lazy constructor boundary' tests/vercel-node/postgres-pool-factory.test.mjs.
The captured author run had0PASS/3FAIL, exit1: each case read a synthetic PG value.
The append is data for exact replay, not another application file. It avoids
duplicating the original110-test source. Raw red and final green logs are retained.

No actual credentials, student records or private keys are included. Tests use
synthetic data and public CA certificates already bundled with Node. Existing
bootstrap stays undefined/503. Real driver/TLS/DB/authority/provider/runtime,
concurrency and durability acceptance remain outside these results. Supported
SQL-callable Ed25519 verification and later approved driver/bootstrap work remain
separate prerequisites. No backup, provider, SQL, installation or upload ran.

Future lab proposal: a separate Backend r2 branch from exact e0ad56df, nine files
under the new checkpoint. Git can derive the two-file delta; no full patch,
transport, archive, base copy or dependency tree is included. The external manifest
pin and payload inventory are supplied separately. Publication needs separate
exact user approval and a fresh parent/branch/prefix/hash recheck.
