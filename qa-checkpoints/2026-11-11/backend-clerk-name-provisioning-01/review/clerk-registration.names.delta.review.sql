-- CLERK REGISTRATION DELTA / INACTIVE REVIEW TEXT / NOT COMPILED OR EXECUTED.
-- Additive dependency: frozen SQL A34366 SHA2563a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4
-- plus corrected activation r3 at lab4924d64333a4348bfcfa2e632cb6a1d8ccaae6b3,
-- 60365 bytes SHA256165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d.
-- No edit to either dependency. No table, function, role, seed or credential added.
-- The trusted server verifies proof/liveness, takes identity advisory/mapping and
-- person locks, derives all context, and executes person/member/identity inserts
-- atomically. Context is NOT authentication against stolen DB credentials.
-- Source dependency HOLD: accepted PATCH /me remains in auth, not domain, and
-- does not bind Clerk context on its legacy path. Do not allow auth-phase UPDATE
-- to make that source gap pass. A reviewed source correction is required.
DO $registration_review_guard$ BEGIN
  RAISE EXCEPTION 'REVIEW_ONLY_CLERK_REGISTRATION_NOT_AUTHORIZED';
END $registration_review_guard$;
BEGIN;
SET LOCAL search_path = pg_catalog, ua_private;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $registration_preflight$ BEGIN
  IF current_user IS DISTINCT FROM session_user
    OR NOT pg_catalog.pg_has_role(current_user,'ua_owner','SET')
    OR NOT pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='ua_runtime'
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin AND NOT rolinherit
      AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication)
    OR (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='ua_private' AND c.relkind='r') <> 30
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='ua_private' AND c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
    OR pg_catalog.has_any_column_privilege('ua_runtime','ua_private.people','INSERT,UPDATE')
    OR pg_catalog.has_any_column_privilege('ua_runtime','ua_private.memberships','INSERT,UPDATE')
    OR pg_catalog.has_any_column_privilege('ua_runtime','ua_private.clerk_identities','INSERT,UPDATE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ua_private'
      AND p.polname IN ('registration_people_insert','registration_member_insert','registration_identity_insert','registration_profile_update')) THEN
    RAISE EXCEPTION 'EXPECTED_REVIEWED_INACTIVE_REGISTRATION_BASE' USING ERRCODE='42501';
  END IF;
END $registration_preflight$;
SET LOCAL ROLE ua_owner;

-- First verified Clerk exchange creates only an enabled, unregistered student.
GRANT INSERT(id,telegram_id,qadam_id,enabled,roles,profile) ON ua_private.people TO ua_runtime;
CREATE POLICY registration_people_insert ON ua_private.people FOR INSERT TO ua_runtime WITH CHECK(
  current_setting('ua.phase',true) = 'exchange'
  AND current_setting('ua.telegram_id',true) = ''
  AND length(current_setting('ua.person_id',true)) = 36
  AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))
  AND current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$'
  AND current_setting('ua.clerk_issuer',true) !~ '[[:space:]]'
  AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
  AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'
  AND id::text = current_setting('ua.person_id',true)
  AND telegram_id IS NULL AND enabled AND roles = ARRAY['student']::text[]
  AND qadam_id IS NOT NULL AND qadam_id ~ '^[0-9]{10}$'
  AND profile = jsonb_build_object('person_id',id::text,
    'first_name',profile->>'first_name','last_name',profile->>'last_name',
    'roles',to_jsonb(roles),'registration_complete',false,'active_group_id',NULL,'qadam_id',qadam_id)
  AND jsonb_typeof(profile->'first_name') = 'string'
  AND jsonb_typeof(profile->'last_name') = 'string'
  AND char_length(profile->>'first_name') BETWEEN 0 AND 100
  AND char_length(profile->>'last_name') BETWEEN 0 AND 100
);

