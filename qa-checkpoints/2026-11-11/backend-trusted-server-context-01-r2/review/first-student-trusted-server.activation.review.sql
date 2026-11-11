-- FIRST-STUDENT TRUSTED-SERVER / INACTIVE REVIEW TEXT / NOT COMPILED OR EXECUTED.
-- Derived ONLY from frozen SQL A34366/SHA2563a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4.
-- Frozen SQL A/B and historical canonical observations are unchanged. This derivative
-- intentionally changes catalog identities; old catalog pins are not new acceptance.
-- Conventional boundary: the server asserts transaction-local scope after verifying
-- current request/session authority. GUCs do NOT authenticate stolen DB credentials.
-- No credentials, LOGIN membership, signature extension, service_role or BYPASSRLS.
-- A future packet needs exact SQL/source/policy review, operator authority, current
-- preflight, compilation and positive/negative RLS tests plus separate run approval.
DO $review_guard$ BEGIN
  RAISE EXCEPTION 'REVIEW_ONLY_FIRST_STUDENT_TRUSTED_SERVER_NOT_AUTHORIZED';
END $review_guard$;
BEGIN;
SET LOCAL search_path = pg_catalog, ua_private;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- P2-CTX-01: require the managed-operator authority explicitly; do not use a
-- superuser success as evidence. A true cluster superuser bypasses ALTER OWNER's
-- SET-role/schema-CREATE checks and would mask this prerequisite.
-- The authenticated operator must already inherit ua_owner privileges, be able
-- to SET ROLE ua_owner, own no helper role beforehand, and hold CREATEROLE.
-- No owner membership or operator attribute is provisioned by this artifact.
-- Require empty createrole_self_grant so PostgreSQL's implicit ADMIN-only creator
-- membership has SET/INHERIT false. The explicit self-grant below is separately
-- attributable and removable; no server/role setting is changed here.
DO $transfer_operator$ BEGIN
  IF current_user IS DISTINCT FROM session_user
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND (NOT rolcreaterole OR rolsuper))
    OR NOT pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')
    OR NOT pg_catalog.pg_has_role(session_user,'ua_owner','SET')
    OR current_setting('createrole_self_grant') IS DISTINCT FROM ''
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='ua_private' AND nspowner='ua_owner'::regrole) THEN
    RAISE EXCEPTION 'MANAGED_OPERATOR_AUTHORITY_REQUIRED' USING ERRCODE='42501';
  END IF;
