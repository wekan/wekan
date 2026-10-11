#!/usr/bin/env python3
"""Run real Nextcloud, AppAPI, HaRP, WeKan and SQLite/FerretDB inside .tools.

Prerequisites and coverage limitations are documented in the Nextcloud README.
No system packages, Docker socket, App Store access or production data are used.
"""
import argparse
import datetime
import json
import hashlib
import re
import os
from pathlib import Path
import secrets
import shutil
import signal
import socket
import subprocess
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / '.tools/nextcloud-runtime'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--major', choices=['32', '33', '34', '35'], default='32')
parser.add_argument('--frp-tls', action='store_true', help='Use real FRP with mutual TLS and a private Unix socket')
parser.add_argument('--subpath', default='', choices=['', '/cloud'], help='Test a Nextcloud installation below /cloud')
parser.add_argument('--candidate-bundle', help='Fresh source-built candidate under .tools; disables source preload for that bundle')
parser.add_argument('--candidate-version', help='Isolated AppAPI test version for the source candidate, e.g. 12.32.1')
parser.add_argument('--upgrade-from', help='Older prepared bundle directory (under .tools) for a real version upgrade')
parser.add_argument('--keep-running', action='store_true', help='Wait for Ctrl-C after tests for debugging')
args = parser.parse_args()
if args.candidate_bundle and not args.candidate_version:
    parser.error('--candidate-bundle requires an isolated --candidate-version')
if args.candidate_version and not re.fullmatch(r'\d+\.\d+\.\d+', args.candidate_version):
    parser.error('--candidate-version must be a three-part numeric test version')
if args.upgrade_from and not args.candidate_bundle:
    parser.error('--upgrade-from requires a distinct --candidate-bundle')
stamp = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
work = RUNTIME / f'run-{args.major}-{stamp}'
logs = ROOT / '.tools/log/nextcloud-tests' / stamp
work.mkdir(parents=True, mode=0o700)
logs.mkdir(parents=True, mode=0o700)
(ROOT / '.tools/tmp').mkdir(exist_ok=True)
env = {**os.environ, 'TMPDIR': str(ROOT / '.tools/tmp'), 'XDG_CONFIG_HOME': str(work / 'config'),
       'XDG_DATA_HOME': str(work / 'xdg-data'),
       'PATH': str(RUNTIME / 'php-cli') + os.pathsep + os.environ['PATH']}
node_version = re.search(r'NODE_VERSION[=:]([^\s]+)', (ROOT / 'Dockerfile').read_text()).group(1).lstrip('v')
node = Path(os.environ.get('NODE_BINARY', ROOT / f'.tools/node-v{node_version}-linux-x64/bin/node'))
php = RUNTIME / 'php-cli/php'
frankenphp = RUNTIME / 'frankenphp'
server = work / 'nextcloud'
bundle = Path(args.candidate_bundle).resolve() if args.candidate_bundle else RUNTIME / 'wekan/bundle'
if not bundle.is_relative_to(ROOT / '.tools'): raise ValueError('Candidate must be under .tools')
versions = json.loads((RUNTIME / 'versions.json').read_text())
release_version = args.candidate_version or versions['wekan']
app_version = '.'.join(str(int(v)) for v in release_version.split('.'))
if app_version.count('.') == 1: app_version += '.0'
children = []

def port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

ncport, hpport, spoaport, gatewayport, backendport, dbport, controlport = [port() for _ in range(7)]
ncurl = f'http://127.0.0.1:{ncport}{args.subpath}'
secret, hpkey, proxykey, password = [secrets.token_hex(24) for _ in range(4)]

def run(command, name='setup', extra=None):
    with (logs / f'{name}.log').open('ab') as out:
        try:
            result = subprocess.run([str(v) for v in command], env={**env, **(extra or {})}, cwd=ROOT,
                                    stdout=out, stderr=subprocess.STDOUT,
                                    timeout=900 if name.startswith('browser') else 300)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f'{name} timed out; inspect {logs}') from None
        if result.returncode:
            raise RuntimeError(f'{name} failed ({result.returncode}); see {logs / (name + chr(46) + "log")}')

