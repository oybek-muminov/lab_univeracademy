import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Node-only test boundary. No network, install or fallback to another checkpoint.
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = readFileSync(new URL('./fixtures/combined-259b675e-manifest.json', import.meta.url));
assert.equal(sha256(raw), '259b675e3e3ce2ad093af0029dc6252d1aad1fd6390048c2789e31cb6715e9be',
  'BASELINE_MANIFEST_MISMATCH');
const baseline = JSON.parse(raw);
assert.equal(baseline.backend_runtime_dependency.files.length, 16);
const runtimeRaw = readFileSync(new URL('./fixtures/current-flow-backend-manifest.json', import.meta.url));
assert.equal(sha256(runtimeRaw), '45dab2f5f56d2c0366a57d9d3d7db4bdcd36d8d0b73c6666d900d8a9da57e797',
  'RUNTIME_MANIFEST_MISMATCH');
const runtime = JSON.parse(runtimeRaw);
assert.equal(runtime.files.length, 44);
const repo = new URL('../../../', import.meta.url);
for (const file of runtime.files) {
  const bytes = readFileSync(new URL(file.path, repo));
  assert.equal(bytes.length, file.bytes, `BACKEND_TARGET_SIZE_MISMATCH: ${file.path}`);
  assert.equal(sha256(bytes), file.sha256, `BACKEND_TARGET_HASH_MISMATCH: ${file.path}`);
}
