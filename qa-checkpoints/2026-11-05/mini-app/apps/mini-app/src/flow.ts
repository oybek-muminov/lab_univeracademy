// UI projections only. These are not wire schemas or a second API client.
export type Student = { firstName: string; lastName: string; displayId: string };
export type Exam = {
  id: string; title: string; group: string; count: number;
  durationLabel: string; startNotice: string; canStart: boolean;
};
export type Question = { id: string; prompt: string; options: { id: string; text: string }[] };
export type SavedAnswer = { optionId: string | null; revision: number };
export type Attempt = {
  id: string; generation: number; active: boolean; statusLabel: string;
  serverTime: string; deadline: string | null;
  questions: Question[]; answers: Record<string, SavedAnswer>;
};
export type Result = {
  earned: string; maximum: string; percentage: string; bonus: string | null;
  reviewMessage: string; note: string;
};
export type HistoryEntry = { title: string; status: string; summary: string };
export type Draft = { questionId: string; optionId: string | null };
export type SaveIntent = Draft & { attemptId: string; generation: number; expectedRevision: number };
export type StudentPort = {
  profile(): Promise<Student | null>;
  register(firstName: string, lastName: string): Promise<Student>;
  exams(): Promise<Exam[]>;
  current(): Promise<Attempt | null>;
  start(examId: string, operationKey: string): Promise<Attempt>;
  save(intent: SaveIntent): Promise<SavedAnswer>;
  submit(attemptId: string, generation: number, operationKey: string): Promise<void>;
  result(attemptId: string): Promise<Result>;
  history(): Promise<HistoryEntry[]>;
};
type Screen = 'welcome' | 'profile' | 'exams' | 'instructions' | 'attempt' | 'result' | 'history';
type State = {
  screen: Screen; busy: boolean; notice: string; student: Student | null;
  exams: Exam[]; exam: Exam | null; attempt: Attempt | null;
  draft: Draft | null; needsRead: boolean; result: Result | null;
  history: HistoryEntry[]; clockAnchor: number;
};

export class StudentFlow {
  port: StudentPort;
  now: () => number;
  state: State;
  listeners = new Set<() => void>();
  startKey: string | null = null;
  submitKey: string | null = null;

  constructor(port: StudentPort, now = () => performance.now()) {
    this.port = port;
    this.now = now;
    this.state = { screen: 'welcome', busy: false, notice: '', student: null, exams: [],
      exam: null, attempt: null, draft: null, needsRead: false, result: null,
      history: [], clockAnchor: now() };
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.state;
  patch(change: Partial<State>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(fn => fn());
  }
  async run(action: () => Promise<void>) {
    if (this.state.busy) return;
    this.patch({ busy: true, notice: '' });
    try { await action(); }
    catch { this.patch({ notice: 'Amal tasdiqlanmadi. Aloqani tekshirib, qayta urinib ko‘ring.' }); }
    finally { this.patch({ busy: false }); }
  }
  async enter() {
    await this.run(async () => {
      const student = await this.port.profile();
      this.patch({ student, screen: student ? 'exams' : 'profile',
        exams: student ? await this.port.exams() : [] });
    });
  }
  async register(firstName: string, lastName: string) {
    if (!firstName.trim() || !lastName.trim()) return;
    await this.run(async () => {
      const student = await this.port.register(firstName.trim(), lastName.trim());
      this.patch({ student, exams: await this.port.exams(), screen: 'exams' });
    });
  }
  async openExam(exam: Exam) {
    await this.run(async () => {
      const attempt = await this.port.current();
      this.startKey = null;
      this.submitKey = null;
      this.patch({ exam, result: null });
      if (attempt) await this.adopt(attempt);
      else this.patch({ screen: 'instructions', attempt: null });
    });
  }
  async start() {
    if (this.state.busy || !this.state.exam?.canStart) return;
    this.startKey ??= crypto.randomUUID();
    const key = this.startKey;
    const exam = this.state.exam;
    await this.run(async () => { await this.adopt(await this.port.start(exam.id, key)); });
  }
  remainingSeconds() {
    const a = this.state.attempt;
    if (!a?.active || !a.deadline) return 0;
    const elapsed = Math.max(0, this.now() - this.state.clockAnchor);
    return Math.max(0, Math.ceil((Date.parse(a.deadline) - Date.parse(a.serverTime) - elapsed) / 1000));
  }
  async adopt(attempt: Attempt) {
    const previous = this.state.attempt;
    const changed = previous && (previous.id !== attempt.id || previous.generation !== attempt.generation);
    let draft = changed || !attempt.active ? null : this.state.draft;
    if (draft && (attempt.answers[draft.questionId]?.optionId ?? null) === draft.optionId) draft = null;
    if (changed) this.submitKey = null;
    this.patch({ attempt, draft, needsRead: false, clockAnchor: this.now(),
      screen: 'attempt', result: null,
      notice: changed ? 'Urinish o‘zgargan. Oldingi saqlanmagan tanlov yangi urinishga ko‘chirilmaydi.' :
        draft ? 'Saqlangan javob va sizning tanlovingiz farq qiladi. Qaysi birini qoldirishni tanlang.' : '' });
    if (!attempt.active) {
      this.patch({ result: await this.port.result(attempt.id), screen: 'result' });
    }
  }
  async reconcile() {
    if (this.state.busy) return;
    this.patch({ needsRead: true });
    await this.run(async () => {
      const attempt = await this.port.current();
      if (attempt) await this.adopt(attempt);
      else this.patch({ needsRead: true, notice: 'Urinish topilmadi. Test ro‘yxatini yangilang.' });
    });
  }
  async choose(questionId: string, optionId: string | null, resolve = false) {
    const a = this.state.attempt;
    // ponytail: serialize saves; add coalescing only if measured interaction needs it.
    if (!a?.active || this.state.busy || this.state.needsRead || this.submitKey ||
      (this.state.draft && !resolve) || this.remainingSeconds() <= 0) return;
    if (!a.questions.some(q => q.id === questionId && (optionId === null || q.options.some(o => o.id === optionId)))) return;
    const draft = { questionId, optionId };
    this.patch({ draft });
    await this.run(async () => {
      try {
        const saved = await this.port.save({ ...draft, attemptId: a.id, generation: a.generation,
          expectedRevision: a.answers[questionId]?.revision ?? 0 });
        this.patch({ attempt: { ...a, answers: { ...a.answers, [questionId]: saved } }, draft: null });
      } catch {
        this.patch({ needsRead: true,
          notice: 'Tanlovingiz hali tasdiqlanmagan. Avval saqlangan javoblarni qayta tekshiring.' });
      }
    });
  }
  keepSaved() {
    if (!this.state.busy && !this.state.needsRead) this.patch({ draft: null, notice: '' });
  }
  async submit() {
    const a = this.state.attempt;
    if (this.state.busy || !a?.active || this.state.draft || this.state.needsRead || this.remainingSeconds() <= 0) return;
    // Retain the key after an uncertain reply. Further edits stay locked until resolved.
    this.submitKey ??= crypto.randomUUID();
    const key = this.submitKey;
    await this.run(async () => {
      await this.port.submit(a.id, a.generation, key);
      const current = await this.port.current();
      if (current) await this.adopt(current);
    });
  }
  async showHistory() {
    await this.run(async () => { this.patch({ history: await this.port.history(), screen: 'history' }); });
  }
  async showExams() {
    await this.run(async () => { this.patch({ exams: await this.port.exams(), screen: 'exams' }); });
  }
}