def start(command, name, extra=None, cwd=ROOT):
    out = (logs / f'{name}.log').open('ab')
    proc = subprocess.Popen([str(v) for v in command], cwd=cwd, env={**env, **(extra or {})},
                            stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
    out.close()
    proc.test_name = name
    children.append(proc)
    return proc

def wait(url, seconds=120, expected=None):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        for child in children:
            if child.poll() is not None:
                raise RuntimeError(f'{child.test_name} exited ({child.returncode}); inspect {logs}')
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    if expected is None or json.load(response) == expected: return
        except (OSError, urllib.error.URLError, ValueError): pass
        time.sleep(.25)
    raise TimeoutError(url)

def occ(*arguments, extra=None):
    run([php, '-d', 'memory_limit=512M', server / 'occ', *arguments], extra=extra)

try:
    print(f'Nextcloud {args.major}: logs {logs}', flush=True)
    with zipfile.ZipFile(RUNTIME / f'nextcloud-{args.major}.zip') as archive: archive.extractall(work)
    # Nextcloud ships its matching AppAPI version; do not overlay an older release.
    occ('maintenance:install', '--database', 'sqlite', '--admin-user', 'ncadmin', '--admin-pass', password,
        '--data-dir', str(work / 'nc-data'))
    occ('config:system:set', 'trusted_domains', '1', '--value', f'127.0.0.1:{ncport}')
    occ('config:system:set', 'allow_local_remote_servers', '--type', 'boolean', '--value', 'true')
    occ('config:system:set', 'auth.bruteforce.protection.enabled', '--type', 'boolean', '--value', 'false')
    occ('config:system:set', 'overwrite.cli.url', '--value', ncurl)
    if args.subpath: occ('config:system:set', 'overwritewebroot', '--value', args.subpath)
    occ('app:enable', 'app_api')
    for username in ['alice', 'bob']:
        occ('user:add', username, '--password-from-env', extra={'OC_PASS': password})
    appenv = {'APP_ID': 'wekan', 'APP_SECRET': secret, 'APP_VERSION': app_version,
              'APP_PORT': str(gatewayport), 'APP_HOST': '127.0.0.1',
              'APP_PERSISTENT_STORAGE': str(work / 'storage'), 'NEXTCLOUD_URL': ncurl,
              'NEXTCLOUD_SERVER': str(server), 'NEXTCLOUD_ADMIN_USERS': '["ncadmin"]',
              'WEKAN_NEXTCLOUD_PROXY_KEY': proxykey, 'WEKAN_PUBLIC_URL': ncurl + '/exapps/wekan/',
              'WEKAN_BACKEND_PORT': str(backendport),
              'NEXTCLOUD_GATEWAY_MODULE': str(ROOT / '.tools/nextcloud/ex_app/gateway.mjs')}
    storage = work / 'storage/wekan/files'
    for directory in ['db', 'attachments', 'avatars']: (storage / directory).mkdir(parents=True)
    webroot = server
    if args.subpath:
        webroot = work / 'www'
        webroot.mkdir()
        (webroot / args.subpath.lstrip('/')).symlink_to(server, target_is_directory=True)
    caddy = work / 'Caddyfile'
    caddy.write_text('''{
  admin off
  auto_https off
  frankenphp {
    num_threads 4
  }
}
http://127.0.0.1:%d {
  handle %s/exapps/* {
    reverse_proxy 127.0.0.1:%d
  }
  %s {
    root * %s
    php_server
  }
}
''' % (ncport, args.subpath, hpport, 'handle', webroot))
    start([frankenphp, 'run', '--config', caddy, '--adapter', 'caddyfile'], 'nextcloud')
    wait(ncurl + '/status.php')
    occ('app_api:daemon:register', 'wekan-test', 'WeKan native integration tests', 'manual-install',
        'http', f'127.0.0.1:{hpport}', ncurl, '--harp', '--harp_exapp_direct',
        '--harp_frp_address', '127.0.0.1:8782', '--harp_shared_key', hpkey)
    harp = ROOT / '.tools/nextcloud-harp'
    config = (harp / 'haproxy.cfg.template').read_text()
    replacements = {'HP_LOG_LEVEL_HAPROXY': 'warning', 'HP_EXAPPS_ADDRESS': f'127.0.0.1:{hpport}',
                    'HP_SPOA_ADDRESS': f'127.0.0.1:{spoaport}', 'HP_TIMEOUT_CONNECT': '5s',
                    'HP_TIMEOUT_CLIENT': '60s', 'HP_TIMEOUT_SERVER': '60s', 'HP_TIMEOUT_TUNNEL': '60s'}
    for key, value in replacements.items(): config = config.replace('${' + key + '}', value)
    config = '\n'.join(line for line in config.splitlines() if not line.startswith('_HTTPS_FRONTEND_') and 'ca-base ' not in line)
    config = config.replace('/etc/haproxy/spoe-agent.conf', str(harp / 'spoe-agent.conf'))
    config = config.replace('127.0.0.1:8200', f'127.0.0.1:{controlport}')
    (work / 'haproxy.cfg').write_text(config + '\n')
    start([RUNTIME / 'harp-venv/bin/python', ROOT / 'tests/nextcloud/harp.py'], 'harp-agent',
          {'HP_CONTROL_PORT': str(controlport), 'HP_SHARED_KEY': hpkey, 'HP_LOG_LEVEL': 'WARNING', 'NC_INSTANCE_URL': ncurl, 'HP_SPOA_ADDRESS': f'127.0.0.1:{spoaport}'})
    wait(f'http://127.0.0.1:{controlport}/heartbeat')
    start([RUNTIME / 'haproxy-3.4.4/haproxy', '-db', '-f', work / 'haproxy.cfg'], 'haproxy')
    if args.frp_tls:
        frpport = port()
        certs = work / 'certs'
        certs.mkdir(mode=0o700)
        run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
             '-subj', '/CN=WeKan isolated test CA', '-keyout', certs / 'ca.key', '-out', certs / 'ca.crt'])
        for role, common, usage in [('server', 'harp.nc', 'serverAuth'), ('client', 'wekan', 'clientAuth')]:
            run(['openssl', 'req', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=' + common,
                 '-keyout', certs / (role + '.key'), '-out', certs / (role + '.csr')])
            extensions = certs / (role + '.ext')
            extensions.write_text('extendedKeyUsage=' + usage + '\nsubjectAltName=DNS:' + common + '\n')
            run(['openssl', 'x509', '-req', '-days', '1', '-in', certs / (role + '.csr'),
                 '-CA', certs / 'ca.crt', '-CAkey', certs / 'ca.key', '-CAcreateserial',
                 '-extfile', extensions, '-out', certs / (role + '.crt')])
        for key in certs.glob('*.key'): key.chmod(0o600)
        frps_config = work / 'frps.toml'
        frps_config.write_text(f'''bindAddr = "127.0.0.1"
bindPort = {frpport}
proxyBindAddr = "127.0.0.1"
transport.tls.force = true
transport.tls.certFile = "{certs}/server.crt"
transport.tls.keyFile = "{certs}/server.key"
transport.tls.trustedCaFile = "{certs}/ca.crt"
allowPorts = [{{single = {gatewayport}}}]
[[httpPlugins]]
addr = "127.0.0.1:{controlport}"
path = "/frp_handler"
ops = ["Login"]
''')
        start([RUNTIME / 'frp_0.61.1_linux_amd64/frps', '-c', frps_config], 'frps')
        appenv.update({'HP_SHARED_KEY': hpkey, 'HP_FRP_ADDRESS': '127.0.0.1', 'HP_FRP_PORT': str(frpport),
                       'NATIVE_FRP_SOCKET': str(work / 'gateway.sock'), 'NATIVE_FRP_CERTS': str(certs),
                       'NATIVE_FRP_CONFIG': str(work / 'frpc.toml')})

    tunnel_negatives_checked = False
    def start_wekan(selected_bundle=bundle):
        global tunnel_negatives_checked
        appenv['WEKAN_NEXTCLOUD_PROXY_KEY'] = secrets.token_hex(32)
        selected_version = release_version if selected_bundle == bundle else versions['wekan']
        parts = [str(int(v)) for v in selected_version.split('.')]
        appenv['APP_VERSION'] = '.'.join(parts + ['0'] * (3 - len(parts)))
        backend_env = {k: v for k, v in appenv.items() if k not in ['APP_SECRET', 'HP_SHARED_KEY']}
        first = len(children)
        start([RUNTIME / 'ferretdb', '--handler=sqlite', f'--sqlite-url=file:{storage / "db"}/',
               f'--listen-addr=127.0.0.1:{dbport}', '--debug-addr=127.0.0.1:0', '--telemetry=disable'], 'ferretdb')
        preload = [] if args.candidate_bundle and selected_bundle == bundle else ['--require', ROOT / 'tests/nextcloud/load-source.cjs']
        start([node, *preload, selected_bundle / 'main.js'], 'wekan',
              {**backend_env, 'NEXTCLOUD_EXAPP': 'true', 'PORT': str(backendport), 'BIND_IP': '127.0.0.1',
               'ROOT_URL': appenv['WEKAN_PUBLIC_URL'], 'MONGO_URL': f'mongodb://127.0.0.1:{dbport}/wekan',
               'WRITABLE_PATH': str(storage.parent), 'DDP_TRANSPORT': 'sockjs', 'HTTP_FORWARDED_COUNT': '0',
               'WITH_API': 'true', 'METEOR_POLLING_INTERVAL_MS': '1000', 'METEOR_POLLING_THROTTLE_MS': '100'}, cwd=selected_bundle)
        frpc_config = work / 'frpc.toml'
        if args.frp_tls: frpc_config.unlink(missing_ok=True)
        start([node, ROOT / 'tests/nextcloud/gateway.mjs'], 'gateway', appenv)
        if args.frp_tls:
            deadline = time.monotonic() + 30
            while not frpc_config.exists():
                if time.monotonic() > deadline: raise TimeoutError('Gateway did not prepare FRP configuration')
                time.sleep(.1)
            if not tunnel_negatives_checked:
                valid = frpc_config.read_text().replace('loginFailExit = false', 'loginFailExit = true')
                for label, invalid in [
                    ('wrong-secret', valid.replace('metadatas.token = ' + json.dumps(hpkey), 'metadatas.token = "invalid"')),
                    ('wrong-tls-name', valid.replace('serverName = "harp.nc"', 'serverName = "untrusted.invalid"')),
                ]:
                    rejected_config = work / ('frpc-' + label + '.toml')
                    rejected_config.write_text(invalid); rejected_config.chmod(0o600)
                    with (logs / ('frpc-' + label + '.log')).open('ab') as out:
                        result = subprocess.run([RUNTIME / 'frp_0.61.1_linux_amd64/frpc', '-c', rejected_config],
                                                stdout=out, stderr=subprocess.STDOUT, env=env, timeout=30)
                    if result.returncode == 0: raise AssertionError('FRP accepted ' + label)
                tunnel_negatives_checked = True
            start([RUNTIME / 'frp_0.61.1_linux_amd64/frpc', '-c', frpc_config], 'frpc')
        wait(f'http://127.0.0.1:{gatewayport}/heartbeat')
        wait(f'http://127.0.0.1:{backendport}{args.subpath}/exapps/wekan/_nextcloud/health', expected={'nextcloud': 1})
        return children[first:]

    def stop_wekan(processes):
        for child in reversed(processes):
            if child.poll() is None: os.killpg(child.pid, signal.SIGTERM)
        for child in processes:
            child.wait(timeout=20)
            children.remove(child)

    initial_bundle = Path(args.upgrade_from).resolve() if args.upgrade_from else bundle
    if not initial_bundle.is_relative_to(ROOT / '.tools'):
        raise ValueError('Upgrade fixture bundles must be under .tools')
    wekan_processes = start_wekan(initial_bundle)
    # Parse the real metadata, preserving its USER routes, rather than inventing a permissive route.
    import xml.etree.ElementTree as ET
    info = ET.parse(ROOT / '.tools/nextcloud/appinfo/info.xml').getroot()
    routes = [{'url': r.findtext('url'), 'verb': r.findtext('verb'),
               'access_level': {'PUBLIC': 0, 'USER': 1, 'ADMIN': 2}[r.findtext('access_level')]}
              for r in info.findall('./external-app/routes/route')]
    registration = {'id': 'wekan', 'name': 'WeKan', 'version': appenv['APP_VERSION'],
                    'port': gatewayport, 'secret': secret, 'routes': routes}
    occ('app_api:app:register', 'wekan', 'wekan-test', '--json-info', json.dumps(registration), '--wait-finish')
    fixture = {'url': appenv['WEKAN_PUBLIC_URL'], 'nextcloud': ncurl, 'password': password,
               'mongo': f'mongodb://127.0.0.1:{dbport}/wekan', 'storage': str(storage.parent),
               'gateway': f'http://127.0.0.1:{gatewayport}', 'secret': secret,
               'php': str(php), 'server': str(server), 'work': str(work)}
    fixturepath = work / 'fixture.json'
    fixturepath.write_text(json.dumps(fixture)); fixturepath.chmod(0o600)
    (logs / 'runtime.json').write_text(json.dumps({'major': args.major, 'subpath': args.subpath, 'transport': 'frp-mtls' if args.frp_tls else 'direct', 'work': str(work), 'url': fixture['url'], 'versions': versions,
        'baseline_source_transport_overlay': initial_bundle != bundle or not bool(args.candidate_bundle), 'candidate_source_transport_overlay': not bool(args.candidate_bundle), 'candidate_bundle': str(bundle),
        'candidate_test_version': args.candidate_version,
        'candidate_app_sha256': hashlib.sha256((bundle / 'programs/server/app/app.js').read_bytes()).hexdigest(),
        'baseline_app_sha256': hashlib.sha256((initial_bundle / 'programs/server/app/app.js').read_bytes()).hexdigest(),
        'companion_commit': subprocess.check_output(['git', '-C', ROOT / '.tools/nextcloud', 'rev-parse', 'HEAD'], text=True).strip(),
        'wekan_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()}))
    browserenv = {'WEKAN_NEXTCLOUD_FIXTURE': str(fixturepath),
                  'NODE_PATH': str(RUNTIME / 'browser/node_modules'),
                  'PLAYWRIGHT_BROWSERS_PATH': str(RUNTIME / 'browsers'),
                  'NEXTCLOUD_TEST_OUTPUT': str(logs / 'browser')}
    def browser_tests(phase=None):
        run([node, RUNTIME / 'browser/node_modules/@playwright/test/cli.js', 'test',
             '--config', ROOT / 'tests/nextcloud/playwright.config.cjs'], 'browser' + (('-' + phase) if phase else ''),
            {**browserenv, 'NEXTCLOUD_TEST_OUTPUT': str(logs / ('browser-' + phase if phase else 'browser')),
             **({'NEXTCLOUD_TEST_PHASE': phase} if phase else {})})

    browser_tests()
    stop_wekan(wekan_processes)
    backup = work / 'volume-backup'
    shutil.copytree(work / 'storage', backup)
    wekan_processes = start_wekan(initial_bundle)
    browser_tests('restart')
    if args.upgrade_from:
        stop_wekan(wekan_processes)
        wekan_processes = start_wekan(bundle)
        registration['version'] = app_version
        occ('app_api:app:update', 'wekan', '--json-info', json.dumps(registration), '--wait-finish')
        browser_tests('upgrade')
    stop_wekan(wekan_processes)
    # Restore the stopped full volume, including enabled state, database, and file bytes.
    (work / 'storage').rename(work / 'volume-before-restore')
    shutil.copytree(backup, work / 'storage')
    wekan_processes = start_wekan(bundle)
    browser_tests('backup-restore')
    print(f'PASS Nextcloud {args.major}; logs {logs}', flush=True)
    if args.keep_running:
        print('Services remain available until Ctrl-C.', flush=True)
        while True: time.sleep(1)
finally:
    for child in reversed(children):
        if child.poll() is None: os.killpg(child.pid, signal.SIGTERM)
    for child in children:
        try: child.wait(timeout=20)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL); child.wait()
