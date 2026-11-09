from pathlib import Path
import datetime
import hashlib
import json
import os
import stat
import subprocess
import sys

root = Path(sys.argv[1]).resolve()
evidence = root / "evidence"
frozen = root / "frozen-source"
project = frozen / "workspaces/univeracademy"
original = Path("/tmp/univeracademy-r03-candidate-v4-vv6_2lg3")
original_project = original / "repo/workspaces/univeracademy"
inventory = original / "publication-inventory.json"
expected_inventory = "5b08a48024f59a4cd950dc9b48b47b2fa8f9514a5c4ae721329809593dbd4ccd"
expected_manifest = "fff9bf605dbed5c2a53b4f3e6c6409dfe45255e131c9a05985ae16f257053850"
expected_source = "afcb1e1af61c2ab44fa8b4e501463c304c57d283d535ba929d77e57748ea4f86"

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n")

def original_package_check():
    assert sha(inventory) == expected_inventory
    assert sha(original / "evidence/source-manifest.json") == expected_manifest
    files = json.loads(inventory.read_text())["files"]
    for row in files:
        path = Path(row["local_authoritative_path"])
        assert path.stat().st_size == row["bytes"] and sha(path) == row["sha256"]
    return {"files": len(files), "bytes": sum(row["bytes"] for row in files),
            "inventory_sha256": expected_inventory, "all_match": True}

def source_snapshot():
    rows, symlinks, directories = [], [], []
    for directory, names, files in os.walk(frozen, followlinks=False):
        path = Path(directory)
        directories.append({"path": str(path.relative_to(frozen)) or ".",
                            "mode": oct(stat.S_IMODE(path.stat().st_mode))})
        assert stat.S_IMODE(path.stat().st_mode) == 0o555
        for name in list(names):
            child = path / name
            if child.is_symlink():
                names.remove(name)
                symlinks.append({"path": str(child.relative_to(frozen)),
                                 "resolved_target": str(child.resolve())})
        for name in files:
            child = path / name
            assert not child.is_symlink()
            relative = child.relative_to(frozen)
            counterpart = original / "repo" / relative
            assert child.read_bytes() == counterpart.read_bytes()
            assert not os.path.samefile(child, counterpart)
            mode = stat.S_IMODE(child.stat().st_mode)
            assert mode == 0o444
            rows.append({"path": str(relative), "bytes": child.stat().st_size,
                         "sha256": sha(child), "mode": oct(mode),
                         "original_counterpart_equal": True, "distinct_inode_from_original": True})
    rows.sort(key=lambda row: row["path"])
    symlinks.sort(key=lambda row: row["path"])
    directories.sort(key=lambda row: row["path"])
    assert len(rows) == 345
    locks = [row for row in rows if row["path"].endswith("package-lock.json")]
    return {"scope": "All345 copied tracked files including source/test/doc/config and every committed lockfile; dependencies excluded",
            "frozen_source_root": str(frozen), "original_source_root": str(original / "repo"),
            "files": rows, "lockfiles": locks, "directories": directories,
            "dependency_symlinks": symlinks,
            "permission_limit": "0444/0555 modes plus pre/post bytes/inodes; no claim of kernel immutable protection or transient write-attempt instrumentation"}

assert not os.path.samefile(project, original_project)
package_before = original_package_check()
before = source_snapshot()
write(evidence / "sources-locks.before.json", before)
helper = project / "supabase/functions/univeracademy-api/membership-activity.ts"
assert sha(helper) == expected_source
command = ["npm", "run", "typecheck"]
overrides = {"npm_config_cache": str(root / "npm-cache"),
             "npm_config_update_notifier": "false"}
environment = os.environ.copy()
environment.update(overrides)
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
result = subprocess.run(command, cwd=project, env=environment, text=True,
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
finished = datetime.datetime.now(datetime.timezone.utc).isoformat()
log = evidence / "typecheck.log"
log.write_text(result.stdout)
after = source_snapshot()
write(evidence / "sources-locks.after.json", after)
package_after = original_package_check()
assert before == after and package_before == package_after
assert sha(evidence / "sources-locks.before.json") == sha(evidence / "sources-locks.after.json")
metadata = {
    "status": "SUPPLEMENTARY_ISOLATED_R03_V4_TYPECHECK_NOT_REPLACEMENT_OF_ORIGINAL_RUN",
    "reason": "Original persisted patch parity metadata omitted cwd; no original retained runner script proved historical isolation. Fresh isolated typecheck authorized as provenance correction.",
    "historical_parity_cwd": None,
    "historical_parity_cwd_status": "NOT_PROVEN_FROM_SAVED_METADATA_NOT_INFERRED_FROM_CURRENT_DIRECTORY",
    "original_typecheck_cwd": str(original_project),
    "actual_cwd": str(project.resolve()),
    "actual_cwd_device_inode": [project.stat().st_dev, project.stat().st_ino],
    "original_cwd_device_inode": [original_project.stat().st_dev, original_project.stat().st_ino],
    "cwd_distinct_from_original": True,
    "runner_path": str(Path(__file__).resolve()), "runner_sha256": sha(Path(__file__)),
    "runner_invocation": [sys.executable, str(Path(__file__).resolve()), str(root)],
    "command": command, "environment_overrides": overrides,
    "literal_command": "npm_config_cache=" + overrides["npm_config_cache"] + " npm_config_update_notifier=false npm run typecheck",
    "start_utc": started, "end_utc": finished, "exit": result.returncode,
    "log_sha256": sha(log), "log_bytes": log.stat().st_size,
    "source_manifest_sha256": expected_manifest, "helper_sha256_before_after": expected_source,
    "source_snapshot_before_sha256": sha(evidence / "sources-locks.before.json"),
    "source_snapshot_after_sha256": sha(evidence / "sources-locks.after.json"),
    "copied_tracked_files": len(before["files"]),
    "all_source_and_lock_bytes_before_after_equal": True,
    "lockfiles": before["lockfiles"],
    "original_approved_proposal_package_before": package_before,
    "original_approved_proposal_package_after": package_after,
    "original_package_files_or_inventory_modified": False,
    "tests_run": False, "commit_upload_push": False,
    "branch_remote_real_services_other_environment": False,
    "independent_QA": False,
    "dependency_limit": "Uses existing same-executor dependencies via read-through symlinks; their lockfiles are frozen copied sources. This is compiler validation, not dependency reinstallation or real services.",
}
write(evidence / "typecheck-supplement.json", metadata)
print(json.dumps(metadata, indent=2))
print("SUPPLEMENTARY_TYPECHECK_EXIT", result.returncode)
sys.exit(result.returncode)
