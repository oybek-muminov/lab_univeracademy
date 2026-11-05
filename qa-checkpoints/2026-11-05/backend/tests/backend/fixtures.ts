import { startAttempt } from "../../supabase/functions/univeracademy-api/attempts.ts";
import type { StudentAccess, Admission } from "../../supabase/functions/univeracademy-api/attempts.ts";
import { ratio } from "../../supabase/functions/univeracademy-api/ordinary.ts";
import type { PublishedTest } from "../../supabase/functions/univeracademy-api/ordinary.ts";

// Entirely synthetic identities, answer keys, points and time; no real pupil/test/bot.
export const clock = Date.UTC(2026, 10, 5, 12);
export const access: StudentAccess = {
  proofKind: "student_session", personId: "synthetic-pupil", enabled: true,
  assignmentIds: ["synthetic-assignment"],
};
export const admission: Admission = {
  assignmentId: "synthetic-assignment", groupId: "synthetic-group",
  activeGroupId: "synthetic-group", rostered: true, profileComplete: true,
  membershipEpoch: 7, grantEpoch: 7,
  opensAt: clock - 1000, closesAt: clock + 1000,
};
export function published(): PublishedTest {
  return {
    demoId: "synthetic-physics-demo", versionId: "synthetic-version",
    durationMs: 60_000, individualEnabled: false,
    questions: Array.from({ length: 3 }, (_, i) => ({
      id: `synthetic-question-${i}`,
      optionIds: Array.from({ length: 4 }, (_, j) => `synthetic-option-${i}-${j}`),
      correctOptionId: `synthetic-option-${i}-0`, individualPoints: ratio(5n, 2n),
    })),
  };
}
export function started() {
  return startAttempt({ access, admission, published: published(), existing: null,
    id: "synthetic-attempt", confirmed: true, now: clock });
}
export const current = { id: "synthetic-attempt", generation: 1 };
