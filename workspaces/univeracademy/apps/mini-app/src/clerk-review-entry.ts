import { createCommonEntryPrototype, EntryDemoFailure } from './common-entry-prototype.ts';
import type { EntryDemoProvider } from './common-entry-prototype.ts';
import { createOwnerPort } from './owner-port.ts';
import type { OwnerPortOptions } from './owner-port.ts';

// Local review composition only. An injected synthetic provider supplies a JWT;
// the pinned Backend client exchanges it, then owns every opaque app operation.
// No SDK, provider IO, identity linking, token store or production entry change.
export function createClerkReviewEntry(options: Omit<OwnerPortOptions, 'mode' | 'loginMethod' | 'loginSignal'> & {
  mode: 'local_fixture'; provider: EntryDemoProvider; context?: 'browser' | 'telegram_webview';
}) {
  if (options.mode !== 'local_fixture') throw new EntryDemoFailure('LOCAL_REVIEW_REQUIRED');
  const { provider, context, ...config } = options;
  type Active = { connection: ReturnType<typeof createOwnerPort>; abort: AbortController };
  let active: Active | null = null, epoch = 0;
  const attempted = new Set<string>(); // Document-only digests, never raw JWTs.
  function retire(): Promise<'confirmed' | 'unconfirmed' | 'none'> {
    epoch++; const old = active; active = null;
    if (!old) return Promise.resolve('none');
    if (!old.connection.auth.person()) {
      old.connection.auth.clear(); old.abort.abort();
      return Promise.resolve('unconfirmed'); // Exchange may have committed remotely.
    }
    // Capture the old refresh proof before abort/clear. Body-only owner logout;
    // a late ACK belongs solely to that retired connection and controller epoch.
    const sent = new Promise<void>(resolve => resolve(old.connection.auth.logout()));
    old.abort.abort(); return sent.then(() => 'confirmed' as const);
  }
  return createCommonEntryPrototype({ mode: 'synthetic', context: context ?? 'browser', provider, retire,
    async authorize(evidence) {
      const generation = ++epoch;
      const abort = new AbortController();
      const connection = createOwnerPort({ ...config, loginMethod: 'clerk', loginSignal: abort.signal });
      const target = { connection, abort }; active = target;
      const check = () => {
        if (generation !== epoch || active !== target) throw new EntryDemoFailure('SUPERSEDED');
      };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(evidence.proof)); check();
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (attempted.has(fingerprint)) throw new EntryDemoFailure('FRESH_PROOF_REQUIRED');
      attempted.add(fingerprint); // Before any ambiguous exchange; never auto-replay.
      const person = await connection.auth.login(evidence.proof); check();
      if (person !== connection.auth.person()) throw new EntryDemoFailure('PROFILE_MISMATCH');
      return { person, port: connection.port };
    },
  });
}
