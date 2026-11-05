import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyTelegramInitData } from "../../supabase/functions/univeracademy-api/telegram.ts";
import { ApiFault } from "../../supabase/functions/univeracademy-api/fault.ts";

// Explicit synthetic bot key and freshness interval; no real bot or policy defaults.
const token = "123456:SYNTHETIC_LOCAL_TEST_BOT_TOKEN";
const interval = { notBeforeSeconds: 1000, notAfterSeconds: 1100 };
function signed(changes: Record<string, string> = {}, key = token): string {
  const fields = new URLSearchParams({
    auth_date: "1050", query_id: "synthetic-query",
    user: JSON.stringify({ id: 4_000_000_001, first_name: "Sinov", last_name: "O‘quvchi" }),
    ...changes,
  });
  const canonical = [...fields.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([name, value]) => `${name}=${value}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(key).digest();
  fields.set("hash", createHmac("sha256", secret).update(canonical).digest("hex"));
  return fields.toString();
}
const error = (code: string) => (value: unknown) => value instanceof ApiFault && value.code === code;

test("verified signed initData yields only a verified Telegram identity and replay fingerprint", async () => {
  const raw = signed({ signature: "synthetic-signed-field", start_param: "synthetic-launch" });
  const identity = await verifyTelegramInitData(raw, token, interval);
  assert.equal(identity.telegramUserId, 4_000_000_001);
  assert.equal(identity.firstName, "Sinov");
  assert.equal(identity.authDate, 1050);
  assert.match(identity.replayKey, /^[0-9a-f]{64}$/);
  assert.ok(!("access_token" in identity));
});

test("wire reordering/encoding variants have the same consumed-proof fingerprint", async () => {
  const raw = signed();
  const params = new URLSearchParams(raw);
  const reordered = new URLSearchParams([...params.entries()].reverse()).toString();
  const first = await verifyTelegramInitData(raw, token, interval);
  const second = await verifyTelegramInitData(reordered, token, interval);
  assert.equal(first.replayKey, second.replayKey);
  // Pure verification does not consume it: the future login transaction must do that.
});

test("tampering, wrong bot and non-initData proof are rejected", async () => {
  const raw = signed();
  await assert.rejects(verifyTelegramInitData(raw.replace("1050", "1051"), token, interval),
    error("INIT_DATA_INVALID"));
  await assert.rejects(verifyTelegramInitData(raw, token + "wrong", interval), error("INIT_DATA_INVALID"));
  await assert.rejects(verifyTelegramInitData("eyJhbGciOiJIUzI1NiJ9.fake.staff", token, interval),
    error("INIT_DATA_INVALID"));
});

test("duplicate fields and malformed hash/encoding cannot produce an ambiguous verified identity", async () => {
  for (const raw of [signed() + "&auth_date=1050", signed() + "&hash=" + "0".repeat(64),
    signed().replace(/hash=[^&]+/, "hash=xyz"), signed() + "&x=%ZZ", "", "x".repeat(16385)]) {
    await assert.rejects(verifyTelegramInitData(raw, token, interval), error("INIT_DATA_INVALID"));
  }
});

test("freshness bounds are supplied explicitly; stale and future valid signatures fail", async () => {
  await assert.rejects(verifyTelegramInitData(signed({ auth_date: "999" }), token, interval),
    error("INIT_DATA_EXPIRED"));
  await assert.rejects(verifyTelegramInitData(signed({ auth_date: "1101" }), token, interval),
    error("INIT_DATA_INVALID"));
  await assert.rejects(verifyTelegramInitData(signed(), "", interval), error("SERVICE_UNAVAILABLE"));
  await assert.rejects(verifyTelegramInitData(signed(), token, undefined as never),
    error("SERVICE_UNAVAILABLE"));
});

test("valid HMAC cannot authorize malformed user identity or noninteger auth date", async () => {
  for (const user of ["null", "[]", "not json", '{"id":9007199254740992,"first_name":"x"}',
    '{"id":1}', '{"id":1,"first_name":"x","last_name":1}']) {
    await assert.rejects(verifyTelegramInitData(signed({ user }), token, interval), error("INIT_DATA_INVALID"));
  }
  await assert.rejects(verifyTelegramInitData(signed({ auth_date: "1050.1" }), token, interval),
    error("INIT_DATA_INVALID"));
});
