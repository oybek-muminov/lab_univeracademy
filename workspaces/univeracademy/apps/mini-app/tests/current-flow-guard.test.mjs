import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('../../../', import.meta.url));
const guard = 'apps/mini-app/tests/verify-backend-targets.mjs';
const current = 'apps/mini-app/tests/fixtures/backend-c78c293-manifest.json';
const sdkStorageBaseline = 'apps/mini-app/tests/fixtures/backend-6f2dbee7-manifest.json';
const providerBaseline = 'apps/mini-app/tests/fixtures/backend-a36d41a-manifest.json';
const reviewBaseline = 'apps/mini-app/tests/fixtures/backend-b9efa597-manifest.json';
const familyBaseline = 'apps/mini-app/tests/fixtures/backend-6329367-manifest.json';
const clerkBaseline = 'apps/mini-app/tests/fixtures/backend-39b2d92-manifest.json';
const vercelBaseline = 'apps/mini-app/tests/fixtures/backend-47ed6f8-manifest.json';
const adaBaseline = 'apps/mini-app/tests/fixtures/backend-ada6600-manifest.json';
const productionBaseline = 'apps/mini-app/tests/fixtures/production-backend-manifest.json';
const previous = 'apps/mini-app/tests/fixtures/current-flow-backend-manifest.json';
const copies = ['student-client.ts', 'student-types.d.ts'].map(name => 'apps/mini-app/src/owner-client/' + name);
const history = 'apps/mini-app/tests/fixtures/combined-259b675e-manifest.json';
const attempts = 'supabase/functions/univeracademy-api/attempts.ts';
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(join(source, current), 'utf8'));

