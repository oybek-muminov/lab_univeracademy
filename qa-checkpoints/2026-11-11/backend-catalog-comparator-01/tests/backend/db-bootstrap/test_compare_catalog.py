"""Offline data controls only. Synthetic bindings are not historical DB evidence.

The test-only policy/root below never enters compare() via an input flag. Tests
call the same private validation/comparison pipeline with a distinct profile.
Arbitrary Python code can import private helpers; this is API separation, not a
Python sandbox or authentication of an operator's manifest-selection decision.
"""

import ast
import copy
import hashlib
import json
from pathlib import Path
import unittest

import compare_catalog as c

HERE = Path(__file__).resolve().parent
BASE_BYTES = (HERE / "catalog-baseline.pg17.11.json").read_bytes()
BASE_PIN = "7471e498e5bbb2d0668c2a0d6a47aa2fae6eb6e0c19a04a53807d6ab0f4ea106"
HIST_MANIFEST_PIN = "28df67976ee793a0c0489f482061ffc3f91e87cdf95988d111a7dd77d5203ae9"
BASE = json.loads(BASE_BYTES)
HIST_RAW = (json.dumps(BASE["expected_observation"], ensure_ascii=False) + "\n").encode()
HIST_SQLB = BASE["expected_sqlb_projection"]["historical_wire"].encode()
TEST_POLICY = c._Policy("UA-TEST-ONLY-CATALOG-v1", "SYNTHETIC", "unit-only-no-db", False)


