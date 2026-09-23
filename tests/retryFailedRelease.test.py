import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
import json
spec=importlib.util.spec_from_file_location('recovery',Path(__file__).resolve().parent.parent/'releases/retry-failed-release.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class Recovery(unittest.TestCase):
    def test_only_matching_failed_jobs_are_retried(self):
        rows=[{'id':2,'display_title':'Release v11.93','status':'completed','conclusion':'failure'},
              {'id':1,'display_title':'Release v11.92','status':'completed','conclusion':'failure'}]
        with patch.object(r,'gh',return_value=json.dumps([{'workflow_runs':rows}])),patch.object(r.subprocess,'run') as run:
            r.recover('11.92','wekan/wekan')
            self.assertEqual(run.call_args_list[0].args[0],['gh','run','rerun','1','--failed','--repo','wekan/wekan'])
            self.assertEqual(run.call_args_list[1].args[0][1:3],['run','watch'])
    def test_successful_or_unknown_release_is_not_rebuilt(self):
        for rows in [[],[{'id':1,'display_title':'Release v11.92','status':'completed','conclusion':'success'}]]:
            with patch.object(r,'gh',return_value=json.dumps([{'workflow_runs':rows}])),patch.object(r.subprocess,'run') as run:
                r.recover('11.92','wekan/wekan');run.assert_not_called()
    def test_running_or_invalid_version_stops(self):
        rows=[{'id':1,'display_title':'Release v11.92','status':'in_progress','conclusion':None}]
        with patch.object(r,'gh',return_value=json.dumps([{'workflow_runs':rows}])),patch.object(r.subprocess,'run') as run:
            for version in ['11.92','invalid;exit 0']:
                with self.assertRaises(ValueError):r.recover(version,'wekan/wekan')
            run.assert_not_called()
    def test_legacy_run_found_from_release_commit(self):
        rows=[{'id':9,'display_title':'Release All','head_commit':{'message':'Prepare v11.92 release'},'status':'completed','conclusion':'failure'}]
        with patch.object(r,'gh',return_value=json.dumps([{'workflow_runs':rows}])),patch.object(r.subprocess,'run') as run:
            r.recover('11.92','wekan/wekan')
            self.assertEqual(run.call_args_list[0].args[0][3],'9')
if __name__=='__main__':unittest.main()
