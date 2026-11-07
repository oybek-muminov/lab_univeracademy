# SDK-CANCEL-1 local correction candidate

PROVISIONAL / NOT ACCEPTED. Local only, not uploaded or deployed.
Base: `6f2dbee78ba5545bd07ce759a9f0a6dde5514e60` in the laboratory repo.

The old `call()` abort removed a pending public call and rejected503, but did not
connect that call to the worker's independently numbered fetch. Its active
transport continued until the SDK deadline or close. The former deadline test
checked cancellation only after `close()`, masking this resource-lifecycle bug.
The new caller-abort regression fails on the exact base before the correction:
`transport must abort before sdk.close(): false !== true`.

The worker now tags each fetch with its caller ID using Node AsyncLocalStorage.
Main-thread calls own their transport controllers. A single terminal finish
removes the pending call and caller listener, clears its timer, and aborts its
controllers before resolving/rejecting. Unknown/completed call IDs never start
a transport. Transport race listeners/timers/controllers are removed in finally;
worker response handling clears read entries. Same-target concurrent calls have
separate contexts. No new dependency, SDK version, auth policy, DTO or schema.

Abort during a body read cancels its reader and releases the lock. A transport
that ignores abort may still execute its own work; its signal is nevertheless
aborted, its late response body is cancelled, and its reply cannot authenticate.
This is cooperative cancellation, not forcible termination of arbitrary code.

Validation:65/65 PASS (10 new cancellation checks +55 existing affected checks),
typecheck exit0. Tests include active caller abort, provider100ms/SDK3000ms,
SDK3000ms deadline without close, streamed-body cancellation, late response
disposal, concurrent same-session isolation, pre-abort and queued abort, repeated
Session/User cancellation, success/listener cleanup, idempotent close, and HTTP
state preservation: no new/replaced profile/proof and old family still usable.
All transport/provider replies and fixture identities are synthetic. Actual
Clerk transport abort semantics, HTTP socket cancellation, worker deployment,
real database/RLS and deployment remain NOT_RUN. No provider/database connection.

Run from `workspaces/univeracademy/` after the normal locked dependency setup:

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/sdk-cancel.test.mjs tests/clerk-auth/sdk-binding.test.mjs tests/clerk-auth/scoped-store.test.mjs tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/staff-parallel.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/family-context.test.mjs tests/clerk-auth/review-listener.test.mjs
npm run typecheck
```

Local test setup reused exact installed dependencies by symlink; no installation,
lock modification or external service call was needed. The symlinks are removed
after validation and are not deliverables. Existing frozen Backend manifest and
UI guard are left as base provenance; they do not describe this unuploaded delta.

`evidence/clerk-sdk-cancel-2026-11-07/source.patch` contains only the two runtime
changes and the new cancellation test. In a clean exact-base checkout, run from
repo root `git apply --check <patch-path>` then `git apply <patch-path>`.
Verify every before/after digest against `source-manifest.json`. The source patch
was checked against the base index and in reverse against the modified worktree.
This handoff document and test/verification logs are separate local evidence.
