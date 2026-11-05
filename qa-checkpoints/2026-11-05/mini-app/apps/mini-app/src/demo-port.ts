import type { Attempt, Exam, Result, SaveIntent, Student, StudentPort } from './flow.ts';

// Entirely synthetic UI data. No Telegram credentials, answer keys or scoring engine.
const questions = [
  { id: 'sample-q1', prompt: 'Jism 4 s davomida 20 m yo‘l bosdi. Uning o‘rtacha tezligini toping.',
    options: [{ id: 'sample-11', text: '4 m/s' }, { id: 'sample-12', text: '5 m/s' },
      { id: 'sample-13', text: '16 m/s' }, { id: 'sample-14', text: '80 m/s' }] },
  { id: 'sample-q2', prompt: 'Kuchning SI tizimidagi o‘lchov birligini belgilang.',
    options: [{ id: 'sample-21', text: 'Joul' }, { id: 'sample-22', text: 'Vatt' },
      { id: 'sample-23', text: 'Nyuton' }, { id: 'sample-24', text: 'Paskal' }] },
  { id: 'sample-q3', prompt: 'Bir tekis harakatda bosib o‘tilgan yo‘l qaysi ifoda bilan beriladi?',
    options: [{ id: 'sample-31', text: 's = v · t' }, { id: 'sample-32', text: 's = v / t' },
      { id: 'sample-33', text: 's = t / v' }, { id: 'sample-34', text: 's = m · v' }] },
  { id: 'sample-q4', prompt: 'Massasi 2 kg bo‘lgan jismning tezligi 3 m/s. Impuls birligini belgilang.',
    options: [{ id: 'sample-41', text: 'kg · m/s' }, { id: 'sample-42', text: 'kg/m' },
      { id: 'sample-43', text: 'm/s²' }, { id: 'sample-44', text: 'N/m²' }] },
];
const exam: Exam = { id: 'sample-physics', title: 'Fizika · guruh testi', group: 'Namuna guruhi',
  count: questions.length, durationLabel: '12 daqiqa', canStart: true,
  startNotice: 'Bu lokal namuna. Haqiqiy test muddati va kirish oynasini o‘qituvchi belgilaydi.' };
const exampleResult: Result = { earned: '6,00', maximum: '8,00', percentage: '75,00', bonus: null,
  reviewMessage: 'Batafsil tahlil hozir yopiq. Ruxsat ochilganda alohida ko‘rsatiladi.',
  note: 'Bu oldindan berilgan namuna natijasi. Tanlagan javoblaringizdan hisoblanmaydi.' };

export type DemoFault = 'none' | 'offline' | 'conflict' | 'lost-save' | 'recovery' | 'lost-submit' | 'short-timer';

export function createDemoPort() {
  let student: Student | null = null;
  let attempt: Attempt | null = null;
  let fault: DemoFault = 'none';
  const startReceipts = new Map<string, Attempt>();
  const submitReceipts = new Set<string>();
  const clone = <T,>(value: T): T => structuredClone(value);
  async function connection() {
    // A visible delay makes pending state reviewable; this is not a polling policy.
    await new Promise(resolve => setTimeout(resolve, 180));
    if (fault === 'offline') throw new Error('demo offline');
  }
  function sampleAttempt(generation = 1): Attempt {
    const now = Date.now();
    return { id: `sample-attempt-${generation}`, generation, active: true, statusLabel: 'Davom etmoqda',
      serverTime: new Date(now).toISOString(),
      deadline: new Date(now + (fault === 'short-timer' ? 3000 : 720000)).toISOString(),
      questions: clone(questions), answers: {} };
  }
  const port: StudentPort = {
    async profile() { await connection(); return clone(student); },
    async register(firstName, lastName) {
      await connection(); student = { firstName, lastName, displayId: 'NAMUNA' }; return clone(student);
    },
    async exams() { await connection(); return student ? [clone(exam)] : []; },
    async current() {
      await connection();
      if (attempt) {
        attempt.serverTime = new Date().toISOString();
        if (attempt.active && attempt.deadline && Date.parse(attempt.deadline) <= Date.now()) {
          attempt = { ...attempt, active: false, statusLabel: 'Vaqti tugagan', questions: [] };
        }
      }
      return clone(attempt);
    },
    async start(_examId, key) {
      await connection();
      attempt ??= clone(startReceipts.get(key) ?? sampleAttempt());
      startReceipts.set(key, clone(attempt));
      if (fault === 'short-timer') fault = 'none';
      return clone(attempt);
    },
    async save(intent: SaveIntent) {
      await connection();
      if (!attempt || intent.attemptId !== attempt.id || intent.generation !== attempt.generation) throw new Error('sample superseded');
      if (fault === 'recovery') {
        attempt = sampleAttempt(attempt.generation + 1); fault = 'none'; throw new Error('sample superseded');
      }
      const previous = attempt.answers[intent.questionId];
      if (fault === 'conflict') {
        const other = questions.find(q => q.id === intent.questionId)!.options.find(o => o.id !== intent.optionId)!;
        attempt.answers[intent.questionId] = { optionId: other.id, revision: (previous?.revision ?? 0) + 1 };
        fault = 'none'; throw new Error('sample conflict');
      }
      if ((previous?.revision ?? 0) !== intent.expectedRevision) throw new Error('sample conflict');
      const answer = { optionId: intent.optionId, revision: intent.expectedRevision + 1 };
      attempt.answers[intent.questionId] = answer;
      if (fault === 'lost-save') { fault = 'none'; throw new Error('sample lost reply'); }
      return clone(answer);
    },
    async submit(attemptId, generation, key) {
      await connection();
      if (!attempt || attempt.id !== attemptId || attempt.generation !== generation) throw new Error('sample superseded');
      if (!submitReceipts.has(key)) {
        attempt = { ...attempt, active: false, statusLabel: 'Topshirilgan', questions: [] };
        submitReceipts.add(key);
      }
      if (fault === 'lost-submit') { fault = 'none'; throw new Error('sample lost reply'); }
    },
    async result(attemptId) {
      await connection();
      if (!attempt || attempt.id !== attemptId || attempt.active) throw new Error('sample result unavailable');
      return clone(exampleResult);
    },
    async history() {
      await connection(); return attempt ? [{ title: exam.title, status: attempt.statusLabel,
        summary: attempt.active ? 'Natija hali yo‘q' : 'Namuna natijasi · 6,00 / 8,00' }] : [];
    },
  };
  return { port, setFault(value: DemoFault) { fault = value; } };
}
