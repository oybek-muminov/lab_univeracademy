-- DB-BOOTSTRAP-01 / REVIEW ONLY / PostgreSQL 17 proposal.
-- Source: UniverAcademy de2adf023428a374f075faa421ece9e1deafaf36.
-- No statement in this file has been executed against PostgreSQL.
-- This deliberate guard must remain in the review artifact. A future executable
-- package needs separate review, a new byte/hash identity and exact approval.
DO $review_guard$ BEGIN
  RAISE EXCEPTION 'REVIEW_ONLY_DB_BOOTSTRAP_01_NOT_AUTHORIZED_FOR_APPLICATION';
END $review_guard$;

BEGIN;
-- BEGIN MANAGED-OPERATOR PREFLIGHT ADDITION
-- Inactive derivative: no SQL has been compiled or executed by this owner.
-- The existing review guard and terminal ROLLBACK remain unchanged.
-- Empty createrole_self_grant preserves PostgreSQL's implicit ADMIN-only grants;
-- no operator attribute, server setting, or permanent runtime authority changes.
DO $bootstrap_operator$ BEGIN
  IF current_user IS DISTINCT FROM session_user
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND rolcreaterole AND NOT rolsuper)
    OR current_setting('createrole_self_grant') IS DISTINCT FROM ''
    OR NOT pg_catalog.has_database_privilege(current_user,current_database(),'CREATE') THEN
    RAISE EXCEPTION 'MANAGED_BOOTSTRAP_OPERATOR_REQUIRED' USING ERRCODE='42501';
  END IF;
END $bootstrap_operator$;
-- END MANAGED-OPERATOR PREFLIGHT ADDITION
-- The future migration operator must have reviewed CREATE ROLE and SET ROLE
-- authority. Neither role is a login, API role, or a credential-bearing account.
-- Fail on collisions; do not adopt or overwrite an existing role/schema.
CREATE ROLE ua_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ua_runtime NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
-- BEGIN MANAGED-OPERATOR OWNER WINDOW ADDITION
-- Attribute this temporary membership to the actual creating operator, not to
-- an assumed managed/bootstrap superuser. ADMIN is not added by this grant.
GRANT ua_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;
DO $bootstrap_owner_ready$ BEGIN
  IF NOT pg_catalog.pg_has_role(current_user,'ua_owner','SET')
    OR NOT pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m
      WHERE m.roleid='ua_owner'::regrole AND m.member=current_user::regrole
        AND m.grantor=current_user::regrole AND NOT m.admin_option AND m.inherit_option AND m.set_option)
    OR pg_catalog.pg_has_role('ua_runtime','ua_owner','MEMBER') THEN
    RAISE EXCEPTION 'TEMPORARY_OWNER_AUTHORITY_MISSING' USING ERRCODE='42501';
  END IF;
END $bootstrap_owner_ready$;
-- END MANAGED-OPERATOR OWNER WINDOW ADDITION
CREATE SCHEMA ua_private AUTHORIZATION ua_owner;
SET LOCAL ROLE ua_owner;
SET LOCAL search_path = pg_catalog, ua_private;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Only this new creator's defaults change. Existing public/default ACLs and
-- managed schemas are not modified. A per-schema revoke cannot cancel global
-- default PUBLIC function/type privileges, hence these owner-specific revokes.
ALTER DEFAULT PRIVILEGES FOR ROLE ua_owner REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ua_owner REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ua_owner REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE ua_owner REVOKE ALL ON TYPES FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SCHEMA ua_private FROM PUBLIC, anon, authenticated, service_role, ua_runtime;

