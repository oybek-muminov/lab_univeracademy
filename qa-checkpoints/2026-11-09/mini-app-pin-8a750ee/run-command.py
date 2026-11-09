import datetime
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import time

out = pathlib.Path(__file__).resolve().parent
label, cwd, *argv = sys.argv[1:]
if argv and argv[0] == '--':
    argv = argv[1:]
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
started, clock = utc(), time.monotonic()
log = out / (label + '.log')
with log.open('wb') as stream:
    completed = subprocess.run(argv, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT)
data = log.read_bytes()
record = {'label': label, 'argv': argv, 'cwd': cwd, 'started_at_utc': started,
          'finished_at_utc': utc(), 'duration_seconds': round(time.monotonic() - clock, 3),
          'exit': completed.returncode, 'log': log.name, 'log_bytes': len(data),
          'log_sha256': hashlib.sha256(data).hexdigest()}
if 'UA_MINI_PIN_GUARD_TRACE_PATH' in os.environ:
    record['test_trace_path'] = os.environ['UA_MINI_PIN_GUARD_TRACE_PATH']
index = out / 'commands.json'
records = json.loads(index.read_text()) if index.exists() else []
records.append(record)
index.write_text(json.dumps(records, indent=2) + '\n')
print(json.dumps(record))
print(data.decode('utf-8', errors='replace')[-5000:])
sys.exit(completed.returncode)
