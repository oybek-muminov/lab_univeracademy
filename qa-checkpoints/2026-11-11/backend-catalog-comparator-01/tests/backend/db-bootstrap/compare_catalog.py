"""Pure, bounded catalog-data comparison; no files, SQL, processes or network.

The operator supplies immutable bytes and independently chosen manifest/baseline
pins. This module cannot authenticate that operator or a QA decision. The public
entry accepts the one retained historical profile, whose full projection is NOT_READY.
Private comparison primitives are exercised by a separate test-only trust root in
test_compare_catalog.py; no input flag enables that root in compare().
"""

import hashlib
import json
import re
from collections import Counter
from dataclasses import dataclass

MAX_INPUT = 1_048_576
MAX_REPORT = 65_536
MAX_DETAILS = 100
COMMIT = "de2adf023428a374f075faa421ece9e1deafaf36"
PROFILE = "UA17-7211e09742a7-PGCATALOG-v1"
RUN_ID = "ua17-7211e09742a7"
SCOPE = {
    "included": ["named_keys_and_fks", "ordered_columns_and_fk_actions",
                 "user_triggers_including_tgtype", "internal_trigger_semantic_multiset",
                 "explicit_domain_acl", "captured_array_usage_consistency"],
    "excluded": ["exact_internal_trigger_to_fk_edge", "internal_trigger_tgtype",
                 "actual_array_element_name_graph"],
    "claim": "bounded catalog projection, not universal database-graph equivalence",
}

FID = {"bytes": "I", "sha256": "H"}
REF_NAMES = ("packet_manifest", "collector_query", "plan", "postgresql_config",
             "run_journal", "identity_probe", "observed_ledger", "tool_setup_result",
             "tool_setup_commands", "sqlb_collector_query", "sqlb_raw_observation")
RECORDED = {"source_commit": "S", "sql_a": FID, "sql_b": FID,
            "server_version_num": "S", "source_archive_sha256": "H",
            "installed_tool_manifest_sha256": "H", "postgres_binary_sha256": "H",
            "search_path": "S", "encoding": "S", "locale": "S", "canonicalization": "S"}
KEY = {"table": "S", "kind": "S", "columns": ["S"], "deferrable": "B", "deferred": "B"}
FK = {"table": "S", "columns": ["S"], "target_schema": "S", "target": "S",
      "target_columns": ["S"], "deferrable": "B", "deferred": "B",
      "update": "S", "delete": "S", "match": "S"}
INDEX = {"table": "S", "name": "S", "columns": ["S"], "unique": "B", "has_predicate": "B"}
TRIGGER = {"table": "S", "name": "S", "function_schema": "S", "function": "S",
           "enabled": "S", "type": "I", "deferrable": "B", "deferred": "B"}
OBS = {
    "status": "S", "source_SQL_A_sha256": "H", "version": "S", "schema_owner": "S",
    "policy_count": "I", "membership_count": "I", "all_application_tables_empty": "B",
    "tables": [{"name": "S", "owner": "S", "rls": "B", "force_rls": "B"}],
    "columns": [{"table": "S", "column": "S", "type": "S", "notnull": "B", "collation": "S?"}],
    "keys": [KEY], "fks": [FK], "explicit_indexes": [INDEX], "user_triggers": [TRIGGER],
    "helpers": [{"name": "S", "owner": "S", "language": "S", "arguments": "S", "result": "S",
                 "volatility": "S", "definer": "B", "config_matches": "B", "candidate_definition_sha256": "H"}],
    "domains": [{"name": "S", "owner": "S", "base_type": "S"}],
    "roles": [{"name": "S", "super": "B", "inherit": "B", "createrole": "B", "createdb": "B",
               "login": "B", "replication": "B", "bypass": "B"}],
    "consumer_acl": [{"role": "S", "schema_access": "B", "table_or_column_access": "B",
                      "helper_execute": "B", "explicit_domain_usage": "B"}],
    "check_pins": [{"table": "S", "name": "S", "validated": "B", "candidate_expression_sha256": "H"}],
    "domain_pins": [{"domain": "S", "name": "S", "validated": "B", "candidate_expression_sha256": "H"}],
    "index_pins": [{"table": "S", "name": "S", "valid": "B", "ready": "B", "immediate": "B",
                    "candidate_definition_sha256": "H", "candidate_expression_sha256": "H?",
                    "candidate_predicate_sha256": "H?"}],
}
EXPECTED = {
    "origin": "S", "tables": ["S"],
    "columns": [{"table": "S", "column": "S", "type": "S", "notnull": "B", "c_collation": "B"}],
    "keys": [KEY], "fks": [FK], "explicit_indexes": [INDEX], "user_triggers": [TRIGGER],
    "helpers": ["S"], "domains": ["S"], "table_check_count": "I",
    "immediate_arbiters": [["S", ["S"]]],
    "domain_bases": {"safe_counter": "S", "ms_time": "S", "proof_digest": "S"},
}

