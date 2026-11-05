import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createDemoPort } from './demo-port.ts';
import type { DemoFault } from './demo-port.ts';
import { StudentFlow } from './flow.ts';

const demo = createDemoPort();
const flow = new StudentFlow(demo.port);
const letters = ['A', 'B', 'C', 'D'];

export function DemoApp() {
  const s = useSyncExternalStore(flow.subscribe, flow.snapshot);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [confirmation, setConfirmation] = useState<'start' | 'submit' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const firstName = useRef<HTMLInputElement>(null);
  const lastName = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<HTMLHeadingElement>(null);

  useEffect(() => { focusTarget.current?.focus(); }, [s.screen]);
  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmation]);
  useEffect(() => {
    setQuestionIndex(0);
  }, [s.attempt?.id, s.attempt?.generation]);
  useEffect(() => {
    const tick = () => setSeconds(flow.remainingSeconds());
    tick(); const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [s.attempt]);
  useEffect(() => {
    const read = () => {
      if (flow.state.screen === 'attempt' && flow.state.attempt?.active) void flow.reconcile();
    };
    const visible = () => { if (document.visibilityState === 'visible') read(); };
    window.addEventListener('online', read);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('online', read); document.removeEventListener('visibilitychange', visible); };
  }, []);

  const a = s.attempt;
  const q = a?.questions[Math.min(questionIndex, Math.max(0, a.questions.length - 1))];
  const answered = Object.values(a?.answers ?? {}).filter(v => v.optionId !== null).length;
  const pending = s.draft?.questionId === q?.id ? s.draft : null;
  const confirmedOption = q ? a?.answers[q.id]?.optionId : null;
  const selectedOption = pending ? pending.optionId : confirmedOption;
  const locked = s.busy || s.needsRead || !!s.draft || !!flow.submitKey || seconds === 0;
  const title = { welcome: 'Testga xush kelibsiz', profile: 'Avval tanishib olaylik', exams: 'Mening testlarim',
    instructions: 'Boshlashga tayyormisiz?', attempt: 'Fizika testi', result: 'Natijangiz', history: 'Urinishlar tarixi' }[s.screen];

  return <main className="shell">
    <header className="brand"><span className="brand-mark" aria-hidden="true">U</span>
      <span>UniverAcademy<small>O‘quvchi kabineti</small></span><span className="demo-badge">Lokal namuna</span></header>
    <p className="sample-notice">Bu sinov interfeysi. Telegram va haqiqiy test xizmatiga ulanmagan. Sahifa yangilansa namuna boshidan boshlanadi.</p>
    <section className="page-heading"><p className="eyebrow">O‘zingizga ishonch bilan</p>
      <h1 ref={focusTarget} tabIndex={-1}>{title}</h1></section>
    {s.notice && <div className="notice" role="alert">{s.notice}</div>}

    {s.screen === 'welcome' && <section className="card welcome">
      <div className="orbit" aria-hidden="true">↗</div><h2>Birinchi qadam — bilimni sinash</h2>
      <p>Testni boshlang, savollarga javob bering va natijangizni ko‘ring.</p>
      <button className="primary" disabled={s.busy} onClick={() => void flow.enter()}>Namunani ochish <span aria-hidden="true">→</span></button>
      <small>Haqiqiy kirish nuqtasi: @univeracademybot</small>
    </section>}

    {s.screen === 'profile' && <form className="card" onSubmit={event => {
      event.preventDefault(); void flow.register(firstName.current!.value, lastName.current!.value);
    }}><h2>Ism va familiyangiz</h2><p>Namuna uchun to‘qima ism ishlatishingiz mumkin.</p>
      <label htmlFor="first-name">Ism</label><input id="first-name" ref={firstName} required maxLength={100} autoComplete="given-name" placeholder="Masalan, Aziz" />
      <label htmlFor="last-name">Familiya</label><input id="last-name" ref={lastName} required maxLength={100} autoComplete="family-name" placeholder="Masalan, Karimov" />
      <button className="primary" disabled={s.busy}>Davom etish →</button>
    </form>}

    {s.screen === 'exams' && <>
      <div className="student-line"><span>Salom, <strong>{s.student?.firstName}</strong></span><span className="pill">ID: {s.student?.displayId}</span></div>
      {s.exams.map(exam => <article className="card exam-card" key={exam.id}>
        <div className="card-top"><span className="subject-icon" aria-hidden="true">⚛</span><span className="pill green">Sizga biriktirilgan</span></div>
        <h2>{exam.title}</h2><p>{exam.group}</p>
        <div className="exam-facts"><span><strong>{exam.count}</strong> savol</span><span><strong>{exam.durationLabel}</strong> vaqt</span></div>
        <button className="primary" disabled={s.busy} onClick={() => void flow.openExam(exam)}>Testni ko‘rish →</button>
      </article>)}
      {!s.exams.length && <section className="card"><h2>Hozircha test yo‘q</h2><p>Guruh testiga o‘qituvchi yoki administrator biriktiradi.</p></section>}
      <button className="text-button" disabled={s.busy} onClick={() => void flow.showHistory()}>Urinishlar tarixini ko‘rish →</button>
      <div className="future-links"><span>Fanlar <small>Tez kunda</small></span><span>Yo‘l xaritasi <small>Tez kunda</small></span><span>Videodarslar <small>Tez kunda</small></span></div>
    </>}

    {s.screen === 'instructions' && <section className="card">
      <span className="pill green">{s.exam?.group}</span><h2>{s.exam?.title}</h2>
      <p>{s.exam?.startNotice}</p><ul className="instructions">
        <li>{s.exam?.count} ta savol, {s.exam?.durationLabel}.</li><li>Vaqt boshlash tasdig‘idan keyin yuradi. Pauza yo‘q.</li>
        <li>Savollar orasida erkin o‘tishingiz va javobni o‘zgartirishingiz mumkin.</li>
        <li>Faqat tasdiqlangan javoblar saqlangan hisoblanadi.</li>
      </ul><button className="primary" disabled={s.busy || !s.exam?.canStart} onClick={() => setConfirmation('start')}>Boshlash</button>
      <button className="text-button" disabled={s.busy} onClick={() => void flow.showExams()}>Testlarimga qaytish</button>
    </section>}

    {s.screen === 'attempt' && a && <>
      <section className="exam-bar"><div><span className="muted">Qolgan vaqt</span><strong className={seconds <= 60 ? 'urgent' : ''} role="timer" aria-label="Qolgan vaqt">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></div>
        <div className="align-right"><strong>{answered} / {a.questions.length}</strong><span className="muted">tasdiqlangan javob</span></div></section>
      {seconds === 0 && a.active && <div className="notice" role="status">Ko‘rsatilgan vaqt tugadi. Yakuniy holatni tekshiring.</div>}
      <nav className="question-nav" aria-label="Savollar">{a.questions.map((question, i) => <button key={question.id}
        aria-current={i === questionIndex ? 'step' : undefined}
        aria-label={`${i + 1}-savol${a.answers[question.id]?.optionId ? ', javob tasdiqlangan' : ', javobsiz'}`}
        className={a.answers[question.id]?.optionId ? 'answered' : ''} onClick={() => setQuestionIndex(i)}>{i + 1}</button>)}</nav>
      {q && <section className="card question"><div className="card-top"><p className="eyebrow">Savol {questionIndex + 1} / {a.questions.length}</p>
        <span className="save-state" aria-live="polite">{pending ? (s.busy ? 'Saqlanmoqda…' : 'Tasdiqlanmagan') : confirmedOption ? '✓ Tasdiqlangan' : 'Javob tanlanmagan'}</span></div>
        <fieldset disabled={locked}><legend>{q.prompt}</legend><div className="options">{q.options.map((option, i) => <label className={`option ${selectedOption === option.id ? 'selected' : ''}`} key={option.id}>
          <input type="radio" name={q.id} checked={selectedOption === option.id} onChange={() => void flow.choose(q.id, option.id)} />
          <span className="letter" aria-hidden="true">{letters[i]}</span><span>{option.text}</span></label>)}</div></fieldset>
        <button className="text-button clear" disabled={locked || !confirmedOption} onClick={() => void flow.choose(q.id, null)}>Tanlovni tozalash</button>
      </section>}
      {s.draft && !s.needsRead && !s.busy && <section className="notice"><p>Saqlanmagan tanlov {a.questions.findIndex(v => v.id === s.draft!.questionId) + 1}-savolga tegishli.</p>
        <button className="secondary" disabled={seconds === 0} onClick={() => void flow.choose(s.draft!.questionId, s.draft!.optionId, true)}>Mening tanlovimni saqlash</button>
        <button className="text-button" onClick={() => flow.keepSaved()}>Saqlangan javobni qoldirish</button></section>}
      <div className="question-actions"><button className="secondary" disabled={questionIndex === 0} onClick={() => setQuestionIndex(i => i - 1)}>← Oldingi</button>
        <button className="secondary" disabled={questionIndex >= a.questions.length - 1} onClick={() => setQuestionIndex(i => i + 1)}>Keyingi →</button></div>
      <div className="finish-actions"><button className="text-button" disabled={s.busy} onClick={() => void flow.reconcile()}>Saqlanganlarni tekshirish</button>
        <button className="primary" disabled={s.busy || s.needsRead || !!s.draft || seconds === 0} onClick={() => setConfirmation('submit')}>{flow.submitKey ? 'Topshirishni qayta tekshirish' : 'Testni topshirish'}</button></div>
    </>}

    {s.screen === 'result' && s.result && <section className="card result">
      <div className="result-mark" aria-hidden="true">✓</div><span className="pill green">{a?.statusLabel}</span><h2>Oddiy natija</h2>
      <p className="score">{s.result.earned}<span> / {s.result.maximum}</span></p><p className="percentage">{s.result.percentage}%</p>
      <p className="sample-result">{s.result.note}</p>
      {s.result.bonus !== null && <p>Statistik bonus: {s.result.bonus}</p>}
      <div className="review-note"><strong>Batafsil tahlil</strong><p>{s.result.reviewMessage}</p></div>
      <button className="primary" disabled={s.busy} onClick={() => void flow.showExams()}>Testlarimga qaytish</button>
      <button className="text-button" disabled={s.busy} onClick={() => void flow.showHistory()}>Urinishlar tarixi →</button>
    </section>}

    {s.screen === 'history' && <section className="card"><h2>O‘z urinishlaringiz</h2>
      {s.history.length ? s.history.map((entry, i) => <article className="history-entry" key={i}><strong>{entry.title}</strong><span>{entry.status}</span><p>{entry.summary}</p></article>) : <p>Hali urinish yo‘q.</p>}
      <button className="text-button" disabled={s.busy} onClick={() => void flow.showExams()}>← Testlarimga qaytish</button></section>}

    <footer><span>UniverAcademy</span><span>Har bir qadam — oldinga.</span></footer>
    <details className="demo-tools"><summary>Namuna holatlarini sinash</summary><p>Faqat lokal namuna uchun. Keyingi amalga ta’sir qiladi.</p>
      <label htmlFor="demo-fault">Sinov holati</label><select id="demo-fault" onChange={e => demo.setFault(e.target.value as DemoFault)}>
        <option value="none">Oddiy oqim</option><option value="offline">Aloqa yo‘q</option>
        <option value="conflict">Javob boshqa qurilmada o‘zgargan</option><option value="lost-save">Javob saqlangan, tasdiq kelmagan</option>
        <option value="recovery">Yangi bo‘sh urinish ochilgan</option><option value="lost-submit">Topshirilgan, tasdiq kelmagan</option>
        <option value="short-timer">Yangi test uchun 3 soniyalik vaqt</option></select></details>

    <dialog ref={dialog} onCancel={() => setConfirmation(null)} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{confirmation === 'start' ? 'Testni boshlaysizmi?' : 'Testni topshirasizmi?'}</h2>
      <p>{confirmation === 'start' ? `Tasdiqlasangiz, ${s.exam?.durationLabel} vaqt boshlanadi.` : `${answered} ta javob tasdiqlangan. ${(a?.questions.length ?? 0) - answered} ta savol javobsiz.`}</p>
      <div className="dialog-actions"><button className="secondary" onClick={() => setConfirmation(null)}>Ortga</button>
        <button className="primary" onClick={() => { const action = confirmation; setConfirmation(null); void (action === 'start' ? flow.start() : flow.submit()); }}>Ha, {confirmation === 'start' ? 'boshlash' : 'topshirish'}</button></div>
    </dialog>
  </main>;
}
