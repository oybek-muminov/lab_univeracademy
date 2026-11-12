-- INACTIVE REVIEW DERIVATIVE. NOT a migration or executable activation packet.
-- Review against accepted access locator / activation creator-admin source:
-- 04ef1ddd0316ec9f03a09eec14feae3a326aa1c9, 61,385 bytes,
-- SHA256 3c4ae9ddd436807329d9db298eda42ef9a34af715d74c8d3ded71c1602d4fae4.
-- Frozen baseline, registration/name deltas and 75,031-byte da0a27b6 composition
-- are unchanged. A separately reviewed executable composition is REQUIRED.
-- No SQL compilation/execution has been performed by this author.
-- Prerequisite: verified managed postgres operator and the separately reviewed
-- temporary ua_owner SET/INHERIT window. No superuser/BYPASSRLS runtime shortcut.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
SET LOCAL search_path = pg_catalog, ua_private;
DO $preflight$
DECLARE operator_oid oid; bootstrap_oid oid; helper_oid oid;
BEGIN
  SELECT oid INTO STRICT operator_oid FROM pg_catalog.pg_roles
    WHERE rolname='postgres' AND oid=current_user::regrole AND current_user=session_user
      AND NOT rolsuper AND rolcreaterole AND rolbypassrls;
  SELECT oid INTO STRICT bootstrap_oid FROM pg_catalog.pg_roles
    WHERE oid=10 AND rolname='supabase_admin' AND rolsuper;
  SELECT oid INTO STRICT helper_oid FROM pg_catalog.pg_roles
    WHERE rolname='ua_access_locator_owner' AND NOT rolcanlogin AND NOT rolinherit
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole
      AND NOT rolcreatedb AND NOT rolreplication;
  IF NOT pg_catalog.pg_has_role(current_user,'ua_owner','SET')
    OR NOT pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')
    OR pg_catalog.has_schema_privilege(helper_oid,'ua_private','CREATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE roleid=helper_oid AND grantor=operator_oid)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members WHERE member=helper_oid)
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members WHERE roleid=helper_oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members
      WHERE roleid=helper_oid AND member=operator_oid AND grantor=bootstrap_oid
        AND admin_option AND NOT inherit_option AND NOT set_option)
    OR pg_catalog.to_regprocedure('ua_private.locate_student_refresh(text)') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_policy WHERE polname='locator_refresh_read'
      AND polrelid='ua_private.student_refresh'::regclass)
    OR NOT pg_catalog.has_table_privilege(helper_oid,'ua_private.student_families','SELECT')
       AND NOT (pg_catalog.has_column_privilege(helper_oid,'ua_private.student_families','id','SELECT')
         AND pg_catalog.has_column_privilege(helper_oid,'ua_private.student_families','person_id','SELECT')) THEN
    RAISE EXCEPTION 'REFRESH_LOCATOR_PRECONDITION_FAILED' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='ua_runtime'
    AND NOT rolcanlogin AND NOT rolinherit AND NOT rolsuper AND NOT rolbypassrls
    AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication) THEN
    RAISE EXCEPTION 'REFRESH_LOCATOR_RUNTIME_ROLE_UNSAFE' USING ERRCODE='42501';
  END IF;
END $preflight$;
-- Use the existing inaccessible locator owner, not another credential/role.
-- Creator ADMIN-only membership stays intact; this separately granted row has
-- no ADMIN option and is revoked by its exact grantor before completion.
GRANT CREATE ON SCHEMA ua_private TO ua_access_locator_owner;
GRANT ua_access_locator_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;
GRANT SELECT(digest,family_id) ON ua_private.student_refresh TO ua_access_locator_owner;
CREATE POLICY locator_refresh_read ON ua_private.student_refresh
  FOR SELECT TO ua_access_locator_owner USING(true);
SET LOCAL ROLE ua_owner;
CREATE FUNCTION ua_private.locate_student_refresh(p_digest text) RETURNS TABLE(person_id uuid)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, ua_private
AS $fn$ BEGIN
  IF NOT COALESCE(length(p_digest)=64 AND p_digest ~ '^[0-9a-f]{64}$',false)
    OR current_setting('ua.phase',true) IS DISTINCT FROM 'auth'
    OR current_setting('ua.person_id',true) IS DISTINCT FROM ''
    OR current_setting('ua.person_ids',true) IS DISTINCT FROM '[]'
    OR current_setting('ua.clerk_issuer',true) IS DISTINCT FROM ''
    OR current_setting('ua.clerk_subject',true) IS DISTINCT FROM ''
    OR current_setting('ua.telegram_id',true) IS DISTINCT FROM '' THEN
    RAISE EXCEPTION 'INVALID_REFRESH_LOCATOR_SCOPE' USING ERRCODE='42501';
  END IF;
  -- Hint only, INCLUDING consumed, expired and revoked relationships. This
  -- reveals neither digest/family nor private data. Lock and reauthorize later.
  RETURN QUERY SELECT f.person_id FROM ua_private.student_refresh r
    JOIN ua_private.student_families f ON f.id=r.family_id WHERE r.digest=p_digest;
END $fn$;
SET LOCAL ROLE NONE;
ALTER FUNCTION ua_private.locate_student_refresh(text) OWNER TO ua_access_locator_owner;
REVOKE ALL ON FUNCTION ua_private.locate_student_refresh(text) FROM PUBLIC,anon,authenticated,service_role,ua_owner;
GRANT EXECUTE ON FUNCTION ua_private.locate_student_refresh(text) TO ua_runtime;
REVOKE CREATE ON SCHEMA ua_private FROM ua_access_locator_owner;
REVOKE ua_access_locator_owner FROM CURRENT_USER GRANTED BY CURRENT_USER;
DO $postflight$
DECLARE operator_oid oid:=current_user::regrole; helper_oid oid:='ua_access_locator_owner'::regrole;
BEGIN
  IF pg_catalog.has_schema_privilege(helper_oid,'ua_private','CREATE')
    OR pg_catalog.pg_has_role(current_user,helper_oid,'SET')
    OR pg_catalog.pg_has_role(current_user,helper_oid,'USAGE')
    OR (SELECT count(*) FROM pg_catalog.pg_auth_members WHERE roleid=helper_oid OR member=helper_oid)<>1
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members
      WHERE roleid=helper_oid AND member=operator_oid AND grantor=10
        AND admin_option AND NOT inherit_option AND NOT set_option)
    OR NOT pg_catalog.has_function_privilege('ua_runtime','ua_private.locate_student_refresh(text)','EXECUTE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_proc p,
      LATERAL pg_catalog.aclexplode(COALESCE(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid='ua_private.locate_student_refresh(text)'::regprocedure
        AND (p.proowner<>helper_oid OR a.grantee NOT IN(helper_oid,'ua_runtime'::regrole)
          OR a.privilege_type<>'EXECUTE' OR a.is_grantable)) THEN
    RAISE EXCEPTION 'REFRESH_LOCATOR_FINAL_PRIVILEGES_UNSAFE' USING ERRCODE='42501';
  END IF;
END $postflight$;
-- INACTIVE by construction. An execution packet must replace this only after
-- independent review, exact composition pins and separate run authorization.
ROLLBACK;
