"""Read pinned base checkout and restore only to a NEW local output directory."""
import hashlib,io,json,os,subprocess,sys,tarfile
from pathlib import Path
base='31b2b00ecd1c413e1f828fef4c023c3ff2310909'
evidence=Path(__file__).resolve().parent
assert len(sys.argv)==3,'Usage: python3 -B restore-candidate.py PINNED_BASE_CHECKOUT NEW_OUTPUT'
repo,target=map(lambda p:Path(p).resolve(),sys.argv[1:])
assert not target.exists(),'Output exists; refusing to overwrite'
sha=lambda b:hashlib.sha256(b).hexdigest()
raw=(evidence/'candidate-manifest.json').read_bytes();patch=(evidence/'candidate.patch').read_bytes()
assert sha(raw)=='5f4d0f22ade20e4609657b7366febe3014d4f4745254c01569da747def9e253b'
assert len(patch)==86867 and sha(patch)=='e628afee2b6410b815dd3588431316b9cb26b5923a4161a24bd3d2ea23ce9b20'
m=json.loads(raw);assert m['base_commit']==base and m['file_count']==26
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo).decode().strip()==base
archive=subprocess.check_output(['git','archive',base,'workspaces/univeracademy'],cwd=repo)
target.mkdir(parents=True,exist_ok=False)
with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(target,filter='data')
env={**os.environ,'GIT_CEILING_DIRECTORIES':str(target.parent)}
for args in [['--check'],[]]:
 subprocess.run(['git','apply',*args,str(evidence/'candidate.patch')],cwd=target,env=env,check=True)
for f in m['files']:
 p=Path(f['path']);assert not p.is_absolute() and '..' not in p.parts
 b=(target/p).read_bytes();assert len(b)==f['after']['bytes'] and sha(b)==f['after']['sha256'],str(p)
subprocess.run(['node','workspaces/univeracademy/apps/mini-app/tests/verify-backend-targets.mjs'],cwd=target,check=True)
print(json.dumps({'status':'PASS','base_commit':base,'restored_targets':26,'Backend172_plus_owner2':'PASS','target':str(target)}))
