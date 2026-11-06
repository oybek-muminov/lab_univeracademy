import type { components } from "./student-types.d.ts";

type Schema = components["schemas"];
export type StudentSchema = Schema;
export const STUDENT_CONTRACT_SHA256 = "9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4";
export const STUDENT_CONTRACT_VERSION = "0.2.9-admin-assignment-policy-a-candidate.1";

export class StudentClientProtocolError extends Error {
  constructor(code: string) { super(code); this.name = "StudentClientProtocolError"; }
}
export class StudentApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  constructor(status: number, code: string, requestId: string) {
    // Do not echo a raw response body, proof, URL or arbitrary server message into logs.
    super(code);
    this.name = "StudentApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export type LocalStudentClientOptions = {
  mode: "local_fixture";
  contractSha256: string;
  baseUrl: string;
  transport(request: Request): Promise<Response>;
};

// Review-only shared transport. No production constructor/native-fetch fallback,
// secret loading, storage, background timers, automatic login/refresh or hidden retry.
export function createLocalStudentClient(options: LocalStudentClientOptions) {
  if (options.mode !== "local_fixture") throw new StudentClientProtocolError("DRAFT_CLIENT_LOCAL_ONLY");
  if (options.contractSha256 !== STUDENT_CONTRACT_SHA256) {
    throw new StudentClientProtocolError("CONTRACT_HASH_MISMATCH");
  }
  let base: URL;
  try { base = new URL(options.baseUrl); }
  catch { throw new StudentClientProtocolError("INVALID_LOCAL_BASE_URL"); }
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash ||
    !["127.0.0.1", "localhost", "[::1]", "local.invalid"].includes(base.hostname) ||
    base.pathname.replace(/\/$/, "") !== "/api/v1" || typeof options.transport !== "function") {
    throw new StudentClientProtocolError("INVALID_LOCAL_BASE_URL");
  }
  const root = `${base.origin}/api/v1`;
  async function send<T>(method: string, path: string,
    args: { accessToken?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
    const headers = new Headers({ accept: "application/json" });
    if (args.accessToken) headers.set("authorization", `Bearer ${args.accessToken}`);
    if (args.idempotencyKey !== undefined) headers.set("idempotency-key", args.idempotencyKey);
    if (args.body !== undefined) headers.set("content-type", "application/json");
    const response = await options.transport(new Request(root + path, { method, headers,
      body: args.body === undefined ? undefined : JSON.stringify(args.body) }));
    let value: unknown;
    try { value = await response.json(); }
    catch { throw new StudentClientProtocolError("CLIENT_INVALID_RESPONSE"); }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new StudentClientProtocolError("CLIENT_INVALID_RESPONSE");
    }
    const envelope = value as Record<string, unknown>;
    if (!response.ok) {
      const error = envelope.error;
      if (!error || typeof error !== "object" || Array.isArray(error)) {
        throw new StudentClientProtocolError("CLIENT_INVALID_RESPONSE");
      }
      const e = error as Record<string, unknown>;
      if (typeof e.code !== "string" || !/^[A-Z0-9_]+$/.test(e.code) || typeof e.request_id !== "string") {
        throw new StudentClientProtocolError("CLIENT_INVALID_RESPONSE");
      }
      throw new StudentApiError(response.status, e.code, e.request_id);
    }
    if (!Object.hasOwn(envelope, "data") || Object.hasOwn(envelope, "error")) {
      throw new StudentClientProtocolError("CLIENT_INVALID_RESPONSE");
    }
    // Generated types are not a full runtime JSON Schema validator. The local server
    // response suite separately validates pinned schemas; do not infer API acceptance.
    return value as T;
  }
  const part = encodeURIComponent;
  const pendingRefresh = new Map<string, Promise<Schema["SuccessSession"]>>();
  const attemptedRefresh = new Set<string>();
  return {
    telegramLogin: (input: Schema["TelegramLogin"]) =>
      send<Schema["SuccessSession"]>("POST", "/auth/telegram", { body: input }),
    refresh(input: Schema["Refresh"]): Promise<Schema["SuccessSession"]> {
      const proof = input.refresh_token, pending = pendingRefresh.get(proof);
      if (pending) return pending;
      if (attemptedRefresh.has(proof)) return Promise.reject(
        new StudentClientProtocolError("REFRESH_PROOF_ALREADY_ATTEMPTED"));
      attemptedRefresh.add(proof);
      const request = send<Schema["SuccessSession"]>("POST", "/auth/refresh", { body: input })
        .finally(() => pendingRefresh.delete(proof));
      pendingRefresh.set(proof, request);
      return request;
    },
    logout: (args: { accessToken?: string; body?: Schema["Logout"] } = {}) =>
      send<Schema["SuccessAck"]>("POST", "/auth/logout", args),
    // Explicit receipt-proof request: no Authorization header, fallback, or local-only ACK.
    logoutByRefresh: (input: Schema["Logout"]) =>
      send<Schema["SuccessAck"]>("POST", "/auth/logout", { body: input }),
    me: (accessToken: string) => send<Schema["SuccessProfile"]>("GET", "/me", { accessToken }),
    updateProfile: (accessToken: string, input: Schema["ProfileUpdate"]) =>
      send<Schema["SuccessProfile"]>("PATCH", "/me", { accessToken, body: input }),
    exams: (accessToken: string) => send<Schema["SuccessMetaList"]>("GET", "/exams", { accessToken }),
    exam: (accessToken: string, assignmentId: string) =>
      send<Schema["SuccessMeta"]>("GET", `/exams/${part(assignmentId)}`, { accessToken }),
    startAttempt: (accessToken: string, assignmentId: string, input: Schema["Start"], idempotencyKey: string) =>
      send<Schema["SuccessAttempt"]>("POST", `/exams/${part(assignmentId)}/attempts`,
        { accessToken, body: input, idempotencyKey }),
    resumeAttempt: (accessToken: string, attemptId: string) =>
      send<Schema["SuccessAttempt"]>("GET", `/attempts/${part(attemptId)}`, { accessToken }),
    saveAnswer: (accessToken: string, attemptId: string, questionId: string, input: Schema["SaveAnswer"]) =>
      send<Schema["SuccessAnswer"]>("PUT", `/attempts/${part(attemptId)}/answers/${part(questionId)}`,
        { accessToken, body: input }),
    submitAttempt: (accessToken: string, attemptId: string, idempotencyKey: string) =>
      send<Schema["SuccessStudentCompletedGradingResult"]>("POST", `/attempts/${part(attemptId)}/submit`,
        { accessToken, idempotencyKey }),
    result: (accessToken: string, attemptId: string) =>
      send<Schema["SuccessStudentGradingResult"]>("GET", `/attempts/${part(attemptId)}/result`, { accessToken }),
    history: (accessToken: string, assignmentId: string) =>
      send<Schema["SuccessHistory"]>("GET", `/exams/${part(assignmentId)}/history`, { accessToken }),
  };
}