GRANT INSERT(person_id,active,epoch,revision,affinity_group_id) ON ua_private.memberships TO ua_runtime;
CREATE POLICY registration_member_insert ON ua_private.memberships FOR INSERT TO ua_runtime WITH CHECK(
  current_setting('ua.phase',true) = 'exchange'
  AND current_setting('ua.telegram_id',true) = ''
  AND length(current_setting('ua.person_id',true)) = 36
  AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))
  AND current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$'
  AND current_setting('ua.clerk_issuer',true) !~ '[[:space:]]'
  AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
  AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'
  AND person_id::text = current_setting('ua.person_id',true)
  AND NOT active AND epoch = 0 AND revision = 0 AND affinity_group_id IS NULL
  AND EXISTS(SELECT 1 FROM ua_private.people p
    WHERE p.id = person_id AND p.id::text = current_setting('ua.person_id',true)
      AND p.telegram_id IS NULL AND p.enabled AND p.roles = ARRAY['student']::text[]
      AND p.profile->'registration_complete' = 'false'::jsonb
      AND p.profile->'active_group_id' = 'null'::jsonb
      AND jsonb_typeof(p.profile->'first_name') = 'string'
      AND jsonb_typeof(p.profile->'last_name') = 'string'
      AND char_length(p.profile->>'first_name') BETWEEN 0 AND 100
      AND char_length(p.profile->>'last_name') BETWEEN 0 AND 100
  )
);

-- No reassignment, linking to a registered/mapped person, enabled toggle or repair.
-- Uniqueness rejects an already existing/disabled issuer+subject even if hidden by
-- ordinary RLS. The authoritative lock helper rejects disabled BEFORE provisioning.
GRANT INSERT(issuer,subject,person_id,enabled) ON ua_private.clerk_identities TO ua_runtime;
CREATE POLICY registration_identity_insert ON ua_private.clerk_identities FOR INSERT TO ua_runtime WITH CHECK(
  current_setting('ua.phase',true) = 'exchange'
  AND current_setting('ua.telegram_id',true) = ''
  AND length(current_setting('ua.person_id',true)) = 36
  AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))
  AND current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$'
  AND current_setting('ua.clerk_issuer',true) !~ '[[:space:]]'
  AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
  AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'
  AND person_id::text = current_setting('ua.person_id',true) AND enabled
  AND issuer = current_setting('ua.clerk_issuer',true) COLLATE "C"
  AND subject = current_setting('ua.clerk_subject',true) COLLATE "C"
  AND EXISTS(SELECT 1 FROM ua_private.people p
    WHERE p.id = person_id AND p.id::text = current_setting('ua.person_id',true)
      AND p.telegram_id IS NULL AND p.enabled AND p.roles = ARRAY['student']::text[]
      AND p.profile->'registration_complete' = 'false'::jsonb
      AND p.profile->'active_group_id' = 'null'::jsonb
      AND jsonb_typeof(p.profile->'first_name') = 'string'
      AND jsonb_typeof(p.profile->'last_name') = 'string'
      AND char_length(p.profile->>'first_name') BETWEEN 0 AND 100
      AND char_length(p.profile->>'last_name') BETWEEN 0 AND 100
  )
  AND EXISTS(SELECT 1 FROM ua_private.memberships m WHERE m.person_id = clerk_identities.person_id
    AND NOT m.active AND m.epoch = 0 AND m.revision = 0 AND m.affinity_group_id IS NULL)
  AND NOT EXISTS(SELECT 1 FROM ua_private.clerk_identities c WHERE c.person_id = clerk_identities.person_id)
);

