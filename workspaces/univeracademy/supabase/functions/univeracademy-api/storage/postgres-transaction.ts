import { ApiFault, fail } from "../fault.ts";

// Driver boundary only. No URL, credential, pool construction or network fallback.
export type Statement = { name: string; text: string; values: readonly unknown[] };
export type Rows = { rows: Record<string, unknown>[]; rowCount: number | null };
export interface PgClient {
  query(statement: Statement): Promise<Rows>;
  release(discard?: boolean): void;
}
export interface PgPool { connect(): Promise<PgClient> }
export class StorageUnavailable extends ApiFault {
  readonly outcome: "not_committed" | "commit_unknown";
  constructor(outcome: "not_committed" | "commit_unknown") { super("SERVICE_UNAVAILABLE", 503); this.outcome = outcome; }
}
export function integer(value: unknown): number {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) fail("RESPONSE_INVARIANT_FAILED", 500);
  const n = Number(value);
  if (!Number.isSafeInteger(n)) fail("RESPONSE_INVARIANT_FAILED", 500);
  return n;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export type LockedTransaction = { client: PgClient; personIds: readonly string[]; now: number };
export type IdentityTransaction = LockedTransaction & { telegramId: number };
export function own(tx: LockedTransaction, personId: string): void {
  if (!tx.personIds.includes(personId)) fail("NOT_FOUND", 404);
}
export function query(tx: LockedTransaction, name: string, text: string, values: readonly unknown[] = []) {
  return tx.client.query({ name, text, values });
}
export class PostgresTransactions {
  private readonly pool: PgPool;
  constructor(pool: PgPool) { this.pool = pool; }
  async run<T>(personIds: readonly string[], work: (tx: LockedTransaction) => Promise<T>): Promise<T> {
    const ids = [...new Set(personIds)].sort();
    if (!ids.length || ids.some((id) => !uuid.test(id))) fail("NOT_FOUND", 404);
    return this.execute(client => this.lockPeople(client, ids), work);
  }
  async runIdentity<T>(telegramId: number, ensure: (gate: IdentityTransaction) => Promise<string>,
    work: (tx: LockedTransaction) => Promise<T>): Promise<T> {
    if (!Number.isSafeInteger(telegramId) || telegramId <= 0) fail("INIT_DATA_INVALID", 401);
    return this.execute(async client => {
      // Negative bigint keys are reserved for verified Telegram identities.
      // This lock exists before the first people row; no global identity lock.
      await client.query({ name: "ua_telegram_identity_lock", text: "SELECT pg_advisory_xact_lock($1::bigint)", values: [(-BigInt(telegramId)).toString()] });
      const personId = await ensure({client,personIds:[],now:await this.clock(client),telegramId});
      if (!uuid.test(personId)) fail("RESPONSE_INVARIANT_FAILED", 500);
      return this.lockPeople(client, [personId]);
    }, work);
  }
  private async clock(client: PgClient): Promise<number> {
    const clock = await client.query({ name: "ua_clock", text:
      "SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS now_ms", values: [] });
    if (clock.rows.length !== 1) fail("RESPONSE_INVARIANT_FAILED", 500);
    const now = integer(clock.rows[0].now_ms);
    if (now > 8_640_000_000_000_000) fail("RESPONSE_INVARIANT_FAILED", 500);
    return now;
  }
  private async lockPeople(client: PgClient, ids: readonly string[]): Promise<LockedTransaction> {
    const locked = await client.query({ name: "ua_people_lock", text:
      "SELECT id::text AS id FROM ua_private.people WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE", values: [ids] });
    if (locked.rows.length !== ids.length || locked.rows.some((r, i) => r.id !== ids[i])) fail("NOT_FOUND", 404);
    return {client,personIds:ids,now:await this.clock(client)};
  }
  private async execute<T>(prepare: (client: PgClient) => Promise<LockedTransaction>, work: (tx: LockedTransaction) => Promise<T>): Promise<T> {
    if (typeof this.pool?.connect !== "function") throw new StorageUnavailable("not_committed");
    let client: PgClient;
    try { client = await this.pool.connect(); } catch { throw new StorageUnavailable("not_committed"); }
    if (typeof client?.query !== "function" || typeof client.release !== "function") {
      if (typeof client?.release === "function") client.release(true);
      throw new StorageUnavailable("not_committed");
    }
    let began = false, committing = false, discard = false;
    try {
      await client.query({ name: "ua_begin", text: "BEGIN", values: [] }); began = true;
      const value = await work(await prepare(client));
      // Returned business-error outcomes commit maintenance transitions, including
      // deadline expiry. Throwing aborts. Never render an ACK inside this callback.
      committing = true;
      await client.query({ name: "ua_commit", text: "COMMIT", values: [] }); began = false;
      return value;
    } catch (error) {
      if (committing) { discard = true; throw new StorageUnavailable("commit_unknown"); }
      if (began) {
        try { await client.query({ name: "ua_rollback", text: "ROLLBACK", values: [] }); }
        catch { discard = true; }
      } else discard = true;
      throw error;
    } finally { client.release(discard); }
  }
}
