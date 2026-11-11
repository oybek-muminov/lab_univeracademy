# Local HTTP -> PostgreSQL flow01 — complete review candidate, NOT AUTHORIZED

This networking revision has not been executed. The prior approved packet's
controller ran only npm and stopped at EAI_AGAIN; no package installation,
PostgreSQL/SQL/HTTP/seed or cleanup stage completed. Failed evidence and dependency
prefix remain retained. This revision receives text/AST/reference/hash review
only; historical syntax/text replay results are carried, not newly rerun.

The application is the exact 283-file/3596839-byte assembly: accepted main
de2adf023428a374f075faa421ece9e1deafaf36 plus the ordered lab overlays recorded in
source-inventory.json, ending in trusted-server context77e04d13. The lab tree is
not its application tree. Original source, tools, SQL A/B, guards and all prior
evidence remain unchanged. Application files are NOT duplicated in this packet.

## Exact inputs and external execution gates

This separate revision preserves the prior11-file preparation manifest
3f27734811803662336ee5c202d51055afc9a4ae933e08498536132bed27756d unchanged.
All executable inputs are now specified. plan.runnable=true means input-complete,
NOT user authorization. No command may run until this exact packet is published
with separate permission, independently reviewed by QA and explicitly approved
for installation/run/cleanup. The external manifest pin in the approved launch
argv is selected outside the packet; no caller flag or local file grants authority.

Corrected activation is the exact60363-byte immutable lab source8be232eff22c2608b55f7f5513d8752a0307977a,
SHA256e7929b6c36e3d251c62177c76d69a9071fe35f0f6845585bc26aff21485e2dbd.
Architect and independent QA accepted P2-CTX-01 at SOURCE level only. QA report
SHA25640251d2ff85ea8be25af48cab1c67c93212ff1134a5b929b309de3123e0b31c6.
Earlier337-test/TS application source acceptance was retained without rerun.
Eight selected guard pins remain stale; no guard PASS or repin is implied.
Its guard/ROLLBACK are preserved
in corrected-activation.review.sql. activation.local.diff proposes only deliberate
guard removal and terminal COMMIT:60294 bytes/SHA256
b3ff2979c16c2daddc024c3e700b8a55494c9d2a068cc2a7885fdfd310e1ee4c.
No SQL was parsed, compiled or run. Helper bodies, scoped grants/policies and all
283 application bytes are unchanged from the independently inspected originals.

The original frozen SQL A IS present, exact34366 bytes/SHA256
3a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4.
bootstrap.local.diff limits its proposed scratch derivation to deliberate guard
removal and final ROLLBACK->COMMIT. The derived identity is34294 bytes/SHA256
bd3d7c05acc2aa6f9d07885075a2f7482e31c7fa46d580d4d3207978bfcf5efb.
Both minimal derivation diffs are supplied for independent text replay; no supplied SQL has been executed.

True disposable-cluster superuser ua_flow_admin performs init/schema setup and
synthetic seeding only. Activation is proposed under ua_flow_operator, a separate
non-superuser/NOBYPASSRLS role with CREATEROLE and existing ua_owner authority.
This matches the published correction: actual current_user=session_user, CREATEROLE,
inherited ua_owner/SET authority and schema owner ua_owner are checked before the
activation. createrole_self_grant must already be empty and is checked, not set.
The source provides temporary schema CREATE plus explicit self-granted operator
SET/INHERIT with grantor-specific revocation. Bounded post-apply metadata must show
no surviving CREATE/SET/INHERIT/runtime-helper membership, and exactly the four
expected implicit bootstrap-granted ADMIN-only creator rows. These checks use the
non-superuser operator connection, never the cluster superuser.
After activation, the draft disables the operator login/CREATEROLE and revokes its
ua_owner membership. This is not proof of actual Supabase operator compatibility.

ua_runtime remains NOLOGIN. After activation, the separate peer-only LOGIN
ua_flow_client gets runtime inheritance with SET false, no superuser/BYPASSRLS,
ownership, CREATE ROLE/DB or owner/helper membership. HTTP/DB assertions use only
this runtime connection, never seed/admin credentials. Actual role flags,
nonownership and ENABLE+FORCE RLS are asserted from the real local catalog.

## Proposed exact resources and limits

Sole owner: Architect uid/gid1000, OS peer user agent, this existing workspace.

- Runtime/only deletion target: /tmp/ua-http-pg17-flow01-attempt02-20261111.
- Retained private driver prefix: /tmp/ua-http-pg17-driver01-attempt02-20261111/driver.
- Evidence: this packet's new evidence/ directory, outside runtime root.
- New database ua_flow01; only initdb's inherent postgres/template databases in
  addition. No existing cluster, role, resource or evidence directory is adopted.
