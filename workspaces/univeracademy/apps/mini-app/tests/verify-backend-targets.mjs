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
// Historical manifests remain pinned as provenance, never current fallbacks.
const previousRaw = readFileSync(new URL('./fixtures/current-flow-backend-manifest.json', import.meta.url));
assert.equal(sha256(previousRaw), '45dab2f5f56d2c0366a57d9d3d7db4bdcd36d8d0b73c6666d900d8a9da57e797',
  'PREVIOUS_RUNTIME_MANIFEST_MISMATCH');
assert.equal(JSON.parse(previousRaw).files.length, 44);
const productionBaselineRaw = readFileSync(new URL('./fixtures/production-backend-manifest.json', import.meta.url));
assert.equal(sha256(productionBaselineRaw), 'bb8f1a619d677826225253614771863136cab7616c16bfdf35aaaf1a12b6b669',
  'PRODUCTION_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(productionBaselineRaw).files.length, 71);
const adaBaselineRaw = readFileSync(new URL('./fixtures/backend-ada6600-manifest.json', import.meta.url));
assert.equal(sha256(adaBaselineRaw), '9321fe841690a3511b2399661fa7c8b860315f55dfed2389362d2c2a62f69619',
  'ADA6600_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(adaBaselineRaw).files.length, 83);
const vercelBaselineRaw = readFileSync(new URL('./fixtures/backend-47ed6f8-manifest.json', import.meta.url));
assert.equal(sha256(vercelBaselineRaw), 'ed4058842c6bef9dd18791424abff99418c931a9821c74fca38e09b4f34e9aee',
  'VERCEL_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(vercelBaselineRaw).files.length, 95);
const clerkBaselineRaw = readFileSync(new URL('./fixtures/backend-39b2d92-manifest.json', import.meta.url));
assert.equal(sha256(clerkBaselineRaw), '60b6cc33f3ea951c402b06aeff3ef2eaa0ff7bb2d561d1f91aeec004b076447a',
  'CLERK_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(clerkBaselineRaw).files.length, 108);
const familyBaselineRaw = readFileSync(new URL('./fixtures/backend-6329367-manifest.json', import.meta.url));
assert.equal(sha256(familyBaselineRaw), '5036069d94b2a22326bed20dbe5f7ba62371102db081445ca103ce07606853cf',
  'FAMILY_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(familyBaselineRaw).files.length, 117);
const reviewBaselineRaw = readFileSync(new URL('./fixtures/backend-b9efa597-manifest.json', import.meta.url));
assert.equal(sha256(reviewBaselineRaw), 'c9a2f4ceee5bd1ade89df05c618e0c302b2b3a454f3c2b909397beb0256db31b',
  'CLERK_REVIEW_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(reviewBaselineRaw).files.length, 133);
const providerBaselineRaw = readFileSync(new URL('./fixtures/backend-a36d41a-manifest.json', import.meta.url));
assert.equal(sha256(providerBaselineRaw), '4b57143f14c6f6d77d1f30bec340f61f2f5cdea608d044a7f71df76e71473082',
  'CLERK_PROVIDER_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(providerBaselineRaw).files.length, 149);
const sdkStorageBaselineRaw = readFileSync(new URL('./fixtures/backend-6f2dbee7-manifest.json', import.meta.url));
assert.equal(sha256(sdkStorageBaselineRaw), '2a5f0b8fd2f4939932e0e50b4e30d14d0c84b502038852770dc456e09bc68fa0',
  'CLERK_SDK_STORAGE_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(sdkStorageBaselineRaw).files.length, 163);
const sdkCancelBaselineRaw = readFileSync(new URL('./fixtures/backend-c78c293-manifest.json', import.meta.url));
assert.equal(sha256(sdkCancelBaselineRaw), 'f085f2666c7cb3811da2ede722428ea275aa01e258b77666769447174c23fd06',
  'CLERK_SDK_CANCEL_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(sdkCancelBaselineRaw).files.length, 172);
const backend191Raw = readFileSync(new URL('./fixtures/backend-fa82166-manifest.json', import.meta.url));
assert.equal(sha256(backend191Raw), '1a2588f66f261029753b5756e3783adc5940834839b0bfc339f7bc7ffa31f4f7',
  'BACKEND_191_BASELINE_MANIFEST_MISMATCH');
assert.equal(JSON.parse(backend191Raw).files.length, 191);
// The new manifest alone supplies active rows. Retained checksum contents and
// older manifest rows are historical evidence, never an inventory fallback.
const runtimeRaw = readFileSync(new URL('./fixtures/backend-8a750ee-manifest.json', import.meta.url));
assert.equal(sha256(runtimeRaw), '9deefd433a9c4709ef037a5142c8a4e39db8f3fb0c2bd3f96fcb20f7d654632e',
  'RUNTIME_MANIFEST_MISMATCH');
const runtime = JSON.parse(runtimeRaw);
assert.equal(runtime.source_commit, '8a750ee01eed794bda1942bc1bd0e89829c3a704');
assert.equal(runtime.files.length, 194);
assert.equal(runtime.target_count, 194);
assert.equal(new Set(runtime.files.map(file => file.path)).size, 194, 'RUNTIME_TARGET_DUPLICATE');
assert.equal(runtime.target_bytes, 2207847);
assert.equal(runtime.files.reduce((total, file) => total + file.bytes, 0), 2207847,
  'RUNTIME_TARGET_BYTES_MISMATCH');
export const BACKEND_SOURCE_COMMIT = runtime.source_commit;
const repo = new URL('../../../', import.meta.url);
for (const file of runtime.files) {
  const bytes = readFileSync(new URL(file.path, repo));
  assert.equal(bytes.length, file.bytes, `BACKEND_TARGET_SIZE_MISMATCH: ${file.path}`);
  assert.equal(sha256(bytes), file.sha256, `BACKEND_TARGET_HASH_MISMATCH: ${file.path}`);
}
for (const name of ['student-client.ts', 'student-types.d.ts']) {
  const target = runtime.files.find(file => file.path === 'packages/api-client/' + name);
  assert(target, 'OWNER_CLIENT_TARGET_MISSING');
  const path = 'apps/mini-app/src/owner-client/' + name;
  const bytes = readFileSync(new URL(path, repo));
  assert.equal(bytes.length, target.bytes, `OWNER_CLIENT_SIZE_MISMATCH: ${name}`);
  assert.equal(sha256(bytes), target.sha256, `OWNER_CLIENT_HASH_MISMATCH: ${name}`);
}
