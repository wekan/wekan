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
        with patch.object(r,'gh',return_value=json.dumps({'workflow_runs':rows})),patch.object(r.subprocess,'run') as run,\
             patch.object(r,'wait_for_rerun') as wait:
            r.recover('11.92','wekan/wekan')
            self.assertEqual(run.call_args_list[0].args[0],['gh','run','rerun','1','--failed','--repo','wekan/wekan'])
            self.assertEqual(len(run.call_args_list),1)
            self.assertEqual(wait.call_args.args,(1,1,'wekan/wekan'))
    def test_rerun_survives_github_api_errors(self):
        # A release recovery died on one HTTP 502 inside `gh run watch`.
        err=r.subprocess.CalledProcessError(1,['gh'],'HTTP 502: Server Error')
        answers=[json.dumps({'attempt':1,'status':'completed','conclusion':'failure'}),err,err,
                 json.dumps({'attempt':2,'status':'in_progress','conclusion':''}),err,
                 json.dumps({'attempt':2,'status':'completed','conclusion':'success'})]
        with patch.object(r,'gh',side_effect=answers) as gh:
            r.wait_for_rerun(5,1,'wekan/wekan',sleep=lambda s:None)
            self.assertEqual(gh.call_count,6)
            self.assertNotIn('watch',gh.call_args.args)
    def test_failed_rerun_or_lasting_api_outage_stops(self):
        with patch.object(r,'gh',return_value=json.dumps({'attempt':2,'status':'completed','conclusion':'failure'})):
            with self.assertRaises(ValueError):r.wait_for_rerun(5,1,'wekan/wekan',sleep=lambda s:None)
        err=r.subprocess.CalledProcessError(1,['gh'],'HTTP 502')
        with patch.object(r,'gh',side_effect=err) as gh:
            with self.assertRaises(ValueError):r.wait_for_rerun(5,1,'wekan/wekan',max_errors=3,sleep=lambda s:None)
            self.assertEqual(gh.call_count,3)
    def test_old_attempt_failure_is_not_the_answer(self):
        # Right after `rerun`, the run still shows attempt 1's failure.
        answers=[json.dumps({'attempt':1,'status':'completed','conclusion':'failure'}),
                 json.dumps({'attempt':2,'status':'completed','conclusion':'success'})]
        with patch.object(r,'gh',side_effect=answers):
            r.wait_for_rerun(5,1,'wekan/wekan',sleep=lambda s:None)
    def test_no_watch_anywhere_in_recovery(self):
        src=(Path(__file__).resolve().parent.parent/'releases/retry-failed-release.py').read_text()
        self.assertNotIn("'watch'",src)
    def test_successful_or_unknown_release_is_not_rebuilt(self):
        for rows in [[],[{'id':1,'display_title':'Release v11.92','status':'completed','conclusion':'success'}]]:
            with patch.object(r,'gh',return_value=json.dumps({'workflow_runs':rows})),patch.object(r.subprocess,'run') as run:
                r.recover('11.92','wekan/wekan');run.assert_not_called()
    def test_running_or_invalid_version_stops(self):
        rows=[{'id':1,'display_title':'Release v11.92','status':'in_progress','conclusion':None}]
        with patch.object(r,'gh',return_value=json.dumps({'workflow_runs':rows})),patch.object(r.subprocess,'run') as run:
            for version in ['11.92','invalid;exit 0']:
                with self.assertRaises(ValueError):r.recover(version,'wekan/wekan')
            run.assert_not_called()
    def test_legacy_run_found_from_release_commit(self):
        rows=[{'id':9,'display_title':'Release All','head_commit':{'message':'Prepare v11.92 release'},'status':'completed','conclusion':'failure'}]
        with patch.object(r,'gh',return_value=json.dumps({'workflow_runs':rows})),patch.object(r.subprocess,'run') as run,patch.object(r,'wait_for_rerun'):
            r.recover('11.92','wekan/wekan')
            self.assertEqual(run.call_args_list[0].args[0][3],'9')
    def test_pages_are_read_without_slurp(self):
        # gh before 2.48 has no --slurp; --paginate prints pages back to back.
        later=[{'id':7,'display_title':'Release v11.92','status':'completed','conclusion':'failure'}]
        pages=json.dumps({'workflow_runs':[]})+'\n'+json.dumps({'workflow_runs':later})
        with patch.object(r,'gh',return_value=pages) as gh,patch.object(r.subprocess,'run') as run,patch.object(r,'wait_for_rerun'):
            r.recover('11.92','wekan/wekan')
            self.assertEqual(run.call_args_list[0].args[0][3],'7')
            self.assertNotIn('--slurp',gh.call_args.args)
if __name__=='__main__':unittest.main()
