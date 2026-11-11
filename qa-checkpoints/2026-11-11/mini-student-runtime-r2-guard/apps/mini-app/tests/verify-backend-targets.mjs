import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Fixed local test boundary. No network, environment override or inventory fallback.
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// Independently reviewed clean seed paths, not derived from manifest.files.
const expectedPaths = [
  "api/index.mjs",
  "apps/mini-app/tests/first-student-flow.offline.test.mjs",
  "apps/mini-app/tests/fixtures/first-student-flow.offline.json",
  "contracts/clerk-auth.proposal.patch.json",
  "contracts/clerk-review.openapi.json",
  "contracts/review-only.openapi.json",
  "package-lock.json",
  "package.json",
  "packages/api-client/staff-openapi.json",
  "packages/api-client/staff-types.d.ts",
  "packages/api-client/student-client.ts",
  "packages/api-client/student-openapi.json",
  "packages/api-client/student-types.d.ts",
  "runtime/clerk-review-server.mjs",
  "runtime/clerk-sdk-bindings.mjs",
  "runtime/clerk-sdk-worker.mjs",
  "runtime/configured-server.mjs",
  "runtime/content-pilot-driver.mjs",
  "runtime/content-pilot-lab.mjs",
  "runtime/content-pilot-server.mjs",
  "runtime/local-cors.mjs",
  "runtime/local-lab.mjs",
  "runtime/local-server.mjs",
  "runtime/node-request-abort.mjs",
  "runtime/production-entry.mjs",
  "runtime/production-options.mjs",
  "runtime/ungrouped-driver.mjs",
  "runtime/ungrouped-fixture.mjs",
  "runtime/ungrouped-lab.mjs",
  "runtime/ungrouped-server.mjs",
  "runtime/vercel-node.mjs",
  "supabase/functions/univeracademy-api/attempts.ts",
  "supabase/functions/univeracademy-api/clerk-auth.ts",
  "supabase/functions/univeracademy-api/clerk-http.ts",
  "supabase/functions/univeracademy-api/clerk-provider.ts",
  "supabase/functions/univeracademy-api/configured-http.ts",
  "supabase/functions/univeracademy-api/fault.ts",
  "supabase/functions/univeracademy-api/individual-points.ts",
  "supabase/functions/univeracademy-api/membership-activity.ts",
  "supabase/functions/univeracademy-api/membership-effects.ts",
  "supabase/functions/univeracademy-api/membership-preflight.ts",
  "supabase/functions/univeracademy-api/membership-removal-http.ts",
  "supabase/functions/univeracademy-api/membership-removal.ts",
  "supabase/functions/univeracademy-api/ordinary.ts",
  "supabase/functions/univeracademy-api/pilot-provisioning.ts",
  "supabase/functions/univeracademy-api/removal-authority.ts",
  "supabase/functions/univeracademy-api/staff-content.ts",
  "supabase/functions/univeracademy-api/staff-http.ts",
  "supabase/functions/univeracademy-api/staff-json.ts",
  "supabase/functions/univeracademy-api/staff-jwt.ts",
  "supabase/functions/univeracademy-api/staff-state.ts",
  "supabase/functions/univeracademy-api/storage/attempt-rows.ts",
  "supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts",
  "supabase/functions/univeracademy-api/storage/clerk-domain.ts",
  "supabase/functions/univeracademy-api/storage/membership-preflight-port.ts",
  "supabase/functions/univeracademy-api/storage/membership-protection-contract.ts",
  "supabase/functions/univeracademy-api/storage/postgres-transaction.ts",
  "supabase/functions/univeracademy-api/storage/prepared-student.ts",
  "supabase/functions/univeracademy-api/storage/session-rows.ts",
  "supabase/functions/univeracademy-api/storage/staff-access-rows.ts",
  "supabase/functions/univeracademy-api/storage/staff-first-test-rows.ts",
  "supabase/functions/univeracademy-api/storage/student-http-rows.ts",
  "supabase/functions/univeracademy-api/storage/student-identity-rows.ts",
  "supabase/functions/univeracademy-api/storage/student-scope.ts",
  "supabase/functions/univeracademy-api/storage/transaction-pool-port.ts",
  "supabase/functions/univeracademy-api/student-http.ts",
  "supabase/functions/univeracademy-api/student-state.ts",
  "supabase/functions/univeracademy-api/student-wire.ts",
  "supabase/functions/univeracademy-api/telegram.ts",
  "tests/backend/http-fixture.ts",
  "tests/backend/staff-fixture.ts",
  "tests/backend/student-prepared/clerk.test.mjs",
  "tests/backend/student-prepared/flow.test.mjs",
  "tests/backend/student-prepared/memory-pool.mjs",
  "tests/backend/student-prepared/routing-receipts.test.mjs",
  "tests/backend/validator/ajv-config.cjs",
  "tests/backend/validator/base-ajv-config.cjs",
  "tests/backend/validator/tooling/package-lock.json",
  "tests/backend/validator/tooling/package.json",
  "tests/backend/validator/view-builder.cjs",
  "tests/clerk-auth/contract.test.mjs",
  "tests/clerk-auth/domain-executor.mjs",
  "tests/clerk-auth/domain-http.test.mjs",
  "tests/clerk-auth/family-context.test.mjs",
  "tests/clerk-auth/fixture.mjs",
  "tests/clerk-auth/http.test.mjs",
  "tests/clerk-auth/provider-adapter.test.mjs",
  "tests/clerk-auth/review-listener.test.mjs",
  "tests/clerk-auth/review-types.test.ts",
  "tests/clerk-auth/scoped-store.test.mjs",
  "tests/clerk-auth/sdk-binding.test.mjs",
  "tests/clerk-auth/sdk-cancel.test.mjs",
  "tests/clerk-auth/staff-parallel.test.mjs",
  "tests/clerk-auth/tcp-cancel.test.mjs",
  "tests/clerk-auth/verifier.test.mjs",
  "tests/enrollment/identity-staff.test.mjs",
  "tests/enrollment/production-client.test.mjs",
  "tests/first-test/cors.test.mjs",
  "tests/first-test/executor.mjs",
  "tests/first-test/fixture.mjs",
  "tests/first-test/http.test.mjs",
  "tests/local-content-pilot.test.mjs",
  "tests/membership/preflight-adapter.test.mjs",
  "tests/membership/protection-contract.test.mjs",
  "tests/membership/protection-postgres-transaction.test.mjs",
  "tests/membership/removal-active.test.mjs",
  "tests/membership/removal-command.test.mjs",
  "tests/membership/removal-http.test.mjs",
  "tests/membership/shared-expiry-invariant.test.mjs",
  "tests/persistent-http/executor.mjs",
  "tests/persistent-http/http.test.mjs",
  "tests/storage-auth/disk-executor.mjs",
  "tests/storage-auth/staff-jwt.test.mjs",
  "tests/storage-auth/storage.test.mjs",
  "tests/vercel-node/adapter.test.mjs",
  "tests/vercel-node/pool-port.test.mjs",
  "tests/vercel-node/production-options.test.mjs",
  "tools/generate-staff-contract.py",
  "vercel.json"
];
// Fixed assembly authority. No runtime override, fallback, fetch or regeneration.
const ACTIVE_MANIFEST_SHA256 = 'fa30bc581d9f3708d766f98415957afd613e0919ec85d5860b96aebcc299dbb5';
const expectedAssembly = {
  "format_version": 2,
  "source_repository": "oybek-muminov/lab_univeracademy",
  "source_commit": "3f6e3a6bf1a6c2e96fca02aef06712a5d6924391",
  "source_tree": "52fa0e104c6c644f32991267bffd6730ea32279a",
  "application_base": {
    "repository": "oybek-muminov/UniverAcademy",
    "commit": "de2adf023428a374f075faa421ece9e1deafaf36",
    "tree": "bc891240798d9bf56ee52c4a0f0ecede8ed33552"
  },
  "backend_overlays": [
    {
      "repository": "oybek-muminov/lab_univeracademy",
      "commit": "80ee858fefde0b1d3d08b7ef3c07d780b7e41ea3",
      "tree": "e5d482497a224d100d1bf6beedc66cd0fb7225b5",
      "parent": "d54d19cb9ba78a13187362afdb2178e90430cefe",
      "prefix": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/",
      "manifest": {
        "path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/publication-manifest.json",
        "bytes": 9641,
        "sha256": "58fcac2b8f6bfef64ea414f2df48e8fa7e30e7bbceb94aa67b81f5026bfdfedf"
      },
      "files": [
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/api/index.mjs",
          "application_path": "api/index.mjs",
          "mode": "100644",
          "bytes": 777,
          "sha256": "7b597deacd99170bcae296871da9d535acbb832272419a79ef9c1f60a60b6728",
          "preimage": {
            "mode": "100644",
            "bytes": 616,
            "sha256": "e8c6699dbfac16771857c2b684b1198ac53950cf71469149200b619fb9412a4b"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/runtime/production-entry.mjs",
          "application_path": "runtime/production-entry.mjs",
          "mode": "100644",
          "bytes": 619,
          "sha256": "2f7d95aacd75e889b60c596d840e4e5f7b8109421c7deedc4d3180a381b5f50f",
          "preimage": null
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/runtime/production-options.mjs",
          "application_path": "runtime/production-options.mjs",
          "mode": "100644",
          "bytes": 7634,
          "sha256": "1224e4af8bede15d922a770f2bbe858a6807865c3cd7eaf9eb4177fd9a02c803",
          "preimage": {
            "mode": "100644",
            "bytes": 7544,
            "sha256": "251a124def286b6b42f11602cdaf79fd73d42f1b696eba89e6d9697169937989"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/clerk-auth.ts",
          "application_path": "supabase/functions/univeracademy-api/clerk-auth.ts",
          "mode": "100644",
          "bytes": 5065,
          "sha256": "94dd8154b8d74f17e8e17a97944e6e8b9a6d107d0abf1c1cf69a18e82f86dcb8",
          "preimage": {
            "mode": "100644",
            "bytes": 4980,
            "sha256": "278d4d6deaaf9a9b53e1fa1feb6f677b29b81761b6c3eb3f85a3b80cf31f3565"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/clerk-http.ts",
          "application_path": "supabase/functions/univeracademy-api/clerk-http.ts",
          "mode": "100644",
          "bytes": 15369,
          "sha256": "5dc5792ec73947cee6eee9121a33961e3c6fcc26e115ba35010b1404f09bd13c",
          "preimage": {
            "mode": "100644",
            "bytes": 15215,
            "sha256": "79fade5bdc4bb4e9ccbf09b2cf7de3101a7a11406457e4bbcb361074dbfc85e0"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/configured-http.ts",
          "application_path": "supabase/functions/univeracademy-api/configured-http.ts",
          "mode": "100644",
          "bytes": 9271,
          "sha256": "93359265ae5c2f1ba8b553a3fd8149e5ef845d0a7d7a6d893263baccc22a83f1",
          "preimage": {
            "mode": "100644",
            "bytes": 8697,
            "sha256": "3ab2e3c9393080c41347bf98f1e83d1a0a1ca3b64dbc847bf6a2c9d52ef7c708"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/staff-jwt.ts",
          "application_path": "supabase/functions/univeracademy-api/staff-jwt.ts",
          "mode": "100644",
          "bytes": 3624,
          "sha256": "090b6811c4010c58b0cd9f14999cc0657b8385fba6ee1f6be838e6cfe49b1635",
          "preimage": {
            "mode": "100644",
            "bytes": 3535,
            "sha256": "6b28fe7ab3c08a6f4c6b6867dd353a98dc397afd006236a510324c9e4cc3fc1b"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/storage/clerk-domain.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/clerk-domain.ts",
          "mode": "100644",
          "bytes": 12544,
          "sha256": "0ada748497502ca288a66201bd8e906d3481e4d3a021608df3d1f0bd6547bfb8",
          "preimage": {
            "mode": "100644",
            "bytes": 10501,
            "sha256": "8d2f69c9a4a970c85ff2594fa23cd8cd7441d0ae3b74ee265919381f2d44ea77"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/storage/prepared-student.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/prepared-student.ts",
          "mode": "100644",
          "bytes": 9365,
          "sha256": "9d365eade712d4149387c54e034f3f4b6f0b6522b0c09e2f86ca823442491171",
          "preimage": null
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/storage/student-http-rows.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/student-http-rows.ts",
          "mode": "100644",
          "bytes": 13877,
          "sha256": "7e374d1cd2891f056475141ceadca733a1a96f75e6a0c35190e6fd69b58d8f6e",
          "preimage": {
            "mode": "100644",
            "bytes": 13250,
            "sha256": "a6a97239245a086d5e6c51fbb6ddd9977b2e781b5ef92071d89bbfd71a909595"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/supabase/functions/univeracademy-api/storage/student-scope.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/student-scope.ts",
          "mode": "100644",
          "bytes": 4619,
          "sha256": "a8082c1a95534e5dbdedc5086ecae48b243b0d1cfdc68acf25dabfbc7197464a",
          "preimage": {
            "mode": "100644",
            "bytes": 3575,
            "sha256": "263238b744240af6e62cfd14c6dc00943bf840f7fe9c6e2ed18acbd914dd38bd"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/tests/backend/student-prepared/clerk.test.mjs",
          "application_path": "tests/backend/student-prepared/clerk.test.mjs",
          "mode": "100644",
          "bytes": 5153,
          "sha256": "4c61142f45ed932a7b886f29861d07089e562c0824ad3c819676d7ca0933860f",
          "preimage": null
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/tests/backend/student-prepared/flow.test.mjs",
          "application_path": "tests/backend/student-prepared/flow.test.mjs",
          "mode": "100644",
          "bytes": 12102,
          "sha256": "74ef69ef91852ad9c28f827588af5b9330b43dde3550e778b7bd0803cdd3f818",
          "preimage": null
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/tests/backend/student-prepared/memory-pool.mjs",
          "application_path": "tests/backend/student-prepared/memory-pool.mjs",
          "mode": "100644",
          "bytes": 8125,
          "sha256": "e86bad4d27fc376b876a40c70c0d914f0427262987f0505dcd8a36fa34c689f4",
          "preimage": null
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01/tests/vercel-node/production-options.test.mjs",
          "application_path": "tests/vercel-node/production-options.test.mjs",
          "mode": "100644",
          "bytes": 22292,
          "sha256": "09bb7e0face5e6bea69166de0c792f57fbb4c4da7f51e218ae82266c464e3769",
          "preimage": {
            "mode": "100644",
            "bytes": 21924,
            "sha256": "052e7e8aa70519c35d03d2de7d673db3737b4bcfd9858ae351ee2761ae0fc2ac"
          }
        }
      ]
    },
    {
      "repository": "oybek-muminov/lab_univeracademy",
      "commit": "3f6e3a6bf1a6c2e96fca02aef06712a5d6924391",
      "tree": "52fa0e104c6c644f32991267bffd6730ea32279a",
      "parent": "80ee858fefde0b1d3d08b7ef3c07d780b7e41ea3",
      "prefix": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/",
      "manifest": {
        "path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/publication-manifest.json",
        "bytes": 6267,
        "sha256": "5e7720b5a2d243deb2bd7d6b238689186052fd4011d1851f9ebd63d387409cba"
      },
      "files": [
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/supabase/functions/univeracademy-api/clerk-http.ts",
          "application_path": "supabase/functions/univeracademy-api/clerk-http.ts",
          "mode": "100644",
          "bytes": 15562,
          "sha256": "b6a7ef7a9b2c8ec0956dd8fafd15e4359db12bb36932e11476d486f09189f275",
          "preimage": {
            "mode": "100644",
            "bytes": 15369,
            "sha256": "5dc5792ec73947cee6eee9121a33961e3c6fcc26e115ba35010b1404f09bd13c"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/supabase/functions/univeracademy-api/configured-http.ts",
          "application_path": "supabase/functions/univeracademy-api/configured-http.ts",
          "mode": "100644",
          "bytes": 9359,
          "sha256": "582819b9a2218d804b8015861405e19b60fe08d440201cf245f266befc6f2c8f",
          "preimage": {
            "mode": "100644",
            "bytes": 9271,
            "sha256": "93359265ae5c2f1ba8b553a3fd8149e5ef845d0a7d7a6d893263baccc22a83f1"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/supabase/functions/univeracademy-api/storage/clerk-domain.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/clerk-domain.ts",
          "mode": "100644",
          "bytes": 12856,
          "sha256": "70b4a038642e4e92f53dd0bd8daf8b1de3108f4e698e4031e5eea5ac4727296a",
          "preimage": {
            "mode": "100644",
            "bytes": 12544,
            "sha256": "0ada748497502ca288a66201bd8e906d3481e4d3a021608df3d1f0bd6547bfb8"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/supabase/functions/univeracademy-api/storage/prepared-student.ts",
          "application_path": "supabase/functions/univeracademy-api/storage/prepared-student.ts",
          "mode": "100644",
          "bytes": 10068,
          "sha256": "fe8022c4d48f76d90240669bfd1899df77ceccccc0aede9323a9c429c475cc4d",
          "preimage": {
            "mode": "100644",
            "bytes": 9365,
            "sha256": "9d365eade712d4149387c54e034f3f4b6f0b6522b0c09e2f86ca823442491171"
          }
        },
        {
          "source_path": "qa-checkpoints/2026-11-11/backend-student-runtime-context-01-r2/tests/backend/student-prepared/routing-receipts.test.mjs",
          "application_path": "tests/backend/student-prepared/routing-receipts.test.mjs",
          "mode": "100644",
          "bytes": 10342,
          "sha256": "4a6e879e393d1bdf5b8425f305e6641af6aa0902c73396e1a8f49cbfd741aa46",
          "preimage": null
        }
      ]
    }
  ],
  "mini_overlay": {
    "repository": "oybek-muminov/lab_univeracademy",
    "commit": "1273852e29919f18aaecbe0c2b439fcd3153ff9e",
    "tree": "29758acf5874959e9dc990744d7403f47379cb70",
    "parent": "dc2bf835c7eee35e2471b2c14764957131543cfd",
    "prefix": "qa-checkpoints/2026-11-11/mini-first-student-flow-offline/",
    "manifest": {
      "path": "qa-checkpoints/2026-11-11/mini-first-student-flow-offline/MANIFEST.json",
      "bytes": 20409,
      "sha256": "ae7b3e84dfe2ce78de4a06671ef4dee5c69bc535c6d4e3a8f4e780cc1ea0e208"
    },
    "files": [
      {
        "source_path": "qa-checkpoints/2026-11-11/mini-first-student-flow-offline/apps/mini-app/tests/first-student-flow.offline.test.mjs",
        "application_path": "apps/mini-app/tests/first-student-flow.offline.test.mjs",
        "mode": "100644",
        "bytes": 12179,
        "sha256": "8d4d6d74f254324fc5ce1cf878bd013a09552626bbe7691777e088ad7454b5f0",
        "preimage": null
      },
      {
        "source_path": "qa-checkpoints/2026-11-11/mini-first-student-flow-offline/apps/mini-app/tests/fixtures/first-student-flow.offline.json",
        "application_path": "apps/mini-app/tests/fixtures/first-student-flow.offline.json",
        "mode": "100644",
        "bytes": 14552,
        "sha256": "4a218b7e8e24b743d781549bb9be61fe08cdea3ad9544c88490ff25f1a5a8652",
        "preimage": null
      }
    ]
  },
  "layout": "main-root",
  "target_count": 119,
  "target_bytes": 2135406
};
const runtimeRaw = readFileSync(new URL('./fixtures/backend-student-runtime-r2-3f6e3a6-assembly-manifest.json', import.meta.url));
assert.equal(sha256(runtimeRaw), ACTIVE_MANIFEST_SHA256, 'RUNTIME_MANIFEST_MISMATCH');
const runtime = JSON.parse(runtimeRaw);
assert(runtime && typeof runtime === 'object' && !Array.isArray(runtime), 'RUNTIME_MANIFEST_SHAPE_MISMATCH');
assert.deepEqual(Object.keys(runtime), [...Object.keys(expectedAssembly), 'files'], 'RUNTIME_MANIFEST_SHAPE_MISMATCH');
for (const key of ['format_version', 'source_repository', 'source_commit', 'source_tree', 'layout', 'target_count', 'target_bytes'])
  assert.equal(runtime[key], expectedAssembly[key], 'ASSEMBLY_METADATA_MISMATCH: ' + key);
assert.deepEqual(runtime.application_base, expectedAssembly.application_base, 'ASSEMBLY_METADATA_MISMATCH: application_base');
function canonicalPath(path) {
  return typeof path === 'string' && /^[A-Za-z0-9_./-]+$/.test(path) && !posix.isAbsolute(path)
    && posix.normalize(path) === path && path !== '.'
    && !path.split('/').some(part => part === '.' || part === '..' || part === '');
}
const allowedR2Replacements = new Set([
  'supabase/functions/univeracademy-api/clerk-http.ts',
  'supabase/functions/univeracademy-api/configured-http.ts',
  'supabase/functions/univeracademy-api/storage/clerk-domain.ts',
  'supabase/functions/univeracademy-api/storage/prepared-student.ts',
]);
const mapped = new Map();
const r2Replaced = new Set();
function validateLayer(layer, expected, label) {
  assert(layer && typeof layer === 'object' && !Array.isArray(layer), 'ASSEMBLY_LAYER_SHAPE_MISMATCH: ' + label);
  assert.deepEqual(Object.keys(layer), Object.keys(expected), 'ASSEMBLY_LAYER_SHAPE_MISMATCH: ' + label);
  for (const key of ['repository', 'commit', 'tree', 'parent', 'prefix'])
    assert.equal(layer[key], expected[key], 'ASSEMBLY_METADATA_MISMATCH: ' + label + '.' + key);
  assert.deepEqual(layer.manifest, expected.manifest, 'ASSEMBLY_METADATA_MISMATCH: ' + label + '.manifest');
  assert(Array.isArray(layer.files) && layer.files.length === expected.files.length,
    'ASSEMBLY_MAPPING_COUNT_MISMATCH: ' + label);
  const sourcePaths = new Set(), destinations = new Set();
  for (const file of layer.files) {
    assert(file && typeof file === 'object' && !Array.isArray(file), 'ASSEMBLY_MAPPING_SHAPE_MISMATCH: ' + label);
    assert.deepEqual(Object.keys(file), ['source_path', 'application_path', 'mode', 'bytes', 'sha256', 'preimage'],
      'ASSEMBLY_MAPPING_SHAPE_MISMATCH: ' + label);
    assert(canonicalPath(file.source_path) && canonicalPath(file.application_path)
      && file.source_path === layer.prefix + file.application_path, 'ASSEMBLY_MAPPING_PATH_MISMATCH: ' + label);
    assert(!sourcePaths.has(file.source_path) && !destinations.has(file.application_path),
      'ASSEMBLY_MAPPING_DUPLICATE: ' + label);
    sourcePaths.add(file.source_path); destinations.add(file.application_path);
    assert.equal(file.mode, '100644', 'ASSEMBLY_MAPPING_MODE_MISMATCH: ' + label);
    assert(Number.isSafeInteger(file.bytes) && file.bytes >= 0 && typeof file.sha256 === 'string'
      && /^[a-f0-9]{64}$/.test(file.sha256), 'ASSEMBLY_MAPPING_DIGEST_SHAPE_MISMATCH: ' + label);
    if (file.preimage !== null) {
      assert(file.preimage && typeof file.preimage === 'object' && !Array.isArray(file.preimage),
        'ASSEMBLY_PREIMAGE_SHAPE_MISMATCH: ' + label);
      assert.deepEqual(Object.keys(file.preimage), ['mode', 'bytes', 'sha256'], 'ASSEMBLY_PREIMAGE_SHAPE_MISMATCH: ' + label);
      assert(file.preimage.mode === '100644' && Number.isSafeInteger(file.preimage.bytes) && file.preimage.bytes >= 0
        && typeof file.preimage.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.preimage.sha256),
        'ASSEMBLY_PREIMAGE_SHAPE_MISMATCH: ' + label);
    }
    const previous = mapped.get(file.application_path);
    if (previous) {
      assert(label === 'backend_overlays[1]' && allowedR2Replacements.has(file.application_path),
        'ASSEMBLY_UNEXPECTED_COLLISION: ' + label);
      assert.deepEqual(file.preimage, { mode: previous.mode, bytes: previous.bytes, sha256: previous.sha256 },
        'ASSEMBLY_PREIMAGE_MISMATCH: ' + label);
      r2Replaced.add(file.application_path);
    }
    mapped.set(file.application_path, file);
  }
  assert.deepEqual(layer.files, expected.files, 'ASSEMBLY_MAPPING_MISMATCH: ' + label);
}
assert(Array.isArray(runtime.backend_overlays) && runtime.backend_overlays.length === 2,
  'ASSEMBLY_METADATA_MISMATCH: backend_overlays');
runtime.backend_overlays.forEach((layer, index) => validateLayer(layer, expectedAssembly.backend_overlays[index], 'backend_overlays[' + index + ']'));
assert.deepEqual([...r2Replaced].sort(), [...allowedR2Replacements].sort(), 'ASSEMBLY_REPLACEMENT_SET_MISMATCH');
validateLayer(runtime.mini_overlay, expectedAssembly.mini_overlay, 'mini_overlay');
assert(Array.isArray(runtime.files) && runtime.files.length === 119, 'RUNTIME_TARGET_COUNT_MISMATCH');
for (const file of runtime.files) {
  assert(file && typeof file === 'object' && !Array.isArray(file), 'RUNTIME_TARGET_SHAPE_MISMATCH');
  assert.deepEqual(Object.keys(file), ['path', 'bytes', 'sha256'], 'RUNTIME_TARGET_SHAPE_MISMATCH');
  assert(canonicalPath(file.path), 'RUNTIME_TARGET_PATH_MISMATCH');
  assert(Number.isSafeInteger(file.bytes) && file.bytes >= 0, 'RUNTIME_TARGET_SIZE_SHAPE_MISMATCH');
  assert(typeof file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.sha256), 'RUNTIME_TARGET_HASH_SHAPE_MISMATCH');
}
const paths = runtime.files.map(file => file.path);
assert.equal(new Set(paths).size, 119, 'RUNTIME_TARGET_DUPLICATE');
assert.deepEqual(paths, [...paths].sort(), 'RUNTIME_TARGET_ORDER_MISMATCH');
assert.deepEqual(paths, expectedPaths, 'RUNTIME_TARGET_SET_MISMATCH');
assert.equal(runtime.files.reduce((sum, file) => sum + file.bytes, 0), 2135406, 'RUNTIME_TARGET_BYTES_MISMATCH');
for (const [path, mapping] of mapped) {
  const target = runtime.files.find(file => file.path === path);
  assert(target && target.bytes === mapping.bytes && target.sha256 === mapping.sha256,
    'ASSEMBLY_FINAL_TARGET_MISMATCH: ' + path);
}
// Active corrected lab checkpoint provenance, not the base or an assembled tree.
export const BACKEND_SOURCE_COMMIT = runtime.source_commit;
const repo = realpathSync(fileURLToPath(new URL('../../../', import.meta.url)));
function readTarget(path) {
  const target = resolve(repo, path);
  const within = relative(repo, realpathSync(target));
  assert(within !== '..' && !within.startsWith('../') && !posix.isAbsolute(within),
    `BACKEND_TARGET_PATH_ESCAPE: ${path}`);
  assert(statSync(target).isFile(), `BACKEND_TARGET_NOT_FILE: ${path}`);
  return readFileSync(target);
}
const historicalAttemptsRaw = readTarget('apps/mini-app/tests/fixtures/attempts-8a750ee.ts.txt');
assert.equal(historicalAttemptsRaw.length, 9616, 'HISTORICAL_ATTEMPTS_FIXTURE_MISMATCH');
assert.equal(sha256(historicalAttemptsRaw), 'b4bc54e39fef6799b6ff83a4be3c474471afd2e4c76e888767e999064a4d9e20',
  'HISTORICAL_ATTEMPTS_FIXTURE_MISMATCH');
for (const file of runtime.files) {
  const bytes = readTarget(file.path);
  assert.equal(bytes.length, file.bytes, `BACKEND_TARGET_SIZE_MISMATCH: ${file.path}`);
  assert.equal(sha256(bytes), file.sha256, `BACKEND_TARGET_HASH_MISMATCH: ${file.path}`);
}
for (const name of ['student-client.ts', 'student-types.d.ts']) {
  const target = runtime.files.find(file => file.path === 'packages/api-client/' + name);
  assert(target, 'OWNER_CLIENT_TARGET_MISSING');
  const bytes = readTarget('apps/mini-app/src/owner-client/' + name);
  assert.equal(bytes.length, target.bytes, `OWNER_CLIENT_SIZE_MISMATCH: ${name}`);
  assert.equal(sha256(bytes), target.sha256, `OWNER_CLIENT_HASH_MISMATCH: ${name}`);
}