-- JSON numeric values follow the existing JS safe-integer decoder, not a new
-- product duration/score limit. Ratios remain decimal strings without clipping.
CREATE DOMAIN ua_private.safe_counter AS bigint CHECK (VALUE BETWEEN 0 AND 9007199254740991);
CREATE DOMAIN ua_private.ms_time AS bigint CHECK (VALUE BETWEEN 0 AND 8640000000000000);
CREATE DOMAIN ua_private.proof_digest AS text COLLATE "C" CHECK (VALUE ~ '^[0-9a-f]{64}$');
CREATE FUNCTION ua_private.ratio_shape(v jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog
AS $fn$ SELECT COALESCE(jsonb_typeof(v) = 'object'
  AND jsonb_typeof(v->'numerator') = 'string' AND (v->>'numerator') ~ '^(0|[1-9][0-9]*)$'
  AND jsonb_typeof(v->'denominator') = 'string' AND (v->>'denominator') ~ '^[1-9][0-9]*$', false) $fn$;

CREATE TABLE ua_private.groups (
  id uuid PRIMARY KEY,
  revision ua_private.safe_counter NOT NULL,
  status text COLLATE "C" NOT NULL CHECK (status IN ('active','archived'))
);
CREATE TABLE ua_private.people (
  id uuid PRIMARY KEY,
  telegram_id bigint UNIQUE CHECK (telegram_id BETWEEN 1 AND 9007199254740991),
  qadam_id text COLLATE "C" UNIQUE CHECK (qadam_id ~ '^[0-9]{10}$'),
  enabled boolean NOT NULL,
  roles text[] NOT NULL CHECK (cardinality(roles)>0 AND roles <@ ARRAY['student','teacher','admin','owner']::text[] AND array_position(roles,NULL) IS NULL),
  profile jsonb NOT NULL,
  CONSTRAINT people_profile_shape CHECK (COALESCE(jsonb_typeof(profile)='object'
    AND profile->>'person_id'=id::text AND profile->'roles'=to_jsonb(roles)
    AND profile ?& ARRAY['first_name','last_name','registration_complete','active_group_id','qadam_id']
    AND jsonb_typeof(profile->'first_name')='string' AND jsonb_typeof(profile->'last_name')='string'
    AND jsonb_typeof(profile->'registration_complete')='boolean'
    AND (profile->'qadam_id')=COALESCE(to_jsonb(qadam_id),'null'::jsonb)
    AND (jsonb_typeof(profile->'active_group_id')='string' OR profile->'active_group_id'='null'::jsonb),false))
);
CREATE TABLE ua_private.memberships (
  person_id uuid PRIMARY KEY REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  affinity_group_id uuid REFERENCES ua_private.groups(id) ON DELETE NO ACTION,
  active boolean NOT NULL,
  revision ua_private.safe_counter NOT NULL,
  epoch ua_private.safe_counter NOT NULL,
  CHECK (NOT active OR affinity_group_id IS NOT NULL)
);
ALTER TABLE ua_private.people ADD CONSTRAINT people_membership_required
  FOREIGN KEY(id) REFERENCES ua_private.memberships(person_id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX memberships_group_idx ON ua_private.memberships(affinity_group_id,person_id);

CREATE TABLE ua_private.staff_identities (
  issuer text COLLATE "C" NOT NULL CHECK (issuer<>''),
  provider_subject text COLLATE "C" NOT NULL CHECK (provider_subject<>''),
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  revoked_at_ms ua_private.ms_time,
  PRIMARY KEY(issuer,provider_subject)
);
CREATE INDEX staff_identities_person_idx ON ua_private.staff_identities(person_id);
CREATE TABLE ua_private.staff_access (
  person_id uuid PRIMARY KEY REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  approved boolean NOT NULL, manage_roster boolean NOT NULL, manage_content boolean NOT NULL,
  all_groups boolean NOT NULL, all_subjects boolean NOT NULL
);
CREATE TABLE ua_private.staff_group_scope (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  group_id uuid NOT NULL REFERENCES ua_private.groups(id) ON DELETE NO ACTION,
  revoked_at_ms ua_private.ms_time,
  PRIMARY KEY(person_id,group_id)
);
CREATE INDEX staff_group_scope_group_idx ON ua_private.staff_group_scope(group_id,person_id);
-- Subjects are nonempty application strings (accepted MVP value: physics),
-- not UUIDs. No subjects table/registry or broader subject grant is invented.
CREATE TABLE ua_private.staff_subject_scope (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  subject_id text COLLATE "C" NOT NULL CHECK (subject_id<>''),
  revoked_at_ms ua_private.ms_time,
  PRIMARY KEY(person_id,subject_id)
);
CREATE TABLE ua_private.teacher_subject_approvals (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  subject_id text COLLATE "C" NOT NULL CHECK (subject_id<>''),
  approved boolean NOT NULL,
  revoked_at_ms ua_private.ms_time,
  PRIMARY KEY(person_id,subject_id)
);

CREATE TABLE ua_private.clerk_identities (
  issuer text COLLATE "C" NOT NULL CHECK (issuer<>''),
  subject text COLLATE "C" NOT NULL CHECK (subject<>''),
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  enabled boolean NOT NULL,
  PRIMARY KEY(issuer,subject), UNIQUE(issuer,subject,person_id)
);
CREATE INDEX clerk_identities_person_idx ON ua_private.clerk_identities(person_id);
CREATE TABLE ua_private.clerk_student_sessions (
  issuer text COLLATE "C" NOT NULL, subject text COLLATE "C" NOT NULL,
  sid text COLLATE "C" NOT NULL CHECK (sid<>''), person_id uuid NOT NULL,
  retired_at_ms ua_private.ms_time,
  PRIMARY KEY(issuer,subject,sid), UNIQUE(issuer,subject,sid,person_id),
  FOREIGN KEY(issuer,subject,person_id) REFERENCES ua_private.clerk_identities(issuer,subject,person_id) ON DELETE NO ACTION
);
CREATE INDEX clerk_sessions_person_idx ON ua_private.clerk_student_sessions(person_id);
CREATE TABLE ua_private.student_families (
  id uuid PRIMARY KEY, person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  expires_at_ms ua_private.ms_time NOT NULL, revoked_at_ms ua_private.ms_time,
  logout_retain_until_ms ua_private.ms_time,
  auth_provider text COLLATE "C" NOT NULL CHECK (auth_provider IN ('clerk','telegram')),
  UNIQUE(id,person_id),
  CHECK (logout_retain_until_ms IS NULL OR (revoked_at_ms IS NOT NULL AND logout_retain_until_ms>=revoked_at_ms))
);
CREATE UNIQUE INDEX families_one_unrevoked_idx ON ua_private.student_families(person_id) WHERE revoked_at_ms IS NULL;
CREATE INDEX families_person_idx ON ua_private.student_families(person_id,id);
CREATE TABLE ua_private.clerk_family_bindings (
  family_id uuid PRIMARY KEY, issuer text COLLATE "C" NOT NULL,
  subject text COLLATE "C" NOT NULL, sid text COLLATE "C" NOT NULL, person_id uuid NOT NULL,
  FOREIGN KEY(family_id,person_id) REFERENCES ua_private.student_families(id,person_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY(issuer,subject,sid,person_id) REFERENCES ua_private.clerk_student_sessions(issuer,subject,sid,person_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX clerk_bindings_person_idx ON ua_private.clerk_family_bindings(person_id);
CREATE TABLE ua_private.clerk_exchange_replays (
  digest ua_private.proof_digest PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  consumed_at_ms ua_private.ms_time NOT NULL
);
CREATE INDEX clerk_replays_person_idx ON ua_private.clerk_exchange_replays(person_id);
CREATE TABLE ua_private.student_access (
  digest ua_private.proof_digest PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES ua_private.student_families(id) ON DELETE NO ACTION,
  expires_at_ms ua_private.ms_time NOT NULL, superseded boolean NOT NULL
);
CREATE INDEX access_family_idx ON ua_private.student_access(family_id);
CREATE TABLE ua_private.student_refresh (
  digest ua_private.proof_digest PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES ua_private.student_families(id) ON DELETE NO ACTION,
  consumed boolean NOT NULL
);
CREATE INDEX refresh_family_idx ON ua_private.student_refresh(family_id);
CREATE TABLE ua_private.init_data_replays (
  digest ua_private.proof_digest PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  consumed_at_ms ua_private.ms_time NOT NULL
);
CREATE INDEX init_replays_person_idx ON ua_private.init_data_replays(person_id);

CREATE TABLE ua_private.demos (
  id uuid PRIMARY KEY, subject_id text COLLATE "C" NOT NULL CHECK (subject_id<>''), title text NOT NULL
);
CREATE TABLE ua_private.test_versions (
  id uuid PRIMARY KEY, demo_id uuid NOT NULL REFERENCES ua_private.demos(id) ON DELETE NO ACTION,
  revision ua_private.safe_counter NOT NULL,
  status text COLLATE "C" NOT NULL CHECK (status IN ('draft','published')),
  wire jsonb NOT NULL, published_snapshot jsonb,
  UNIQUE(id,demo_id),
  CHECK (COALESCE(jsonb_typeof(wire)='object' AND wire->>'id'=id::text
    AND wire->>'demo_id'=demo_id::text AND wire->>'revision'=revision::text AND wire->>'status'=status,false)),
  CHECK (COALESCE((status='draft' AND (published_snapshot IS NULL OR published_snapshot='null'::jsonb)) OR (status='published' AND jsonb_typeof(published_snapshot)='object'),false))
);
CREATE INDEX versions_demo_idx ON ua_private.test_versions(demo_id,id);
CREATE TABLE ua_private.draft_questions (
  version_id uuid NOT NULL REFERENCES ua_private.test_versions(id) ON DELETE NO ACTION,
  id uuid NOT NULL, position ua_private.safe_counter NOT NULL, record jsonb NOT NULL,
  PRIMARY KEY(version_id,id), UNIQUE(version_id,position) DEFERRABLE INITIALLY DEFERRED,
  CHECK (COALESCE(jsonb_typeof(record)='object' AND record->>'id'=id::text AND record->>'position'=position::text,false))
);
CREATE TABLE ua_private.assignments (
  id uuid PRIMARY KEY, group_id uuid NOT NULL REFERENCES ua_private.groups(id) ON DELETE NO ACTION,
  demo_id uuid NOT NULL REFERENCES ua_private.demos(id) ON DELETE NO ACTION,
  version_id uuid NOT NULL, revision ua_private.safe_counter NOT NULL, record jsonb NOT NULL,
  UNIQUE(group_id,demo_id), UNIQUE(id,demo_id),
  FOREIGN KEY(version_id,demo_id) REFERENCES ua_private.test_versions(id,demo_id) ON DELETE NO ACTION,
  CHECK (COALESCE(jsonb_typeof(record)='object' AND record#>>'{admission,assignmentId}'=id::text
    AND record#>>'{admission,groupId}'=group_id::text AND record#>>'{published,demoId}'=demo_id::text
    AND record#>>'{published,versionId}'=version_id::text AND jsonb_typeof(record->'reviewGate')='object'
    AND jsonb_typeof(record->'cancelled')='boolean',false))
);
CREATE INDEX assignments_version_idx ON ua_private.assignments(version_id);
CREATE INDEX assignments_demo_idx ON ua_private.assignments(demo_id,id);
CREATE TABLE ua_private.grants (
  person_id uuid NOT NULL REFERENCES ua_private.memberships(person_id) ON DELETE NO ACTION,
  assignment_id uuid NOT NULL REFERENCES ua_private.assignments(id) ON DELETE NO ACTION,
  rostered boolean NOT NULL, grant_epoch ua_private.safe_counter NOT NULL,
  PRIMARY KEY(person_id,assignment_id)
);
CREATE INDEX grants_assignment_idx ON ua_private.grants(assignment_id,person_id);
CREATE TABLE ua_private.exam_series (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  demo_id uuid NOT NULL REFERENCES ua_private.demos(id) ON DELETE NO ACTION,
  id uuid NOT NULL UNIQUE, current_attempt_id uuid NOT NULL,
  generation ua_private.safe_counter NOT NULL CHECK (generation>0),
  state_revision ua_private.safe_counter NOT NULL, normal_attempt_used boolean NOT NULL,
  official_attempt_id uuid, recovery_state text COLLATE "C" NOT NULL CHECK (recovery_state IN ('none','ready','active','lapsed')),
  recovery_window jsonb,
  PRIMARY KEY(person_id,demo_id),
  -- Accepted lapse retains its historical window. Do not erase it to satisfy DDL.
  CHECK (COALESCE((recovery_state IN ('ready','active') AND jsonb_typeof(recovery_window)='object') OR
    (recovery_state='none' AND (recovery_window IS NULL OR recovery_window='null'::jsonb)) OR
    (recovery_state='lapsed' AND (recovery_window IS NULL OR recovery_window='null'::jsonb OR jsonb_typeof(recovery_window)='object')),false))
);
CREATE TABLE ua_private.attempts (
  id uuid PRIMARY KEY, person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  assignment_id uuid NOT NULL, demo_id uuid NOT NULL,
  generation ua_private.safe_counter NOT NULL CHECK (generation>0),
  state_revision ua_private.safe_counter NOT NULL, body jsonb NOT NULL,
  frozen_test jsonb NOT NULL, question_order jsonb NOT NULL,
  UNIQUE(person_id,demo_id,generation), UNIQUE(id,person_id), UNIQUE(id,person_id,demo_id), UNIQUE(id,person_id,demo_id,generation),
  FOREIGN KEY(assignment_id,demo_id) REFERENCES ua_private.assignments(id,demo_id) ON DELETE NO ACTION,
  FOREIGN KEY(person_id,demo_id) REFERENCES ua_private.exam_series(person_id,demo_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  CHECK (COALESCE(jsonb_typeof(body)='object' AND body->>'id'=id::text AND body->>'personId'=person_id::text
    AND body->>'assignmentId'=assignment_id::text AND body->>'generation'=generation::text AND body->>'stateRevision'=state_revision::text
    AND body->>'status' IN ('in_progress','submitted','expired','forced','cancelled')
    AND body ?& ARRAY['groupId','startedAt','deadlineAt','completedAt','seriesStateRevision']
    AND jsonb_typeof(body->'startedAt')='number' AND jsonb_typeof(body->'deadlineAt')='number'
    AND jsonb_typeof(body->'seriesStateRevision')='number' AND jsonb_typeof(body->'generation')='number'
    AND jsonb_typeof(body->'stateRevision')='number'
    AND (jsonb_typeof(body->'completedAt')='number' OR body->'completedAt'='null'::jsonb)
    AND jsonb_typeof(frozen_test)='object' AND frozen_test->>'demoId'=demo_id::text
    AND jsonb_typeof(question_order)='array',false)),
  CHECK ((body->>'startedAt')::ua_private.ms_time < (body->>'deadlineAt')::ua_private.ms_time),
  CHECK ((body->>'seriesStateRevision')::ua_private.safe_counter >= 0),
  CHECK (body->'completedAt'='null'::jsonb OR (body->>'completedAt')::ua_private.ms_time >= (body->>'startedAt')::ua_private.ms_time),
  CHECK (COALESCE(CASE body->>'status'
    WHEN 'in_progress' THEN body->'completedAt'='null'::jsonb
    WHEN 'expired' THEN body->>'completedAt'=body->>'deadlineAt'
    WHEN 'submitted' THEN (body->>'completedAt')::bigint < (body->>'deadlineAt')::bigint
    ELSE true END,false))
);
CREATE INDEX attempts_assignment_person_idx ON ua_private.attempts(assignment_id,person_id);
ALTER TABLE ua_private.exam_series ADD CONSTRAINT series_current_attempt_fk
  FOREIGN KEY(current_attempt_id,person_id,demo_id,generation) REFERENCES ua_private.attempts(id,person_id,demo_id,generation) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ua_private.exam_series ADD CONSTRAINT series_official_attempt_fk
  FOREIGN KEY(official_attempt_id,person_id,demo_id) REFERENCES ua_private.attempts(id,person_id,demo_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ua_private.answers (
  attempt_id uuid NOT NULL REFERENCES ua_private.attempts(id) ON DELETE NO ACTION,
  question_id uuid NOT NULL, selected_option_id uuid,
  revision ua_private.safe_counter NOT NULL CHECK (revision>0),
  saved_at_ms ua_private.ms_time NOT NULL, series_state_revision ua_private.safe_counter NOT NULL,
  PRIMARY KEY(attempt_id,question_id)
);
CREATE TABLE ua_private.ordinary_results (
  attempt_id uuid PRIMARY KEY REFERENCES ua_private.attempts(id) ON DELETE NO ACTION,
  exact_result jsonb NOT NULL,
  CHECK (COALESCE(jsonb_typeof(exact_result)='object'
    AND ua_private.ratio_shape(exact_result->'earned') AND ua_private.ratio_shape(exact_result->'maximum')
    AND ua_private.ratio_shape(exact_result->'percentage') AND exact_result ? 'calculatedAt',false)),
  CHECK (CASE WHEN jsonb_typeof(exact_result->'calculatedAt')='number' THEN
    (exact_result->>'calculatedAt')::numeric BETWEEN 0 AND 8640000000000000
    AND trunc((exact_result->>'calculatedAt')::numeric)=(exact_result->>'calculatedAt')::numeric
    ELSE false END)
);
CREATE TABLE ua_private.command_receipts (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  key text COLLATE "C" PRIMARY KEY, payload text NOT NULL,
  attempt_id uuid NOT NULL,
  FOREIGN KEY(attempt_id,person_id) REFERENCES ua_private.attempts(id,person_id) ON DELETE NO ACTION,
  CHECK (left(key,length(person_id::text)+1)=person_id::text||'/')
);
CREATE INDEX command_receipts_person_idx ON ua_private.command_receipts(person_id);
CREATE TABLE ua_private.statistical_bonuses (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  attempt_id uuid PRIMARY KEY,
  record jsonb NOT NULL CHECK (COALESCE(jsonb_typeof(record)='object' AND ua_private.ratio_shape(record->'earned'),false)),
  FOREIGN KEY(attempt_id,person_id) REFERENCES ua_private.attempts(id,person_id) ON DELETE NO ACTION
);
CREATE INDEX bonuses_person_idx ON ua_private.statistical_bonuses(person_id);
CREATE TABLE ua_private.attempt_cancellations (
  person_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  attempt_id uuid PRIMARY KEY,
  record jsonb NOT NULL CHECK (jsonb_typeof(record)='object'),
  FOREIGN KEY(attempt_id,person_id) REFERENCES ua_private.attempts(id,person_id) ON DELETE NO ACTION
);
CREATE INDEX cancellations_person_idx ON ua_private.attempt_cancellations(person_id);
CREATE TABLE ua_private.staff_receipts (
  actor_id uuid NOT NULL REFERENCES ua_private.people(id) ON DELETE NO ACTION,
  key text COLLATE "C" NOT NULL, payload text NOT NULL, response jsonb NOT NULL,
  PRIMARY KEY(actor_id,key), UNIQUE(key),
  CHECK (left(key,length(actor_id::text)+1)=actor_id::text||'/' AND jsonb_typeof(response)='object')
);
CREATE TABLE ua_private.staff_audit (
  command_key text COLLATE "C" PRIMARY KEY, actor_id uuid NOT NULL,
  action text COLLATE "C" NOT NULL, target_id uuid NOT NULL,
  revision ua_private.safe_counter NOT NULL, at_ms ua_private.ms_time NOT NULL,
  FOREIGN KEY(actor_id,command_key) REFERENCES ua_private.staff_receipts(actor_id,key) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX staff_audit_actor_idx ON ua_private.staff_audit(actor_id,at_ms);
ALTER TABLE ua_private.staff_receipts ADD CONSTRAINT staff_receipt_audit_required
  FOREIGN KEY(key) REFERENCES ua_private.staff_audit(command_key) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED;

-- Enforce immutable keys/history and only the monotonic mutations that current
-- query writers issue. This does not implement current staff permission checks.
CREATE FUNCTION ua_private.guard_history() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE b jsonb := to_jsonb(OLD); n jsonb := to_jsonb(NEW);
BEGIN
  IF TG_TABLE_NAME IN ('ordinary_results','command_receipts','staff_receipts','staff_audit',
      'clerk_exchange_replays','init_data_replays','clerk_family_bindings','statistical_bonuses','attempt_cancellations','assignments') THEN
    IF n IS DISTINCT FROM b THEN RAISE EXCEPTION 'immutable history: %',TG_TABLE_NAME USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='student_access' THEN
    IF (n-'superseded') IS DISTINCT FROM (b-'superseded') OR (OLD.superseded AND NOT NEW.superseded) THEN RAISE EXCEPTION 'immutable access binding' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='student_refresh' THEN
    IF (n-'consumed') IS DISTINCT FROM (b-'consumed') OR (OLD.consumed AND NOT NEW.consumed) THEN RAISE EXCEPTION 'immutable refresh binding' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='student_families' THEN
    IF (n-ARRAY['revoked_at_ms','logout_retain_until_ms']) IS DISTINCT FROM (b-ARRAY['revoked_at_ms','logout_retain_until_ms'])
       OR (OLD.revoked_at_ms IS NOT NULL AND n IS DISTINCT FROM b)
       OR (OLD.revoked_at_ms IS NULL AND NEW.revoked_at_ms IS NULL AND NEW.logout_retain_until_ms IS DISTINCT FROM OLD.logout_retain_until_ms) THEN
      RAISE EXCEPTION 'immutable family origin/expiry/first revocation' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='clerk_student_sessions' THEN
    IF (n-'retired_at_ms') IS DISTINCT FROM (b-'retired_at_ms') OR (OLD.retired_at_ms IS NOT NULL AND NEW.retired_at_ms IS DISTINCT FROM OLD.retired_at_ms) THEN
      RAISE EXCEPTION 'immutable provider session/first retirement' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='test_versions' THEN
    IF NEW.id<>OLD.id OR NEW.demo_id<>OLD.demo_id OR NEW.revision<>OLD.revision+1 OR OLD.status<>'draft' OR (OLD.published_snapshot IS NOT NULL AND OLD.published_snapshot<>'null'::jsonb) THEN
      RAISE EXCEPTION 'frozen version/revision' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='attempts' THEN
    IF (n-ARRAY['body','state_revision']) IS DISTINCT FROM (b-ARRAY['body','state_revision'])
      OR (NEW.body-ARRAY['status','completedAt','stateRevision','seriesStateRevision']) IS DISTINCT FROM (OLD.body-ARRAY['status','completedAt','stateRevision','seriesStateRevision'])
      OR NEW.state_revision<>OLD.state_revision+1
      OR (NEW.body->>'seriesStateRevision')::bigint<>(OLD.body->>'seriesStateRevision')::bigint+1
      OR OLD.body->>'status'<>'in_progress' THEN
      RAISE EXCEPTION 'immutable attempt/history or invalid revision' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='exam_series' THEN
    IF NEW.person_id<>OLD.person_id OR NEW.demo_id<>OLD.demo_id OR NEW.id<>OLD.id
      OR (OLD.normal_attempt_used AND NOT NEW.normal_attempt_used) OR NEW.generation<OLD.generation OR NEW.state_revision<OLD.state_revision THEN
      RAISE EXCEPTION 'immutable series identity/global normal usage' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='answers' THEN
    IF NEW.attempt_id<>OLD.attempt_id OR NEW.question_id<>OLD.question_id OR NEW.revision<>OLD.revision+1 THEN
      RAISE EXCEPTION 'immutable answer identity or invalid CAS revision' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $fn$;

CREATE FUNCTION ua_private.check_answer_binding() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE a ua_private.attempts%ROWTYPE; q jsonb;
BEGIN
  SELECT * INTO STRICT a FROM ua_private.attempts WHERE id=NEW.attempt_id;
  IF a.body->>'status'<>'in_progress' THEN RAISE EXCEPTION 'answer on terminal attempt' USING ERRCODE='23514'; END IF;
  SELECT value INTO STRICT q FROM jsonb_array_elements(a.frozen_test->'questions') WHERE value->>'id'=NEW.question_id::text;
  IF NEW.selected_option_id IS NOT NULL AND NOT (q->'optionIds' ? NEW.selected_option_id::text) THEN
    RAISE EXCEPTION 'option outside pinned question' USING ERRCODE='23514'; END IF;
  IF NEW.saved_at_ms >= (a.body->>'deadlineAt')::bigint THEN RAISE EXCEPTION 'answer after deadline' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $fn$;

-- Deferred checks see the final transaction state: person-before-membership,
-- attempt-before-series and Clerk family-before-binding ordering are intentional.
CREATE FUNCTION ua_private.check_membership_projection() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE pid uuid; p ua_private.people%ROWTYPE; m ua_private.memberships%ROWTYPE; expected jsonb;
BEGIN
  IF TG_TABLE_NAME='people' THEN pid:=NEW.id; ELSE pid:=NEW.person_id; END IF;
  SELECT * INTO STRICT p FROM ua_private.people WHERE id=pid;
  SELECT * INTO STRICT m FROM ua_private.memberships WHERE person_id=pid;
  expected:=CASE WHEN m.active THEN to_jsonb(m.affinity_group_id::text) ELSE 'null'::jsonb END;
  IF p.profile->'active_group_id' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'profile/membership mismatch' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $fn$;
CREATE FUNCTION ua_private.check_family_projection() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE fid uuid; f ua_private.student_families%ROWTYPE; cnt bigint;
BEGIN
  IF TG_TABLE_NAME='student_families' THEN fid:=NEW.id; ELSE fid:=NEW.family_id; END IF;
  SELECT * INTO STRICT f FROM ua_private.student_families WHERE id=fid;
  SELECT count(*) INTO cnt FROM ua_private.clerk_family_bindings WHERE family_id=fid AND person_id=f.person_id;
  IF (f.auth_provider='clerk' AND cnt<>1) OR (f.auth_provider='telegram' AND cnt<>0) THEN
    RAISE EXCEPTION 'provider family/binding mismatch' USING ERRCODE='23514'; END IF;
  IF EXISTS (SELECT 1 FROM ua_private.student_access WHERE family_id=fid AND expires_at_ms>f.expires_at_ms) THEN
    RAISE EXCEPTION 'access outlives family' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $fn$;
CREATE FUNCTION ua_private.check_access_projection() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE expiry bigint;
BEGIN
  SELECT expires_at_ms INTO STRICT expiry FROM ua_private.student_families WHERE id=NEW.family_id;
  IF NEW.expires_at_ms>expiry THEN RAISE EXCEPTION 'access outlives family' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $fn$;
CREATE FUNCTION ua_private.check_attempt_projection() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE aid uuid; a ua_private.attempts%ROWTYPE; assignment ua_private.assignments%ROWTYPE; has_result boolean; q jsonb; ord jsonb; frozen_options jsonb; ordered_options jsonb;
BEGIN
  IF TG_TABLE_NAME='attempts' THEN aid:=NEW.id; ELSE aid:=NEW.attempt_id; END IF;
  SELECT * INTO STRICT a FROM ua_private.attempts WHERE id=aid;
  SELECT * INTO STRICT assignment FROM ua_private.assignments WHERE id=a.assignment_id;
  IF a.body->>'groupId' IS DISTINCT FROM assignment.group_id::text OR a.frozen_test IS DISTINCT FROM assignment.record->'published' THEN
    RAISE EXCEPTION 'attempt outside frozen assignment binding' USING ERRCODE='23514'; END IF;
  IF jsonb_typeof(a.frozen_test->'questions') IS DISTINCT FROM 'array'
    OR jsonb_typeof(a.frozen_test->'durationMs') IS DISTINCT FROM 'number'
    OR jsonb_typeof(a.frozen_test->'individualEnabled') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'invalid frozen test shape' USING ERRCODE='23514'; END IF;
  IF (a.frozen_test->>'durationMs')::ua_private.safe_counter=0 OR jsonb_array_length(a.frozen_test->'questions')=0
     OR jsonb_array_length(a.question_order)<>jsonb_array_length(a.frozen_test->'questions')
     OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(a.frozen_test->'questions'))<>jsonb_array_length(a.frozen_test->'questions')
     OR (SELECT count(DISTINCT value->>'questionId') FROM jsonb_array_elements(a.question_order))<>jsonb_array_length(a.question_order) THEN
    RAISE EXCEPTION 'frozen question/order set mismatch' USING ERRCODE='23514'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(a.frozen_test->'questions') LOOP
    SELECT value INTO STRICT ord FROM jsonb_array_elements(a.question_order) WHERE value->>'questionId'=q->>'id';
    IF jsonb_typeof(q->'optionIds') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'missing frozen options' USING ERRCODE='23514'; END IF;
    IF jsonb_array_length(q->'optionIds')<>4
      OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(q->'optionIds'))<>4
      OR NOT COALESCE(q->'optionIds' ? (q->>'correctOptionId'),false) THEN
      RAISE EXCEPTION 'invalid frozen option set' USING ERRCODE='23514'; END IF;
    SELECT jsonb_agg(value ORDER BY value) INTO frozen_options FROM jsonb_array_elements(q->'optionIds');
    SELECT jsonb_agg(value ORDER BY value) INTO ordered_options FROM jsonb_array_elements(ord->'optionIds');
    IF ordered_options IS DISTINCT FROM frozen_options THEN RAISE EXCEPTION 'ordered options outside frozen set' USING ERRCODE='23514'; END IF;
  END LOOP;
  SELECT EXISTS(SELECT 1 FROM ua_private.ordinary_results WHERE attempt_id=aid) INTO has_result;
  IF (a.body->>'status'='in_progress' AND has_result)
     OR (a.body->>'status' IN ('submitted','expired') AND NOT has_result) THEN
    RAISE EXCEPTION 'attempt/ordinary invariant' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $fn$;
CREATE FUNCTION ua_private.check_series_projection() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, ua_private
AS $fn$
DECLARE s ua_private.exam_series%ROWTYPE; a ua_private.attempts%ROWTYPE;
BEGIN
  SELECT * INTO STRICT s FROM ua_private.exam_series WHERE person_id=NEW.person_id AND demo_id=NEW.demo_id;
  SELECT * INTO STRICT a FROM ua_private.attempts WHERE id=s.current_attempt_id AND person_id=s.person_id AND demo_id=s.demo_id AND generation=s.generation;
  IF s.state_revision<>(a.body->>'seriesStateRevision')::bigint THEN RAISE EXCEPTION 'current series revision mismatch' USING ERRCODE='23514'; END IF;
  IF s.official_attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ua_private.ordinary_results WHERE attempt_id=s.official_attempt_id) THEN
    RAISE EXCEPTION 'official pointer without ordinary result' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $fn$;

CREATE TRIGGER answer_binding BEFORE INSERT OR UPDATE ON ua_private.answers FOR EACH ROW EXECUTE FUNCTION ua_private.check_answer_binding();
CREATE CONSTRAINT TRIGGER people_membership_projection AFTER INSERT OR UPDATE ON ua_private.people DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_membership_projection();
CREATE CONSTRAINT TRIGGER membership_profile_projection AFTER INSERT OR UPDATE ON ua_private.memberships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_membership_projection();
CREATE CONSTRAINT TRIGGER family_binding_projection AFTER INSERT OR UPDATE ON ua_private.student_families DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_family_projection();
CREATE CONSTRAINT TRIGGER binding_family_projection AFTER INSERT OR UPDATE ON ua_private.clerk_family_bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_family_projection();
CREATE CONSTRAINT TRIGGER access_family_projection AFTER INSERT OR UPDATE ON ua_private.student_access DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_access_projection();
CREATE CONSTRAINT TRIGGER attempt_ordinary_projection AFTER INSERT OR UPDATE ON ua_private.attempts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_attempt_projection();
CREATE CONSTRAINT TRIGGER ordinary_attempt_projection AFTER INSERT OR UPDATE ON ua_private.ordinary_results DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_attempt_projection();
CREATE CONSTRAINT TRIGGER current_series_projection AFTER INSERT OR UPDATE ON ua_private.exam_series DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_series_projection();
-- Revalidate the final current-series projection when an attempt changes too.
-- Deferred timing allows accepted attempt-before-series insert/flush ordering.
CREATE CONSTRAINT TRIGGER attempt_current_series_projection AFTER INSERT OR UPDATE ON ua_private.attempts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ua_private.check_series_projection();

DO $history_triggers$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ordinary_results','command_receipts','staff_receipts','staff_audit',
    'clerk_exchange_replays','init_data_replays','clerk_family_bindings','statistical_bonuses','attempt_cancellations',
    'assignments','student_access','student_refresh','student_families','clerk_student_sessions',
    'test_versions','attempts','exam_series','answers'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_history BEFORE UPDATE ON ua_private.%I FOR EACH ROW EXECUTE FUNCTION ua_private.guard_history()',t);
  END LOOP;
END $history_triggers$;

-- Runtime remains deliberately INACTIVE. No login/membership, no table/schema
-- grants, and no allow policy are created. GUC values are not a security token.
-- The owner has FORCE RLS too; future seed/cleanup needs exact separate approval.
DO $rls$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='ua_private' AND c.relkind='r' LOOP
    EXECUTE format('ALTER TABLE ua_private.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE ua_private.%I FORCE ROW LEVEL SECURITY',t);
  END LOOP;
END $rls$;
REVOKE ALL ON ALL TABLES IN SCHEMA ua_private FROM PUBLIC, anon, authenticated, service_role, ua_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ua_private FROM PUBLIC, anon, authenticated, service_role, ua_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ua_private FROM PUBLIC, anon, authenticated, service_role, ua_runtime;
REVOKE ALL ON SCHEMA ua_private FROM PUBLIC, anon, authenticated, service_role, ua_runtime;
-- No public schema changes, managed-schema writes, extension install, provider
-- actions, credential, seed, runtime activation, DELETE, TRUNCATE or CASCADE.
-- Even after removing the guard, this review artifact ends with ROLLBACK.
-- BEGIN MANAGED-OPERATOR OWNER CLEANUP ADDITION
SET LOCAL ROLE NONE;
-- A future separately approved single transaction may insert the exact reviewed
-- activation and registration bodies HERE, before this membership is revoked.
-- No such bodies are included or executed by this baseline-only derivative.
-- Standalone r3 activation still needs its owner-authority prerequisite, and
-- its no-runtime-membership check conflicts with the implicit creator ADMIN
-- grant. This artifact does not relax that unresolved activation prerequisite.
REVOKE ua_owner FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;
DO $bootstrap_owner_closed$ BEGIN
  IF current_user IS DISTINCT FROM session_user
    OR pg_catalog.pg_has_role(current_user,'ua_owner','SET')
    OR pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m
      WHERE m.roleid='ua_owner'::regrole AND m.member=current_user::regrole
        AND m.grantor=current_user::regrole)
    OR pg_catalog.pg_has_role(current_user,'ua_runtime','SET')
    OR pg_catalog.pg_has_role(current_user,'ua_runtime','USAGE')
    OR pg_catalog.pg_has_role('ua_runtime','ua_owner','MEMBER')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles
      WHERE rolname IN ('ua_owner','ua_runtime')
        AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolinherit OR rolcreaterole OR rolcreatedb OR rolreplication)) THEN
    RAISE EXCEPTION 'TEMPORARY_OWNER_AUTHORITY_SURVIVED' USING ERRCODE='42501';
  END IF;
END $bootstrap_owner_closed$;
-- Implicit creator ADMIN-only grants are not temporary SET/INHERIT privileges.
-- Their removal is not claimed; their activation-r3 conflict is an open gate.
-- END MANAGED-OPERATOR OWNER CLEANUP ADDITION
ROLLBACK;
