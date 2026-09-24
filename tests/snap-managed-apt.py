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

    def exercise(self, status='Stopped', fail=False, name=NAME):
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
                    recovery.refresh(LOG)
            elif name != NAME or status == 'Frozen':
                with self.assertRaises(ValueError):
                    recovery.refresh(LOG)
            else:
                recovery.refresh(LOG)
        return calls

    def test_stopped_instance_is_restored(self):
        calls = self.exercise()
        self.assertEqual([c[0] for c in calls], ['list', 'start', 'exec', 'stop'])
        self.assertEqual(calls[2], ['exec', 'local:' + NAME, '--', 'env',
                                  'DEBIAN_FRONTEND=noninteractive', 'apt-get', '-o',
                                  'Acquire::Retries=3', '-o', 'APT::Update::Error-Mode=any', 'update'])

    def test_running_instance_stays_running(self):
        self.assertEqual([c[0] for c in self.exercise('Running')], ['list', 'exec'])

    def test_update_failure_is_fatal_and_restores_state(self):
        self.assertEqual([c[0] for c in self.exercise(fail=True)], ['list', 'start', 'exec', 'stop'])

    def test_missing_and_frozen_instances_are_not_modified(self):
        self.assertEqual(len(self.exercise(name=NAME + '-other')), 1)
        self.assertEqual(len(self.exercise(status='Frozen')), 1)


if __name__ == '__main__':
    unittest.main()
