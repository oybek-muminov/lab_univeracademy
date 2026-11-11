#!/usr/bin/env python3
"""Complete candidate, NOT AUTHORIZED. Execute only after exact external approval.
No command is launched by importing this file. No SQL/driver was run in preparation.
"""
import argparse, hashlib, json, os, pathlib, shutil, signal, stat, subprocess, sys, time
from datetime import datetime, timezone
from urllib.parse import urlsplit

HERE = pathlib.Path(__file__).resolve().parent
class Stop(Exception): pass
def utc(): return datetime.now(timezone.utc).isoformat()
def sha(b): return hashlib.sha256(b).hexdigest()
def strict_json(b):
    def pairs(xs):
        d = {}
        for k,v in xs:
            if k in d: raise Stop('DUPLICATE_JSON_KEY')
            d[k] = v
        return d
    return json.loads(b.decode('utf-8','strict'), object_pairs_hook=pairs,
                      parse_constant=lambda _: (_ for _ in ()).throw(Stop('NONFINITE_JSON')))
def fsync_dir(p):
    fd = os.open(p, os.O_RDONLY | os.O_DIRECTORY)
    try: os.fsync(fd)
    finally: os.close(fd)
def durable(p, value):
    b = (json.dumps(value, sort_keys=True, indent=2)+'\n').encode()
    fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o400)
    try:
        with os.fdopen(fd,'wb') as f: f.write(b); f.flush(); os.fsync(f.fileno())
        if p.read_bytes() != b: raise Stop('CHECKPOINT_READBACK_FAILED')
        fsync_dir(p.parent)
    except BaseException: raise
def exact(p, item):
    if p.is_symlink() or not p.is_file(): raise Stop('INPUT_NOT_REGULAR')
    b = p.read_bytes()
    if len(b) != item['bytes'] or sha(b) != item['sha256']: raise Stop('INPUT_IDENTITY_DRIFT')
    return b
def inventory(root):
    result=[]
    for p in sorted(root.rglob('*')):
        if p.is_symlink(): raise Stop('SOURCE_SYMLINK')
        if p.is_file():
            b=p.read_bytes();result.append(dict(path=p.relative_to(root).as_posix(),bytes=len(b),sha256=sha(b),mode=oct(stat.S_IMODE(p.stat().st_mode))))
    return result
def size(root):
    return sum(p.stat().st_size for p in root.rglob('*') if p.is_file() and not p.is_symlink())
def process_identity(pid):
    p=pathlib.Path('/proc')/str(pid)
    raw=(p/'stat').read_text();start=raw[raw.rfind(')')+2:].split()[19]
    return dict(pid=pid,start_ticks=start,exe=os.readlink(p/'exe'),argv=(p/'cmdline').read_bytes().split(b'\0')[:-1])
def public_identity(x):
    return {**x,'argv':[v.decode('utf8','strict') for v in x['argv']]}
def derived(raw, spec):
    guard=spec['guard'].encode()
    if raw.count(guard)!=1 or not raw.endswith(b'ROLLBACK;\n'): raise Stop('SQL_DERIVATION_DRIFT')
    out=raw.replace(guard,b'-- DISPOSABLE LOCAL RUN ONLY: reviewed guard removal.\n',1)
    out=out[:-len(b'ROLLBACK;\n')]+b'COMMIT;\n'
    if len(out)!=spec['derived_bytes'] or sha(out)!=spec['derived_sha256']: raise Stop('DERIVED_SQL_IDENTITY_DRIFT')
    return out