END $transfer_operator$;
-- Operator must have reviewed authority to create roles/functions/policies and assign
-- ownership; no existing role/object is adopted. Runtime stays nonowner/NOLOGIN.
DO $roles$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='ua_runtime' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin AND NOT rolinherit AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.member OR r.oid=m.roleid WHERE r.rolname='ua_runtime') THEN
    RAISE EXCEPTION 'UNEXPECTED_RUNTIME_ROLE_OR_MEMBERSHIP';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ua_private' AND c.relkind='r')<>30
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ua_private')
    OR pg_catalog.has_schema_privilege('ua_runtime','ua_private','USAGE,CREATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace JOIN pg_catalog.pg_roles o ON o.oid=c.relowner
      WHERE n.nspname='ua_private' AND c.relkind='r' AND (o.rolname<>'ua_owner' OR NOT c.relrowsecurity OR NOT c.relforcerowsecurity
        OR pg_catalog.has_table_privilege('ua_runtime',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
        OR pg_catalog.has_any_column_privilege('ua_runtime',c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) THEN
    RAISE EXCEPTION 'EXPECTED_INACTIVE_DEFAULT_DENY_BASELINE';
  END IF;
END $roles$;
CREATE ROLE ua_access_locator_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ua_person_lock_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ua_clerk_lock_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE ua_invariant_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA ua_private TO ua_runtime,ua_access_locator_owner,ua_person_lock_owner,ua_clerk_lock_owner,ua_invariant_owner;
-- No CREATE schema privilege or owner-role membership is granted to runtime.
GRANT USAGE ON DOMAIN ua_private.safe_counter,ua_private.ms_time,ua_private.proof_digest TO ua_runtime,ua_invariant_owner;

-- Ownership-transfer window ONLY. New function owners need schema CREATE;
-- the operator needs SET to transfer and inherited ownership to finish each
-- function's existing SECURITY/ACL statements after transfer. No ADMIN option
-- is added. All explicit grants in this window are revoked below, before the
-- runtime-policy section. No application request is run in this transaction.
GRANT CREATE ON SCHEMA ua_private TO ua_access_locator_owner,ua_person_lock_owner,ua_clerk_lock_owner,ua_invariant_owner;
GRANT ua_access_locator_owner,ua_person_lock_owner,ua_clerk_lock_owner,ua_invariant_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;
DO $transfer_ready$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['ua_access_locator_owner','ua_person_lock_owner','ua_clerk_lock_owner','ua_invariant_owner'] LOOP
    IF NOT pg_catalog.has_schema_privilege(target,'ua_private','CREATE')
      OR NOT pg_catalog.pg_has_role(current_user,target,'SET')
      OR NOT pg_catalog.pg_has_role(current_user,target,'USAGE') THEN
      RAISE EXCEPTION 'OWNERSHIP_TRANSFER_AUTHORITY_MISSING' USING ERRCODE='42501';
    END IF;
  END LOOP;
END $transfer_ready$;

-- Helper owners have complete, narrowly scoped visibility despite FORCE RLS.
GRANT SELECT(digest,family_id) ON ua_private.student_access TO ua_access_locator_owner;
GRANT SELECT(id,person_id) ON ua_private.student_families TO ua_access_locator_owner;
CREATE POLICY locator_access_read ON ua_private.student_access FOR SELECT TO ua_access_locator_owner USING(true);
CREATE POLICY locator_family_read ON ua_private.student_families FOR SELECT TO ua_access_locator_owner USING(true);
GRANT SELECT(id),UPDATE(enabled) ON ua_private.people TO ua_person_lock_owner;
CREATE POLICY person_lock_read ON ua_private.people FOR SELECT TO ua_person_lock_owner USING(true);
CREATE POLICY person_lock_rowmark ON ua_private.people FOR UPDATE TO ua_person_lock_owner USING(true) WITH CHECK(false);
GRANT SELECT(issuer,subject,person_id,enabled),UPDATE(enabled) ON ua_private.clerk_identities TO ua_clerk_lock_owner;
CREATE POLICY clerk_lock_read ON ua_private.clerk_identities FOR SELECT TO ua_clerk_lock_owner USING(true);
CREATE POLICY clerk_lock_rowmark ON ua_private.clerk_identities FOR UPDATE TO ua_clerk_lock_owner USING(true) WITH CHECK(false);
-- UPDATE(enabled) exists only on inaccessible lock owners to permit row marks.
-- There is no UPDATE statement in either helper; WITH CHECK(false) also rejects
-- actual owner-row changes. No ordinary runtime UPDATE on people/identities.

-- Use the frozen creator-specific defaults, not an unknown operator default ACL.
SET LOCAL ROLE ua_owner;
CREATE FUNCTION ua_private.locate_student_access(p_digest text) RETURNS TABLE(person_id uuid)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, ua_private
AS $fn$ BEGIN
  IF NOT COALESCE(length(p_digest)=64 AND p_digest ~ '^[0-9a-f]{64}$',false)
    OR current_setting('ua.phase',true) IS DISTINCT FROM 'auth'
    OR current_setting('ua.person_id',true) IS DISTINCT FROM ''
    OR current_setting('ua.person_ids',true) IS DISTINCT FROM '[]'
    OR current_setting('ua.clerk_issuer',true) IS DISTINCT FROM ''
    OR current_setting('ua.clerk_subject',true) IS DISTINCT FROM ''
    OR current_setting('ua.telegram_id',true) IS DISTINCT FROM '' THEN
    RAISE EXCEPTION 'INVALID_ACCESS_LOCATOR_SCOPE' USING ERRCODE='42501';
  END IF;
  -- Hint only, INCLUDING expired/superseded/revoked relationships. Current
  -- authorization happens under person locks in the trusted application.
  RETURN QUERY SELECT f.person_id FROM ua_private.student_access a
    JOIN ua_private.student_families f ON f.id=a.family_id WHERE a.digest=p_digest;
END $fn$;
SET LOCAL ROLE NONE;
ALTER FUNCTION ua_private.locate_student_access(text) OWNER TO ua_access_locator_owner;
REVOKE ALL ON FUNCTION ua_private.locate_student_access(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ua_private.locate_student_access(text) TO ua_runtime;

-- Use the frozen creator-specific defaults, not an unknown operator default ACL.
SET LOCAL ROLE ua_owner;
CREATE FUNCTION ua_private.lock_people(p_person_ids uuid[]) RETURNS TABLE(id uuid)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, ua_private
AS $fn$ BEGIN
  IF p_person_ids IS NULL OR cardinality(p_person_ids)=0 OR array_ndims(p_person_ids)<>1
    OR array_position(p_person_ids,NULL) IS NOT NULL
    OR p_person_ids IS DISTINCT FROM ARRAY(SELECT DISTINCT v.pid FROM unnest(p_person_ids) AS v(pid) ORDER BY v.pid)
    OR current_setting('ua.phase',true) IS DISTINCT FROM 'auth'
    OR current_setting('ua.telegram_id',true) IS DISTINCT FROM ''
    OR current_setting('ua.person_id',true) IS NULL
    OR current_setting('ua.person_ids',true) IS NULL
    OR current_setting('ua.clerk_issuer',true) IS NULL OR current_setting('ua.clerk_subject',true) IS NULL THEN
    RAISE EXCEPTION 'INVALID_PERSON_LOCK_SCOPE' USING ERRCODE='42501';
  END IF;
  IF current_setting('ua.person_ids',true)::jsonb IS DISTINCT FROM to_jsonb(p_person_ids)
    OR current_setting('ua.person_id',true) IS DISTINCT FROM CASE WHEN cardinality(p_person_ids)=1 THEN p_person_ids[1]::text ELSE '' END
    OR NOT ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='')
      OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
        AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]')) THEN
    RAISE EXCEPTION 'INVALID_PERSON_LOCK_SCOPE' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT p.id FROM ua_private.people p WHERE p.id=ANY(p_person_ids) ORDER BY p.id FOR UPDATE OF p;
END $fn$;
SET LOCAL ROLE NONE;
ALTER FUNCTION ua_private.lock_people(uuid[]) OWNER TO ua_person_lock_owner;
REVOKE ALL ON FUNCTION ua_private.lock_people(uuid[]) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ua_private.lock_people(uuid[]) TO ua_runtime;

-- Use the frozen creator-specific defaults, not an unknown operator default ACL.
SET LOCAL ROLE ua_owner;
CREATE FUNCTION ua_private.lock_clerk_identity(p_issuer text,p_subject text) RETURNS TABLE(person_id uuid,enabled boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, ua_private
AS $fn$ BEGIN
  IF NOT COALESCE(p_issuer ~ '^https://[^/[:space:]]+$' AND p_subject ~ '^user_[A-Za-z0-9]+$' AND p_subject !~ '[[:space:]]',false)
    OR current_setting('ua.phase',true) IS DISTINCT FROM 'auth'
    OR current_setting('ua.person_id',true) IS DISTINCT FROM '' OR current_setting('ua.person_ids',true) IS DISTINCT FROM '[]'
    OR current_setting('ua.clerk_issuer',true) COLLATE "C" IS DISTINCT FROM p_issuer COLLATE "C"
    OR current_setting('ua.clerk_subject',true) COLLATE "C" IS DISTINCT FROM p_subject COLLATE "C"
    OR current_setting('ua.telegram_id',true) IS DISTINCT FROM '' THEN
    RAISE EXCEPTION 'INVALID_CLERK_LOCK_SCOPE' USING ERRCODE='42501';
  END IF;
  -- Disabled mappings are returned, not hidden as absent. No create/reassignment.
  RETURN QUERY SELECT c.person_id,c.enabled FROM ua_private.clerk_identities c
    WHERE c.issuer=p_issuer COLLATE "C" AND c.subject=p_subject COLLATE "C" FOR UPDATE OF c;
END $fn$;
SET LOCAL ROLE NONE;
ALTER FUNCTION ua_private.lock_clerk_identity(text,text) OWNER TO ua_clerk_lock_owner;
REVOKE ALL ON FUNCTION ua_private.lock_clerk_identity(text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION ua_private.lock_clerk_identity(text,text) TO ua_runtime;

-- All six cross-row invariant helpers must see COMPLETE related-row sets. Their
-- exact frozen bodies/search paths stay unchanged; only owner/definer changes.
-- No broad invariant-read grant or helper-owner membership is given to runtime.
GRANT SELECT ON ua_private.people TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.people FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.memberships TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.memberships FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.student_families TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.student_families FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.clerk_family_bindings TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.clerk_family_bindings FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.student_access TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.student_access FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.attempts TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.attempts FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.assignments TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.assignments FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.ordinary_results TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.ordinary_results FOR SELECT TO ua_invariant_owner USING(true);
GRANT SELECT ON ua_private.exam_series TO ua_invariant_owner;
CREATE POLICY invariant_complete_read ON ua_private.exam_series FOR SELECT TO ua_invariant_owner USING(true);
ALTER FUNCTION ua_private.check_answer_binding() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_answer_binding() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_answer_binding() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_answer_binding() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
ALTER FUNCTION ua_private.check_membership_projection() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_membership_projection() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_membership_projection() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_membership_projection() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
ALTER FUNCTION ua_private.check_family_projection() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_family_projection() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_family_projection() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_family_projection() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
ALTER FUNCTION ua_private.check_access_projection() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_access_projection() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_access_projection() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_access_projection() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
ALTER FUNCTION ua_private.check_attempt_projection() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_attempt_projection() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_attempt_projection() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_attempt_projection() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
ALTER FUNCTION ua_private.check_series_projection() OWNER TO ua_invariant_owner;
ALTER FUNCTION ua_private.check_series_projection() SECURITY DEFINER;
ALTER FUNCTION ua_private.check_series_projection() SET search_path = pg_catalog, ua_private;
REVOKE ALL ON FUNCTION ua_private.check_series_projection() FROM PUBLIC,anon,authenticated,service_role,ua_runtime;
-- Close the transfer window before introducing any runtime domain policies.
REVOKE CREATE ON SCHEMA ua_private FROM ua_access_locator_owner,ua_person_lock_owner,ua_clerk_lock_owner,ua_invariant_owner;
REVOKE ua_access_locator_owner,ua_person_lock_owner,ua_clerk_lock_owner,ua_invariant_owner FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;
-- PostgreSQL's implicit ADMIN-only creator membership is unchanged from CREATE
-- ROLE itself, with SET/INHERIT false by the checked precondition. The trusted
-- CREATEROLE operator remains an administrator, not an application principal.
-- There is no enduring SET/INHERIT or schema CREATE for these helper roles.
DO $transfer_closed$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['ua_access_locator_owner','ua_person_lock_owner','ua_clerk_lock_owner','ua_invariant_owner'] LOOP
    IF pg_catalog.has_schema_privilege(target,'ua_private','CREATE')
      OR pg_catalog.pg_has_role(current_user,target,'SET')
      OR pg_catalog.pg_has_role(current_user,target,'USAGE')
      OR pg_catalog.pg_has_role('ua_runtime',target,'MEMBER') THEN
      RAISE EXCEPTION 'OWNERSHIP_TRANSFER_PRIVILEGE_SURVIVED' USING ERRCODE='42501';
    END IF;
  END LOOP;
  IF pg_catalog.has_schema_privilege('ua_runtime','ua_private','CREATE') THEN
    RAISE EXCEPTION 'RUNTIME_CREATE_PRIVILEGE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
END $transfer_closed$;
GRANT EXECUTE ON FUNCTION ua_private.ratio_shape(jsonb),ua_private.guard_history() TO ua_runtime;
-- The trigger helpers are callable as triggers only, not as arbitrary table APIs.

-- Ordinary access is phase+person bound. All six keys must exist; invalid JSON
-- errors also deny rather than fall back. No absent/malformed value grants rows.
-- Single person in this first-flow policy; broader staff/removal is not activated.
GRANT SELECT ON ua_private.people TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.people FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.memberships TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.memberships FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.clerk_identities TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.clerk_identities FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.clerk_student_sessions TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.clerk_student_sessions FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.student_families TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.student_families FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.clerk_family_bindings TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.clerk_family_bindings FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.clerk_exchange_replays TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.clerk_exchange_replays FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.init_data_replays TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.init_data_replays FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.student_access TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.student_access FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
GRANT SELECT ON ua_private.student_refresh TO ua_runtime;
CREATE POLICY student_auth_read ON ua_private.student_refresh FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) IN ('auth','domain','exchange')) AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
GRANT SELECT ON ua_private.grants TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.grants FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.assignments TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.assignments FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.grants g WHERE g.assignment_id=assignments.id AND g.person_id::text=current_setting('ua.person_id',true)) OR EXISTS(SELECT 1 FROM ua_private.attempts t WHERE t.assignment_id=assignments.id AND t.person_id::text=current_setting('ua.person_id',true))));
GRANT SELECT ON ua_private.exam_series TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.exam_series FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.attempts TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.attempts FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.answers TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.answers FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true))));
GRANT SELECT ON ua_private.ordinary_results TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.ordinary_results FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true))));
GRANT SELECT ON ua_private.command_receipts TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.command_receipts FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.statistical_bonuses TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.statistical_bonuses FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT SELECT ON ua_private.attempt_cancellations TO ua_runtime;
CREATE POLICY student_domain_read ON ua_private.attempt_cancellations FOR SELECT TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT INSERT,UPDATE(body,state_revision) ON ua_private.attempts TO ua_runtime;
CREATE POLICY student_domain_insert ON ua_private.attempts FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
CREATE POLICY student_domain_update ON ua_private.attempts FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true))) WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT INSERT,UPDATE(current_attempt_id,generation,state_revision,normal_attempt_used,official_attempt_id,recovery_state,recovery_window) ON ua_private.exam_series TO ua_runtime;
CREATE POLICY student_domain_insert ON ua_private.exam_series FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
CREATE POLICY student_domain_update ON ua_private.exam_series FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true))) WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT INSERT,UPDATE(selected_option_id,revision,saved_at_ms,series_state_revision) ON ua_private.answers TO ua_runtime;
CREATE POLICY student_domain_insert ON ua_private.answers FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true))));
CREATE POLICY student_domain_update ON ua_private.answers FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true)))) WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true))));
GRANT INSERT ON ua_private.ordinary_results TO ua_runtime;
CREATE POLICY student_domain_insert ON ua_private.ordinary_results FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.attempts a WHERE a.id=attempt_id AND a.person_id::text=current_setting('ua.person_id',true))));
GRANT INSERT ON ua_private.command_receipts TO ua_runtime;
CREATE POLICY student_domain_insert ON ua_private.command_receipts FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'domain') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
-- Existing mapped Clerk session exchange only. No people/identity INSERT or
-- UPDATE permission: absent mappings cannot provision accounts under this packet.
-- Profile editing, Telegram login/refresh/logout and staff/removal remain outside
-- this first-flow activation, even though their source adapters remain present.
GRANT INSERT ON ua_private.student_families TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.student_families FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND auth_provider='clerk'));
GRANT INSERT ON ua_private.clerk_student_sessions TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.clerk_student_sessions FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND issuer=current_setting('ua.clerk_issuer',true) COLLATE "C" AND subject=current_setting('ua.clerk_subject',true) COLLATE "C"));
GRANT INSERT ON ua_private.clerk_family_bindings TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.clerk_family_bindings FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND issuer=current_setting('ua.clerk_issuer',true) COLLATE "C" AND subject=current_setting('ua.clerk_subject',true) COLLATE "C"));
GRANT INSERT ON ua_private.clerk_exchange_replays TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.clerk_exchange_replays FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true)));
GRANT INSERT ON ua_private.student_access TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.student_access FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
GRANT INSERT ON ua_private.student_refresh TO ua_runtime;
CREATE POLICY student_exchange_insert ON ua_private.student_refresh FOR INSERT TO ua_runtime WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
GRANT UPDATE(revoked_at_ms,logout_retain_until_ms) ON ua_private.student_families TO ua_runtime;
CREATE POLICY student_exchange_update ON ua_private.student_families FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND auth_provider='clerk')) WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND auth_provider='clerk'));
GRANT UPDATE(retired_at_ms) ON ua_private.clerk_student_sessions TO ua_runtime;
CREATE POLICY student_exchange_update ON ua_private.clerk_student_sessions FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND issuer=current_setting('ua.clerk_issuer',true) COLLATE "C" AND subject=current_setting('ua.clerk_subject',true) COLLATE "C")) WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (person_id::text=current_setting('ua.person_id',true) AND issuer=current_setting('ua.clerk_issuer',true) COLLATE "C" AND subject=current_setting('ua.clerk_subject',true) COLLATE "C"));
GRANT UPDATE(superseded) ON ua_private.student_access TO ua_runtime;
CREATE POLICY student_exchange_update ON ua_private.student_access FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true)))) WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
GRANT UPDATE(consumed) ON ua_private.student_refresh TO ua_runtime;
CREATE POLICY student_exchange_update ON ua_private.student_refresh FOR UPDATE TO ua_runtime USING((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true)))) WITH CHECK((current_setting('ua.phase',true) = 'exchange' AND current_setting('ua.clerk_issuer',true)<>'' AND current_setting('ua.clerk_subject',true)<>'') AND (length(current_setting('ua.person_id',true))=36 AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND current_setting('ua.person_ids',true)::jsonb=jsonb_build_array(current_setting('ua.person_id',true)) AND current_setting('ua.telegram_id',true)='' AND ((current_setting('ua.clerk_issuer',true)='' AND current_setting('ua.clerk_subject',true)='') OR (current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$' AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$' AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'))) AND (EXISTS(SELECT 1 FROM ua_private.student_families f WHERE f.id=family_id AND f.person_id::text=current_setting('ua.person_id',true))));
-- No DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN, identity reassignment,
-- enduring schema CREATE, runtime owner/SET ROLE membership or other-table grants
-- are introduced; the temporary operator ownership-transfer window is closed above.
-- Existing ENABLE+FORCE RLS, checks, immediate/deferred keys, history and CAS
-- triggers stay enabled. Unlisted tables/commands keep default deny.
-- This artifact is inactive even if its guard were removed. Do not substitute it
-- for an independently reviewed, approved executable packet.
ROLLBACK;
