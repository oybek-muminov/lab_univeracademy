import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, ClerkLoaded, ClerkLoading, ClerkFailed, HandleSSOCallback, useClerk, useSignIn, useSignUp } from '@clerk/react';
import type { SignInFutureResource, SignUpFutureResource } from '@clerk/react/types';
import { CommonSignInView } from './common-sign-in-view.tsx';
import { readCommonEntryConfig, createCommonProductionRuntime } from './common-production-runtime.ts';
import type { CommonEntryConfig } from './common-production-runtime.ts';
import { readTelegramBridge } from './telegram-bootstrap.ts';
import { mountTelegramEntry } from './production-entry.tsx';
import { createProductionConnection } from './production-connection.ts';

function Status({ text }: { text: string }) {
  return <main className="shell"><section className="card"><h1>Kabinetga kirish</h1><p role="status">{text}</p></section></main>;
}
class EntryBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Status text="Kirish xizmati tayyor bo‘lmadi. Sahifani qayta oching." /> : this.props.children; }
}
function ReadyEntry({ config, scope, signIn, signUp }: {
  config: CommonEntryConfig; scope: unknown; signIn: SignInFutureResource; signUp: SignUpFutureResource;
}) {
  const clerk = useClerk(), latest = useRef({ clerk, signIn, signUp });
  latest.current = { clerk, signIn, signUp };
  const webview = !!readTelegramBridge(scope);
  const [runtime] = useState(() => createCommonProductionRuntime(config, {
    get signIn() { return latest.current.signIn; }, get signUp() { return latest.current.signUp; },
    session: () => latest.current.clerk.session ?? null,
    signOut: sessionId => latest.current.clerk.signOut({ sessionId }),
    openPopup: () => window.open('about:blank', '_blank', 'popup,width=480,height=700'), callbackUrl: config.callbackUrl,
  }, webview ? 'telegram_webview' : 'browser'));
  const [callback, setCallback] = useState(location.pathname === '/auth/callback');
  const [callbackSession, setCallbackSession] = useState<string | null>(null), [callbackNotice, setCallbackNotice] = useState('');
  const cancelled = useRef(false), handled = useRef(false);
  useEffect(() => () => runtime.dispose(), [runtime]);
  useEffect(() => {
    if (cancelled.current || handled.current || !callbackSession || clerk.session?.id !== callbackSession) return;
    if (clerk.session.status !== 'active' || clerk.session.currentTask) { setCallbackNotice('Qo‘shimcha tasdiqlash kerak.'); return; }
    handled.current = true; setCallback(false);
    history.replaceState(null, '', config.signInUrl);
    // Only this verified callback requests an app exchange. SDK state changes
    // elsewhere never auto-reopen an app session after cancel/logout.
    void runtime.continueSession();
  }, [callbackSession, clerk.session, runtime, config.signInUrl]);
  if (callback) return <>
    <Status text={callbackNotice || 'Google orqali kirish tekshirilmoqda…'} />
    <button className="text-button" onClick={() => {
      cancelled.current = true; runtime.reset(); setCallback(false); history.replaceState(null, '', config.signInUrl);
    }}>Bekor qilish</button>
    <HandleSSOCallback navigateToApp={({ session }) => {
      if (cancelled.current) return;
      if (!session || session.currentTask) { setCallbackNotice('Qo‘shimcha tasdiqlash kerak.'); return; }
      setCallbackSession(session.id);
    }} navigateToSignIn={() => { if (!cancelled.current) setCallbackNotice('Kirish uchun qo‘shimcha tasdiqlash kerak.'); }}
      navigateToSignUp={() => { if (!cancelled.current) setCallbackNotice('Ro‘yxatdan o‘tishni yakunlash uchun qo‘shimcha tasdiqlash kerak.'); }} />
  </>;
  return <CommonSignInView runtime={runtime} canContinue={clerk.session?.status === 'active'}
    telegramUrl={config.telegramEnabled ? webview ? '/telegram' : 'https://t.me/univeracademybot' : undefined} />;
}
function ConnectedEntry({ config, scope }: { config: CommonEntryConfig; scope: unknown }) {
  const { signIn } = useSignIn(), { signUp } = useSignUp();
  if (!signIn || !signUp) return <Status text="Kirish oynasi tayyorlanmoqda…" />;
  return <ReadyEntry config={config} scope={scope} signIn={signIn} signUp={signUp} />;
}
export function mountCommonProductionEntry(element: HTMLElement, options: {
  env: Readonly<Record<string, unknown>>; pageOrigin: string; scope: unknown;
}) {
  if (location.pathname === '/telegram' && options.env.VITE_TELEGRAM_SDK_ENABLED === 'true')
    return mountTelegramEntry(element, { ...options, createConnection: createProductionConnection });
  // Configuration is checked before any SDK component or script is loaded.
  let config: CommonEntryConfig;
  try { config = readCommonEntryConfig(options.env, options.pageOrigin); }
  catch {
    const root = createRoot(element); root.render(<Status text="Kabinetga ulanish hali tayyor emas. Keyinroq qayta oching." />);
    return { unmount: () => root.unmount() };
  }
  const root = createRoot(element);
  if (!['/', '/sign-in', '/auth/callback'].includes(location.pathname)) {
    root.render(<Status text="Kirish sahifasini yangidan oching." />); return { unmount: () => root.unmount() };
  }
  root.render(<EntryBoundary><ClerkProvider publishableKey={config.publishableKey} signInUrl={config.signInUrl}
    signUpUrl={config.signInUrl} signInFallbackRedirectUrl={config.callbackUrl} signUpFallbackRedirectUrl={config.callbackUrl}
    telemetry={{ disabled: true }}>
    <ClerkLoading><Status text="Kirish oynasi tayyorlanmoqda…" /></ClerkLoading>
    <ClerkFailed><Status text="Kirish xizmati javob bermadi. Keyinroq qayta urinib ko‘ring." /></ClerkFailed>
    <ClerkLoaded><ConnectedEntry config={config} scope={options.scope} /></ClerkLoaded>
  </ClerkProvider></EntryBoundary>);
  return { unmount: () => root.unmount() };
}