function check(mutate, expected) {
  const root = mkdtempSync(join(tmpdir(), 'ua-current-guard-'));
  try {
    for (const name of [guard, current, previous, productionBaseline, adaBaseline, vercelBaseline, clerkBaseline, familyBaseline, reviewBaseline, providerBaseline, sdkStorageBaseline, history, ...copies, ...manifest.files.map(file => file.path)]) {
      const path = join(root, name); mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, readFileSync(join(source, name)));
    }
    mutate?.(root);
    const result = spawnSync(process.execPath, [guard], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, expected ? 1 : 0, result.stderr);
    if (expected) assert(result.stderr.includes(expected), result.stderr);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

function oldAttempts(root) {
  const raw = readFileSync(join(root, attempts), 'utf8');
  const added = '// Internal maintenance transition. HTTP callers still require current staff auth,\n'
    + '// target visibility and transaction locks before loading/passing this record.\n'
    + 'export function expireForMembershipGuard(record: AttemptRecord, now: number): AttemptRecord {\n'
    + '  return expire(record, now);\n}\n\n';
  assert.equal(sha(Buffer.from(raw)), 'b4bc54e39fef6799b6ff83a4be3c474471afd2e4c76e888767e999064a4d9e20');
  const old = Buffer.from(raw.replace(added, ''));
  assert.equal(old.length, 9327);
  assert.equal(sha(old), 'acf2906760018be9eafa7b9a7b0d57bcc1e0486d4142a6acadc62a6515a01060');
  return old; // Exact historical bytes; never executed or written over owner source.
}

test('current guard accepts all 172 exact Backend files and both browser owner copies', () => check());
test('same-size corruption of new attempts bytes is rejected', () => check(root => {
  const path = join(root, attempts), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: ' + attempts));
test('exact historical 9327-byte attempts is rejected', () => check(root => {
  writeFileSync(join(root, attempts), oldAttempts(root));
}, 'BACKEND_TARGET_SIZE_MISMATCH: ' + attempts));
test('historical attempts padded to new length is rejected', () => check(root => {
  const old = oldAttempts(root); writeFileSync(join(root, attempts), Buffer.concat([old, Buffer.alloc(9616 - old.length, 32)]));
}, 'BACKEND_TARGET_HASH_MISMATCH: ' + attempts));
test('another dependency same-size corruption is rejected', () => check(root => {
  const path = join(root, 'package.json'), raw = readFileSync(path, 'utf8');
  const changed = raw.replace('"name"', '"namo"'); assert.notEqual(changed, raw); writeFileSync(path, changed);
}, 'BACKEND_TARGET_HASH_MISMATCH: package.json'));
test('another dependency wrong size is rejected', () => check(root => {
  const path = join(root, 'package.json'); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'BACKEND_TARGET_SIZE_MISMATCH: package.json'));
test('historical manifest tampering is rejected', () => check(root => {
  const path = join(root, history); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'BASELINE_MANIFEST_MISMATCH'));
test('current manifest tampering is rejected', () => check(root => {
  const path = join(root, current); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'RUNTIME_MANIFEST_MISMATCH'));

test('previous 44-file manifest tampering is rejected', () => check(root => {
  const path = join(root, previous); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'PREVIOUS_RUNTIME_MANIFEST_MISMATCH'));
test('browser production client same-size corruption is rejected', () => check(root => {
  const path = join(root, copies[0]), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'OWNER_CLIENT_HASH_MISMATCH: student-client.ts'));
test('browser stale-size local-only client is rejected', () => check(root => {
  const path = join(root, copies[0]); writeFileSync(path, readFileSync(path).subarray(0, 6968));
}, 'OWNER_CLIENT_SIZE_MISMATCH: student-client.ts'));
test('browser types same-size corruption is rejected', () => check(root => {
  const path = join(root, copies[1]), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'OWNER_CLIENT_HASH_MISMATCH: student-types.d.ts'));

test('previous production 71-file manifest tampering is rejected', () => check(root => {
  const path = join(root, productionBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'PRODUCTION_BASELINE_MANIFEST_MISMATCH'));
test('new local CORS target same-size corruption is rejected', () => check(root => {
  const path = join(root, 'runtime/local-cors.mjs'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: runtime/local-cors.mjs'));
test('updated configured HTTP target same-size corruption is rejected', () => check(root => {
  const path = join(root, 'supabase/functions/univeracademy-api/configured-http.ts'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: supabase/functions/univeracademy-api/configured-http.ts'));
test('missing new local CORS dependency fails closed', () => check(root => {
  rmSync(join(root, 'runtime/local-cors.mjs'));
}, 'ENOENT'));

test('previous ada6600 83-file manifest tampering is rejected', () => check(root => {
  const path = join(root, adaBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'ADA6600_BASELINE_MANIFEST_MISMATCH'));
test('new Vercel API entry same-size corruption is rejected', () => check(root => {
  const path = join(root, 'api/index.mjs'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: api/index.mjs'));
test('new Vercel transport same-size corruption is rejected', () => check(root => {
  const path = join(root, 'runtime/vercel-node.mjs'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: runtime/vercel-node.mjs'));
test('new Vercel configuration wrong size is rejected', () => check(root => {
  const path = join(root, 'vercel.json'); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'BACKEND_TARGET_SIZE_MISMATCH: vercel.json'));
test('missing new transaction-pool dependency fails closed', () => check(root => {
  rmSync(join(root, 'supabase/functions/univeracademy-api/storage/transaction-pool-port.ts'));
}, 'ENOENT'));

test('previous Vercel 95-file manifest tampering is rejected', () => check(root => {
  const path = join(root, vercelBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'VERCEL_BASELINE_MANIFEST_MISMATCH'));
test('new Clerk HTTP target same-size corruption is rejected', () => check(root => {
  const path = join(root, 'supabase/functions/univeracademy-api/clerk-http.ts'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: supabase/functions/univeracademy-api/clerk-http.ts'));
test('new Clerk verifier target same-size corruption is rejected', () => check(root => {
  const path = join(root, 'supabase/functions/univeracademy-api/clerk-auth.ts'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: supabase/functions/univeracademy-api/clerk-auth.ts'));
test('Clerk proposal wrong size is rejected', () => check(root => {
  const path = join(root, 'contracts/clerk-auth.proposal.patch.json'); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'BACKEND_TARGET_SIZE_MISMATCH: contracts/clerk-auth.proposal.patch.json'));
test('missing Clerk fixture dependency fails closed', () => check(root => {
  rmSync(join(root, 'tests/clerk-auth/fixture.mjs'));
}, 'ENOENT'));

const studentState = 'supabase/functions/univeracademy-api/student-state.ts';
function oldStudentState(root) {
  const raw = readFileSync(join(root, studentState), 'utf8');
  assert.equal(sha(Buffer.from(raw)), '208f220a3b72a572a37ab0ffba6763193b67beb3732aebe521f2295039333f72');
  const provenance = '  // Existing standalone handlers may omit it. The Clerk candidate requires\n'
    + '  // explicit provenance for every active family; missing is never "telegram".\n'
    + '  authProvider?: "clerk" | "telegram";\n';
  const old = Buffer.from(raw.replace(provenance, ''));
  assert.equal(old.length, 7338);
  assert.equal(sha(old), '9f8404d4caf65744d781eebd2931e27f2407fc3669a53b7afbfb522ad13183a1');
  return old; // Exact pre-F1 bytes, used only in the temporary negative control.
}

test('previous Clerk 108-file manifest tampering is rejected', () => check(root => {
  const path = join(root, clerkBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'CLERK_BASELINE_MANIFEST_MISMATCH'));
test('F1 student state same-size corruption is rejected', () => check(root => {
  const path = join(root, studentState), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: ' + studentState));
test('exact pre-F1 unmarked student state is rejected', () => check(root => {
  writeFileSync(join(root, studentState), oldStudentState(root));
}, 'BACKEND_TARGET_SIZE_MISMATCH: ' + studentState));
test('pre-F1 student state padded to the current length is rejected', () => check(root => {
  const old = oldStudentState(root); writeFileSync(join(root, studentState), Buffer.concat([old, Buffer.alloc(7532 - old.length, 32)]));
}, 'BACKEND_TARGET_HASH_MISMATCH: ' + studentState));
test('missing F1 family-context regression dependency fails closed', () => check(root => {
  rmSync(join(root, 'tests/clerk-auth/family-context.test.mjs'));
}, 'ENOENT'));

test('previous F1 117-file manifest tampering is rejected', () => check(root => {
  const path = join(root, familyBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'FAMILY_BASELINE_MANIFEST_MISMATCH'));
test('Clerk review schema same-size corruption is rejected', () => check(root => {
  const path = join(root, 'contracts/clerk-review.openapi.json'), bytes = readFileSync(path); bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: contracts/clerk-review.openapi.json'));
test('missing Clerk review TCP listener fails closed', () => check(root => {
  rmSync(join(root, 'runtime/clerk-review-server.mjs'));
}, 'ENOENT'));

test('previous Clerk review 133-file manifest tampering is rejected', () => check(root => {
  const path = join(root, reviewBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'CLERK_REVIEW_BASELINE_MANIFEST_MISMATCH'));
test('exact old 133-file manifest cannot replace the current manifest', () => check(root => {
  writeFileSync(join(root, current), readFileSync(join(root, reviewBaseline)));
}, 'RUNTIME_MANIFEST_MISMATCH'));
test('new Clerk provider same-size corruption is rejected', () => check(root => {
  const path = join(root, 'supabase/functions/univeracademy-api/clerk-provider.ts'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: supabase/functions/univeracademy-api/clerk-provider.ts'));
test('missing new Clerk provider dependency fails closed', () => check(root => {
  rmSync(join(root, 'supabase/functions/univeracademy-api/clerk-provider.ts'));
}, 'ENOENT'));

test('previous Clerk provider 149-file manifest tampering is rejected', () => check(root => {
  const path = join(root, providerBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'CLERK_PROVIDER_BASELINE_MANIFEST_MISMATCH'));
test('exact old 149-file manifest cannot replace the current manifest', () => check(root => {
  writeFileSync(join(root, current), readFileSync(join(root, providerBaseline)));
}, 'RUNTIME_MANIFEST_MISMATCH'));
test('new scoped Clerk storage same-size corruption is rejected', () => check(root => {
  const path = join(root, 'supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts'));
test('missing new Clerk SDK worker dependency fails closed', () => check(root => {
  rmSync(join(root, 'runtime/clerk-sdk-worker.mjs'));
}, 'ENOENT'));
test('unapplied Clerk storage proposal wrong size is rejected', () => check(root => {
  const path = join(root, 'contracts/clerk-storage.schema-rls.proposal.json'); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'BACKEND_TARGET_SIZE_MISMATCH: contracts/clerk-storage.schema-rls.proposal.json'));

test('previous Clerk SDK storage 163-file manifest tampering is rejected', () => check(root => {
  const path = join(root, sdkStorageBaseline); writeFileSync(path, readFileSync(path, 'utf8') + '\n');
}, 'CLERK_SDK_STORAGE_BASELINE_MANIFEST_MISMATCH'));
test('exact old 163-file manifest cannot replace the current manifest', () => check(root => {
  writeFileSync(join(root, current), readFileSync(join(root, sdkStorageBaseline)));
}, 'RUNTIME_MANIFEST_MISMATCH'));
test('SDK-CANCEL-1 fixed bindings same-size corruption is rejected', () => check(root => {
  const path = join(root, 'runtime/clerk-sdk-bindings.mjs'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: runtime/clerk-sdk-bindings.mjs'));
test('SDK-CANCEL-1 fixed worker same-size corruption is rejected', () => check(root => {
  const path = join(root, 'runtime/clerk-sdk-worker.mjs'), bytes = readFileSync(path);
  bytes[0] ^= 1; writeFileSync(path, bytes);
}, 'BACKEND_TARGET_HASH_MISMATCH: runtime/clerk-sdk-worker.mjs'));
test('missing SDK-CANCEL-1 regression dependency fails closed', () => check(root => {
  rmSync(join(root, 'tests/clerk-auth/sdk-cancel.test.mjs'));
}, 'ENOENT'));