def dump(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def fid(raw):
    return {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}


SYN = copy.deepcopy(BASE)
SYN["profile"] = TEST_POLICY.profile
P = SYN["expected_sqlb_projection"]
P["historical_wire"] = ""  # A logical fixture, never a new SQL B capture.
P["projection"]["oid_resolution"]["roles"]["16388"] = {
    "identity": "ua_owner", "witness": "SYNTHETIC_EXPLICIT_ROLE_NOT_HISTORICAL_EVIDENCE"}
for mapping in P["projection"]["oid_resolution"].values():
    for row in mapping.values():
        if row is not None:
            row["witness"] = "SYNTHETIC_TEMPLATE_NOT_CAPTURE_EVIDENCE"
for row in P["projection"]["column_bindings"]:
    row["provenance"] = "SYNTHETIC_EXPLICIT"
P["bindings"]["references"] = {k: fid(("SYNTHETIC:" + k).encode()) for k in c.REF_NAMES}
P["bindings"]["structural_expectations"] = fid(dump(SYN["structural_expectations"]))
SYN["accepted_candidate_serialization"] = fid(dump(SYN["expected_observation"]))


def fixture(obs=None, projection=None, *, baseline=SYN, raw=None, sqlb=None,
            context_edit=None, manifest_edit=None, baseline_bytes=None):
    """Each mutation gets an independent test-root hash/context binding."""
    bb = dump(baseline) if baseline_bytes is None else baseline_bytes
    raw = dump(obs if obs is not None else baseline["expected_observation"]) if raw is None else raw
    sqlb = dump(projection if projection is not None else baseline["expected_sqlb_projection"]["projection"]) if sqlb is None else sqlb
    binding = baseline["expected_sqlb_projection"]["bindings"]
    historical = baseline["profile"] == c.PROFILE
    ctx = {"format": "UA-PG17-OFFLINE-CONTEXT-v1",
           "classification": "HISTORICAL_REPLAY" if historical else "SYNTHETIC",
           "profile": baseline["profile"], "run_id": c.RUN_ID if historical else TEST_POLICY.run_id,
           "baseline": fid(bb), "raw_observation": fid(raw),
           "candidate_serialization": baseline["accepted_candidate_serialization"],
           "structural_expectations": binding["structural_expectations"],
           "references": binding["references"], "recorded_context": binding["recorded_context"],
           "projection_scope": c.SCOPE}
    ctx = copy.deepcopy(ctx)
    ctx["references"]["sqlb_raw_observation"] = fid(sqlb)
    if context_edit:
        context_edit(ctx)
    cb = dump(ctx)
    manifest = {"format": "UA-OFFLINE-SEALED-INPUTS-v1", "profile": baseline["profile"],
                "baseline": fid(bb), "context": fid(cb), "raw_observation": fid(raw),
                "sqlb_raw_observation": fid(sqlb), "candidate_serialization": ctx["candidate_serialization"],
                "structural_expectations": ctx["structural_expectations"], "references": ctx["references"]}
    manifest = copy.deepcopy(manifest)
    if manifest_edit:
        manifest_edit(manifest)
    mb = dump(manifest)
    return bb, fid(bb)["sha256"], raw, {"context_bytes": cb, "manifest_bytes": mb,
             "manifest_sha256": fid(mb)["sha256"], "sqlb_observation_bytes": sqlb}


def synth(*args, **kwargs):
    return c._run(*fixture(*args, **kwargs), TEST_POLICY)


def historical(**kwargs):
    args = list(fixture(baseline=BASE, baseline_bytes=BASE_BYTES, raw=HIST_RAW,
                        sqlb=HIST_SQLB, **kwargs))
    args[1] = BASE_PIN
    return c.compare(*args)


def get_path(value, path):
    for key in path:
        value = value[key]
    return value


def set_path(value, path, replacement):
    parent = get_path(value, path[:-1]); parent[path[-1]] = replacement


HASH_PATHS, NULL_PATHS, OBJECT_PATHS = [], [], []
for section in ("check_pins", "domain_pins", "helpers", "index_pins"):
    for i, row in enumerate(BASE["expected_observation"][section]):
        OBJECT_PATHS.append((section, i))
        for field, value in row.items():
            if field.startswith("candidate_") and field.endswith("_sha256"):
                (NULL_PATHS if value is None else HASH_PATHS).append((section, i, field))
assert (len(OBJECT_PATHS), len(HASH_PATHS), len(NULL_PATHS)) == (114, 115, 131)


class CatalogTests(unittest.TestCase):
    def mismatch(self, result, count=None):
        self.assertEqual(result["status"], "MISMATCH", result)
        self.assertEqual(result["classification"], "SYNTHETIC")
        self.assertTrue(result["comparison_performed"])
        self.assertFalse(result["runtime_readiness"])
        self.assertFalse(result["SQL_B_readiness"])
        self.assertGreater(result["total_mismatch_count"], 0)
        if count is not None:
            self.assertEqual(result["total_mismatch_count"], count)

    def not_ready(self, result, reason=None):
        self.assertEqual(result["status"], "NOT_READY", result)
        self.assertFalse(result["comparison_performed"])
        self.assertIsNone(result["total_mismatch_count"])
        self.assertFalse(result["runtime_readiness"])
        if reason:
            self.assertEqual(result["reason"], reason)

    def test_exact_historical_not_ready(self):
        self.assertEqual(fid(BASE_BYTES)["sha256"], BASE_PIN)
        self.assertEqual(fid(HIST_RAW), BASE["expected_sqlb_projection"]["bindings"]["raw_observation"])
        self.assertEqual(len(HIST_RAW), 70830)
        args = fixture(baseline=BASE, baseline_bytes=BASE_BYTES, raw=HIST_RAW, sqlb=HIST_SQLB)
        self.assertEqual(args[3]["manifest_sha256"], HIST_MANIFEST_PIN)
        result = c.compare(BASE_BYTES, BASE_PIN, HIST_RAW, {**args[3], "manifest_sha256": HIST_MANIFEST_PIN})
        self.not_ready(result, "DEFAULT_ACL_ROLE_NAME_WITNESS_MISSING")
        self.assertEqual(result["classification"], "HISTORICAL_REPLAY")
        self.assertEqual(result["identities"]["raw_observation"], fid(HIST_RAW))

    def test_synthetic_positive(self):
        result = synth()
        self.assertEqual(result["status"], "CATALOG_MATCH", result)
        self.assertEqual(result["classification"], "SYNTHETIC")
        self.assertTrue(result["comparison_performed"])
        self.assertEqual(result["total_mismatch_count"], 0)
        self.assertFalse(result["runtime_readiness"])
        self.assertEqual(result["projection_scope"], c.SCOPE)

    def test_no_synthetic_entry_through_public_api(self):
        self.not_ready(c.compare(*fixture()), "INCOMPATIBLE_BASELINE")

    def test_no_caller_mode_flags(self):
        args = list(fixture()); args[3]["synthetic"] = True
        self.not_ready(c.compare(*args), "INVALID_EVIDENCE_BUNDLE")

    def test_no_historical_mapping_repair(self):
        changed = copy.deepcopy(BASE)
        changed["expected_sqlb_projection"]["projection"]["oid_resolution"]["roles"]["16388"] = {
            "identity": "ua_owner", "witness": "A_LATER_CAPTURE"}
        args = list(fixture(baseline=changed, raw=HIST_RAW, sqlb=HIST_SQLB)); args[1] = BASE_PIN
        self.not_ready(c.compare(*args), "EXTERNAL_PIN_MISMATCH")

    def test_fresh_provenance_unsupported(self):
        self.not_ready(historical(context_edit=lambda x: x.update(classification="FRESH_OBSERVATION")),
                       "FRESH_PROVENANCE_UNSUPPORTED")

    def test_raw_pretty_bytes_distinct(self):
        pretty = (json.dumps(BASE["expected_observation"], ensure_ascii=False, indent=2) + "\n").encode()
        self.assertEqual(fid(pretty), BASE["accepted_candidate_serialization"])
        self.assertEqual(json.loads(pretty), json.loads(HIST_RAW))
        self.assertNotEqual(fid(pretty), fid(HIST_RAW))
        args = list(fixture(baseline=BASE, baseline_bytes=BASE_BYTES, raw=pretty, sqlb=HIST_SQLB))
        self.not_ready(c.compare(*args), "UNREVIEWED_HISTORICAL_INPUT")

    def test_modified_raw_with_old_binding(self):
        args = list(fixture()); args[2] += b" "
        self.not_ready(c._run(*args, TEST_POLICY), "TRUST_BINDING_MISMATCH")

    def test_joint_substitution_external_pin(self):
        original = fixture(); changed = copy.deepcopy(SYN)
        changed["expected_observation"]["schema_owner"] = "other"
        args = list(fixture(baseline=changed)); args[1] = original[1]
        self.not_ready(c._run(*args, TEST_POLICY), "EXTERNAL_PIN_MISMATCH")

    def test_manifest_external_pin(self):
        args = list(fixture()); args[3]["manifest_sha256"] = "0" * 64
        self.not_ready(c._run(*args, TEST_POLICY), "EXTERNAL_PIN_MISMATCH")

    def test_whitespace_is_not_repinning(self):
        args = list(fixture()); args[0] += b"\n"
        self.not_ready(c._run(*args, TEST_POLICY), "EXTERNAL_PIN_MISMATCH")

    def test_shuffled_outer_object_lists_match(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        for key in c.OBS_IDS:
            obs[key].reverse()
        self.assertEqual(synth(obs)["status"], "CATALOG_MATCH")

    def test_shuffled_json_member_order_match(self):
        obs = dict(reversed(list(SYN["expected_observation"].items())))
        self.assertEqual(synth(obs)["status"], "CATALOG_MATCH")

    def test_semantic_column_order_preserved(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        row = next(r for r in obs["keys"] if len(r["columns"]) > 1)
        row["columns"].reverse(); self.mismatch(synth(obs))

    def test_wrong_helper_signature(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        obs["helpers"][0]["arguments"] = "unexpected jsonb"; self.mismatch(synth(obs))

    def test_empty_sections_are_present(self):
        p = SYN["expected_sqlb_projection"]["projection"]
        for name in ("policies", "memberships", "sequence_acl"):
            self.assertEqual(p["sections"][name], [])
        self.assertEqual(synth()["status"], "CATALOG_MATCH")

    def test_implicit_type_usage_is_not_blanket_denied(self):
        rows = SYN["expected_sqlb_projection"]["projection"]["sections"]["runtime_type_acl"]
        self.assertTrue(any(x["acl_class"] == "dependent_array" and x["observed_usage"] for x in rows))
        self.assertEqual(synth()["status"], "CATALOG_MATCH")

    def test_deferred_draft_position_not_made_immediate(self):
        row = next(r for r in SYN["expected_observation"]["index_pins"]
                   if r["name"] == "draft_questions_version_id_position_key")
        self.assertFalse(row["immediate"])

    def test_resolved_public_grant_is_drift(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["default_acls"][0]["grantee_oid"] = "0"
        self.mismatch(synth(projection=p))

    def test_fully_resolved_extra_consumer_grant(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["oid_resolution"]["roles"]["9999"] = {"identity": "ua_runtime", "witness": "SYNTHETIC_EXPLICIT"}
        row = dict(p["sections"]["default_acls"][0]); row["grantee_oid"] = "9999"
        p["sections"]["default_acls"].append(row); self.mismatch(synth(projection=p))

    def test_unresolved_role_is_not_mismatch_zero(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["oid_resolution"]["roles"]["16388"] = None
        self.not_ready(synth(projection=p), "UNRESOLVED_OBJECT_IDENTITY")

    def test_zero_grantor_is_not_public(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["default_acls"][0]["grantor_oid"] = "0"
        self.not_ready(synth(projection=p), "UNRESOLVED_OBJECT_IDENTITY")

    def test_ambiguous_role_mapping(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["oid_resolution"]["roles"]["9999"] = {"identity": "ua_owner", "witness": "SYNTHETIC"}
        self.not_ready(synth(projection=p), "AMBIGUOUS_OBJECT_IDENTITY")

    def test_no_public_sentinel_dictionary_entry(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["oid_resolution"]["roles"]["0"] = {"identity": "PUBLIC", "witness": "SYNTHETIC"}
        self.not_ready(synth(projection=p), "INVALID_SENTINEL_MAPPING")

    def test_no_remembered_oid_fallback(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        del p["oid_resolution"]["types"]["20"]
        self.not_ready(synth(projection=p), "UNRESOLVED_OBJECT_IDENTITY")

    def test_capture_oid_renumbering_uses_natural_identity(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        for domain in p["oid_resolution"]:
            p["oid_resolution"][domain] = {str(int(k) + 100000): v for k, v in p["oid_resolution"][domain].items()}
        for row in p["sections"]["constraints"]:
            if row["referenced_relation_oid"] != "0":
                row["referenced_relation_oid"] = str(int(row["referenced_relation_oid"]) + 100000)
        for row in p["sections"]["domains"]:
            row["base_type_oid"] = str(int(row["base_type_oid"]) + 100000)
        for row in p["sections"]["default_acls"]:
            for key in ("grantor_oid", "grantee_oid"):
                row[key] = str(int(row[key]) + 100000)
        for row in p["sections"]["runtime_helper_acl"]:
            row["oid"] = str(int(row["oid"]) + 100000)
        self.assertEqual(synth(projection=p)["status"], "CATALOG_MATCH")

    def test_gapped_attnum_explicit_binding(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        for row in p["column_bindings"]:
            row["attnum"] = row["attnum"] * 2 + 1
        for row in p["sections"]["constraints"]:
            for key in ("source_attnums", "target_attnums"):
                if row[key] is not None:
                    row[key] = [x * 2 + 1 for x in row[key]]
        for row in p["sections"]["indexes"]:
            row["attribute_numbers"] = [x * 2 + 1 for x in row["attribute_numbers"]]
        self.assertEqual(synth(projection=p)["status"], "CATALOG_MATCH")

    def test_no_rank_as_attnum_fallback(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["column_bindings"][0]["attnum"] += 1000
        self.not_ready(synth(projection=p), "UNRESOLVED_ATTNUM")

    def test_no_historical_deduction_as_generic_fallback(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["column_bindings"][0]["provenance"] = "SOURCE_CONSTRAINED_FRESH_CREATE"
        self.not_ready(synth(projection=p), "UNSUPPORTED_ATTNUM_PROVENANCE")

    def test_all_column_bindings_required(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["column_bindings"].pop()
        self.not_ready(synth(projection=p), "INCOMPLETE_ATTNUM_BINDINGS")

    def test_internal_trigger_generated_name_not_portable(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        next(r for r in p["sections"]["triggers"] if r["internal"])["name"] = "different_capture_suffix"
        self.assertEqual(synth(projection=p)["status"], "CATALOG_MATCH")

    def test_internal_trigger_multiplicity_matters(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        i = next(i for i, r in enumerate(p["sections"]["triggers"]) if r["internal"])
        del p["sections"]["triggers"][i]; self.mismatch(synth(projection=p), 1)

    def test_all_246_slots_count_after_detail_cap(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        for path in HASH_PATHS + NULL_PATHS:
            set_path(obs, path, "0" * 64)
        result = synth(obs); self.mismatch(result, 246)
        self.assertEqual(len(result["details"]), 100); self.assertTrue(result["report_truncated"])

    def test_all_114_missing_objects_count_after_cap(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        for name in ("helpers", "check_pins", "domain_pins", "index_pins"):
            obs[name] = []
        result = synth(obs); self.mismatch(result, 114)
        self.assertEqual(len(result["details"]), 100)

    def test_report_byte_cap_preserves_full_count(self):
        # Serializer calibration, not a DB input or a historical observation.
        differences = c._Differences()
        for _ in range(500):
            differences.add("FIELD_MISMATCH", "snapshot.columns", ("\U0001f680" * 128,) * 3)
        result = c._report("MISMATCH", "SYNTHETIC", {}, comparison=True, diff=differences)
        self.assertEqual(result["total_mismatch_count"], 500)
        self.assertLess(len(result["details"]), 100)
        self.assertLessEqual(len(json.dumps(result, ensure_ascii=False).encode()), 65536)
        self.assertTrue(result["report_truncated"])

    def test_unknown_literals_not_in_report(self):
        obs = copy.deepcopy(SYN["expected_observation"])
        row = dict(obs["roles"][0]); row["name"] = "UNKNOWN_SECRET_LITERAL_" * 100
        obs["roles"].append(row); result = synth(obs); self.mismatch(result)
        self.assertNotIn("UNKNOWN_SECRET_LITERAL", json.dumps(result))

    def test_report_mutation_cannot_change_scope(self):
        result = synth(); result["projection_scope"]["excluded"].clear()
        self.assertEqual(len(c.SCOPE["excluded"]), 3)
        self.assertEqual(synth()["status"], "CATALOG_MATCH")

    def test_consumer_has_no_io_or_repin_capabilities(self):
        tree = ast.parse((HERE / "compare_catalog.py").read_text())
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import): imports.update(x.name for x in node.names)
            if isinstance(node, ast.ImportFrom): imports.add(node.module)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, {"open", "eval", "exec", "compile", "__import__"})
        self.assertEqual(imports, {"hashlib", "json", "re", "collections", "dataclasses"})

    def test_historical_caller_synthetic_classification_rejected(self):
        self.not_ready(historical(context_edit=lambda x: x.update(classification="SYNTHETIC")),
                       "UNSUPPORTED_CLASSIFICATION")

    def test_no_flags_can_claim_review_or_freshness(self):
        for name in ("trusted", "reviewed", "fresh", "update_baseline", "fallback"):
            with self.subTest(flag=name):
                self.not_ready(synth(context_edit=lambda x: x.update({name: True})),
                               "MISSING_OR_UNKNOWN_MEMBER")

    def test_snapshot_unknown_member(self):
        obs = copy.deepcopy(SYN["expected_observation"]); obs["unknown"] = "DO_NOT_ECHO"
        result = synth(obs); self.not_ready(result)
        self.assertNotIn("DO_NOT_ECHO", json.dumps(result))

    def test_snapshot_missing_member(self):
        obs = copy.deepcopy(SYN["expected_observation"]); del obs["index_pins"]
        self.not_ready(synth(obs), "MISSING_OR_UNKNOWN_MEMBER")

    def test_snapshot_nested_unknown_member(self):
        obs = copy.deepcopy(SYN["expected_observation"]); obs["helpers"][0]["definition"] = "DO_NOT_ECHO"
        result = synth(obs); self.not_ready(result)
        self.assertNotIn("DO_NOT_ECHO", json.dumps(result))

    def test_snapshot_nested_duplicate_json_key(self):
        raw = dump(SYN["expected_observation"])
        name = SYN["expected_observation"]["roles"][0]["name"]
        marker = ('"name":' + json.dumps(name)).encode()
        self.assertGreater(raw.count(marker), 0)
        raw = raw.replace(marker, marker + b',' + marker, 1)
        self.not_ready(synth(raw=raw), "DUPLICATE_JSON_KEY")

    def test_projection_nested_duplicate_json_key(self):
        raw = dump(SYN["expected_sqlb_projection"]["projection"])
        marker = b'"16388":'
        self.assertEqual(raw.count(marker), 1)
        raw = raw.replace(marker, b'"16388":null,"16388":', 1)
        self.not_ready(synth(sqlb=raw), "DUPLICATE_JSON_KEY")

    def test_duplicate_identity_with_different_properties(self):
        obs = copy.deepcopy(SYN["expected_observation"]); row = dict(obs["tables"][0])
        row["owner"] = "other"; obs["tables"].append(row)
        self.not_ready(synth(obs), "DUPLICATE_OBJECT_IDENTITY")

    def test_projection_incomplete_capture(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"]); p["complete"] = False
        self.not_ready(synth(projection=p), "INCOMPLETE_OBSERVATION")

    def test_projection_complete_integer_is_not_boolean(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"]); p["complete"] = 1
        self.not_ready(synth(projection=p))

    def test_projection_unknown_section(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"]); p["sections"]["unknown"] = []
        self.not_ready(synth(projection=p), "MISSING_OR_UNKNOWN_SECTION")

    def test_projection_duplicate_natural_identity(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["runtime_column_acl"].append(dict(p["sections"]["runtime_column_acl"][0]))
        self.not_ready(synth(projection=p), "DUPLICATE_OBJECT_IDENTITY")

    def test_projection_noncanonical_oid(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["default_acls"][0]["grantee_oid"] = "016388"
        self.not_ready(synth(projection=p), "INVALID_FIELD_TYPE")

    def test_projection_unknown_configuration_is_not_success(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["helper_properties"][0]["configuration_matches_reviewed"] = None
        self.mismatch(synth(projection=p), 1)

    def test_fully_resolved_policy_drift(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["policies"].append({"table": "people", "name": "unknown_policy",
            "command": "*", "permissive": True, "role_oids": ["0"]})
        result = synth(projection=p); self.mismatch(result, 1)
        self.assertNotIn("unknown_policy", json.dumps(result))

    def test_fully_resolved_membership_drift(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"]["memberships"].append({"role": "ua_owner", "member": "ua_runtime",
            "admin_option": False, "inherit_option": False, "set_option": True})
        self.mismatch(synth(projection=p), 1)

    def test_null_empty_and_space_are_distinct(self):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        row = next(x for x in p["sections"]["constraints"] if x["kind"] != "f")
        self.assertEqual(row["update"], " "); row["update"] = ""
        self.mismatch(synth(projection=p), 1)
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        self.assertIsNone(p["sections"]["default_acls"][0]["namespace"])
        p["sections"]["default_acls"][0]["namespace"] = ""
        self.mismatch(synth(projection=p))

    def test_wrong_file_identity_boolean(self):
        self.not_ready(synth(context_edit=lambda x: x["baseline"].update(bytes=True)))

    def test_missing_manifest_member(self):
        self.not_ready(synth(manifest_edit=lambda x: x.pop("context")), "MISSING_OR_UNKNOWN_MEMBER")

    def test_unknown_manifest_member(self):
        self.not_ready(synth(manifest_edit=lambda x: x.update(reviewed=True)), "MISSING_OR_UNKNOWN_MEMBER")

    def test_missing_context_member(self):
        self.not_ready(synth(context_edit=lambda x: x.pop("recorded_context")), "MISSING_OR_UNKNOWN_MEMBER")

    def test_scope_exclusions_cannot_be_promoted(self):
        self.not_ready(synth(context_edit=lambda x: x["projection_scope"]["excluded"].clear()),
                       "INCOMPATIBLE_CONTEXT")

    def test_collector_reference_drift(self):
        def edit(ctx): ctx["references"]["collector_query"]["sha256"] = "0" * 64
        self.not_ready(synth(context_edit=edit), "INCOMPATIBLE_CONTEXT")

    def test_context_profile_drift(self):
        self.not_ready(synth(context_edit=lambda x: x.update(profile="other")), "INCOMPATIBLE_CONTEXT")

    def test_context_run_drift(self):
        self.not_ready(synth(context_edit=lambda x: x.update(run_id="other")), "INCOMPATIBLE_CONTEXT")

    def test_pinned_sql_context_drift(self):
        def edit(ctx): ctx["recorded_context"]["sql_b"]["sha256"] = "0" * 64
        self.not_ready(synth(context_edit=edit), "INCOMPATIBLE_CONTEXT")

    def test_inputs_unchanged_after_invocation(self):
        args = fixture(); before = copy.deepcopy(args)
        self.assertEqual(c._run(*args, TEST_POLICY)["status"], "CATALOG_MATCH")
        self.assertEqual(args, before)

    def test_baseline_unknown_member(self):
        base = copy.deepcopy(SYN); base["ready"] = True
        self.not_ready(synth(baseline=base), "MISSING_OR_UNKNOWN_MEMBER")

    def test_baseline_structural_expectations_not_replaced_by_hashes(self):
        base = copy.deepcopy(SYN); base["structural_expectations"]["columns"][0]["type"] = "text"
        self.not_ready(synth(baseline=base), "INCONSISTENT_BASELINE_STRUCTURE")

    def test_source_bound_baseline_has_all_slots(self):
        self.assertEqual(len(HASH_PATHS), 115); self.assertEqual(len(NULL_PATHS), 131)
        self.assertEqual(len(OBJECT_PATHS), 114)
        self.assertEqual(SYN["expected_sqlb_projection"]["projection"]["sections"]["all_expression_pins_ready"],
                         [{"value": False}])

    def test_duplicate_source_identity_not_silently_deduplicated(self):
        base = copy.deepcopy(SYN); base["structural_expectations"]["tables"].append(
            base["structural_expectations"]["tables"][0])
        self.not_ready(synth(baseline=base), "DUPLICATE_OBJECT_IDENTITY")

    def test_source_domain_expectations_enforced(self):
        base = copy.deepcopy(SYN); base["structural_expectations"]["domain_bases"]["ms_time"] = "text"
        self.not_ready(synth(baseline=base), "INCONSISTENT_BASELINE_STRUCTURE")

    def test_source_arbiter_timing_enforced(self):
        base = copy.deepcopy(SYN)
        table, columns = base["structural_expectations"]["immediate_arbiters"][0]
        for row in base["structural_expectations"]["keys"] + base["expected_observation"]["keys"]:
            if row["table"] == table and row["columns"] == columns:
                row["deferrable"] = True
        self.not_ready(synth(baseline=base), "INCONSISTENT_BASELINE_STRUCTURE")

    def test_baseline_cross_source_context_consistency(self):
        base = copy.deepcopy(SYN); base["sql_a"]["sha256"] = "0" * 64
        self.not_ready(synth(baseline=base), "INCONSISTENT_BASELINE_CONTEXT")


def install(name, fn):
    setattr(CatalogTests, "test_" + name, fn)


for number, path in enumerate(HASH_PATHS):
    def control(self, path=path):
        obs = copy.deepcopy(SYN["expected_observation"])
        set_path(obs, path, "0" * 64)
        self.mismatch(synth(obs), 1)
    install(f"hash_slot_{number:03}", control)
for number, path in enumerate(NULL_PATHS):
    def control(self, path=path):
        obs = copy.deepcopy(SYN["expected_observation"])
        set_path(obs, path, "0" * 64)
        self.mismatch(synth(obs), 1)
    install(f"required_null_slot_{number:03}", control)
for number, (section, index) in enumerate(OBJECT_PATHS):
    def control(self, section=section, index=index):
        obs = copy.deepcopy(SYN["expected_observation"]); del obs[section][index]
        self.mismatch(synth(obs), 1)
    install(f"missing_canonical_object_{number:03}", control)


for section in c.OBS_IDS:
    def control(self, section=section):
        obs = copy.deepcopy(SYN["expected_observation"]); obs[section].append(copy.deepcopy(obs[section][0]))
        self.not_ready(synth(obs), "DUPLICATE_OBJECT_IDENTITY")
    install("duplicate_snapshot_" + section, control)
for section in c.WIRE:
    def control(self, section=section):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"]); del p["sections"][section]
        self.not_ready(synth(projection=p), "MISSING_OR_UNKNOWN_SECTION")
    install("missing_sqlb_section_" + section, control)


DRIFTS = [
    (("tables", 0, "owner"), "other_owner"), (("tables", 0, "rls"), False),
    (("tables", 0, "force_rls"), False), (("roles", 0, "bypass"), True),
    (("roles", 0, "super"), True), (("roles", 0, "login"), True),
    (("columns", 0, "notnull"), False), (("columns", 0, "type"), "text"),
    (("helpers", 0, "definer"), True), (("helpers", 0, "config_matches"), False),
    (("user_triggers", 0, "type"), 0), (("user_triggers", 0, "enabled"), "D"),
    (("index_pins", 0, "valid"), False), (("index_pins", 0, "ready"), False),
    (("index_pins", 0, "immediate"), False), (("keys", 0, "deferrable"), True),
    (("fks", 0, "delete"), "c"), (("fks", 0, "deferred"), True),
    (("consumer_acl", 0, "helper_execute"), True), (("consumer_acl", 0, "schema_access"), True),
    (("consumer_acl", 0, "explicit_domain_usage"), True), (("consumer_acl", 0, "table_or_column_access"), True),
    (("policy_count",), 1), (("membership_count",), 1), (("all_application_tables_empty",), False),
]
for number, (path, value) in enumerate(DRIFTS):
    def control(self, path=path, value=value):
        obs = copy.deepcopy(SYN["expected_observation"])
        self.assertNotEqual(get_path(obs, path), value)
        set_path(obs, path, value); self.mismatch(synth(obs), 1)
    install(f"structural_drift_{number:02}", control)


ACL_DRIFTS = [("runtime_table_acl", "select"), ("runtime_table_acl", "maintain"),
              ("runtime_column_acl", "update"), ("runtime_helper_acl", "execute"),
              ("consumer_acl", "schema_create"), ("consumer_acl", "any_helper_execute"),
              ("runtime_identity", "member_of_owner"), ("owner_runtime_roles", "login")]
for number, (section, key) in enumerate(ACL_DRIFTS):
    def control(self, section=section, key=key):
        p = copy.deepcopy(SYN["expected_sqlb_projection"]["projection"])
        p["sections"][section][0][key] = not p["sections"][section][0][key]
        self.mismatch(synth(projection=p), 1)
    install(f"effective_acl_drift_{number:02}", control)


for key in ("source_commit", "server_version_num", "source_archive_sha256", "installed_tool_manifest_sha256",
            "postgres_binary_sha256", "search_path", "encoding", "locale", "canonicalization"):
    def control(self, key=key):
        def edit(ctx):
            ctx["recorded_context"][key] = "0" * 64 if key.endswith("sha256") else "incompatible"
        self.not_ready(synth(context_edit=edit), "INCOMPATIBLE_CONTEXT")
    install("context_drift_" + key, control)


INVALID_RAW = [b"\xff", b"{", b"{}", b'{"x":1,"x":2}', b'[]', b'null',
               b'{"x":NaN}', b'{"x":Infinity}', b'{"x":-Infinity}', b'{} trailing']
for number, raw in enumerate(INVALID_RAW):
    def control(self, raw=raw): self.not_ready(synth(raw=raw))
    install(f"invalid_json_{number:02}", control)


INVALID_VALUES = [(("policy_count",), True), (("policy_count",), 1.0),
                  (("policy_count",), float("inf")), (("version",), 170011),
                  (("tables", 0, "rls"), 1), (("helpers", 0, "candidate_definition_sha256"), None),
                  (("helpers", 0, "candidate_definition_sha256"), "A" * 64),
                  (("index_pins", 0, "candidate_expression_sha256"), ""),
                  (("columns", 0, "column"), "\ud800")]
for number, (path, value) in enumerate(INVALID_VALUES):
    def control(self, path=path, value=value):
        obs = copy.deepcopy(SYN["expected_observation"]); set_path(obs, path, value)
        if isinstance(value, str) and value == "\ud800":
            raw = (json.dumps(obs, ensure_ascii=True) + "\n").encode(); self.not_ready(synth(raw=raw))
        else: self.not_ready(synth(obs))
    install(f"wrong_type_or_hash_{number:02}", control)


for name in ("baseline", "observation", "context", "manifest", "sqlb"):
    def control(self, name=name):
        args = list(fixture()); huge = b" " * (c.MAX_INPUT + 1)
        if name == "baseline": args[0] = huge
        elif name == "observation": args[2] = huge
        else: args[3][{"context": "context_bytes", "manifest": "manifest_bytes", "sqlb": "sqlb_observation_bytes"}[name]] = huge
        self.not_ready(c._run(*args, TEST_POLICY), "INPUT_SIZE_OR_TYPE")
    install("oversize_" + name, control)


if __name__ == "__main__":
    unittest.main(verbosity=2)
