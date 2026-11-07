# TCP-CANCEL-1 local candidate

PROVISIONAL / NOT ACCEPTED / NOT UPLOADED.
Base:31b2b00ecd1c413e1f828fef4c023c3ff2310909.

The Node listeners constructed a Fetch Request without a signal. Completing a
POST body and disconnecting the TCP client therefore left Request.signal live;
the provider deadline eventually rejected, but transport cancellation was late.
The exact-base raw TCP reproducer fails with false!==true for Request.signal.

Both local-server and configured-server now reuse nodeRequestAbort. Incomplete
input aborted or response close before writableFinished aborts the request.
Normal IncomingMessage.close after a complete body is not cancellation. Listener
cleanup occurs on response finish/close, without deleting Node's own listeners.
The configured adapter also skips response writes after connection destruction.

Clerk HTTP liveness forwards the per-request signal through an optional internal
ClerkLiveness argument. The provider's bounded Session/User reads race that
signal with their deadline, remove listeners/timers, and pass it to the existing
SDK transport. Time/security checks deny an already-aborted request before new
auth state is issued. This does not replace normal provider/JWT validation.

57/57 affected tests PASS, including5 new TCP cases, SDK-CANCEL-1 regressions,
provider/Clerk HTTP/review listener/configured HTTP checks. Typecheck exit0.
The raw-TCP500ms provider/3000ms SDK cases check both Request.signal and transport
signal, including the actual Clerk HTTP guard with offline signed proofs.
Additional cases cover normal body completion, listener removal, incomplete
body, discarded late reply and disconnect after a simulated durable commit.

Disconnect after COMMIT does not undo the command or establish delivered ACK.
An uncertain outcome must reconcile using existing idempotency/state. A transport
can ignore abort internally; its late response is still discarded. No actual
Clerk tenant/socket, Vercel/edge runtime, real DB, or deployment was tested.
In-flight remote JWKS resolution before a verified proof is a separate
cancellation-coverage limitation; the tested provider phase is Session/User
liveness. The verifier still rejects a late proof before auth mutation.

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/tcp-cancel.test.mjs tests/clerk-auth/sdk-cancel.test.mjs tests/clerk-auth/provider-adapter.test.mjs tests/clerk-auth/http.test.mjs tests/clerk-auth/review-listener.test.mjs tests/persistent-http/http.test.mjs
npm run typecheck
```

No upload/commit/push, credential/provider/DB change, migration or deploy.
Storage-domain work is a separate candidate; none is silently included here.
