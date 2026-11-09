import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys

out = pathlib.Path(__file__).resolve().parent
repo = pathlib.Path('/workspace/mini-pin-8a750ee-20261109')
project = repo / 'workspaces/univeracademy'
base = '8a750ee01eed794bda1942bc1bd0e89829c3a704'
prefix = 'workspaces/univeracademy/apps/mini-app/'
paths = [prefix + name for name in [
    'tests/fixtures/backend-8a750ee-manifest.json',
    'tests/verify-backend-targets.mjs',
    'tests/current-flow-guard.test.mjs',
]]
sha = lambda data: hashlib.sha256(data).hexdigest()
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
def info(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': sha(data)}
def git(*args):
    return subprocess.check_output(['git', *args], cwd=repo)

if '--inventory' in sys.argv:
    destination = 'qa-checkpoints/2026-11-09/mini-app-pin-8a750ee/'
    evidence_names = [
        'candidate-manifest.json', 'candidate.patch', 'author-verification.json',
        'coverage.json', 'coverage.log', 'sources-locks.before.json', 'sources-locks.after.json',
        'commands.json', 'guard-positive.log', 'guard-controls.jsonl', 'mini-tests.log', 'mini-build.log',
        'setup-root.log', 'setup-root-writable-cache.log', 'setup-validator.log', 'setup-mini.log',
        'run-command.py', 'verify-coverage.py', 'finalize-evidence.py', 'finalize.log',
    ]
    rows = [{'kind': 'implementation', 'local_path': str(repo / name),
             'destination_path': name, **info(repo / name)} for name in paths]
    rows += [{'kind': 'evidence', 'local_path': str(out / name),
              'destination_path': destination + name, **info(out / name)} for name in evidence_names]
    assert len({row['destination_path'] for row in rows}) == len(rows)
    inventory = {'status': 'PROPOSED_ONLY_NOT_UPLOADED_NO_PUBLICATION_AUTHORIZATION',
        'backend_sha': base, 'candidate_commit': None,
        'implementation_file_count': 3, 'evidence_file_count': len(evidence_names),
        'file_count': len(rows), 'total_bytes': sum(row['bytes'] for row in rows),
        'implementation_bytes': sum(row['bytes'] for row in rows if row['kind'] == 'implementation'),
        'evidence_bytes': sum(row['bytes'] for row in rows if row['kind'] == 'evidence'),
        'target_inventory_is_separate': {'targets': 194, 'target_bytes': 2207847},
        'self_excluded': 'publication-inventory.json is a review index, not a proposed publication payload file.',
        'files': rows}
    target = out / 'publication-inventory.json'
    target.write_text(json.dumps(inventory, indent=2) + '\n')
    print(json.dumps({'publication_inventory': str(target), 'files': len(rows),
        'implementation_files': 3, 'evidence_files': len(evidence_names),
        'total_bytes': inventory['total_bytes'], 'inventory_file': info(target),
        'implementation': [row for row in rows if row['kind'] == 'implementation']}))
    sys.exit(0)

assert git('rev-parse', 'HEAD').decode().strip() == base
before = json.loads((out / 'sources-locks.before.json').read_text())
assert before['head'] == base
tracked = git('ls-files', '-z').decode().strip('\0').split('\0')
untracked = git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')
untracked = [name for name in untracked if name]
modified = git('diff', '--name-only', 'HEAD').decode().splitlines()
assert set(modified + untracked) == set(paths), (modified, untracked)
assert untracked == [paths[0]]
after_rows = [{'path': name, **info(repo / name)} for name in sorted(set(tracked + untracked))]
after = {'captured_at_utc': utc(), 'repository': str(repo), 'head': base,
    'parent': git('rev-parse', 'HEAD^').decode().strip(),
    'tree': git('rev-parse', 'HEAD^{tree}').decode().strip(),
    'tracked_file_count': len(tracked), 'total_source_file_count': len(after_rows), 'files': after_rows}
(out / 'sources-locks.after.json').write_text(json.dumps(after, indent=2) + '\n')
prior = {row['path']: row for row in before['files']}
current = {row['path']: row for row in after_rows}
assert set(prior) <= set(current)
changed = [name for name in prior if prior[name] != current[name]]
assert set(changed) == set(paths[1:])
assert set(current) - set(prior) == {paths[0]}
locks = sorted(name for name in prior if name.endswith(('package.json', 'package-lock.json')))
assert all(prior[name] == current[name] for name in locks)
historical = sorted(name for name in prior if '/tests/fixtures/' in name or
                    name.startswith('qa-checkpoints/') or name.endswith('SHA256SUMS'))
assert all(prior[name] == current[name] for name in historical)

patch = git('diff', '--binary', '--full-index', 'HEAD', '--', *paths[1:])
added = subprocess.run(['git', 'diff', '--no-index', '--binary', '--full-index',
    '--', '/dev/null', paths[0]], cwd=repo, capture_output=True)
assert added.returncode == 1, added.stderr.decode()
patch += added.stdout
(out / 'candidate.patch').write_bytes(patch)
patch_checks = []
for flags in [['--check', '--cached'], ['--check', '--reverse']]:
    argv = ['git', 'apply', *flags, str(out / 'candidate.patch')]
    result = subprocess.run(argv, cwd=repo, capture_output=True)
    assert result.returncode == 0, result.stderr.decode()
    patch_checks.append({'argv': argv, 'cwd': str(repo), 'exit': result.returncode,
        'stdout_sha256': sha(result.stdout), 'stderr_sha256': sha(result.stderr)})
subprocess.run(['git', 'diff', '--check'], cwd=repo, check=True)

fixture = json.loads((repo / paths[0]).read_text())
source_manifest = {'candidate_id': 'mini-app-pin-8a750ee-local-20261109',
    'status': 'UNCOMMITTED_LOCAL_AUTHOR_CANDIDATE_NOT_INDEPENDENT_QA',
    'backend_sha': base, 'candidate_parent': base, 'candidate_commit': None,
    'backend_parent': before['parent'], 'backend_tree': before['tree'],
    'changed_paths': [{'path': name, 'before': None if name not in prior else
        {k: prior[name][k] for k in ['bytes', 'sha256']},
        'after': {k: current[name][k] for k in ['bytes', 'sha256']}} for name in paths],
    'source_file_count': 3, 'source_bytes': sum(current[name]['bytes'] for name in paths),
    'active_fixture': {'path': paths[0], **info(repo / paths[0])},
    'targets': {'unique': fixture['target_count'], 'bytes': fixture['target_bytes']},
    'patch': {'file': 'candidate.patch', **info(out / 'candidate.patch')},
    'patch_checks': patch_checks,
    'historical_snapshots_preserved': len(historical), 'dependency_locks_preserved': locks,
    'outside_scope': ['UI', 'transport', 'entry', 'client/types/contracts', 'dependencies/locks',
        'Backend source', 'DB/providers', 'deploy', 'upload/publication']}
(out / 'candidate-manifest.json').write_text(json.dumps(source_manifest, indent=2) + '\n')

commands = json.loads((out / 'commands.json').read_text())
by_label = {row['label']: row for row in commands}
for label in ['guard-positive', 'coverage', 'setup-root-writable-cache', 'setup-validator',
              'setup-mini', 'mini-tests', 'mini-build']:
    assert by_label[label]['exit'] == 0, label
assert by_label['guard-positive']['finished_at_utc'] < by_label['mini-tests']['started_at_utc']
controls = [json.loads(line) for line in (out / 'guard-controls.jsonl').read_text().splitlines()]
assert controls[0]['control'] == 'pristine_positive' and controls[0]['status'] == 0
assert len(controls) == 64
assert all(row['control'] == 'negative' and row['status'] == 1 and
           row['deliberate_target_verified'] for row in controls[1:])
new_targets = ['supabase/functions/univeracademy-api/membership-activity.ts',
    'tests/membership/removal-active.test.mjs', 'docs/api/removal-active-invariant-local-2026-11-09.md']
for name in new_targets:
    assert {row['expected'] for row in controls if row['target'] == name} == {
        'ENOENT', 'BACKEND_TARGET_SIZE_MISMATCH: ' + name, 'BACKEND_TARGET_HASH_MISMATCH: ' + name}
log = (out / 'mini-tests.log').read_text()
summary = {k: int(v) for k, v in re.findall(r'ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)', log)}
assert summary == {'tests': 310, 'pass': 310, 'fail': 0, 'cancelled': 0, 'skipped': 0, 'todo': 0}
passed_titles = [line[2:].rsplit(' (', 1)[0] for line in log.splitlines() if line.startswith('✔ ')]
patterns = {
    'production_owner_port_and_connection': 'actual production connection|production bootstrap/owner client',
    'registration_and_empty_exams': 'registration and empty exams|ungrouped student has no tests',
    'start_save_clear_resume': 'CAS clear/resume|register/start|pending answer|resumes saved answers',
    'deadline_and_CAS': 'deadline|CAS conflict|server timer',
    'result_and_history': 'result/history|history retains|ordinary result',
    'refresh_and_logout_receipt': 'refresh|receipt|logout',
    'cancellation_and_late_response_isolation': 'cancel|late |supersed|pending rotation',
}
consumer_coverage = {name: [title for title in passed_titles if re.search(pattern, title, re.I)]
                     for name, pattern in patterns.items()}
assert all(consumer_coverage.values())
runtime = {'node': subprocess.check_output(['node', '--version'], text=True).strip(),
           'npm': subprocess.check_output(['npm', '--version'], text=True).strip()}
result = {'captured_at_utc': utc(), 'verdict': 'LOCAL_AUTHOR_PASS_NOT_INDEPENDENT_QA',
    'scope': 'EXACT_PIN_INTEGRITY_AND_BOUNDED_LOCAL_SYNTHETIC_CONSUMER_COMPATIBILITY',
    'base': base, 'candidate_commit': None, 'runtime': runtime,
    'pristine_guard': 'PASS_BEFORE_NEGATIVES', 'mini_tests': summary, 'build_including_tsc': 'PASS',
    'guard_controls': {'positive': 1, 'negative': 63, 'new_target_negative_controls': 9,
        'all_diagnostics_bound_to_deliberate_target': True, **info(out / 'guard-controls.jsonl')},
    'source_integrity': {'before_file_count': len(prior), 'after_file_count': len(current),
        'unchanged_old_source_files': len(prior) - len(changed), 'only_changed_paths': paths,
        'historical_files_unchanged': len(historical), 'all_package_and_lock_files_unchanged': locks},
    'consumer_coverage': consumer_coverage,
    'patch_checks': patch_checks,
    'browser': {'status': 'NOT_RUN', 'reason': 'Only three guard/fixture/test paths changed; no UI, entry, transport, dependency or build failure/effect required conditional browser expansion.'},
    'R03_internal_acceptance': 'RETAINED_PER_COORDINATOR_NOT_RETESTED_HERE',
    'Mini_acceptance': 'PENDING_INDEPENDENT_QA', 'R1_integration': 'OPEN',
    'removal_E2E': 'BLOCKED', 'real_DB_and_providers': 'NOT_RUN',
    'setup_issue': {'initial_label': 'setup-root', 'exit': by_label['setup-root']['exit'],
        'cause': 'Default npm cache /home/agent/.npm/_cacache was unavailable.',
        'resolution': 'Ordinary task-owned writable cache flag; all three lock-based installs completed.',
        'access_or_tool_denial': False},
    'publication': 'NOT_UPLOADED_NOT_AUTHORIZED',
    'source_manifest': info(out / 'candidate-manifest.json'), 'coverage': info(out / 'coverage.json')}
(out / 'author-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'verdict': result['verdict'], 'source_files': 3,
    'implementation_bytes': source_manifest['source_bytes'], 'tests': summary,
    'guard_controls': {'positive': 1, 'negative': 63, 'new_target_negatives': 9},
    'unchanged_old_source_files': result['source_integrity']['unchanged_old_source_files'],
    'historical_files_preserved': len(historical), 'patch_checks': 'PASS',
    'candidate_manifest': str(out / 'candidate-manifest.json')}))
