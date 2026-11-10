from pathlib import Path
import json,hashlib,datetime,subprocess,sys,os,shlex,re
root=Path(__file__).resolve().parent;ev=root/'evidence';cwd=root/'repo/workspaces/univeracademy'
base='8bc48c4647099355a046bb395de5486e6afd251f';tree='0fb5e8bde38df528ebe763c93eb015f111af0a15'
def utc():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def digest(b):return hashlib.sha256(b).hexdigest()
def snapshot():
 start=utc();rows=[]
 for p in sorted((root/'repo').rglob('*')):
  if p.is_file() and not p.is_symlink() and not any(x in p.relative_to(root/'repo').parts for x in ['node_modules','.git']):
   b=p.read_bytes();rows.append(dict(path=str(p.relative_to(root/'repo')),bytes=len(b),sha256=digest(b)))
 b=(json.dumps(rows,indent=2)+'\n').encode();sha=digest(b);p=ev/'source-snapshots'/str(sha+'.json');p.parent.mkdir(exist_ok=True)
 if not p.exists():p.write_bytes(b)
 return dict(path=str(p),bytes=len(b),sha256=sha,files=len(rows),start_utc=start,end_utc=utc())
label=sys.argv[1];cmd=sys.argv[2:];before=snapshot()
overrides=dict(UA_TX_BRIDGE_TRACE_PATH=str(ev/(label+'-cases.json')),npm_config_cache=str(root/'npm-cache'),npm_config_update_notifier='false')
env=os.environ.copy();env.update(overrides);start=utc();out=subprocess.run(cmd,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);end=utc()
log=ev/(label+'.log');log.write_bytes(out.stdout);after=snapshot();text=out.stdout.decode(errors='replace')
counts={k:int(v) for k,v in re.findall(r'(?m)^[#ℹ] (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$',text)}
files=[]
for path in ['workspaces/univeracademy/supabase/functions/univeracademy-api/storage/postgres-transaction.ts','workspaces/univeracademy/tests/membership/protection-postgres-transaction.test.mjs']:
 b=(root/'repo'/path).read_bytes();files.append(dict(path=path,bytes=len(b),sha256=digest(b)))
result=dict(candidate='R1-TX-BRIDGE-01-r2',base_commit=base,base_tree=tree,actual_execution_base=base,command=cmd,literal_command=' '.join(shlex.quote(k+'='+v) for k,v in overrides.items())+' '+shlex.join(cmd),
 cwd=str(cwd),environment_overrides=overrides,start_utc=start,end_utc=end,exit=out.returncode,counts=counts,
 log=dict(path=str(log),bytes=len(out.stdout),sha256=digest(out.stdout)),source_before=before,source_after=after,source_bytes_changed_during_run=before['sha256']!=after['sha256'],candidate_files=files)
(ev/(label+'-run.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2));print(text[-4500:]);sys.exit(out.returncode)
