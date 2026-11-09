import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    'recovery', Path(__file__).resolve().parents[1] / 'releases/snap-refresh-managed-apt.py')
recovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)
NAME = 'base-instance-snapcraft-buildd-base-v71--f02c2da881cfba9d7924'
LOG = ("Failed to install packages.\n* Command that failed: 'lxc --project snapcraft exec local:"
       + NAME + " -- env CRAFT_MANAGED_MODE=1 apt-get install -y python3-dev'\n"
       "* Command standard error output: b'E: Failed to fetch "
       "http://security.ubuntu.com/ubuntu/pool/main/e/expat/"
       "libexpat1-dev_2.6.1-2ubuntu0.6_amd64.deb  404  Not Found [IP: 91.189.91.83 80]\\n'")
BUILD = 'snapcraft-wekan-ondra-amd64-123456'
STAGE_LOG = (LOG.split('* Command standard error')[0]
             + 'Executing in container: /snap/bin/lxc --project snapcraft exec local:' + BUILD
             + ' --cwd /root/project --mode non-interactive -- env CRAFT_MANAGED_MODE=1 snapcraft pack\n'
             "Failed to fetch package: The item '/root/.cache/snapcraft/download/"
             "libcurl4t64_8.5.0-2ubuntu10.15_amd64.deb' could not be fetched: "
             '404  Not Found [IP: 91.189.91.82 80].\nFailed to run snapcraft in instance\n')
# v13.02 amd64: build-packages could not run apt update in the project
# instance while the amd64 archive was unreachable.
UPDATE_LOG = ('Executing in container: /snap/bin/lxc --project snapcraft exec local:' + BUILD
              + ' --cwd /root/project --mode non-interactive -- env CRAFT_MANAGED_MODE=1 snapcraft pack\n'
              ':: Installing build-packages\n'
              ':: E: Failed to fetch http://archive.ubuntu.com/ubuntu/dists/noble-updates/InRelease  '
              'Could not connect to archive.ubuntu.com:80 (185.125.190.81), connection timed out\n'
              ':: W: Some index files failed to download. They have been ignored, or old ones used instead.\n'
              'Failed to refresh package list: failed to run apt update.\n'
              'Failed to run snapcraft in instance\n')


