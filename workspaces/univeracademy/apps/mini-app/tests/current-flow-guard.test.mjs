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
const current = 'apps/mini-app/tests/fixtures/current-flow-backend-manifest.json';
const history = 'apps/mini-app/tests/fixtures/combined-259b675e-manifest.json';
const attempts = 'supabase/functions/univeracademy-api/attempts.ts';
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(join(source, current), 'utf8'));

function check(mutate, expected) {
  const root = mkdtempSync(join(tmpdir(), 'ua-current-guard-'));
  try {
    for (const name of [guard, current, history, ...manifest.files.map(file => file.path)]) {
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

test('current guard accepts all 44 exact Backend files', () => check());
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
