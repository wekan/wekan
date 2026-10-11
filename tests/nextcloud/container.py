#!/usr/bin/env python3
"""Container-specific acceptance checks. Requires a locally built ExApp image.

No image is published. The native matrix separately checks real AppAPI/HaRP flows.
"""
import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--image', required=True, help='Locally built ExApp image containing the tested source')
args = parser.parse_args()
if not shutil.which('docker'):
    parser.exit(2, 'Docker is unavailable: container acceptance checks are NOT RUN.\n')
root = Path(__file__).resolve().parents[2]
work = root / '.tools/nextcloud-runtime' / ('container-' + secrets.token_hex(6))
work.mkdir(parents=True, mode=0o700)
name = work.name

def docker(*cmd):
    return subprocess.check_output(['docker', *cmd], text=True).strip()

try:
    docker('run', '-d', '--name', name, '--network', 'none', '--mount', f'type=bind,source={work},target=/data',
           '-e', 'APP_ID=wekan', '-e', 'APP_VERSION=1.0.0', '-e', 'APP_SECRET=' + secrets.token_hex(24),
           '-e', 'APP_PORT=23000', '-e', 'APP_PERSISTENT_STORAGE=/data', '-e', 'NEXTCLOUD_URL=http://nextcloud.invalid', args.image)
    probe = '''const fs=require('fs');const assert=require('assert/strict');
      const dirs=['/data/wekan/files/db','/data/wekan/files/attachments','/data/wekan/files/avatars'];
      dirs.forEach(d=>assert.ok(fs.statSync(d).isDirectory()));
      const uid=fs.readFileSync('/proc/1/status','utf8').match(/^Uid:\\s+(\\d+)/m)[1];
      assert.notEqual(uid,'0');
      assert.ok(!fs.existsSync('/var/run/docker.sock'));
      fetch('http://127.0.0.1:23000/heartbeat').then(async r=>{assert.equal(r.status,200);console.log('ready')}).catch(()=>process.exit(1));'''
    deadline = time.monotonic() + 120
    while True:
        try:
            docker('exec', name, 'node', '-e', probe); break
        except subprocess.CalledProcessError:
            if time.monotonic() > deadline: raise
            time.sleep(1)
    inspect = json.loads(docker('inspect', name))[0]
    assert inspect['HostConfig']['Privileged'] is False
    assert inspect['HostConfig']['NetworkMode'] == 'none'
    assert all(m['Destination'] != '/var/run/docker.sock' for m in inspect['Mounts'])
    docker('exec', name, 'node', '-e', "require('fs').writeFileSync('/data/restart-proof','retained')")
    started = time.monotonic()
    docker('stop', '--time', '20', name)
    assert time.monotonic() - started < 20, 'Supervisor did not shut down before Docker forced it'
    assert json.loads(docker('inspect', name))[0]['State']['ExitCode'] == 0
    docker('start', name)
    assert docker('exec', name, 'cat', '/data/restart-proof') == 'retained'
    print('PASS container: privilege drop, private storage, heartbeat, no privileged mode/socket, bounded shutdown and restart')
finally:
    (work / 'container.log').write_text(docker('logs', name))
    docker('rm', '-f', name)
