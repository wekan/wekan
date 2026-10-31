#!/usr/bin/env python3
"""Fetch isolated Linux x86_64 test tools; never modify system installations."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tarfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / '.tools/nextcloud-runtime'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--version', required=True, help='Published WeKan bundle version to test, without v')
parser.add_argument('--majors', nargs='+', default=['32', '33', '34', '35'], choices=['32', '33', '34', '35'])
args = parser.parse_args()
if sys.version_info < (3, 12): parser.error('HaRP requires Python 3.12 or newer')
if platform.system() != 'Linux' or platform.machine() != 'x86_64':
    parser.error('This native bootstrap currently supports Linux x86_64; other hosts can use the deployed-stack tests.')
for version in [args.version]:
    if not re.fullmatch(r'\d+\.\d+(?:\.\d+)?', version): parser.error('Invalid WeKan version')
RUNTIME.mkdir(parents=True, exist_ok=True)
(ROOT / '.tools/tmp').mkdir(exist_ok=True)
env = {**os.environ, 'TMPDIR': str(ROOT / '.tools/tmp')}

def run(*command, cwd=ROOT):
    subprocess.run(list(map(str, command)), cwd=cwd, env=env, check=True)

def download(url, target, digest):
    target = RUNTIME / target
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == digest: return target
    temporary = target.with_suffix(target.suffix + '.part')
    run('curl', '-fL', '--retry', '3', '--max-time', '600', url, '-o', temporary)
    if hashlib.sha256(temporary.read_bytes()).hexdigest() != digest:
        raise RuntimeError(f'Checksum mismatch: {target.name}')
    temporary.replace(target)
    return target

def github_asset(repository, tag, name, target):
    with urllib.request.urlopen(f'https://api.github.com/repos/{repository}/releases/{tag}', timeout=60) as response:
        release = json.load(response)
    asset = next(a for a in release['assets'] if a['name'] == name)
    digest = asset.get('digest', '')
    if not digest.startswith('sha256:'): raise RuntimeError(f'No release asset checksum for {name}')
    return download(asset['browser_download_url'], target, digest.removeprefix('sha256:'))

# Server PHP and native console PHP are separate: FrankenPHP php-cli has upstream
# issue php/frankenphp#842 (headers_sent is true before Nextcloud reads config).
franken = github_asset('php/frankenphp', 'tags/v1.9.0', 'frankenphp-linux-x86_64', 'frankenphp')
franken.chmod(0o755)
archive = download('https://dl.static-php.dev/static-php-cli/common/php-8.4.21-cli-linux-x86_64.tar.gz',
                   'php-cli.tar.gz', 'aaf0d983d3641cb5493d3ae7e05c1075da62e278d15597bc5164a69a2e6dd684')
(RUNTIME / 'php-cli').mkdir(exist_ok=True)
with tarfile.open(archive) as t: t.extractall(RUNTIME / 'php-cli', filter='data')
node_version = re.search(r'NODE_VERSION[=:]([^\s]+)', (ROOT / 'Dockerfile').read_text()).group(1).lstrip('v')
node_dir = ROOT / f'.tools/node-v{node_version}-linux-x64/bin'
if not (node_dir / 'node').exists(): raise RuntimeError('Install the Dockerfile-selected Node.js with releases/ensure-tools.sh first')
env['PATH'] = str(node_dir) + os.pathsep + env['PATH']
release = (ROOT / '.meteor/release').read_text().strip().removeprefix('METEOR@')
meteor = ROOT / '.tools/.meteor/meteor'
if not meteor.exists():
    archive = ROOT / '.tools/tmp/meteor-nextcloud-bootstrap.tar.gz'
    run('curl', '-fL', '--retry', '3', '--max-time', '600',
        f'https://static.meteor.com/packages-bootstrap/{release}/meteor-bootstrap-os.linux.x86_64.tar.gz', '-o', archive)
    with tarfile.open(archive) as t: t.extractall(ROOT / '.tools', filter='data')
env['METEOR_WAREHOUSE_DIR'] = str(ROOT / '.tools/.meteor')
env['SANDBOX'] = 'true'  # as releases/tools-env.sh: or Meteor springboards forever
run(meteor, '--version')

for major in args.majors:
    url = f'https://download.nextcloud.com/server/releases/latest-{major}.zip'
    with urllib.request.urlopen(url + '.sha256', timeout=60) as r: digest = r.read().decode().split()[0]
    download(url, f'nextcloud-{major}.zip', digest)
wekan = github_asset('wekan/wekan', f'tags/v{args.version}', f'wekan-{args.version}-amd64.zip', 'wekan.zip')
# Keep downloaded artifacts separate from fresh run data. Extracting replaces code only.
with zipfile.ZipFile(wekan) as z:
    # Every member must land inside the target (zipfile also refuses '..' and
    # absolute names; this makes the check explicit for a downloaded archive).
    target = (RUNTIME / 'wekan').resolve()
    for name in z.namelist():
        if not (target / name).resolve().is_relative_to(target):
            raise RuntimeError(f'{wekan}: member outside the target: {name}')
    z.extractall(target)  # nosec B202 - every member was checked above
ferret = github_asset('wekan/FerretDB', 'latest', 'ferretdb-amd64', 'ferretdb')
ferret.chmod(0o755)
for name, remote, branch in [('nextcloud', 'wekan/nextcloud', 'main'), ('nextcloud-harp', 'nextcloud/HaRP', 'v0.4.5')]:
    if not (ROOT / '.tools' / name).exists():
        run('git', 'clone', '--depth', '1', '--branch', branch, f'https://github.com/{remote}.git', ROOT / '.tools' / name)
# Versions match the selected HaRP release's Dockerfile.
run('python3', '-m', 'venv', RUNTIME / 'harp-venv')
run(RUNTIME / 'harp-venv/bin/pip', 'install', '--cache-dir', RUNTIME / 'pip-cache', 'aiohttp', 'pydantic==2.13.4',
    'git+https://github.com/cloud-py-api/haproxy-python-spoa.git@f00f3f7b1b0f56e10052af6c0d07e81c5195d84d')
archive = download('https://www.haproxy.org/download/3.4/src/haproxy-3.4.4.tar.gz', 'haproxy.tar.gz',
                   'b0c5053c4d46840ecdee3925736fe9a3de6472559b43c69183d70e593d9133df')
if not (RUNTIME / 'haproxy-3.4.4/haproxy').exists():
    with tarfile.open(archive) as t: t.extractall(RUNTIME, filter='data')
    run('make', '-j4', 'TARGET=linux-glibc', 'USE_PROMEX=1', cwd=RUNTIME / 'haproxy-3.4.4')
archive = download('https://github.com/fatedier/frp/releases/download/v0.61.1/frp_0.61.1_linux_amd64.tar.gz',
                   'frp.tar.gz', 'bff260b68ca7b1461182a46c4f34e9709ba32764eed30a15dd94ac97f50a2c40')
with tarfile.open(archive) as t: t.extractall(RUNTIME, filter='data')
playwright = json.loads((ROOT / 'tests/playwright/package.json').read_text())
run(node_dir / 'npm', 'install', '--prefix', RUNTIME / 'browser', '--cache', RUNTIME / 'npm-cache',
    '@playwright/test@' + playwright['devDependencies']['@playwright/test'],
    'mongodb@' + playwright['dependencies']['mongodb'])
env['PLAYWRIGHT_BROWSERS_PATH'] = str(RUNTIME / 'browsers')
run(node_dir / 'node', RUNTIME / 'browser/node_modules/@playwright/test/cli.js', 'install', 'chromium')
(RUNTIME / 'versions.json').write_text(json.dumps({'wekan': args.version, 'node': node_version,
    'harp': '0.4.5', 'frp': '0.61.1', 'haproxy': '3.4.4', 'php_cli': '8.4.21', 'frankenphp': '1.9.0'}, indent=2) + '\n')