# Exact reviewed SQL B field order/types; this is not a generic pipe-output parser.
WIRE = {
    "session_identity": "database:S,current_user:S,session_user:S,server_version_num:I,isolation_known:B,read_only_expected:B,reviewed_search_path_match:B",
    "schema": "name:S,owner:S",
    "tables": "name:S,kind:S,owner:S,rls:B,force_rls:B",
    "columns": "table:S,column:S,type:S,notnull:B,identity:S,generated:S",
    "constraints": "table:S,name:S,kind:S,deferrable:B,deferred:B,validated:B,source_attnums:AI?,referenced_relation_oid:OID,target_attnums:AI?,update:S,delete:S,match:S,has_expression:B,reviewed_pin_available:B,matches_reviewed_expression:B",
    "indexes": "table:S,name:S,unique:B,immediate:B,valid:B,ready:B,key_attribute_count:I,attribute_numbers:AI,has_expression:B,has_predicate:B,expression_pin_available:B,predicate_pin_available:B,matches_reviewed_expression:B,matches_reviewed_predicate:B",
    "domains": "name:S,type_kind:S,notnull:B,base_type_oid:OID,constraint_name:S?,constraint_kind:S?,validated:B?,has_expression:B,domain_expression_comparison_ready:B",
    "policies": "table:S,name:S,command:S,permissive:B,role_oids:AOID",
    "triggers": "table:S,name:S,enabled:S,internal:B,deferrable:B,deferred:B,function_schema:S,function_name:S,function_definer:B",
    "helper_properties": "name:S,definer:B,volatility:S,configuration_entry_count:I,configuration_matches_reviewed:B?,owner:S",
    "default_acls": "object_kind:S,namespace:S?,grantor_oid:OID,grantee_oid:OID,privilege:S,grantable:B",
    "owner_runtime_roles": "name:S,super:B,bypass:B,inherit:B,login:B,createrole:B,createdb:B,replication:B",
    "memberships": "role:S,member:S,admin_option:B,inherit_option:B,set_option:B",
    "runtime_identity": "current_user:S,session_user:S,member_of_owner:B,schema_usage:B,schema_create:B",
    "runtime_table_acl": "table:S,select:B,insert:B,update:B,delete:B,truncate:B,references:B,trigger:B,maintain:B,any_column_select:B,any_column_insert:B,any_column_update:B,any_column_references:B",
    "runtime_column_acl": "table:S,column:S,select:B,insert:B,update:B,references:B",
    "runtime_helper_acl": "name:S,oid:OID,execute:B",
    "runtime_type_acl": "name:S,kind:S,acl_class:S,observed_usage:B,explicit_domain_denial_matches:B?,array_matches_element:B?",
    "sequence_acl": "name:S,usage:B,select:B,update:B",
    "consumer_acl": "role:S,schema_usage:B,schema_create:B,any_table_or_column_privilege:B,any_helper_execute:B,any_explicit_domain_usage:B",
    "all_expression_pins_ready": "value:B",
}
OBS_IDS = {
    "tables": ("name",), "columns": ("table", "column"), "keys": ("table", "kind", "columns"),
    "fks": ("table", "columns", "target_schema", "target", "target_columns"),
    "explicit_indexes": ("table", "name"), "user_triggers": ("table", "name"),
    "helpers": ("name", "arguments"), "domains": ("name",), "roles": ("name",),
    "consumer_acl": ("role",), "check_pins": ("table", "name"),
    "domain_pins": ("domain", "name"), "index_pins": ("table", "name"),
}
PROJ_IDS = {
    "session_identity": (), "schema": ("name",), "tables": ("name",),
    "columns": ("table", "column"), "constraints": ("table", "name"),
    "indexes": ("table", "name"), "domains": ("name", "constraint_name"),
    "policies": ("table", "name"), "triggers": ("table", "name"),
    "helper_properties": ("name",),
    "default_acls": ("object_kind", "namespace", "grantor_oid", "grantee_oid", "privilege"),
    "owner_runtime_roles": ("name",), "memberships": ("role", "member"),
    "runtime_identity": (), "runtime_table_acl": ("table",),
    "runtime_column_acl": ("table", "column"), "runtime_helper_acl": ("name",),
    "runtime_type_acl": ("name",), "sequence_acl": ("name",),
    "consumer_acl": ("role",), "all_expression_pins_ready": (),
}


