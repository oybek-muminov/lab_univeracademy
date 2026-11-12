"""Static derivative checks only. Never executes SQL or connects to a database."""
from pathlib import Path
import argparse
import difflib
import hashlib
import unittest

OLD_PEOPLE = """  AND profile = jsonb_build_object('person_id',id::text,'first_name','','last_name','',
    'roles',to_jsonb(roles),'registration_complete',false,'active_group_id',NULL,'qadam_id',qadam_id)"""
NEW_PEOPLE = """  AND profile = jsonb_build_object('person_id',id::text,
    'first_name',profile->>'first_name','last_name',profile->>'last_name',
    'roles',to_jsonb(roles),'registration_complete',false,'active_group_id',NULL,'qadam_id',qadam_id)
  AND jsonb_typeof(profile->'first_name') = 'string'
  AND jsonb_typeof(profile->'last_name') = 'string'
  AND char_length(profile->>'first_name') BETWEEN 0 AND 100
  AND char_length(profile->>'last_name') BETWEEN 0 AND 100"""
OLD_COMPANION = "      AND p.profile->>'first_name' = '' AND p.profile->>'last_name' = ''"
NEW_COMPANION = """      AND jsonb_typeof(p.profile->'first_name') = 'string'
      AND jsonb_typeof(p.profile->'last_name') = 'string'
      AND char_length(p.profile->>'first_name') BETWEEN 0 AND 100
      AND char_length(p.profile->>'last_name') BETWEEN 0 AND 100"""
PIN = "8ae3afbd90b5e079dbf5b35513414263cf3174f8547fc27c3ac717a801e738ae"


class StaticChecks(unittest.TestCase):
    def test_01_original_identity(self):
        self.assertEqual(len(original), 12176)
        self.assertEqual(hashlib.sha256(original).hexdigest(), PIN)

    def test_02_exact_inverse_is_original(self):
        self.assertEqual(candidate.count(NEW_PEOPLE), 1)
        self.assertEqual(candidate.count(NEW_COMPANION), 2)
        inverse = candidate.replace(NEW_PEOPLE, OLD_PEOPLE).replace(NEW_COMPANION, OLD_COMPANION)
        self.assertEqual(inverse.encode(), original)

    def test_03_only_three_insert_predicates(self):
        labels = ["registration_people_insert", "registration_member_insert", "registration_identity_insert"]
        for label, fragment in zip(labels, [NEW_PEOPLE, NEW_COMPANION, NEW_COMPANION]):
            block = candidate.split("CREATE POLICY " + label + " ON ", 1)[1].split("\n);", 1)[0]
            self.assertIn(" FOR INSERT TO ua_runtime WITH CHECK(", block)
            self.assertIn(fragment, block)
            self.assertIn("current_setting('ua.phase',true) = 'exchange'", block)
            self.assertIn("current_setting('ua.person_ids',true)::jsonb = jsonb_build_array(current_setting('ua.person_id',true))", block)
            self.assertIn("current_setting('ua.clerk_subject',true)", block)

    def test_04_profile_update_and_grants_unchanged(self):
        marker = "-- Profile completion is a currently authorized domain operation"
        self.assertEqual(candidate.split(marker, 1)[1], original.decode().split(marker, 1)[1])
        grants = lambda s: [line for line in s.splitlines() if line.startswith("GRANT ")]
        self.assertEqual(grants(candidate), grants(original.decode()))
        self.assertIn("GRANT UPDATE(profile) ON ua_private.people TO ua_runtime;", candidate)

    def test_05_review_guard_and_atomic_student_graph_retained(self):
        self.assertIn("RAISE EXCEPTION 'REVIEW_ONLY_CLERK_REGISTRATION_NOT_AUTHORIZED';", candidate)
        self.assertTrue(candidate.endswith("ROLLBACK;\n"))
        self.assertIn("telegram_id IS NULL AND enabled AND roles = ARRAY['student']::text[]", candidate)
        self.assertIn("'registration_complete',false,'active_group_id',NULL", candidate)
        self.assertIn("AND NOT active AND epoch = 0 AND revision = 0 AND affinity_group_id IS NULL", candidate)
        self.assertIn("AND NOT EXISTS(SELECT 1 FROM ua_private.clerk_identities c WHERE c.person_id = clerk_identities.person_id)", candidate)

    def test_06_explicit_diff_exact(self):
        expected = "".join(difflib.unified_diff(original.decode().splitlines(True), candidate.splitlines(True),
            fromfile="frozen/clerk-registration.delta.review.sql", tofile="review/clerk-registration.names.delta.review.sql"))
        self.assertEqual((here / "registration-names.diff").read_text(), expected)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registration-input", type=Path, required=True)
    args, unittest_args = parser.parse_known_args()
    here = Path(__file__).resolve().parent
    original = args.registration_input.read_bytes()
    candidate = (here / "clerk-registration.names.delta.review.sql").read_text()
    unittest.main(argv=[__file__, *unittest_args])
