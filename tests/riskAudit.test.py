import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('risk',ROOT/'releases/risk-audit.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class RiskAudit(unittest.TestCase):
    def setUp(self):
        (ROOT/'.tools/tmp').mkdir(parents=True,exist_ok=True)
        self.tmp=tempfile.TemporaryDirectory(dir=ROOT/'.tools/tmp')
        self.root=Path(self.tmp.name)
        self.file=self.root/'main.js'
        self.file.write_text('console.log("local diagnostics"); fetch("https://service.example/api");')
        self.policy={'roots':['.'],'initialized':True,'files':r.collect(self.root,{'roots':['.']})}
    def tearDown(self):self.tmp.cleanup()
    def test_ordinary_hash_changes_and_local_logging_do_not_block(self):
        self.file.write_text('console.log("more local diagnostics"); fetch("https://service.example/api");')
        r.inspect(self.root,self.policy)
    def test_new_urls_and_keywords_stop_with_evidence(self):
        for text,expected in [('fetch("https://new.example/upload?secret=redacted")','new URL'),('new TelemetryClient()','suspicious keyword')]:
            self.file.write_text(text)
            with self.assertRaisesRegex(ValueError,expected) as result:r.inspect(self.root,self.policy)
            self.assertNotIn('secret=',str(result.exception))
    def test_known_bad_hash_always_blocks_source_or_binary(self):
        self.policy['denyHashes']=[hashlib.sha256(self.file.read_bytes()).hexdigest()]
        with self.assertRaisesRegex(ValueError,'hash'):r.inspect(self.root,self.policy)
        with self.assertRaisesRegex(ValueError,'hash'):r.artifact(self.file,self.policy)
    def test_baselined_keyword_is_not_blanket_for_new_occurrences(self):
        self.file.write_text('/* TelemetryClient compatibility */')
        self.policy['files']=r.collect(self.root,self.policy)
        r.inspect(self.root,self.policy)
        self.file.write_text('/* TelemetryClient compatibility */ new TelemetryClient()')
        with self.assertRaisesRegex(ValueError,'keyword'):r.inspect(self.root,self.policy)
    def test_new_files_are_scanned_and_test_fixtures_are_not_runtime(self):
        (self.root/'tests').mkdir();(self.root/'tests/fixture.js').write_text('new TelemetryClient()')
        r.inspect(self.root,self.policy)
        (self.root/'new.js').write_text('new TelemetryClient()')
        with self.assertRaisesRegex(ValueError,'new.js'):r.inspect(self.root,self.policy)
    def test_artifact_urls_and_telemetry_signatures(self):
        r.artifact(self.file,{'artifactUrls':['https://service.example/api']})
        with self.assertRaisesRegex(ValueError,'New URL'):r.artifact(self.file,{'artifactUrls':[]})
        self.file.write_text('mongosh-telemetry.mongodb.com')
        with self.assertRaisesRegex(ValueError,'Telemetry indicator'):r.artifact(self.file,{})
    def test_cli_exit_code_blocks_findings_but_not_hash_drift(self):
        policy=self.root/'policy.json';policy.write_text(json.dumps(self.policy))
        self.policy['exclude']=['policy.json'];policy.write_text(json.dumps(self.policy))
        for text,code in [('console.log("local logging");',0),('fetch("https://new.example/report")',1)]:
            self.file.write_text(text)
            result=subprocess.run(['python3','-B',str(ROOT/'releases/risk-audit.py'),'--source',str(self.root),'--policy',str(policy)],capture_output=True,text=True)
            self.assertEqual(result.returncode,code,result.stdout+result.stderr)
if __name__=='__main__':unittest.main()
