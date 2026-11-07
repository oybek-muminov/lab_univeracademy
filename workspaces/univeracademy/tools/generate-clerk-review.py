"""Mechanical exchange-only review view; never rewrite the baseline OpenAPI."""
from copy import deepcopy
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = '9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4'
VERSION = '0.3.0-clerk-exchange-review.1'
STATUS = 'PROVISIONAL / NOT ACCEPTED'

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def write(path, value):
    raw = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    (ROOT / path).write_bytes(raw)
    return digest(raw)

raw = (ROOT / 'contracts/review-only.openapi.json').read_bytes()
assert digest(raw) == BASE_SHA
proposal_raw = (ROOT / 'contracts/clerk-auth.proposal.patch.json').read_bytes()
assert digest(proposal_raw) == '7ca7874a07960e9e5a32332d6e51e56b0affaee0224d8d8ffefb36a83f2ea019'
proposal = json.loads(proposal_raw)
source = json.loads(raw)
selected = {
    '/info/version', '/components/securitySchemes/ClerkSessionBearer',
    '/components/schemas/ClerkExchangeRequest', '/paths/~1auth~1clerk',
}
used = set()
for op in proposal['json_patch']:
    if op['path'] not in selected:
        continue  # Six staff security changes remain a separate unapplied proposal.
    assert op['path'] not in used
    used.add(op['path'])
    parts = [p.replace('~1', '/').replace('~0', '~') for p in op['path'][1:].split('/')]
    parent = source
    for part in parts[:-1]:
        parent = parent[part]
    key = parts[-1]
    assert (key in parent) == (op['op'] == 'replace')
    parent[key] = deepcopy(op['value'])
assert used == selected
source['info']['version'] = VERSION
source['info']['description'] = STATUS + '. Exchange-only derived review view. Other behavior retains the exact baseline; no inherited acceptance.'
source['x-status'] = STATUS
clerk_errors = ['CLERK_TOKEN_INVALID', 'CLERK_SESSION_REVOKED', 'CLERK_IDENTITY_REVOKED',
                'CLERK_SESSION_SUPERSEDED', 'CLERK_TOKEN_REPLAY']
error_enum = source['components']['schemas']['Error']['properties']['error']['properties']['code']['enum']
assert not set(error_enum).intersection(clerk_errors)
error_enum.extend(clerk_errors)
source['paths']['/auth/clerk']['post']['description'] += ' PROVISIONAL / NOT ACCEPTED. Active opaque families require F1 server provenance and an immutable provider binding; missing or unmarked active context fails closed with 503.'
source['x-clerk-review'] = {
    'base_commit': '6329367b7346484f58e458f1b62396cfd764e6ec',
    'base_openapi_sha256': BASE_SHA,
    'proposal_sha256': digest(proposal_raw),
    'scope': 'Only student exchange added; six staff security changes NOT applied; linking/return protocol NOT implemented.',
    'added_student_error_codes': clerk_errors,
    'f1_runtime': {
        'supabase/functions/univeracademy-api/clerk-http.ts': '570dd8fe5b952c9b0ee58e67cefdc5a6713b21dceea1c6857e56a76801816029',
        'supabase/functions/univeracademy-api/student-state.ts': '208f220a3b72a572a37ab0ffba6763193b67beb3732aebe521f2295039333f72',
    },
}
for path, expected in source['x-clerk-review']['f1_runtime'].items():
    assert digest((ROOT / path).read_bytes()) == expected
full_sha = write('contracts/clerk-review.openapi.json', source)

student_paths = [
    '/auth/clerk', '/auth/telegram', '/auth/refresh', '/auth/logout', '/me', '/exams',
    '/exams/{assignment_id}', '/exams/{assignment_id}/attempts', '/attempts/{attempt_id}',
    '/attempts/{attempt_id}/answers/{question_id}', '/attempts/{attempt_id}/submit',
    '/attempts/{attempt_id}/result', '/exams/{assignment_id}/history',
]
paths = {p: deepcopy(source['paths'][p]) for p in student_paths}
def refs(value):
    if isinstance(value, dict):
        return ([value['$ref']] if '$ref' in value else []) + [r for v in value.values() for r in refs(v)]
    if isinstance(value, list):
        return [r for v in value for r in refs(v)]
    return []

pending = refs(paths) + ['#/components/securitySchemes/' + k for k in ['StudentSession', 'ClerkSessionBearer']]
components, seen = {}, set()
while pending:
    pointer = pending.pop()
    if pointer in seen:
        continue
    seen.add(pointer)
    assert pointer.startswith('#/components/')
    value = source
    for part in pointer[2:].split('/'):
        value = value[part.replace('~1', '/').replace('~0', '~')]
    _, _, group, name = pointer.split('/')
    components.setdefault(group, {})[name] = deepcopy(value)
    pending.extend(refs(value))
projection = {
    'openapi': source['openapi'],
    'info': {**source['info'], 'title': 'UniverAcademy student Clerk exchange review — NOT ACCEPTED'},
    'paths': paths,
    'components': {g: dict(sorted(items.items())) for g, items in sorted(components.items())},
    'x-source': {'full_openapi_sha256': full_sha, 'base_openapi_sha256': BASE_SHA, 'status': STATUS},
}
slice_sha = write('packages/api-client/student-openapi.json', projection)
client = ROOT / 'packages/api-client/student-client.ts'
text = client.read_text()
for name, value in [('STUDENT_CONTRACT_SHA256', full_sha), ('STUDENT_CONTRACT_VERSION', VERSION)]:
    text, count = re.subn(r'(?m)^export const ' + name + r' = "[^"]+";', 'export const ' + name + ' = "' + value + '";', text)
    assert count == 1
client.write_text(text)
print(json.dumps({'status': STATUS, 'full_sha256': full_sha, 'student_slice_sha256': slice_sha,
                  'paths': len(source['paths']), 'schemas': len(source['components']['schemas']),
                  'student_paths': len(paths), 'student_schemas': len(components['schemas'])}))
