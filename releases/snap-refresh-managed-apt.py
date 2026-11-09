#!/usr/bin/env python3
"""Recover stale APT state in Snapcraft's managed base or build instance.

Two failures are recoverable, and nothing else is:
- a .deb that 404s because the instance's package indexes are stale;
- "Failed to refresh package list: failed to run apt update" while installing
  build-packages, which is the Ubuntu archive being briefly unreachable or
  mid-sync (v13.02: every amd64 snap failed within eight minutes while the
  arm64 ones, served by ports.ubuntu.com, built). That one is retried with a
  backoff until apt-get update succeeds in the same instance, so the Snapcraft
  retry only runs once the archive answers again.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time

APT_UPDATE_FAILED = 'Failed to refresh package list: failed to run apt update'
# Waits before each further apt-get update attempt for an archive outage.
UPDATE_BACKOFF = (30, 60, 120, 240)
APT_DIAGNOSTIC = re.compile(r'(?:^|\s)(?:E:|W:|Err:)|Hash Sum mismatch|Failed to fetch|Could not resolve|'
                            r'Temporary failure|Connection failed|Unable to connect')


def apt_diagnostics(text, limit=20):
    """The apt error lines from a Snapcraft log, so the job says WHY apt failed."""
    text = text.replace('\\n', '\n')
    lines = [line.strip() for line in text.splitlines() if APT_DIAGNOSTIC.search(line)]
    return list(dict.fromkeys(lines))[-limit:]


def project_instance(text):
    # craft-providers logs each LXC command with shlex.join. Build and stage
    # packages are handled in the project instance, after base provisioning
    # finishes. Never fall back to the base here: changing it cannot repair its clone.
    if 'Failed to run snapcraft in instance' not in text:
        raise ValueError('Package failure is not from a failed managed Snapcraft build')
    instances = set(re.findall(
        r'lxc --project snapcraft exec local:(snapcraft-[a-zA-Z0-9-]+) ', text))
    if len(instances) != 1:
        raise ValueError('Cannot identify one failed Snapcraft build instance in the log')
    return instances.pop()


def is_update_failure(text):
    return APT_UPDATE_FAILED in text.replace('\\n', '\n')


def failed_instance(text):
    text = text.replace('\\n', '\n')
    if is_update_failure(text):
        return project_instance(text)
    if not re.search(
            r'Failed to fetch[^\n]*\.deb[^\n]*(?:\n[^\n]*)?404', text):
        raise ValueError('Not a managed APT package 404 or apt update failure; '
                         'refusing to retry this build failure')
    if 'Failed to fetch package:' in text:
        return project_instance(text)
    instances = re.findall(
        r'lxc --project snapcraft exec local:(base-instance-snapcraft-[a-zA-Z0-9-]+) '
        r'[^\n]*apt-get install', text) if 'Failed to install packages' in text else []
    if not instances:
        raise ValueError('No failed Snapcraft base instance identified in the log')
    return instances[-1]


def refresh(text, sleep=time.sleep):
    name = failed_instance(text)
    waits = UPDATE_BACKOFF if is_update_failure(text) else ()
    prefix = ['lxc', '--project', 'snapcraft']
    def run(args):
        return subprocess.run(prefix + args, check=True, text=True,
                              stdout=subprocess.PIPE, timeout=180)
    instances = json.loads(run(['list', 'local:' + name, '--format', 'json']).stdout)
    instance = next((item for item in instances if item['name'] == name), None)
    if instance is None:
        raise ValueError('Failed instance no longer exists: ' + name)
    stopped = instance['status'].lower() == 'stopped'
    if stopped:
        run(['start', 'local:' + name])
    elif instance['status'].lower() != 'running':
        raise ValueError('Cannot refresh instance in state ' + instance['status'])
    try:
        # craft-parts uses /var/lib/apt for stage-package indexes as well.
        # Refresh them in the guest; downloaded packages and part state stay intact.
        update = ['exec', 'local:' + name, '--', 'env', 'DEBIAN_FRONTEND=noninteractive',
                  'apt-get', '-o', 'Acquire::Retries=3',
                  '-o', 'APT::Update::Error-Mode=any', 'update']
        for attempt, wait in enumerate((0,) + tuple(waits), 1):
            if wait:
                print(f'apt-get update still failing; waiting {wait}s for the archive '
                      f'(attempt {attempt}/{len(waits) + 1}) ...', flush=True)
                sleep(wait)
            print('Refreshing APT indexes in failed Snapcraft instance ' + name, flush=True)
            try:
                result = run(update)
            except subprocess.CalledProcessError as error:
                if attempt > len(waits):
                    raise
                print((error.stdout or '').rstrip(), flush=True)
                continue
            print(result.stdout, end='')
            break
    finally:
        if stopped:
            run(['stop', 'local:' + name, '--timeout', '30'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--log', type=Path)
    args = parser.parse_args()
    try:
        log = args.log
        if log is None:
            state = Path(os.environ.get('XDG_STATE_HOME', str(Path.home() / '.local/state')))
            logs = list((state / 'snapcraft/log').glob('snapcraft-*.log'))
            if not logs:
                raise ValueError('No Snapcraft execution log found; original failure remains fatal')
            log = max(logs, key=lambda item: item.stat().st_mtime_ns)
        print('Inspecting ' + str(log), flush=True)
        text = log.read_text(encoding='utf-8', errors='replace')
        diagnostics = apt_diagnostics(text)
        if diagnostics:
            print('APT reported:\n  ' + '\n  '.join(diagnostics), flush=True)
        refresh(text)
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        parser.exit(1, str(error) + '\n')
