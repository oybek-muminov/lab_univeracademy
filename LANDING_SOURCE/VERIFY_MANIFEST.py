"""Verify all extracted archive content without installing dependencies."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'MANIFEST.json').read_text(encoding='utf-8'))
failures = []
for item in manifest['files']:
    path = root / item['path']
    if not path.is_file():
        failures.append({'path': item['path'], 'reason': 'missing'})
        continue
    data = path.read_bytes()
    if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
        failures.append({'path': item['path'], 'reason': 'size or SHA256 mismatch'})
count = 0
for line in (root / 'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines():
    expected, relative = line.split('  ', 1)
    count += 1
    path = root / relative
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        failures.append({'path': relative, 'reason': 'SHA256SUMS mismatch'})
print(json.dumps({'status': 'FAILED' if failures else 'PASS', 'content_files': len(manifest['files']), 'sha256_entries': count, 'failures': failures}, indent=2))
raise SystemExit(1 if failures else 0)
