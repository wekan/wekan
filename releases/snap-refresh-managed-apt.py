#!/usr/bin/env python3
"""Recover stale .deb URLs in Snapcraft's managed base or build instance."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess


def failed_instance(text):
    text = text.replace('\\n', '\n')
    if not re.search(
            r'Failed to fetch[^\n]*\.deb[^\n]*(?:\n[^\n]*)?404', text):
        raise ValueError('Not a managed APT package 404; refusing to retry this build failure')
    if 'Failed to fetch package:' in text:
        if 'Failed to run snapcraft in instance' not in text:
            raise ValueError('Stage-package 404 is not from a failed managed Snapcraft build')
        # craft-providers logs each LXC command with shlex.join. Stage packages
        # are fetched in the project instance, after base provisioning finishes.
        # Never fall back to the base here: changing it cannot repair its clone.
        instances = set(re.findall(
            r'lxc --project snapcraft exec local:(snapcraft-[a-zA-Z0-9-]+) ', text))
        if len(instances) != 1:
            raise ValueError('Cannot identify one failed Snapcraft build instance in the log')
        return instances.pop()
    instances = re.findall(
        r'lxc --project snapcraft exec local:(base-instance-snapcraft-[a-zA-Z0-9-]+) '
        r'[^\n]*apt-get install', text) if 'Failed to install packages' in text else []
    if not instances:
        raise ValueError('No failed Snapcraft base instance identified in the log')
    return instances[-1]


def refresh(text):
    name = failed_instance(text)
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
        print('Refreshing APT indexes in failed Snapcraft instance ' + name, flush=True)
        result = run(['exec', 'local:' + name, '--', 'env', 'DEBIAN_FRONTEND=noninteractive',
                      'apt-get', '-o', 'Acquire::Retries=3',
                      '-o', 'APT::Update::Error-Mode=any', 'update'])
        print(result.stdout, end='')
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
        refresh(log.read_text(errors='replace'))
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        parser.exit(1, str(error) + '\n')