- Private0700 directories/socket, port55473 only as Unix-socket filename;
  listen_addresses empty, host rules reject IPv4/IPv6. HTTP127.0.0.1:0 only.
  No preview, forwarding, external tunnel, real credential or provider connection.
- Concurrency1, poolmax1; servermaxconnections6. Install180s, runtime240s,
  init60s/start30s/SQLcommand90s/flow120s/stop30s. Shutdown retains its separate
  bounded opportunity after a runtime limit. No force kill or SQL/delete retry.
- Statement5s, lock2s, idle transaction15s; HTTP10s, one expiry-control HTTP16s
  with a pause<=12020ms. Shared buffers16MiB, work_mem1MiB, maintenance16MiB,
  temp_file_limit32MiB, Node old-space128MiB. This is NOT a cgroup/process-RSS cap.
- Runtime disk256MiB, dependencies128MiB, evidence8MiB, command stream1MiB:
  sampled stop thresholds at100ms, not filesystem quotas; overshoot is possible.
  fsync/synchronous_commit/full_page_writes stay ON. No crash-durability claim.

## Driver source and exact future installation command

Public official npm metadata pins pg8.16.3 and these12 transitive packages:
pg-pool3.10.1, pg-protocol1.10.3, pg-connection-string2.9.1, pg-types2.2.0,
pgpass1.0.5, pg-int8 1.0.1, postgres-array2.0.0, postgres-bytea1.0.0,
postgres-date1.0.7, postgres-interval1.2.0, split2 4.2.0, xtend4.0.2.
package-lock.json freezes official registry tarball URLs and registry-declared
SHA512 SRI. Its additional optional pg-cloudflare1.2.7 metadata entry is omitted
from installation; pg-native is also omitted. Planned installation:13 packages,
408805 registry-declared unpacked bytes. Actual tarball bytes are not downloaded
or independently verified yet. The handwritten lock's npm acceptance is NOT_RUN.

run.py creates fresh private home/tmp/cache/driver directories, copies only the
sealed package/lock and creates two distinct zero-byte npm configuration files:
user.npmrc and global.npmrc under the private dependency root, each exclusive-created
with mode0600. USERCONFIG and GLOBALCONFIG point to those respective paths; they
never share a filename (P2-PKT-01). No installer has been run. Its exact argv is:

    /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node /opt/codex/runtimes/codex-primary-runtime/dependencies/node/lib/node_modules/npm/bin/npm-cli.js ci --prefix /tmp/ua-http-pg17-driver01-attempt02-20261111/driver --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org/ --fetch-retries=0 --fetch-timeout=15000

The controller is launched with a clean environment containing only fixed
PATH/LANG/LC_ALL/TZ and eight inherited platform networking bindings named in
plan.installer_network. The launcher reads only these names; values are passed
via execve environment, never argv/log/ledger/source. Controller preflight rejects
missing bindings, conflicting case variants, proxy userinfo/query/fragment,
registry NO_PROXY bypass, or either CA byte/hash drift before creating resources.
No new proxy, network policy, trust-store setting or credential is configured.

Only npm receives these network bindings, in addition to the original private
PATH/HOME/TMPDIR/LANG/LC_ALL/TZ, USERCONFIG/GLOBALCONFIG/CACHE/REGISTRY and
IGNORE_SCRIPTS=true,AUDIT=false,FUND=false. STRICT_SSL=true is explicit and
UPDATE_NOTIFIER=false prevents npm's incidental /npm metadata check. Both CA files
are pinned in plan; no TLS bypass or extra software is allowed. Official registry,
lock/SHA512 integrity, thirteen packages, optional/native omission and retry0 stay
unchanged. The SQL/HTTP/pg children receive only their original clean allowlists;
psql additionally gets constant PGCONNECT_TIMEOUT=5. No PG*/NODE_OPTIONS/token or
provider credentials are forwarded.

This is proposed repair scope, not a successful npm validation: the prior exact
attempt failed at getaddrinfo EAI_AGAIN before DB creation. Existing inherited
route HEAD https://registry.npmjs.org/pg returned200/TLS verify0, metadata only;
this does not prove npm/tarball/integrity installation success or exclude an
earlier transient DNS issue. The failed dependency prefix and original evidence
remain preserved; this next attempt uses fresh runtime/dependency/evidence roots.

Existing tools are Node24.22.1, npm11.9.0 and the pinned private PostgreSQL17.11
build without OpenSSL. This run does not use or weaken the production TLS factory.

## Seed and real assertions

seed.mjs derives only reviewed synthetic IDs/content from tests/backend/http-fixture.ts.
Two people, two questions, four distinct options/question and valid correctOptionId.
Run-relative admission/session times replace the historical fixture clock. Fourteen
initial rows across nine tables:group1,people2,memberships2,demo1,version1,
assignment1,grant1,families2,access3. No initial attempts/answers/results/receipts.
Opaque proof fixtures are synthetic, not verified Clerk/Telegram login or linking.
The local numeric/session policies are explicitly test-only, not production approval.

