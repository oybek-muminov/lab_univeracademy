"""Restore the ORIGINAL author case JSON bytes; no checkout relabelling.
Usage: python reconstruct_case_evidence.py PACK [OUTPUT]
Without OUTPUT, only verifies and prints the original identity/counts.
No dependencies, network, repository writes or runtime test invocation.
"""
import copy, hashlib, json, sys
from pathlib import Path

def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')

def object_key(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')).hexdigest()

def restore(pack):
    assert pack['schema'] == 'ua-case-object-pack-v1'
    assert pack['serialization'] == {'encoding':'utf-8', 'indent':2, 'ensure_ascii':False, 'trailing_lf':True}
    data = copy.deepcopy(pack['payload'])
    assert data['base'] == pack['embedded_base_label']
    objects = pack['objects']; used = set(); slots = set()
    for key, value in objects.items():
        assert isinstance(value, (dict, list)) and object_key(value) == key
    for index, field, key in pack['references']:
        assert isinstance(index, int) and 0 <= index < len(data['results'])
        assert (index, field) not in slots and field in data['results'][index]
        assert data['results'][index][field] is None and key in objects
        data['results'][index][field] = copy.deepcopy(objects[key])
        slots.add((index, field)); used.add(key)
    assert used == set(objects)
    raw = encoded(data)
    assert len(raw) == pack['original']['bytes']
    assert hashlib.sha256(raw).hexdigest() == pack['original']['sha256']
    assert len(data['results']) == data['case_count']
    assert sum(c['verdict']=='PASS' for c in data['results']) == data['pass']
    assert sum(c['verdict']=='FAIL' for c in data['results']) == data['fail']
    return raw

if __name__ == '__main__':
    assert len(sys.argv) in (2, 3), __doc__
    pack = json.loads(Path(sys.argv[1]).read_text())
    raw = restore(pack); data = json.loads(raw)
    if len(sys.argv) == 3:
        Path(sys.argv[2]).write_bytes(raw)
    print(json.dumps({'bytes':len(raw), 'sha256':hashlib.sha256(raw).hexdigest(),
        'actual_execution_base':pack['actual_execution_base'], 'embedded_base_label':data['base'],
        'cases':data['case_count'], 'pass':data['pass'], 'fail':data['fail'], 'verified':True}))
