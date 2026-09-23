#!/usr/bin/env python3
"""Resolve stable runtime releases from official metadata, without modifying files."""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def stable(value, major):
    return bool(re.fullmatch(str(major) + r'\.\d+\.\d+', value))


def select(node, mongo, npm):
    nodes = [r['version'][1:] for r in node
             if stable(r.get('version', '')[1:], 26)
             and {'linux-x64', 'linux-arm64'} <= set(r.get('files', []))]
    mongos = []
    for release in mongo['versions']:
        version = release.get('version', '')
        if not stable(version, 7) or not version.startswith("7.0."):
            continue
        urls = {d.get('archive', {}).get('url') for d in release.get('downloads', [])}
        if all('https://fastdl.mongodb.org/linux/mongodb-linux-' + arch +
               '-ubuntu2204-' + version + '.tgz' in urls
               for arch in ('x86_64', 'aarch64')):
            mongos.append(version)
    npm_version = npm.get('version', '')
    if not nodes or not mongos or not stable(npm_version, 12):
        raise ValueError('No stable Node 26 / MongoDB 7.0 architecture pair or supported npm 12 release in metadata')
    key = lambda value: tuple(map(int, value.split('.')))
    return max(nodes, key=key), max(mongos, key=key), npm_version


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--metadata-dir', type=Path, help='offline metadata fixtures')
    args = parser.parse_args()
    data = []
    for name, url in [('node', 'https://nodejs.org/dist/index.json'),
                      ('mongo', 'https://downloads.mongodb.org/full.json'),
                      ('npm', 'https://registry.npmjs.org/npm/latest')]:
        if args.metadata_dir:
            raw = (args.metadata_dir / (name + '.json')).read_text()
        else:
            raw = subprocess.check_output(['curl', '-fsSL', '--retry', '2',
                '--connect-timeout', '15', '--max-time', '60', url], text=True)
        data.append(json.loads(raw))
    print(' '.join(select(*data)))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, subprocess.CalledProcessError) as error:
        sys.exit('Error resolving runtime versions: ' + str(error))
