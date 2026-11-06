import { createRoot } from 'react-dom/client';
import './style.css';

const root = createRoot(document.getElementById('root')!);

// Backend-owned local client is available only through explicit DEV fixture mode.
if (import.meta.env.DEV && import.meta.env.MODE === 'local_fixture') {
  void import('./local-http.tsx').then(({ LocalHttpApp }) => root.render(<LocalHttpApp />));
} else if (import.meta.env.DEV || import.meta.env.MODE === 'demo') {
  void import('./demo.tsx').then(({ DemoApp }) => root.render(<DemoApp />));
} else {
  root.render(<main className="shell"><section className="card">
    <p className="eyebrow">UniverAcademy</p><h1>Ulanish tayyorlanmoqda</h1>
    <p>O‘quvchi kabineti hali haqiqiy test xizmatiga ulanmagan.</p>
  </section></main>);
}
