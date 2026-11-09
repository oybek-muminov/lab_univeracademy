import datetime
import hashlib
import json
import pathlib
import re
import subprocess

out = pathlib.Path(__file__).resolve().parent
repo = pathlib.Path('/workspace/mini-pin-8a750ee-20261109')
root = repo / 'workspaces/univeracademy'
base = '8a750ee01eed794bda1942bc1bd0e89829c3a704'
fixture = root / 'apps/mini-app/tests/fixtures/backend-8a750ee-manifest.json'
old_fixture = root / 'apps/mini-app/tests/fixtures/backend-fa82166-manifest.json'
digest = lambda data: hashlib.sha256(data).hexdigest()
manifest = json.loads(fixture.read_bytes())
old = json.loads(old_fixture.read_bytes())
rows = {row['path']: row for row in manifest['files']}
old_rows = {row['path']: row for row in old['files']}
assert len(rows) == len(manifest['files']) == manifest['target_count'] == 194
assert set(old_rows) <= set(rows)
preserved = [name for name in old_rows if old_rows[name] == rows[name]]
updated = [name for name in old_rows if old_rows[name] != rows[name]]
added = sorted(set(rows) - set(old_rows))
assert len(preserved) == 190
assert updated == ['supabase/functions/univeracademy-api/staff-http.ts']
assert added == sorted([
    'supabase/functions/univeracademy-api/membership-activity.ts',
    'tests/membership/removal-active.test.mjs',
    'docs/api/removal-active-invariant-local-2026-11-09.md',
])
assert rows[added[0]]['role'] == 'provenance'
assert rows['supabase/functions/univeracademy-api/membership-activity.ts']['role'] == 'runtime'
assert rows['tests/membership/removal-active.test.mjs']['role'] == 'provenance'
targets = []
for name, row in rows.items():
    data = (root / name).read_bytes()
    exact = subprocess.check_output(['git', 'show', base + ':workspaces/univeracademy/' + name], cwd=repo)
    assert data == exact, 'NOT_EXACT_BACKEND_SOURCE:' + name
    assert len(data) == row['bytes'] and digest(data) == row['sha256'], name
    targets.append({**row, 'exact_backend_bytes_match': True})
assert sum(row['bytes'] for row in targets) == manifest['target_bytes'] == 2207847

api = sorted(p.relative_to(root).as_posix() for p in (root / 'supabase/functions/univeracademy-api').rglob('*.ts'))
runtime = sorted(p.relative_to(root).as_posix() for p in (root / 'runtime').glob('*.mjs'))
clients = ['packages/api-client/' + name for name in [
    'staff-openapi.json', 'staff-types.d.ts', 'student-client.ts', 'student-openapi.json', 'student-types.d.ts']]
assert len(api) == 31 and len(runtime) == 16
seed_paths = api + runtime + ['api/index.mjs'] + clients
assert all(name in rows for name in seed_paths)
imports = re.compile(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"']+)["']''')
urls = re.compile(r'''new\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url''')
todo, seen, edges, unresolved, unpinned = list(seed_paths), set(), [], [], []
while todo:
    name = todo.pop()
    if name in seen:
        continue
    seen.add(name)
    path = root / name
    if not path.is_file():
        unresolved.append(name)
        continue
    if name not in rows:
        unpinned.append(name)
    if path.suffix not in ('.ts', '.mjs', '.cjs', '.js'):
        continue
    text = path.read_text()
    for spec in sorted(set(imports.findall(text) + urls.findall(text))):
        if not spec.startswith('.'):
            continue
        target = (path.parent / spec).resolve()
        if 'node_modules' in target.parts:
            continue
        relative = target.relative_to(root).as_posix()
        if target.is_dir():
            continue
        edges.append({'from': name, 'specifier': spec, 'to': relative})
        todo.append(relative)
assert not unresolved, unresolved
assert not unpinned, unpinned

required_support = [
    'contracts/review-only.openapi.json', 'contracts/clerk-review.openapi.json',
    'tests/backend/validator/ajv-config.cjs', 'tests/backend/validator/base-ajv-config.cjs',
    'tests/backend/validator/view-builder.cjs', 'package.json', 'package-lock.json',
    'tests/backend/validator/tooling/package.json', 'tests/backend/validator/tooling/package-lock.json',
    'runtime/clerk-sdk-worker.mjs', 'runtime/clerk-sdk-bindings.mjs',
]
assert all(name in rows for name in required_support)
copies = []
for name in ['student-client.ts', 'student-types.d.ts']:
    owner = 'packages/api-client/' + name
    copy = 'apps/mini-app/src/owner-client/' + name
    data = (root / owner).read_bytes()
    assert data == (root / copy).read_bytes()
    copies.append({'owner': owner, 'copy': copy, 'bytes': len(data), 'sha256': digest(data)})

checksum = 'BACKEND-CURRENT-SHA256SUMS'
assert digest((root / checksum).read_bytes()) == '0ca4a7676d7d78286f5fd3735f94be8635cbcb81e05639929a96d227867676e0'
assert 'HISTORICAL_ONLY_NOT_CURRENT_AUTHORITY' in fixture.read_text()
checks = subprocess.run(['rg', '-n', 'BACKEND-CURRENT-SHA256SUMS|sha256sum\\s+-c',
    'apps/mini-app', 'runtime', 'tools', 'tests', 'package.json',
    '-g', '*.mjs', '-g', '*.ts', '-g', '*.tsx', '-g', '*.cjs', '-g', '*.py'],
    cwd=root, capture_output=True, text=True)
assert checks.returncode in (0, 1)
assert not checks.stdout, 'OTHER_ACTIVE_CHECKSUM_AUTHORITY_REQUIRES_FOURTH_EDIT:' + checks.stdout

result = {
    'captured_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'backend_sha': base, 'base_parent': '6a84c6f13725839abf6cde8cd5bc02899ee4cfe2',
    'base_tree': '5a7ed4b51af9fe8c18a4fd52772d9d5eb36d09d0',
    'target_count': len(targets), 'target_bytes': sum(row['bytes'] for row in targets),
    'preserved_old_rows': len(preserved), 'updated_old_rows': updated, 'added_rows': added,
    'targets': targets, 'coverage': {'api_ts': api, 'runtime_mjs': runtime,
        'api_client_artifacts': clients, 'api_entry': 'api/index.mjs',
        'literal_import_and_worker_url_nodes': sorted(seen), 'edges': edges,
        'unresolved_local_imports': unresolved, 'unpinned_dependencies': unpinned,
        'required_support': required_support},
    'owner_copies': copies, 'old_checksum_authority_scan': {'exit': checks.returncode, 'matches': []},
    'scope': 'EXACT_PIN_INTEGRITY_AND_STATIC_DEPENDENCY_COVERAGE_NOT_RUNTIME_PROVIDER_OR_REMOVAL_E2E',
}
(out / 'coverage.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'targets': len(targets), 'target_bytes': result['target_bytes'],
    'api_ts': len(api), 'runtime_mjs': len(runtime), 'import_nodes': len(seen),
    'unresolved': unresolved, 'unpinned': unpinned, 'owner_copies': len(copies)}))