-- Profile completion is a currently authorized domain operation, never an auth
-- preparation write. Immutable profile values are tied to non-writable columns
-- and the unchanged membership projection. Existing deferred triggers remain.
GRANT UPDATE(profile) ON ua_private.people TO ua_runtime;
CREATE POLICY registration_profile_update ON ua_private.people FOR UPDATE TO ua_runtime
USING(
  current_setting('ua.phase',true) = 'domain'
  AND current_setting('ua.telegram_id',true) = ''
  AND length(current_setting('ua.person_id',true)) = 36
  AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))
  AND current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$'
  AND current_setting('ua.clerk_issuer',true) !~ '[[:space:]]'
  AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
  AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'
  AND id::text = current_setting('ua.person_id',true)
  AND enabled AND roles = ARRAY['student']::text[]
  AND EXISTS(SELECT 1 FROM ua_private.clerk_identities c
    WHERE c.person_id = people.id AND c.enabled
      AND c.issuer = current_setting('ua.clerk_issuer',true) COLLATE "C"
      AND c.subject = current_setting('ua.clerk_subject',true) COLLATE "C")
)
WITH CHECK(
  current_setting('ua.phase',true) = 'domain'
  AND current_setting('ua.telegram_id',true) = ''
  AND length(current_setting('ua.person_id',true)) = 36
  AND current_setting('ua.person_id',true) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))
  AND current_setting('ua.clerk_issuer',true) ~ '^https://[^/[:space:]]+$'
  AND current_setting('ua.clerk_issuer',true) !~ '[[:space:]]'
  AND current_setting('ua.clerk_subject',true) ~ '^user_[A-Za-z0-9]+$'
  AND current_setting('ua.clerk_subject',true) !~ '[[:space:]]'
  AND id::text = current_setting('ua.person_id',true)
  AND enabled AND roles = ARRAY['student']::text[]
  AND EXISTS(SELECT 1 FROM ua_private.clerk_identities c
    WHERE c.person_id = people.id AND c.enabled
      AND c.issuer = current_setting('ua.clerk_issuer',true) COLLATE "C"
      AND c.subject = current_setting('ua.clerk_subject',true) COLLATE "C")
  AND profile = jsonb_build_object('person_id',id::text,
    'first_name',profile->>'first_name','last_name',profile->>'last_name',
    'roles',to_jsonb(roles),'registration_complete',true,
    'active_group_id',profile->'active_group_id','qadam_id',qadam_id)
  AND jsonb_typeof(profile->'first_name') = 'string'
  AND jsonb_typeof(profile->'last_name') = 'string'
  AND char_length(profile->>'first_name') BETWEEN 1 AND 100
  AND char_length(profile->>'last_name') BETWEEN 1 AND 100
  AND btrim(profile->>'first_name') <> '' AND btrim(profile->>'last_name') <> ''
  AND EXISTS(SELECT 1 FROM ua_private.memberships m WHERE m.person_id = people.id
    AND profile->'active_group_id' = (CASE WHEN m.active THEN to_jsonb(m.affinity_group_id::text) ELSE 'null'::jsonb END))
);
SET LOCAL ROLE NONE;
DO $registration_acl_closed$ DECLARE t text; a record; BEGIN
  IF pg_catalog.has_table_privilege('ua_runtime','ua_private.people','INSERT,UPDATE')
    OR pg_catalog.has_table_privilege('ua_runtime','ua_private.memberships','INSERT,UPDATE')
    OR pg_catalog.has_table_privilege('ua_runtime','ua_private.clerk_identities','INSERT,UPDATE')
    OR NOT pg_catalog.has_column_privilege('ua_runtime','ua_private.people','profile','UPDATE') THEN
    RAISE EXCEPTION 'REGISTRATION_COLUMN_ACL_REQUIRED' USING ERRCODE='42501';
  END IF;
  FOR a IN SELECT attname FROM pg_catalog.pg_attribute
    WHERE attrelid='ua_private.people'::regclass AND attnum>0 AND NOT attisdropped AND attname<>'profile' LOOP
    IF pg_catalog.has_column_privilege('ua_runtime','ua_private.people',a.attname,'UPDATE') THEN
      RAISE EXCEPTION 'REGISTRATION_IMMUTABLE_COLUMN_WRITABLE' USING ERRCODE='42501';
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['memberships','clerk_identities'] LOOP
    IF pg_catalog.has_any_column_privilege('ua_runtime','ua_private.'||t,'UPDATE') THEN
      RAISE EXCEPTION 'REGISTRATION_IDENTITY_OR_MEMBERSHIP_WRITABLE' USING ERRCODE='42501';
    END IF;
  END LOOP;
END $registration_acl_closed$;
-- No cleanup of unrelated privileges, no owner/runtime LOGIN or membership, no
-- permanent operator grant, no RLS/trigger disabling and no other-table grants.
-- This is NOT an approved executable migration. No live test is claimed.
ROLLBACK;
