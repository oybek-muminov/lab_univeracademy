# Local HTTP -> PostgreSQL flow01 r4: fresh attempt03, verified driver reuse

PREPARATION ONLY. This revision has not run. The preceding r3 run installed the
13 pinned packages, started PG17.11 privately and committed the base schema, then
stopped on activation syntax. Its exact server was stopped; cluster/evidence and
both prior dependency prefixes remain retained. No seed or HTTP flow ran.

## Exact assembly and source gate

Reconstruct packet036beb26e7a6940827daa8691bc04f0326c7df6f, apply r2
2c5f14d00347268ac613562627825069625d5fda and r3
aa2eeeb8204a2e15194d4c6c618b15babba0754e in order, then only this r4 amendment.
The lab tree is never the application tree. The application remains the frozen
283-file/3596839-byte assembly ending77e04d13, pinned by source-inventory.json.
No Cloudflare/bot/Mini deployment or newer application overlay is silently added.

Frozen SQL A remains34366 bytes/SHA256
3a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4.
Corrected inactive activation is from lab4924d64333a4348bfcfa2e632cb6a1d8ccaae6b3,
tree657dd9e450942137b78d3460ce46b8be782453ee, publication manifest SHA256
dcdac653b1ce210aa26728602defdb7db4297909df090a18441fdf72e4ae3f64.
It is60365 bytes/SHA256
165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d.
Compared with frozen8be232 SQL, only two parentheses around the CASE at line133
were inserted. Helper/role/grant/RLS semantics, review guard and terminal ROLLBACK
otherwise remain unchanged. The existing activation.local.diff remains exact:
only review-guard removal and terminal COMMIT in a disposable scratch derivation.
Derived activation is60296 bytes/SHA256 368697df769a3a9dc52d5697c1af0b664903a9fa77bf2b89f590a47a93ba48e9.
Original sources, prior packet manifests/candidates and failed evidence are not
changed. The syntax correction has source/data acceptance, not successful SQL
compilation. Independent exact SQL/packet QA is an external prerequisite.
Plan status/flags do not attest approval; the external approved-manifest argv
selects the reviewed bytes. Existing same-action user test authorization may cover
this technical rerun; publication and materially changed risk need their own
appropriate authorization. This packet itself grants none.

## One reused dependency input; one fresh disposable cluster

Read-only driver root:
/tmp/ua-http-pg17-driver01-attempt02-20261111/driver.
The included driver/installed-driver-inventory.json is the exact23985-byte
observed npm-success artifact, SHA256
57afe588217490869b9d30906e63c5d93e8a958a4e8bc6e828af74aa79d21e48.
It binds13 package versions and129 node_modules files with bytes/SHA256/modes.
It is a previously observed, externally pinned input, not self-validating proof
of a future observation. Original package.json/lock remain sealed, including
registry URLs/integrity. Preflight and post-flow independently compare the actual
installed files and root package/lock, realpaths, no-symlink and uid1000 ownership.
Root package/lock retain mode0600. Any missing/extra/changed file or identity
stops before a cluster is created, or retains the cluster on post-check failure.
No npm/installer, download, proxy/CA propagation, scripts, global/optional/native
installation, retry, driver/cache/config write/chmod or deletion occurs. The
original install180s limit remains recorded but unused. Dependencies are never
a cleanup target. These are the same13 official packages installed by reviewed
r3: pg8.16.3, pg-pool3.10.1, pg-protocol1.10.3,
pg-connection-string2.9.1, pg-types2.2.0, pgpass1.0.5, pg-int8 1.0.1,
postgres-array2.0.0, postgres-bytea1.0.0, postgres-date1.0.7,
postgres-interval1.2.0, split2 4.2.0, xtend4.0.2.

New packet assembly: /tmp/ua-http-pg17-flow-packet-r4-20261111.
New runtime and ONLY deletion target:
/tmp/ua-http-pg17-flow01-attempt03-20261111.
Evidence: the fresh packet's evidence/ outside runtime. No existing runtime or
evidence is adopted. The attempt02 cluster
/tmp/ua-http-pg17-flow01-attempt02-20261111 is stopped and excluded, as are the
original /tmp/ua-http-pg17-driver01-20261111 prefix and all prior evidence.

## Unchanged execution ordering and isolation

Sole owner Architect uid/gid1000, OS peer user agent. Preflight all sealed inputs,
283 source files, eight existing tool identities, driver reuse and fresh paths;
write durable resource ledger/driver reuse witness; create only fresh runtime;
init/start PG17.11; verify actual identity/no-TCP; create inert local anon,
authenticated,service_role stand-ins and ua_flow01 database; apply base schema;
create/witness non-superuser activation operator; apply the reviewed derived
activation; check closed transfer window and four expected ADMIN-only creator
memberships; disable operator; create restricted connection role; seed/run the
unchanged real HTTP flow; check source/tools/driver; exact shutdown; success-only
identity-checked cleanup. No additional fixture or operation is added.

