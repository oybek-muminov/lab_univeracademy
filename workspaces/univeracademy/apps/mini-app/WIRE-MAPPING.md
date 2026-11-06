# Mini App → Backend-owned local HTTP mapping

Current local candidate: Backend handoff21403a42da13c914b6c5ae2b6bd1a8d26725e75b8e73346ac4bfb2a2be64657f,
API0.2.8-student-points-candidate.1,declared full schemaSHA256
280503a6a306c62e60dacea8a067137b37bcde151e6c2101d0beb4cbe09a25eb.
Client/types bytes are locally verified and copied unchanged into src/owner-client.
Full425742-byte OpenAPI is excluded from the minimal handoff,so full-schema
fixture validation remains NOT_RUN. Hash guard/pinned types are not a runtime
JSON Schema validator or global API acceptance.

| Screen/action | Owner client / HTTP | Loading / error / retry |
| --- | --- | --- |
| Enter | telegramLogin POST /auth/telegram,me GET /me | Busy;fresh synthetic launch only,no stored initData replay;401 requires fresh launch |
| Profile | updateProfile PATCH /me,exams GET /exams | Busy;422 validation;401 conceals protected context |
| Exam list | exams GET /exams | Read retry;403/404 clear stale scope;group/start button context is explicitly synthetic,not an invented grant |
| Open/current/reload | exam GET /exams/{assignment_id};resumeAttempt GET /attempts/{current_attempt_id} when present | Preserve assignment;server answers/revisions/generation/deadline;no implicit start or draft replay |
| Start | startAttempt POST /exams/{assignment_id}/attempts | confirmed:true and same scoped Idempotency-Key on explicit retry;no automatic mutation replay |
| Answer/clear | resumeAttempt GET /attempts/{attempt_id};saveAnswer PUT /attempts/{attempt_id}/answers/{question_id} | One flow save at a time;expected_revision;clear:null;not saved until ACK;409 requires current read;generation precheck |
| Submit | resumeAttempt;submitAttempt POST /attempts/{attempt_id}/submit;current read | Same operation key on explicit retry;no auto replay;terminal ordinary required |
| Result | resumeAttempt scope check;result GET /attempts/{attempt_id}/result | Server ordinary independent of null bonus;no scoring/rounding in UI |
| History | history GET /exams/{assignment_id}/history | Selected assignment only;cancelled lifecycle and nonofficial attribution preserved |
| Refresh | refresh POST /auth/refresh | Session-layer single-flight;lost rotation requires fresh launch;only expired GET may retry once |
| Logout/receipt | logoutByRefresh POST /auth/logout | Body refresh proof only;Authorization ABSENT,cookies omitted;HTTP200+data.ok===true required;local clear is not ACK |

Owner-client error status maps to401auth,403forbidden,404missing,409conflict,
422validation,429limited(with Retry-After),5xxtemporary,protocol andoffline.
Every completed/failed owner operation checks its original epoch before returning
payload or changing proof. Mutation auto-retry remains disabled. The old route
executor is disabled in the owner port;all HTTP operation paths live in the owner
client. Only tests/Node runtime import Backend implementation or signing fixtures.
Production browser source imports only the copied owner client/types.

Point fields ordinary.display.earned_points/max_points and nonnull bonus display
are strict1dp server strings;percentage stays2dp. Canonical strings are preserved,
then the renderer changes dot to comma lexically.0.0 does not imply exact zero;
no percentage recomputation or30 cap on totals/bonus. The teacher question parser
and30/3dp ingress rule are Backend-owned and have no Mini App input surface here.

Receipt fixMINI72-RECEIPT-01 retains its independently reviewed local block unchanged.
New combined source is a new candidate requiring separate QA. Optional120000ms
receipt retention is injected in synthetic tests only;browser mode omits a policy
and does not retain a retry proof after an uncertain one-shot logout.
TTL,receipt duration,storage/durable session binding and percentage policy remain
local technical candidates. No production/deploy/provider/DB/capacity claim.