Real loopback HTTP: A me/exams/detail and B own me; start; save INSERT; same-answer
save UPDATE; stale409 and unchanged DB revision/receipt count; one additional valid
save intentionally crosses its preseeded short-proof expiry after the real SQL
write, requiring401/rollback with answer still revision2; B cross-person read/write/
submit/result denial; resume; submit; result and idempotent submit replay. The timed
expiry control must reach the actual write, otherwise it FAILS rather than counting
an earlier401 as final-guard coverage. No network/commit fault is injected.

Separate real-DB runtime assertions prove B context cannot see A rows. Every actual
BEGIN is traced; after the exact six-key reset a real current_setting SELECT must
observe deny/empty scope before any helper/private read. The same private pooled
connection starts with deliberately dirty session sentinels. SET LOCAL overrides
them; it is not claimed to erase session defaults after COMMIT. Trusted adapters
must reset before each transaction and never treat context as external identity.

After closing the HTTP listener and original pool, a fresh runtime connection must
read one committed answer at revision2, submitted attempt revision3, one exact
ordinary result (earned1/2,percentage50) and two receipts. This is committed
persistence/readback with durable settings, not power-loss/fault recovery proof.

## Stop, cleanup and interrupted outcomes

Before any action, the draft verifies the external packet manifest, every payload,
full application inventory and required tool binaries. Resources are new/private;
an immutable resource ledger precedes allocation. Record exact postmaster PID,
start ticks/executable/argv, cluster system identifier, root device/inode/marker.
Before fast stop, verify those identities and the PID file/data directory. Stop
only this known cluster once; no adoption, process-name matching, force kill or
automatic retry. Dependencies, evidence, source, packet and PG tools are retained.

On success only: confirmed shutdown -> symlink-free exact-root identity check ->
exclusive durable cleanup-intent checkpoint, readback and parent fsync -> one
exact-root deletion -> observe absence -> durable confirmed-absence checkpoint.
If intent cannot be recorded, deletion does not begin. Pre-cleanup failure retains
data; after deletion begins, partial/unknown or confirmed-absent states are reported
truthfully. Later journal/result failure never becomes an intact-retention claim.
Read-only reconciliation precedes any later recovery action; no deletion retry.

## Next review, approval and lab-sharing scope

This narrow networking amendment proposes only SCOPE.md, plan.json, run.py and
packet.sha256.json. Reconstruct the original13 files from lab commit
036beb26e7a6940827daa8691bc04f0326c7df6f, then the three replacements from
2c5f14d00347268ac613562627825069625d5fda, then ONLY these four replacements.
The former manifest is4369 bytes/SHA256
a8adf885a5ae37f5f0cdfa7f6df8eec30925ecf9c22b4f455aa5ed336e978f20.
The remaining nine files, source/tools, SQL, seed, HTTP checks, role separation,
limits and cleanup semantics are unchanged. The sparse amendment is not a full
packet. Proposed repo oybek-muminov/lab_univeracademy; branch
architect/local-http-pg-flow01-r3-20261111; sole parent
2c5f14d00347268ac613562627825069625d5fda; prefix
qa-checkpoints/2026-11-11/architect-local-http-pg-flow01-r3/.
No publication or new attempt is authorized. Local files0400, future Git100644.
Fresh assembled path is /tmp/ua-http-pg17-flow-packet-r3-20261111, currently absent;
the old packet/evidence and failed prefix are never edited, adopted or deleted.

Once QA reviews this exact published packet and its source dependencies, request
ONE bounded execution approval:13 pinned driver packages in the fresh private
prefix, one new cluster/task DB, reviewed DDL/activation/14-row synthetic seed,
loopback HTTP+restricted-role SQL assertions, bounded evidence, identity-checked
shutdown and success-only exact-root cleanup. A later sealed revision's exact
external manifest SHA is supplied in the launch argv:

    /opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/python3.12 - <<'LAUNCH_PY'
    import os
    names=('HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy','NO_PROXY','no_proxy','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE')
    child={'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C','TZ':'UTC'}
    for key in names:
        if key not in os.environ:raise SystemExit('INSTALL_NETWORK_CONTEXT_MISSING')
        child[key]=os.environ[key]
    binary='/opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/python3.12'
    os.execve(binary,[binary,'/tmp/ua-http-pg17-flow-packet-r3-20261111/run.py','--approved-manifest','<EXTERNALLY_APPROVED_FINAL_SHA256>'],child)
    LAUNCH_PY

Cloudflare Workers remains the chosen server. This Node localhost milestone is
not a Cloudflare deployment or the user's primary-project test. Cloudflare/Hyperdrive,
real Clerk/Telegram, production TLS, primary Supabase, concurrency/load, crash/fault
durability and G01-G11 remain NOT_RUN/open. Backup/support work remains deferred.