ua_flow_admin is disposable-cluster superuser only for setup/schema/seed.
Actual ua_flow_operator is non-superuser/NOBYPASSRLS with CREATEROLE and existing
ua_owner authority; current_user=session_user, inherited/SET authority and already
empty createrole_self_grant are checked, never manufactured by changing settings.
Corrected SQL revokes its temporary ownership-transfer prerequisites atomically.
ua_runtime stays NOLOGIN. Peer LOGIN ua_flow_client inherits runtime with SET false,
no owner/superuser/BYPASSRLS/CREATE ROLE/DB privilege. Runtime/application assertions
never use admin. The exact existing seed uses two synthetic people, two questions,
four options per question and14 initial application rows; no real identity/token.

Private0700 Unix socket, listen_addresses empty, port55473 as socket filename;
host rules reject IPv4/IPv6. Loopback HTTP127.0.0.1:0 only; no preview/forwarding.
The test-only Unix adapter remains separate from unchanged production TLS factory.
psql -X -w ON_ERROR_STOP=1, PGCONNECT_TIMEOUT=5. All children get the original clean
PATH/HOME/TMPDIR/LANG/LC_ALL/TZ allowlists; no inherited proxy/CA/PG*/NODE_OPTIONS,
credentials or provider variables. Controller launcher likewise gets only its
fixed clean environment. No outward network operation is required in this run.

All original limits remain: runtime240s, init60s, start30s, SQL90s, flow120s,
stop30s (pg_ctl timeout20s plus wait5s), concurrency1, pool1, PG connections6;
Node heap128MiB, shared buffers16MiB/work memory1MiB/maintenance16MiB,
temp files32MiB, statement5s/lock2s/idle-transaction15s; runtime256MiB,
driver128MiB, per-command output1MiB and all evidence8MiB sampled stop thresholds.
These are sampled thresholds, not OS disk/memory quotas. Existing fsync,
synchronous_commit and full_page_writes remain on.

## Unchanged assertions, failure handling and cleanup

flow.mjs/seed.mjs remain byte-identical. Exercise me/exams/detail/start/resume,
answer INSERT then same-answer UPDATE, stale409, expiry rollback, cross-person
denial, submit/result/replay and fresh-connection committed readback. Actual
restricted-role flags, ENABLE+FORCE RLS and transaction-context reset witnesses
remain required. Seed is followed by the reviewed application writes only.
Any failure/drift/denial/uncertainty stops; no SQL retry, unreviewed repair,
existing runtime adoption, force kill, restart or deletion retry. Owned server
stop retains all identity checks. Failed cluster, dependencies and evidence stay.

Success cleanup is unchanged: verify exact root realpath/marker/inode, cluster
system identifier and exact process executable/argv/start ticks; graceful owned
shutdown, confirmed stopped control state/PID absence; exclusive durable cleanup
intent/readback/fsync before one exact-root deletion; observed absence and durable
confirmation. If intent fails, deletion cannot start. After deletion starts,
partial/unknown/confirmed-absent states are reported honestly even if later
journal/result writing fails. No deletion is retried. Tools/source/dependencies,
all old clusters and evidence remain outside deletion scope.

## Proposed publication and exact eventual launcher

Publish only six necessary files: SCOPE.md,plan.json,run.py,
corrected-activation.review.sql,driver/installed-driver-inventory.json and
packet.sha256.json. Other eight prior payloads are inherited unchanged. The full
assembled packet has14 files. No application archive, driver package source,
failed cluster or broad evidence copy is included.
Proposed repo oybek-muminov/lab_univeracademy; branch
architect/local-http-pg-flow01-r4-20261111; sole parent
aa2eeeb8204a2e15194d4c6c618b15babba0754e; prefix
qa-checkpoints/2026-11-11/architect-local-http-pg-flow01-r4/.
No publication or execution has been performed for this revision.

After exact publication, independent review and scope authorization, use only:

    env -i PATH=/usr/bin:/bin LANG=C LC_ALL=C TZ=UTC /opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/python3.12 /tmp/ua-http-pg17-flow-packet-r4-20261111/run.py --approved-manifest <EXTERNALLY_APPROVED_FINAL_SHA256>

This remains a local synthetic Node HTTP->PG milestone. It proves no actual
Clerk/Google/Telegram login, Cloudflare/Hyperdrive deployment, production TLS,
primary Supabase integration, arbitrary lazy SQL paths, concurrency/load or
crash/fault durability. G01-G11 and primary apply/activation stay separate.
No backup/support/provider investigation or bot/UI change is part of this packet.