def installer_network(plan):
    # Existing platform network settings only; never print/store their values.
    spec=plan['installer_network'];names=spec['environment_names']
    if names!=['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy','NO_PROXY','no_proxy','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE']:
        raise Stop('INSTALL_NETWORK_ALLOWLIST_DRIFT')
    values={key:os.environ.get(key) for key in names}
    if any(not isinstance(v,str) or not v or '\0' in v or '\r' in v or '\n' in v for v in values.values()):
        raise Stop('INSTALL_NETWORK_CONTEXT_MISSING_OR_INVALID')
    for upper,lower in [('HTTP_PROXY','http_proxy'),('HTTPS_PROXY','https_proxy'),('NO_PROXY','no_proxy')]:
        if values[upper]!=values[lower]:raise Stop('INSTALL_NETWORK_CASE_VARIANT_DRIFT')
    for key in ['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy']:
        try:
            url=urlsplit(values[key])
            if url.scheme not in ['http','https'] or not url.hostname or not url.port or url.username is not None or url.password is not None or url.path not in ['', '/'] or url.query or url.fragment:
                raise ValueError()
        except Exception:raise Stop('INSTALL_PROXY_CONTEXT_NOT_ACCEPTABLE') from None
    for item in values['NO_PROXY'].split(','):
        host=item.strip().lower().split(':')[0].lstrip('.')
        if '*' in host or host=='registry.npmjs.org' or (host and 'registry.npmjs.org'.endswith('.'+host)):
            raise Stop('INSTALL_REGISTRY_PROXY_BYPASS_NOT_ACCEPTABLE')
    for key in ['NODE_EXTRA_CA_CERTS','SSL_CERT_FILE']:
        exact(pathlib.Path(values[key]),spec['ca_files'][key])
    return values

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--approved-manifest',required=True)
    args=parser.parse_args();manifest_raw=(HERE/'packet.sha256.json').read_bytes()
    if sha(manifest_raw)!=args.approved_manifest: raise Stop('EXTERNAL_MANIFEST_PIN_REQUIRED')
    manifest=strict_json(manifest_raw)
    for row in manifest['files']: exact(HERE/row['path'],row)
    plan=strict_json((HERE/'plan.json').read_bytes())
    # Input completeness is not permission. Exact publication/QA/user approval
    # must select this manifest externally before invoking this controller.
    if plan['runnable'] is not True or plan['pending']: raise Stop('PENDING_REVIEWED_ACTIVATION_SOURCE_AND_RUN_APPROVAL')
    if plan['activation']['status']!='PINNED_AND_INDEPENDENTLY_REVIEWED': raise Stop('ACTIVATION_NOT_REVIEWED')
    if plan['activation'].get('operator_contract_status')!='EXACT_PUBLISHED_CONTRACT_REVIEWED':raise Stop('OPERATOR_CONTRACT_NOT_REVIEWED')
    if (os.getuid(),os.getgid())!=(plan['uid'],plan['gid']) or os.getuid()==0: raise Stop('OS_OWNER_DRIFT')
    root=pathlib.Path(plan['root']);deps=pathlib.Path(plan['dependencies']);source=pathlib.Path(plan['source']);evidence=HERE/'evidence'
    if str(root)!='/tmp/ua-http-pg17-flow01-attempt02-20261111' or str(deps)!='/tmp/ua-http-pg17-driver01-attempt02-20261111': raise Stop('TARGET_DRIFT')
    for p in [root,deps,evidence]:
        if os.path.lexists(p): raise Stop('NO_EXISTING_RESOURCE_ADOPTION')
    if source.resolve()!=source: raise Stop('SOURCE_REALPATH_DRIFT')
    original_source=strict_json((HERE/'source-inventory.json').read_bytes())['files']
    if inventory(source)!=original_source: raise Stop('APPLICATION_SOURCE_DRIFT')
    for x in plan['binaries'].values(): exact(pathlib.Path(x['path']),x)
    schema=derived(exact(HERE/plan['schema']['original'],dict(bytes=plan['schema']['original_bytes'],sha256=plan['schema']['original_sha256'])),plan['schema'])
    activation=derived(exact(HERE/plan['activation']['path'],plan['activation']),plan['activation'])
    network=installer_network(plan) # Preflight before evidence/resources; no network request.
    L=plan['limits'];B={k:x['path'] for k,x in plan['binaries'].items()}
    evidence.mkdir(mode=0o700);journal=evidence/'journal.jsonl';commands=[]
    cleanup='PRE_CLEANUP_NO_DELETION_STARTED';postmaster=None;pg_identity=None;system_id=None;stop_attempted=False;stopped=False;stage='preflight';started=time.monotonic();deadline=None
    marker=None;root_inode=None
    def record(value):
        b=(json.dumps({'UTC':utc(),**value},sort_keys=True)+'\n').encode()
        with journal.open('ab') as f:f.write(b);f.flush();os.fsync(f.fileno())
    def env(home,tmp):
        return {'PATH':str(pathlib.Path(B['node']).parent)+':/usr/bin:/bin','HOME':str(home),'TMPDIR':str(tmp),'LANG':'C','LC_ALL':'C','TZ':'UTC'}
    def check_budget():
        if deadline and time.monotonic()>deadline: raise Stop('OVERALL_RUNTIME_TIMEOUT')
        if size(evidence)>L['all_evidence_bytes']: raise Stop('EVIDENCE_STOP_THRESHOLD')
        if root.exists() and size(root)>L['runtime_disk_bytes']: raise Stop('RUNTIME_DISK_STOP_THRESHOLD')
        if deps.exists() and size(deps)>L['driver_disk_bytes']: raise Stop('DEPENDENCY_DISK_STOP_THRESHOLD')
    def command(label,argv,timeout,child_env,cwd=None,inputs=(),maintenance=False):
        nonlocal stage
        stage=label;out=evidence/(label+'.stdout');err=evidence/(label+'.stderr');t=utc();p=None;ident=None
        try:
            with out.open('xb') as o,err.open('xb') as e:
                p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=o,stderr=e,env=child_env,cwd=cwd)
                try:ident=process_identity(p.pid)
                except FileNotFoundError:
                    if p.poll() is None:raise Stop('CHILD_IDENTITY_UNCERTAIN')
                try:record({'kind':'command_start','label':label,'argv':argv,'pid_identity':None if ident is None else public_identity(ident),'inputs':list(inputs)})
                except BaseException:
                    if not maintenance:raise
                end=time.monotonic()+timeout
                while p.poll() is None:
                    if not maintenance:check_budget()
                    if time.monotonic()>end: raise Stop('COMMAND_TIMEOUT')
                    if out.stat().st_size>L['single_command_stream_bytes'] or err.stat().st_size>L['single_command_stream_bytes']: raise Stop('COMMAND_OUTPUT_STOP_THRESHOLD')
                    time.sleep(L['poll_seconds'])
                if p.returncode!=0: raise Stop('COMMAND_EXIT_NONZERO')
        except BaseException:
            # One TERM only for this still-matching owned command, no KILL/retry.
            if p and p.poll() is None:
                if process_identity(p.pid)!=ident: raise Stop('CHILD_IDENTITY_UNCERTAIN')
                p.terminate()
                try:p.wait(timeout=5)
                except subprocess.TimeoutExpired:raise Stop('CHILD_TERMINATION_UNCERTAIN')
            raise
        finally:
            row={'label':label,'argv':argv,'UTC_start':t,'UTC_end':utc(),'exit':None if p is None else p.poll(),'stdout_sha256':sha(out.read_bytes()),'stderr_sha256':sha(err.read_bytes())}
            commands.append(row)
            try:record({'kind':'command_end',**row})
            except BaseException:
                if not maintenance:raise
        return out.read_text('utf8','strict')
    def root_identity():
        if root.is_symlink() or root.resolve()!=root or (root.stat().st_dev,root.stat().st_ino)!=root_inode or (root/'.ua-flow-marker').read_bytes()!=marker: raise Stop('RUNTIME_IDENTITY_DRIFT')
    def control(label):
        text=command(label,[B['pg_controldata'],str(root/'data')],10,env(root/'home',root/'tmp'),maintenance=label in ['control-before-stop','control-after-stop'])
        values=dict(line.split(':',1) for line in text.splitlines() if ':' in line)
        return {k.strip():v.strip() for k,v in values.items()}
    def verify_postmaster():
        root_identity()
        if postmaster is None or postmaster.poll() is not None or process_identity(postmaster.pid)!=pg_identity: raise Stop('POSTMASTER_IDENTITY_UNCERTAIN')
        pidfile=(root/'data/postmaster.pid').read_text().splitlines()
        if int(pidfile[0])!=postmaster.pid or pathlib.Path(pidfile[1]).resolve()!=root/'data': raise Stop('PIDFILE_IDENTITY_DRIFT')
        if control('control-before-stop')['Database system identifier']!=system_id: raise Stop('CLUSTER_SYSTEM_ID_DRIFT')
    def stop_owned():
        nonlocal stop_attempted,stopped
        if postmaster is None:return
        if stop_attempted:raise Stop('STOP_ALREADY_ATTEMPTED_NO_RETRY')
        stop_attempted=True
        if postmaster.poll() is not None:
            if postmaster.returncode!=0:raise Stop('POSTMASTER_EXIT_FAILURE_RETAIN')
            stopped=True;return
        verify_postmaster()
        command('stop',[B['pg_ctl'],'-D',str(root/'data'),'-m','fast','-w','-t','20','stop'],L['stop_seconds'],env(root/'home',root/'tmp'),maintenance=True)
        postmaster.wait(timeout=5)
        if postmaster.returncode!=0 or (root/'data/postmaster.pid').exists(): raise Stop('SHUTDOWN_NOT_CONFIRMED')
        if control('control-after-stop').get('Database cluster state')!='shut down':raise Stop('CONTROL_NOT_SHUT_DOWN')
        stopped=True
    try:
        durable(evidence/'resource-ledger.json',{'approved_manifest_sha256':args.approved_manifest,'runtime_root':str(root),'dependency_root':str(deps),'evidence':str(evidence),'source':str(source),'database':plan['database'],'admin':plan['admin_user'],'runtime_login':plan['runtime_user'],'uid':os.getuid(),'gid':os.getgid(),'no_adoption':True,'cleanup_target_only':str(root)})
        deps.mkdir(mode=0o700)
        for name in ['home','tmp','cache','driver']:(deps/name).mkdir(mode=0o700)
        for name in ['user.npmrc','global.npmrc']:
            fd=os.open(deps/name,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.close(fd)
        shutil.copyfile(HERE/'driver/package.json',deps/'driver/package.json');shutil.copyfile(HERE/'driver/package-lock.json',deps/'driver/package-lock.json')
        install_env=env(deps/'home',deps/'tmp');install_env.update({'NPM_CONFIG_USERCONFIG':str(deps/'user.npmrc'),'NPM_CONFIG_GLOBALCONFIG':str(deps/'global.npmrc'),'NPM_CONFIG_CACHE':str(deps/'cache'),'NPM_CONFIG_IGNORE_SCRIPTS':'true','NPM_CONFIG_AUDIT':'false','NPM_CONFIG_FUND':'false','NPM_CONFIG_REGISTRY':'https://registry.npmjs.org/','NPM_CONFIG_STRICT_SSL':'true','NPM_CONFIG_UPDATE_NOTIFIER':'false'})
        install_env.update(network) # Installer only; SQL/HTTP children use env() without network bindings.
        command('install-driver',[B['node'],B['npm_cli'],'ci','--prefix',str(deps/'driver'),'--ignore-scripts','--omit=optional','--no-audit','--no-fund','--registry=https://registry.npmjs.org/','--fetch-retries=0','--fetch-timeout=15000'],L['install_seconds'],install_env,cwd=str(deps/'driver'),inputs=['driver/package.json','driver/package-lock.json'])
        lock=strict_json((HERE/'driver/package-lock.json').read_bytes())['packages'];expected={k.split('/')[1]:v['version'] for k,v in lock.items() if k and not v.get('optional')}
        nm=deps/'driver/node_modules';actual={p.name:strict_json((p/'package.json').read_bytes())['version'] for p in nm.iterdir() if p.is_dir() and not p.name.startswith('.')}
        if actual!=expected or len(actual)!=13:raise Stop('INSTALLED_DRIVER_CLOSURE_DRIFT')
        durable(evidence/'installed-driver-inventory.json',{'packages':actual,'files':inventory(nm),'npm_scripts':'DISABLED','optional_pg_cloudflare_and_pg_native':'OMITTED'})
        deadline=time.monotonic()+L['run_seconds'];root.mkdir(mode=0o700);root_inode=(root.stat().st_dev,root.stat().st_ino)
        for name in ['home','tmp','socket']:(root/name).mkdir(mode=0o700)
        marker=(json.dumps({'manifest':args.approved_manifest,'root':str(root),'inode':root_inode},sort_keys=True)+'\n').encode();(root/'.ua-flow-marker').write_bytes(marker);(root/'.ua-flow-marker').chmod(0o400)
        command('initdb',[B['initdb'],'-D',str(root/'data'),'--username='+plan['admin_user'],'--auth-local=peer','--auth-host=reject','--no-locale','--encoding=UTF8','--no-instructions'],L['init_seconds'],env(root/'home',root/'tmp'))
        system_id=control('control-after-init')['Database system identifier']
        (root/'pg_hba.conf').write_text('local all ua_flow_admin peer map=flow_admin\nlocal ua_flow01 ua_flow_operator peer map=flow_operator\nlocal ua_flow01 ua_flow_client peer map=flow_runtime\nlocal all all reject\nhost all all 0.0.0.0/0 reject\nhost all all ::0/0 reject\n')
        (root/'pg_ident.conf').write_text('flow_admin agent ua_flow_admin\nflow_operator agent ua_flow_operator\nflow_runtime agent ua_flow_client\n')
        cfg=f"listen_addresses=''\nport={plan['port']}\nunix_socket_directories='{root}/socket'\nunix_socket_permissions=0700\nhba_file='{root}/pg_hba.conf'\nident_file='{root}/pg_ident.conf'\nmax_connections=6\nsuperuser_reserved_connections=1\nshared_buffers='16MB'\nwork_mem='1MB'\nmaintenance_work_mem='16MB'\ntemp_file_limit='32MB'\nmax_worker_processes=0\nmax_parallel_workers=0\nautovacuum=off\nfsync=on\nsynchronous_commit=on\nfull_page_writes=on\nstatement_timeout='5s'\nlock_timeout='2s'\nidle_in_transaction_session_timeout='15s'\nlogging_collector=off\nlog_statement='none'\nlog_min_error_statement='panic'\n"
        (root/'postgresql.conf').write_text(cfg)
        for name in ['pg_hba.conf','pg_ident.conf','postgresql.conf']:(root/name).chmod(0o600)
        stage='start';stdout=(evidence/'postmaster.stdout').open('xb');stderr=(evidence/'postmaster.stderr').open('xb')
        try:postmaster=subprocess.Popen([B['postgres'],'-D',str(root/'data'),'-c','config_file='+str(root/'postgresql.conf')],stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,env=env(root/'home',root/'tmp'))
        finally:stdout.close();stderr.close()
        pg_identity=process_identity(postmaster.pid)
        if pg_identity['exe']!=B['postgres']:raise Stop('UNEXPECTED_POSTMASTER_EXECUTABLE')
        record({'kind':'postmaster_spawn','identity':public_identity(pg_identity),'system_identifier':system_id})
        ready=time.monotonic()+L['start_seconds']
        while True:
            check_budget()
            if postmaster.poll() is not None:raise Stop('STARTUP_EXIT_FAILURE')
            if time.monotonic()>ready:raise Stop('STARTUP_TIMEOUT')
            pidfile=root/'data/postmaster.pid'
            if pidfile.exists():
                lines=pidfile.read_text().splitlines()
                if len(lines)>=8 and lines[7].strip()=='ready':break
            time.sleep(L['poll_seconds'])
        durable(evidence/'observed-runtime.json',{'root_inode':root_inode,'marker_sha256':sha(marker),'system_identifier':system_id,'postmaster':public_identity(pg_identity),'configuration_sha256':sha(cfg.encode())})
        def sql(label,db,text=None,file=None,user=None):
            argv=[B['psql'],'-X','-w','--set=ON_ERROR_STOP=1','--host='+str(root/'socket'),'--port='+str(plan['port']),'--username='+(user or plan['admin_user']),'--dbname='+db]
            argv+=['-f',str(file)] if file else ['-At','-c',text]
            sql_env=env(root/'home',root/'tmp');sql_env['PGCONNECT_TIMEOUT']='5'
            return command(label,argv,L['sql_seconds'],sql_env,inputs=[] if file is None else [{'path':str(file),'sha256':sha(file.read_bytes())}])
        identity=sql('identity','postgres',"SELECT current_user,current_setting('listen_addresses'),current_setting('port'),current_setting('fsync'),current_setting('synchronous_commit'),current_setting('full_page_writes')")
        if identity.strip()!='ua_flow_admin||55473|on|on|on':raise Stop('SERVER_IDENTITY_OR_DURABILITY_SETTINGS_DRIFT')
        sql('stand-in-roles','postgres',';'.join('CREATE ROLE '+name+' NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS' for name in ['anon','authenticated','service_role'])+';')
        sql('create-task-database','postgres','CREATE DATABASE ua_flow01 TEMPLATE template0;')
        p=evidence/'schema.local.sql';p.write_bytes(schema);p.chmod(0o400);sql('schema',plan['database'],file=p)
        # Exact 8be232 operator precondition: actual non-superuser session,
        # CREATEROLE, inherited ua_owner and SET authority, empty existing
        # createrole_self_grant. No setting is changed to manufacture eligibility.
        if plan['activation'].get('operator_contract_status')!='EXACT_PUBLISHED_CONTRACT_REVIEWED':raise Stop('OPERATOR_CONTRACT_NOT_REVIEWED')
        sql('activation-operator-setup',plan['database'],'CREATE ROLE ua_flow_operator LOGIN INHERIT NOSUPERUSER CREATEROLE NOCREATEDB NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 1; GRANT ua_owner TO ua_flow_operator WITH ADMIN FALSE, INHERIT TRUE, SET TRUE;')
        role=sql('activation-operator-witness',plan['database'],"SELECT current_user,session_user,rolsuper,rolbypassrls,rolcreaterole,pg_has_role(current_user,'ua_owner','USAGE'),pg_has_role(session_user,'ua_owner','SET'),(SELECT pg_get_userbyid(nspowner) FROM pg_catalog.pg_namespace WHERE nspname='ua_private'),current_setting('createrole_self_grant') FROM pg_catalog.pg_roles WHERE rolname=current_user",user='ua_flow_operator')
        if role.strip()!='ua_flow_operator|ua_flow_operator|f|f|t|t|t|ua_owner|':raise Stop('ACTIVATION_OPERATOR_PREREQUISITE_DRIFT')
        p=evidence/'activation.local.sql';p.write_bytes(activation);p.chmod(0o400);sql('activation',plan['database'],file=p,user='ua_flow_operator')
        closed=sql('activation-closed-witness',plan['database'],"SELECT count(*)=4 AND bool_and(NOT has_schema_privilege(oid,'ua_private','CREATE') AND NOT pg_has_role(current_user,oid,'SET') AND NOT pg_has_role(current_user,oid,'USAGE') AND NOT pg_has_role('ua_runtime',oid,'MEMBER')) FROM pg_catalog.pg_roles WHERE rolname IN ('ua_access_locator_owner','ua_person_lock_owner','ua_clerk_lock_owner','ua_invariant_owner')",user='ua_flow_operator')
        if closed.strip()!='t':raise Stop('TRANSFER_WINDOW_NOT_CLOSED')
        implicit=sql('implicit-admin-witness',plan['database'],"SELECT count(*)=4 AND bool_and(m.admin_option AND NOT m.inherit_option AND NOT m.set_option AND grantor.rolname='ua_flow_admin') FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles target ON target.oid=m.roleid JOIN pg_catalog.pg_roles member ON member.oid=m.member JOIN pg_catalog.pg_roles grantor ON grantor.oid=m.grantor WHERE target.rolname IN ('ua_access_locator_owner','ua_person_lock_owner','ua_clerk_lock_owner','ua_invariant_owner') AND member.rolname=current_user",user='ua_flow_operator')
        if implicit.strip()!='t':raise Stop('UNEXPECTED_CREATOR_MEMBERSHIP')
        sql('activation-operator-disable',plan['database'],'ALTER ROLE ua_flow_operator NOLOGIN NOCREATEROLE; REVOKE ua_owner FROM ua_flow_operator;')
        sql('runtime-connection-role',plan['database'],'CREATE ROLE ua_flow_client LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 1; GRANT ua_runtime TO ua_flow_client WITH INHERIT TRUE, SET FALSE; REVOKE ALL ON DATABASE ua_flow01 FROM PUBLIC; GRANT CONNECT ON DATABASE ua_flow01 TO ua_flow_client;')
        descriptor={'kind':'APPROVED_DISPOSABLE_LOCAL_FLOW01','root':str(root),'host':str(root/'socket'),'port':plan['port'],'database':plan['database'],'adminUser':plan['admin_user'],'runtimeUser':plan['runtime_user'],'source':str(source),'dependencies':str(deps/'driver'),'output':str(evidence/'flow-result.json')}
        durable(evidence/'flow-descriptor.json',descriptor)
        command('real-http-pg-flow',[B['node'],'--max-old-space-size=128',str(HERE/'flow.mjs'),str(evidence/'flow-descriptor.json')],L['flow_seconds'],env(root/'home',root/'tmp'),inputs=['flow.mjs','seed.mjs','source-inventory.json','flow-descriptor.json'])
        result=strict_json((evidence/'flow-result.json').read_bytes())
        if result['status']!='LOCAL_HTTP_PG_FLOW_PASS_ONLY' or result['runtime_readiness'] is not False:raise Stop('FLOW_RESULT_NOT_ACCEPTABLE')
        if inventory(source)!=original_source:raise Stop('POST_RUN_SOURCE_DRIFT')
        for x in plan['binaries'].values():exact(pathlib.Path(x['path']),x)
        stop_owned();root_identity()
        if not stopped:raise Stop('NOT_STOPPED_NO_CLEANUP')
        if any(p.is_symlink() for p in root.rglob('*')):raise Stop('SYMLINK_NO_CLEANUP')
        durable(evidence/'cleanup-intent.json',{'state':'CLEANUP_STARTED_COMPLETION_UNKNOWN','target':str(root),'root_inode':root_inode,'marker_sha256':sha(marker),'system_identifier':system_id,'postmaster_exit':postmaster.returncode,'approved_manifest':args.approved_manifest,'ledger_sha256':sha((evidence/'resource-ledger.json').read_bytes())})
        cleanup='CLEANUP_STARTED_COMPLETION_UNKNOWN';shutil.rmtree(root) # ONE exact, verified target. Never retried.
        if os.path.lexists(root):raise Stop('CLEANUP_NOT_CONFIRMED')
        cleanup='CLEANUP_CONFIRMED_ABSENT'
        fsync_dir(root.parent)
        durable(evidence/'cleanup-confirmed.json',{'state':cleanup,'target':str(root),'intent_sha256':sha((evidence/'cleanup-intent.json').read_bytes())})
        durable(evidence/'result.json',{'status':'LOCAL_FLOW_AND_CLEANUP_COMPLETE','cleanup_state':cleanup,'runtime_readiness':False,'commands':commands,'source_preserved':True,'dependencies_retained':str(deps),'stage':stage})
        print(json.dumps({'status':'LOCAL_FLOW_AND_CLEANUP_COMPLETE','cleanup_state':cleanup,'evidence':str(evidence)}));return 0
    except BaseException as error:
        failure={'status':'STOP_NO_RETRY','stage':stage,'error_code':str(error) if isinstance(error,Stop) else type(error).__name__,'cleanup_state':cleanup,'runtime_root':str(root),'root_intact_not_promised':cleanup!='PRE_CLEANUP_NO_DELETION_STARTED'}
        try:
            if postmaster is not None and not stop_attempted:stop_owned()
            failure['owned_postmaster_stop_confirmed']=stopped
        except BaseException as stop_error:failure['stop_error_code']=str(stop_error) if isinstance(stop_error,Stop) else type(stop_error).__name__
        try:durable(evidence/'failure.json',failure)
        except BaseException:pass
        print(json.dumps(failure),file=sys.stderr);return 1

if __name__=='__main__':
    try:exit_code=main()
    except BaseException as error:
        print(json.dumps({'status':'STOP_BEFORE_EXECUTION_OR_UNREPORTED_FAILURE','error_code':str(error) if isinstance(error,Stop) else type(error).__name__}),file=sys.stderr);exit_code=1
    sys.exit(exit_code)