class _NotReady(Exception):
    pass


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _identity(data):
    return {"bytes": len(data), "sha256": _sha(data)}


def _pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise _NotReady("DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def _constant(_):
    raise _NotReady("NONFINITE_NUMBER")


def _decode(data):
    if type(data) is not bytes or len(data) > MAX_INPUT:
        raise _NotReady("INPUT_SIZE_OR_TYPE")
    try:
        return json.loads(data.decode("utf-8"), object_pairs_hook=_pairs,
                          parse_constant=_constant)
    except (UnicodeError, ValueError, RecursionError):
        raise _NotReady("INVALID_UTF8_OR_JSON") from None


def _check(value, schema):
    if type(schema) is str:
        if schema.endswith("?"):
            if value is None:
                return
            return _check(value, schema[:-1])
        if schema == "S" and type(value) is str:
            # Reject escaped lone surrogates too; decoded strings must be UTF8.
            try:
                value.encode("utf-8")
            except UnicodeError:
                raise _NotReady("INVALID_UTF8_OR_JSON") from None
            return
        if schema == "B" and type(value) is bool:
            return
        if schema == "I" and type(value) is int:
            return
        if schema == "H" and type(value) is str and re.fullmatch(r"[0-9a-f]{64}", value):
            return
        if schema == "OID" and type(value) is str and re.fullmatch(r"0|[1-9][0-9]{0,9}", value):
            if int(value) <= 4_294_967_295:
                return
        if schema in ("AI", "AOID"):
            return _check(value, ["I" if schema == "AI" else "OID"])
        raise _NotReady("INVALID_FIELD_TYPE")
    if type(schema) is dict:
        if type(value) is not dict or value.keys() != schema.keys():
            raise _NotReady("MISSING_OR_UNKNOWN_MEMBER")
        for key, sub in schema.items():
            _check(value[key], sub)
        if schema == FID and not 0 <= value["bytes"] <= MAX_INPUT:
            raise _NotReady("INVALID_FILE_IDENTITY")
        return
    if type(schema) is list:
        if type(value) is not list:
            raise _NotReady("INVALID_FIELD_TYPE")
        if len(schema) == 1:
            for item in value:
                _check(item, schema[0])
        else:
            if len(value) != len(schema):
                raise _NotReady("INVALID_FIELD_TYPE")
            for item, sub in zip(value, schema):
                _check(item, sub)


def _freeze(value):
    if type(value) is list:
        return tuple(_freeze(x) for x in value)
    if type(value) is dict:
        return tuple(sorted((k, _freeze(v)) for k, v in value.items()))
    return value


def _rows(rows, fields):
    result = {}
    for row in rows:
        key = tuple(_freeze(row[f]) for f in fields)
        if key in result:
            raise _NotReady("DUPLICATE_OBJECT_IDENTITY")
        result[key] = row
    return result


def _observation(value):
    _check(value, OBS)
    for section, fields in OBS_IDS.items():
        _rows(value[section], fields)


def _sections(value):
    if type(value) is not dict or value.keys() != WIRE.keys():
        raise _NotReady("MISSING_OR_UNKNOWN_SECTION")
    for name, spec in WIRE.items():
        schema = dict(item.split(":") for item in spec.split(","))
        _check(value[name], [schema])
        _rows(value[name], PROJ_IDS[name])


def _resolution(value, bindings):
    if type(value) is not dict or set(value) != {"relations", "types", "roles", "helpers"}:
        raise _NotReady("INVALID_RESOLUTION")
    for mapping in value.values():
        if type(mapping) is not dict:
            raise _NotReady("INVALID_RESOLUTION")
        for oid, row in mapping.items():
            _check(oid, "OID")
            if oid == "0":
                raise _NotReady("INVALID_SENTINEL_MAPPING")
            if row is not None:
                _check(row, {"identity": "S", "witness": "S"})
                if not row["identity"] or not row["witness"]:
                    raise _NotReady("INVALID_RESOLUTION")
        names = [row["identity"] for row in mapping.values() if row is not None]
        if len(names) != len(set(names)):
            raise _NotReady("AMBIGUOUS_OBJECT_IDENTITY")
    _check(bindings, [{"table": "S", "column": "S", "attnum": "I", "provenance": "S"}])
    _rows(bindings, ("table", "column"))
    _rows(bindings, ("table", "attnum"))
    if any(x["attnum"] <= 0 for x in bindings):
        raise _NotReady("INVALID_ATTNUM")


def _projection(value):
    required = {"format", "scope", "complete", "sections", "oid_resolution", "column_bindings"}
    if type(value) is not dict or set(value) != required:
        raise _NotReady("MISSING_OR_UNKNOWN_MEMBER")
    if value["format"] != "UA-BOUNDED-SQLB-PROJECTION-v1" or value["scope"] != SCOPE:
        raise _NotReady("INCOMPATIBLE_PROJECTION_SCOPE")
    if value["complete"] is not True:
        raise _NotReady("INCOMPLETE_OBSERVATION")
    _sections(value["sections"])
    _resolution(value["oid_resolution"], value["column_bindings"])


def _normal_projection(value):
    """Resolve only witnessed identities; never use remembered OIDs or row rank."""
    maps = value["oid_resolution"]
    def resolve(domain, oid, sentinel=None):
        if oid == "0" and sentinel is not None:
            return sentinel
        row = maps[domain].get(oid)
        if row is None:
            raise _NotReady("UNRESOLVED_OBJECT_IDENTITY")
        return row["identity"]
    columns = {}
    if _rows(value["column_bindings"], ("table", "column")).keys() != _rows(
            value["sections"]["columns"], ("table", "column")).keys():
        raise _NotReady("INCOMPLETE_ATTNUM_BINDINGS")
    for row in value["column_bindings"]:
        if row["provenance"] not in ("EXPLICIT_CAPTURE", "SYNTHETIC_EXPLICIT"):
            raise _NotReady("UNSUPPORTED_ATTNUM_PROVENANCE")
        columns[row["table"], row["attnum"]] = row["column"]
    def vector(table, numbers):
        if numbers is None:
            return None
        result = []
        for number in numbers:
            if (table, number) not in columns:
                raise _NotReady("UNRESOLVED_ATTNUM")
            result.append(columns[table, number])
        return result
    result = {}
    for section, rows in value["sections"].items():
        output = []
        for original in rows:
            row = dict(original)
            if section == "constraints":
                target = resolve("relations", row["referenced_relation_oid"], "NO_RELATION")
                row["referenced_relation_oid"] = target
                row["source_attnums"] = vector(row["table"], row["source_attnums"])
                row["target_attnums"] = vector(target.removeprefix("ua_private."), row["target_attnums"])
            elif section == "indexes":
                row["attribute_numbers"] = vector(row["table"], row["attribute_numbers"])
            elif section == "domains":
                row["base_type_oid"] = resolve("types", row["base_type_oid"])
            elif section == "policies":
                row["role_oids"] = [resolve("roles", x, "PUBLIC") for x in row["role_oids"]]
            elif section == "default_acls":
                # grantor 0 is NOT the PUBLIC grantee sentinel.
                row["grantor_oid"] = resolve("roles", row["grantor_oid"])
                row["grantee_oid"] = resolve("roles", row["grantee_oid"], "PUBLIC")
            elif section == "runtime_helper_acl":
                row["oid"] = resolve("helpers", row["oid"])
            if section == "triggers" and row["internal"]:
                row.pop("name")
            output.append(row)
        result[section] = output
    return result


def _baseline(value, policy):
    fields = {"format", "profile", "source_commit", "sql_a", "sql_b", "accepted_candidate_serialization",
              "structural_expectations", "expected_observation", "expected_sqlb_projection"}
    if type(value) is not dict or set(value) != fields:
        raise _NotReady("MISSING_OR_UNKNOWN_MEMBER")
    if (value["format"] != "UA-PG17-CATALOG-BASELINE-v1" or value["profile"] != policy.profile
            or value["source_commit"] != COMMIT):
        raise _NotReady("INCOMPATIBLE_BASELINE")
    for key in ("sql_a", "sql_b", "accepted_candidate_serialization"):
        _check(value[key], FID)
    _check(value["structural_expectations"], EXPECTED)
    _observation(value["expected_observation"])
    p = value["expected_sqlb_projection"]
    if type(p) is not dict or set(p) != {"projection", "bindings", "historical_wire", "witness_identities"}:
        raise _NotReady("MISSING_OR_UNKNOWN_MEMBER")
    _projection(p["projection"])
    _check(p["historical_wire"], "S")
    _check(p["witness_identities"], {"WITNESS.json": FID, "DECISION.md": FID})
    _check(p["bindings"], {"raw_observation": FID, "structural_expectations": FID,
                           "references": {n: FID for n in REF_NAMES}, "recorded_context": RECORDED})
    e, o = value["structural_expectations"], value["expected_observation"]
    for name in ("tables", "helpers", "domains"):
        if len(e[name]) != len(set(e[name])):
            raise _NotReady("DUPLICATE_OBJECT_IDENTITY")
    if set(e["tables"]) != {x["name"] for x in o["tables"]}:
        raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")
    if (set(e["helpers"]) != {x["name"] for x in o["helpers"]}
            or set(e["domains"]) != {x["name"] for x in o["domains"]}
            or e["domain_bases"] != {x["name"]: x["base_type"] for x in o["domains"]}
            or e["table_check_count"] != len(o["check_pins"])):
        raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")
    arbiters = [_freeze(x) for x in e["immediate_arbiters"]]
    if len(arbiters) != len(set(arbiters)):
        raise _NotReady("DUPLICATE_OBJECT_IDENTITY")
    for table, columns in e["immediate_arbiters"]:
        if not any(x["table"] == table and x["columns"] == columns and x["kind"] in ("p", "u")
                   and not x["deferrable"] and not x["deferred"] for x in o["keys"]):
            raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")
    recorded = p["bindings"]["recorded_context"]
    if (recorded["source_commit"] != value["source_commit"] or recorded["sql_a"] != value["sql_a"]
            or recorded["sql_b"] != value["sql_b"] or o["version"] != recorded["server_version_num"]
            or o["source_SQL_A_sha256"] != value["sql_a"]["sha256"]):
        raise _NotReady("INCONSISTENT_BASELINE_CONTEXT")
    for name in ("keys", "fks", "explicit_indexes", "user_triggers"):
        if _rows(e[name], OBS_IDS[name]) != _rows(o[name], OBS_IDS[name]):
            raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")
    ec = _rows(e["columns"], ("table", "column")); oc = _rows(o["columns"], ("table", "column"))
    if ec.keys() != oc.keys():
        raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")
    for k, row in ec.items():
        actual = oc[k]
        if any(row[f] != actual[f] for f in ("type", "notnull")) or row["c_collation"] != (actual["collation"] == "C"):
            raise _NotReady("INCONSISTENT_BASELINE_STRUCTURE")


@dataclass(frozen=True)
class _Policy:
    profile: str
    classification: str
    run_id: str
    retained: bool


_HISTORICAL = _Policy(PROFILE, "HISTORICAL_REPLAY", RUN_ID, True)


def _bind(baseline_bytes, baseline_pin, observation_bytes, evidence, policy):
    if type(evidence) is not dict or set(evidence) != {"context_bytes", "manifest_bytes", "manifest_sha256", "sqlb_observation_bytes"}:
        raise _NotReady("INVALID_EVIDENCE_BUNDLE")
    _check(baseline_pin, "H"); _check(evidence["manifest_sha256"], "H")
    # Check byte pins before parsing; hashes are not taken from input declarations.
    for raw in (baseline_bytes, observation_bytes, evidence["context_bytes"], evidence["manifest_bytes"], evidence["sqlb_observation_bytes"]):
        if type(raw) is not bytes or len(raw) > MAX_INPUT:
            raise _NotReady("INPUT_SIZE_OR_TYPE")
    if _sha(baseline_bytes) != baseline_pin or _sha(evidence["manifest_bytes"]) != evidence["manifest_sha256"]:
        raise _NotReady("EXTERNAL_PIN_MISMATCH")
    baseline = _decode(baseline_bytes); _baseline(baseline, policy)
    context = _decode(evidence["context_bytes"])
    _check(context, {"format": "S", "classification": "S", "profile": "S", "run_id": "S",
                     "baseline": FID, "raw_observation": FID, "candidate_serialization": FID,
                     "structural_expectations": FID, "references": {n: FID for n in REF_NAMES},
                     "recorded_context": RECORDED,
                     "projection_scope": {"included": ["S"], "excluded": ["S"], "claim": "S"}})
    manifest = _decode(evidence["manifest_bytes"])
    _check(manifest, {"format": "S", "profile": "S", "baseline": FID, "context": FID,
                      "raw_observation": FID, "sqlb_raw_observation": FID,
                      "candidate_serialization": FID, "structural_expectations": FID,
                      "references": {n: FID for n in REF_NAMES}})
    if manifest["format"] != "UA-OFFLINE-SEALED-INPUTS-v1" or context["format"] != "UA-PG17-OFFLINE-CONTEXT-v1":
        raise _NotReady("UNKNOWN_FORMAT")
    identities = {"baseline": _identity(baseline_bytes), "context": _identity(evidence["context_bytes"]),
                  "raw_observation": _identity(observation_bytes), "sqlb_raw_observation": _identity(evidence["sqlb_observation_bytes"]),
                  "manifest": _identity(evidence["manifest_bytes"])}
    for key in ("baseline", "context", "raw_observation", "sqlb_raw_observation"):
        if manifest[key] != identities[key]:
            raise _NotReady("TRUST_BINDING_MISMATCH")
    if context["baseline"] != identities["baseline"] or context["raw_observation"] != identities["raw_observation"]:
        raise _NotReady("TRUST_BINDING_MISMATCH")
    for key in ("candidate_serialization", "structural_expectations", "references"):
        if context[key] != manifest[key]:
            raise _NotReady("TRUST_BINDING_MISMATCH")
    p = baseline["expected_sqlb_projection"]; bindings = p["bindings"]
    if (context["profile"] != policy.profile or manifest["profile"] != policy.profile
            or context["run_id"] != policy.run_id or context["projection_scope"] != SCOPE
            or context["recorded_context"] != bindings["recorded_context"]
            or context["candidate_serialization"] != baseline["accepted_candidate_serialization"]
            or context["structural_expectations"] != bindings["structural_expectations"]):
        raise _NotReady("INCOMPATIBLE_CONTEXT")
    refs = dict(context["references"])
    if refs.pop("sqlb_raw_observation") != identities["sqlb_raw_observation"]:
        raise _NotReady("TRUST_BINDING_MISMATCH")
    wanted = dict(bindings["references"]); wanted.pop("sqlb_raw_observation")
    if refs != wanted:
        raise _NotReady("INCOMPATIBLE_CONTEXT")
    if context["classification"] == "FRESH_OBSERVATION" and policy.retained:
        raise _NotReady("FRESH_PROVENANCE_UNSUPPORTED")
    if context["classification"] != policy.classification:
        raise _NotReady("UNSUPPORTED_CLASSIFICATION")
    if policy.retained and (identities["raw_observation"] != bindings["raw_observation"]
                            or identities["sqlb_raw_observation"] != bindings["references"]["sqlb_raw_observation"]):
        raise _NotReady("UNREVIEWED_HISTORICAL_INPUT")
    obs = _decode(observation_bytes); _observation(obs)
    return baseline, obs, identities


class _Differences:
    def __init__(self):
        self.total = 0
        self.details = []

    def add(self, reason, section, identity=()):
        self.total += 1
        if len(self.details) < MAX_DETAILS:
            self.details.append({"reason": reason, "section": section,
                                 "identity": list(identity) if identity else []})

    def fields(self, expected, actual, section, identity):
        for key in expected:
            if expected[key] != actual[key]:
                self.add("FIELD_MISMATCH", section, identity)

    def rows(self, expected, actual, fields, section):
        e, a = _rows(expected, fields), _rows(actual, fields)
        for identity in e:
            # Only reviewed natural identities can enter the bounded report.
            safe = tuple(str(x)[:128] for x in identity)
            if identity not in a:
                self.add("MISSING_OBJECT", section, safe)
            else:
                self.fields(e[identity], a[identity], section, safe)
        for identity in a.keys() - e.keys():
            self.add("EXTRA_OBJECT", section)


def _semantic(baseline, obs, projection, identities, classification):
    _projection(projection)
    expected = baseline["expected_sqlb_projection"]["projection"]
    eproj, aproj = _normal_projection(expected), _normal_projection(projection)
    diff = _Differences(); wanted = baseline["expected_observation"]
    for section in OBS:
        if section in OBS_IDS:
            diff.rows(wanted[section], obs[section], OBS_IDS[section], "snapshot." + section)
        elif wanted[section] != obs[section]:
            diff.add("FIELD_MISMATCH", "snapshot." + section)
    for section in WIRE:
        if section == "triggers":
            euser = [r for r in eproj[section] if not r["internal"]]
            auser = [r for r in aproj[section] if not r["internal"]]
            diff.rows(euser, auser, ("table", "name"), "sqlb.triggers")
            ecount = Counter(_freeze(r) for r in eproj[section] if r["internal"])
            acount = Counter(_freeze(r) for r in aproj[section] if r["internal"])
            for key in ecount.keys() | acount.keys():
                for _ in range(abs(ecount[key] - acount[key])):
                    diff.add("INTERNAL_TRIGGER_MULTISET_MISMATCH", "sqlb.triggers")
        else:
            diff.rows(eproj[section], aproj[section], PROJ_IDS[section], "sqlb." + section)
    return _report("MISMATCH" if diff.total else "CATALOG_MATCH", classification, identities,
                   comparison=True, diff=diff)


def _report(status, classification, identities, *, comparison=False, diff=None, reason=None):
    result = {"status": status, "classification": classification, "runtime_readiness": False,
              "SQL_B_readiness": False,
              "projection_scope": {k: list(v) if type(v) is list else v for k, v in SCOPE.items()},
              "identities": identities,
              "comparison_performed": comparison,
              "total_mismatch_count": diff.total if comparison else None,
              "details": list(diff.details) if diff else [], "report_truncated": False}
    if reason is not None:
        result["reason"] = reason
    result["report_truncated"] = bool(diff and diff.total > len(result["details"]))
    while len(json.dumps(result, ensure_ascii=False).encode("utf-8")) > MAX_REPORT and result["details"]:
        result["details"].pop(); result["report_truncated"] = True
    return result


def _run(baseline_bytes, baseline_pin, observation_bytes, evidence, policy):
    identities = {}
    for key, raw in (("baseline", baseline_bytes), ("raw_observation", observation_bytes)):
        if type(raw) is bytes and len(raw) <= MAX_INPUT:
            identities[key] = _identity(raw)
    if type(evidence) is dict:
        for key, field in (("context", "context_bytes"), ("manifest", "manifest_bytes"),
                           ("sqlb_raw_observation", "sqlb_observation_bytes")):
            raw = evidence.get(field)
            if type(raw) is bytes and len(raw) <= MAX_INPUT:
                identities[key] = _identity(raw)
    try:
        baseline, obs, identities = _bind(baseline_bytes, baseline_pin, observation_bytes, evidence, policy)
        if policy.retained:
            # Exact historical data has no retained name witness for role 16388.
            # Neither later evidence nor caller-provided mappings repair that run.
            raise _NotReady("DEFAULT_ACL_ROLE_NAME_WITNESS_MISSING")
        projection = _decode(evidence["sqlb_observation_bytes"])
        return _semantic(baseline, obs, projection, identities, policy.classification)
    except _NotReady as error:
        return _report("NOT_READY", policy.classification, identities, reason=str(error))
    except (TypeError, ValueError, KeyError, IndexError, RecursionError, UnicodeError):
        return _report("NOT_READY", policy.classification, identities, reason="INVALID_SCHEMA")


def compare(reviewed_baseline_bytes, externally_pinned_baseline_sha256,
            observation_bytes, context_evidence):
    """Historical-only public API. Pins are supplied by the external reviewer/operator.

    context_evidence has exactly context_bytes, manifest_bytes, manifest_sha256,
    sqlb_observation_bytes. Every serialized input is capped independently at 1 MiB.
    No callable, path, flags, freshness attestation or test-root selector is accepted.
    """
    return _run(reviewed_baseline_bytes, externally_pinned_baseline_sha256,
                observation_bytes, context_evidence, _HISTORICAL)
