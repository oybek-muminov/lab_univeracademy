import { StudentFlow } from './flow.ts';
import type { StudentPort } from './flow.ts';

// UI prototype ports only: these are neither Clerk SDK APIs nor HTTP contracts.
export type EntryEvidence = { proof: string };
export type EntryDemoProvider = {
  google(): Promise<EntryEvidence>;
  sendCode(email: string): Promise<{ challenge: string }>;
  verifyCode(challenge: string, code: string): Promise<EntryEvidence>;
};
export class EntryDemoFailure extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}
type Step = 'choose' | 'sending' | 'code' | 'verifying' | 'authorizing' | 'ready' | 'browser_required';
export type EntryDemoSnapshot = Readonly<{ step: Step; busy: boolean; maskedEmail: string; notice: string; flow: StudentFlow | null }>;
const messages: Record<string, string> = {
  INVALID_EMAIL: 'Namuna uchun faqat example.test emailidan foydalaning.',
  INVALID_CODE: 'Kod mos kelmadi. Qayta tekshiring.',
  CODE_EXPIRED: 'Kod muddati tugagan. Yangi kod so‘rang.',
  RATE_LIMITED: 'Biroz kutib, qayta urinib ko‘ring.',
  CANCELLED: 'Google bilan kirish bekor qilindi.',
  VERIFICATION_REQUIRED: 'Qo‘shimcha tasdiqlash kerak. Bu prototipda u ulanmagan.',
  APP_DENIED: 'Kabinetga kirish huquqi tasdiqlanmadi. Ma’lumotlar ochilmadi.',
  PROFILE_MISMATCH: 'Hisob mosligi tasdiqlanmadi. Yangidan kirib ko‘ring.',
};
export function createCommonEntryPrototype(options: {
  mode: 'synthetic'; context: 'browser' | 'telegram_webview'; provider: EntryDemoProvider;
  authorize(evidence: EntryEvidence): Promise<{ person: string; port: StudentPort }>;
  retire?(): Promise<'confirmed' | 'unconfirmed' | 'none'>;
}) {
  if (options.mode !== 'synthetic') throw new EntryDemoFailure('SYNTHETIC_MODE_REQUIRED');
  let state: EntryDemoSnapshot = Object.freeze({ step: 'choose', busy: false, maskedEmail: '', notice: '', flow: null });
  const listeners = new Set<() => void>();
  let epoch = 0, disposed = false, challenge: string | null = null, email = '';
  let pending: Promise<void> | null = null;
  function update(value: Partial<EntryDemoSnapshot>) {
    if (disposed) return;
    state = Object.freeze({ ...state, ...value }); listeners.forEach(notify => notify());
  }
  function check(generation: number) { if (disposed || generation !== epoch) throw new EntryDemoFailure('SUPERSEDED'); }
  function clearLocal() {
    epoch++; pending = null; challenge = null; email = '';
    update({ step: 'choose', busy: false, maskedEmail: '', notice: '', flow: null });
  }
  function retire() {
    // Eager invocation invalidates the old connection before any late callback.
    return new Promise<'confirmed' | 'unconfirmed' | 'none'>(resolve => resolve(options.retire?.() ?? 'none'));
  }
  function reset() { clearLocal(); void retire().catch(() => {}); }
  async function logout() {
    clearLocal(); const generation = epoch;
    try {
      const receipt = await retire(); check(generation);
      update({ notice: receipt === 'confirmed' ? 'Server sessiya yopilganini tasdiqladi.'
        : receipt === 'unconfirmed' ? 'Kirish bekor qilindi. Server holati tasdiqlanmagan; yangidan kiring.' : '' });
    } catch (error) {
      check(generation); update({ notice: 'Sessiya lokal yopildi. Server tasdig‘i kelmadi; yangidan kiring.' }); throw error;
    }
  }
  function run(step: Step, failureStep: Step, action: (generation: number) => Promise<void>): Promise<void> {
    if (disposed) return Promise.resolve();
    if (pending) return pending;
    const generation = ++epoch;
    update({ step, busy: true, notice: '', flow: null });
    const task = (async () => { await action(generation); })().catch(error => {
      if (disposed || generation !== epoch) return;
      void retire().catch(() => {}); // Rejected bootstrap cannot retain an app proof.
      const code = error instanceof EntryDemoFailure ? error.code : 'UNCONFIRMED';
      const expired = code === 'CODE_EXPIRED';
      if (expired) { challenge = null; email = ''; }
      const nextStep = expired || (failureStep === 'code' && !challenge) ? 'choose' : failureStep;
      update({ step: nextStep, notice: messages[code] ?? 'Tasdiq kelmadi. Keyinroq qayta urinib ko‘ring.', flow: null });
    }).finally(() => {
      if (!disposed && generation === epoch) update({ busy: false });
      if (pending === task) pending = null;
    });
    pending = task; return task;
  }
  async function finish(evidence: EntryEvidence, generation: number) {
    check(generation);
    if (!evidence || typeof evidence.proof !== 'string' || !evidence.proof) throw new EntryDemoFailure('APP_DENIED');
    challenge = null; email = '';
    update({ step: 'authorizing', maskedEmail: '' });
    // A provider success alone cannot open the existing student UI.
    const authorization = await options.authorize(evidence); check(generation);
    const student = await authorization.port.profile(); check(generation);
    if (!student || student.person !== authorization.person) throw new EntryDemoFailure('PROFILE_MISMATCH');
    const exams = student.registrationComplete ? await authorization.port.exams() : []; check(generation);
    const flow = new StudentFlow(authorization.port, undefined, undefined, 'clerk');
    flow.patch({ student, exams, screen: student.registrationComplete ? 'exams' : 'profile' });
    challenge = null; email = '';
    update({ step: 'ready', maskedEmail: '', notice: '', flow });
  }
  function google(): Promise<void> {
    if (disposed || state.step === 'ready') return Promise.resolve();
    if (pending) return pending;
    if (options.context === 'telegram_webview') {
      update({ step: 'browser_required', notice: '', flow: null }); return Promise.resolve();
    }
    challenge = null; email = ''; update({ maskedEmail: '' });
    return run('verifying', 'choose', async generation => {
      const evidence = await options.provider.google(); check(generation); await finish(evidence, generation);
    });
  }
  function sendCode(value: string): Promise<void> {
    if (disposed || state.step === 'ready') return Promise.resolve();
    if (pending) return pending;
    const normalized = value.trim().toLowerCase();
    if (!/^[a-z0-9._+-]+@example\.test$/.test(normalized)) {
      update({ notice: messages.INVALID_EMAIL }); return Promise.resolve();
    }
    email = normalized; challenge = null;
    update({ maskedEmail: normalized[0] + '***@example.test' });
    return run('sending', 'choose', async generation => {
      const sent = await options.provider.sendCode(normalized); check(generation);
      if (!sent || typeof sent.challenge !== 'string' || !sent.challenge) throw new EntryDemoFailure('UNCONFIRMED');
      challenge = sent.challenge; update({ step: 'code' });
    });
  }
  function verifyCode(code: string): Promise<void> {
    if (disposed || state.step === 'ready') return Promise.resolve();
    if (pending) return pending;
    if (!challenge || state.step !== 'code') return Promise.resolve();
    if (!/^\d{6}$/.test(code)) { update({ notice: messages.INVALID_CODE }); return Promise.resolve(); }
    const current = challenge;
    return run('verifying', 'code', async generation => {
      const evidence = await options.provider.verifyCode(current, code); check(generation); await finish(evidence, generation);
    });
  }
  return {
    snapshot: () => state, subscribe(notify: () => void) { listeners.add(notify); return () => { listeners.delete(notify); }; },
    google, sendCode, verifyCode, resend: () => email ? sendCode(email) : Promise.resolve(), reset, logout,
    // Preview reset does not claim a real Clerk/server logout receipt.
    dispose() { reset(); disposed = true; listeners.clear(); },
  };
}
