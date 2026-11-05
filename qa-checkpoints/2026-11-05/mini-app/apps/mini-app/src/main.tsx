import { createRoot } from 'react-dom/client';
import './style.css';

const root = createRoot(document.getElementById('root')!);

// No live transport until Backend supplies its reviewed client and launch policy.
if (import.meta.env.DEV || import.meta.env.MODE === 'demo') {
  void import('./demo.tsx').then(({ DemoApp }) => root.render(<DemoApp />));
} else {
  root.render(<main className="shell"><section className="card">
    <p className="eyebrow">UniverAcademy</p><h1>Ulanish tayyorlanmoqda</h1>
    <p>O‘quvchi kabineti hali haqiqiy test xizmatiga ulanmagan.</p>
  </section></main>);
}