class RecoveryTests(unittest.TestCase):
    def test_reported_package_failure(self):
        self.assertEqual(recovery.failed_instance(LOG), NAME)
        self.assertEqual(recovery.failed_instance(LOG.replace('\n', '\\n')), NAME)

    def test_unrelated_errors_are_fatal(self):
        for log in [LOG.replace('404', '403'), LOG.replace('.deb', '.tar.gz'),
                    LOG.replace('Failed to install packages.', 'Build failed'),
                    LOG.replace(NAME, 'unrelated-container')]:
            with self.subTest(log=log), self.assertRaises(ValueError):
                recovery.failed_instance(log)

    def test_stage_failure_selects_project_not_base(self):
        self.assertEqual(recovery.failed_instance(STAGE_LOG), BUILD)
        self.assertEqual(recovery.failed_instance(STAGE_LOG.replace('\n', '\\n')), BUILD)
        for text in [STAGE_LOG.replace('404', '403'),
                     STAGE_LOG.replace(BUILD, 'other-container'),
                     STAGE_LOG + '\nlxc --project snapcraft exec local:snapcraft-other-123 -- env',
                     STAGE_LOG.replace('Failed to run snapcraft in instance', '')]:
            with self.subTest(text=text), self.assertRaises(ValueError):
                recovery.failed_instance(text)

    def test_apt_update_failure_selects_project_instance(self):
        self.assertEqual(recovery.failed_instance(UPDATE_LOG), BUILD)
        self.assertEqual(recovery.failed_instance(UPDATE_LOG.replace('\n', '\\n')), BUILD)
        for text in [UPDATE_LOG.replace('Failed to run snapcraft in instance', ''),
                     UPDATE_LOG.replace(BUILD, 'other-container'),
                     UPDATE_LOG + 'lxc --project snapcraft exec local:snapcraft-other-123 -- env\n',
                     UPDATE_LOG.replace('failed to run apt update', 'failed to run apt upgrade'),
                     'Build failed\nFailed to run snapcraft in instance\n'
                     'lxc --project snapcraft exec local:' + BUILD + ' -- env\n']:
            with self.subTest(text=text), self.assertRaises(ValueError):
                recovery.failed_instance(text)

    def test_apt_diagnostics_say_why(self):
        lines = recovery.apt_diagnostics(UPDATE_LOG)
        self.assertEqual(len(lines), 2)
        self.assertIn('Could not connect to archive.ubuntu.com', lines[0])
        self.assertIn('Some index files failed', lines[1])
        self.assertEqual(recovery.apt_diagnostics('Building\nStaged\n'), [])

    def exercise_update(self, failures, status='Stopped'):
        """apt-get update fails `failures` times, then succeeds."""
        calls, sleeps, left = [], [], [failures]
        def run(args, **kwargs):
            self.assertTrue(kwargs['check'])
            calls.append(args[3:])
            if args[3] == 'list':
                return subprocess.CompletedProcess(args, 0, json.dumps([{'name': BUILD, 'status': status}]))
            if args[3] == 'exec':
                self.assertEqual(args[-1], 'update')
                if left[0]:
                    left[0] -= 1
                    raise subprocess.CalledProcessError(100, args, 'E: Could not connect')
            return subprocess.CompletedProcess(args, 0, '')
        with patch.object(recovery.subprocess, 'run', side_effect=run):
            if failures > len(recovery.UPDATE_BACKOFF):
                with self.assertRaises(subprocess.CalledProcessError):
                    recovery.refresh(UPDATE_LOG, sleep=sleeps.append)
            else:
                recovery.refresh(UPDATE_LOG, sleep=sleeps.append)
        return [c[0] for c in calls], sleeps

    def test_apt_update_outage_waits_until_the_archive_answers(self):
        self.assertEqual(self.exercise_update(0), (['list', 'start', 'exec', 'stop'], []))
        calls, sleeps = self.exercise_update(2)
        self.assertEqual(calls, ['list', 'start', 'exec', 'exec', 'exec', 'stop'])
        self.assertEqual(sleeps, list(recovery.UPDATE_BACKOFF[:2]))

    def test_apt_update_outage_that_never_ends_is_fatal_and_bounded(self):
        calls, sleeps = self.exercise_update(len(recovery.UPDATE_BACKOFF) + 1)
        self.assertEqual(calls.count('exec'), len(recovery.UPDATE_BACKOFF) + 1)
        self.assertEqual(calls[-1], 'stop')
        self.assertEqual(sleeps, list(recovery.UPDATE_BACKOFF))
        # Bounded well inside the 90-minute snap-variants job.
        self.assertLess(sum(recovery.UPDATE_BACKOFF), 15 * 60)

    def test_package_404_is_refreshed_once_without_waiting(self):
        sleeps = []
        def run(args, **kwargs):
            if args[3] == 'list':
                return subprocess.CompletedProcess(args, 0, json.dumps([{'name': NAME, 'status': 'Running'}]))
            raise subprocess.CalledProcessError(100, args)
        with patch.object(recovery.subprocess, 'run', side_effect=run):
            with self.assertRaises(subprocess.CalledProcessError):
                recovery.refresh(LOG, sleep=sleeps.append)
        self.assertEqual(sleeps, [])

    def exercise(self, status='Stopped', fail=False, name=NAME, log=LOG):
        calls = []
        def run(args, **kwargs):
            self.assertEqual(args[:3], ['lxc', '--project', 'snapcraft'])
            self.assertTrue(kwargs['check'])
            self.assertEqual(kwargs['timeout'], 180)
            calls.append(args[3:])
            if args[3] == 'list':
                return subprocess.CompletedProcess(args, 0, json.dumps([{'name': name, 'status': status}]))
            if fail and args[3] == 'exec':
                raise subprocess.CalledProcessError(100, args)
            return subprocess.CompletedProcess(args, 0, '')
        with patch.object(recovery.subprocess, 'run', side_effect=run):
            if fail:
                with self.assertRaises(subprocess.CalledProcessError):
                    recovery.refresh(log)
            elif name != recovery.failed_instance(log) or status == 'Frozen':
                with self.assertRaises(ValueError):
                    recovery.refresh(log)
            else:
                recovery.refresh(log)
        return calls

    def test_stopped_instance_is_restored(self):
        calls = self.exercise()
        self.assertEqual([c[0] for c in calls], ['list', 'start', 'exec', 'stop'])
        self.assertEqual(calls[2], ['exec', 'local:' + NAME, '--', 'env',
                                  'DEBIAN_FRONTEND=noninteractive', 'apt-get', '-o',
                                  'Acquire::Retries=3', '-o', 'APT::Update::Error-Mode=any', 'update'])

    def test_running_instance_stays_running(self):
        self.assertEqual([c[0] for c in self.exercise('Running')], ['list', 'exec'])

    def test_stage_refresh_and_failure_restore_project_state(self):
        for fail in [False, True]:
            calls = self.exercise(name=BUILD, log=STAGE_LOG, fail=fail)
            self.assertEqual([c[0] for c in calls], ['list', 'start', 'exec', 'stop'])
            self.assertTrue(all(c[1] == 'local:' + BUILD for c in calls))

    def test_update_failure_is_fatal_and_restores_state(self):
        self.assertEqual([c[0] for c in self.exercise(fail=True)], ['list', 'start', 'exec', 'stop'])

    def test_missing_and_frozen_instances_are_not_modified(self):
        self.assertEqual(len(self.exercise(name=NAME + '-other')), 1)
        self.assertEqual(len(self.exercise(status='Frozen')), 1)


if __name__ == '__main__':
    unittest.main()
