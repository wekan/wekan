#!/usr/bin/env python3
"""Release gate: reviewed source plus known reporting implementations in artifacts.

A binary signature scan is a regression check, not proof of arbitrary program
behavior. Pair it with source review, locked dependencies and runtime tests.
"""
import argparse
import hashlib
import json
import mmap
from pathlib import Path
import sys
import zipfile

COMMON = (
    'mongosh-telemetry.mongodb.com', 'beacon.ferretdb.com', 'activity.meteor.com',
    'api.segment.io/v1/', 'api.segment.io/v1', 'api.mixpanel.com/track',
    'api.amplitude.com/2/httpapi', 'us.i.posthog.com', 'eu.i.posthog.com',
)
MONGOSH = (
    'Sending telemetry event', 'Persisted telemetry throttle state',
    'ThrottledAnalytics', 'KNOWN_AGENT_ENV_VARS', 'MONGOSH_TELEMETRY_ENDPOINT',
    '@mongodb-js/native-machine-id', '@mongodb-js/device-id', 'emitApiCallTelemetry',
)
CLOUD = (
    'azsdk-go-%s/%s',
    'github.com/Azure/azure-sdk-for-go/sdk/azcore/runtime.formatTelemetry',
    'github.com/aws/aws-sdk-go-v2/aws/middleware.addSDKMetadata',
    'github.com/aws/aws-sdk-go-v2/aws/middleware.buildFeatureMetrics',
)
NATIVE_CLOUD = ('x-client-sku', 'x-client-SKU', 'x-client-ver', 'x-client-Ver',
                'x-client-os', 'x-client-cpu')
TOOLS = {'bsondump', 'mongodump', 'mongoexport', 'mongofiles', 'mongoimport',
         'mongorestore', 'mongostat', 'mongotop'}
FERRET = (
    'internal/util/telemetry.(*Reporter).report',
    'internal/util/telemetry.(*Reporter).send',
)
TEXT = {'.js', '.mjs', '.cjs', '.json', '.html', '.wasm', '.node', '.go', '.ts', '.tsx', '.jsx'}


def scan_file(path, kind):
    path = Path(path)
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError('Missing or empty artifact: ' + str(path))
    signatures = COMMON
    if kind in ('wekan', 'mongosh'):
        signatures += MONGOSH
    if kind in ('wekan', 'mongo-tools'):
        signatures += CLOUD
    if kind == 'mongo-tools':
        signatures += NATIVE_CLOUD
    if kind in ('wekan', 'ferretdb'):
        signatures += FERRET
    with path.open('rb') as stream:
        with mmap.mmap(stream.fileno(), 0, access=mmap.ACCESS_READ) as data:
            found = [value for value in signatures if data.find(value.encode()) >= 0]
    if found:
        raise ValueError('Telemetry implementation remains in ' + str(path) + ': ' + ', '.join(found))


def scan_bundle(root):
    root = Path(root).resolve()
    if not (root / 'main.js').is_file() or not (root / 'programs/server').is_dir():
        raise ValueError('Not a complete WeKan bundle: ' + str(root))
    count = 0
    for path in root.rglob('*'):
        if path.is_symlink():
            target = path.resolve()
            if not target.is_relative_to(root):
                raise ValueError('Bundle symlink escapes audited tree: ' + str(path))
            continue  # its target is scanned at its real path
        if not path.is_file() or path.stat().st_size == 0:
            continue
        # Scan every shipped file, including minified code and native executables.
        kind = 'mongo-tools' if path.name.removesuffix('.exe') in TOOLS else 'wekan'
        scan_file(path, kind)
        count += 1
    print('Telemetry artifact audit passed: %s files in %s' % (count, root))



def scan_archive(path):
    # Stream members without extraction, including the Windows virtual bundle.
    signatures = COMMON + MONGOSH + CLOUD + FERRET
    overlap = max(map(len, signatures))
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if 'bundle/main.js' not in names or not any(n.startswith('bundle/programs/server/') for n in names):
            raise ValueError('Not a complete WeKan bundle archive: ' + str(path))
        for member in archive.infolist():
            if member.is_dir():
                continue
            member_signatures = signatures
            if Path(member.filename).name.removesuffix('.exe') in TOOLS:
                member_signatures += NATIVE_CLOUD
            with archive.open(member) as stream:
                tail = b''
                while True:
                    chunk = stream.read(1024 * 1024)
                    if not chunk:
                        break
                    data = tail + chunk
                    found = [v for v in member_signatures if v.encode() in data]
                    if found:
                        raise ValueError('Telemetry implementation remains in %s!%s: %s' %
                                         (path, member.filename, ', '.join(found)))
                    tail = data[-overlap:]
    print('Telemetry archive audit passed: ' + str(path))


def snapshot(root, policy):
    root = Path(root).resolve()
    paths = set()
    for name in policy['roots']:
        directory = root / name
        if not directory.is_dir():
            raise ValueError('Missing source directory: ' + str(directory))
        for path in directory.rglob('*'):
            relative = path.relative_to(root).as_posix()
            if any(part in policy.get('excludeDirectoryNames', []) for part in path.relative_to(root).parts):
                continue
            if any(relative == x or relative.startswith(x + '/') for x in policy.get('exclude', [])):
                continue
            if path.is_symlink():
                if not path.resolve().is_relative_to(root) or not path.resolve().is_file():
                    raise ValueError('Source symlink escapes audited files: ' + relative)
            if path.is_file():
                paths.add(path)
    for name in policy['files']:
        path = root / name
        if not path.is_file():
            raise ValueError('Missing source input: ' + name)
        paths.add(path)
    for path in root.iterdir():
        if path.suffix in TEXT - {'.json'} and path.is_file():
            paths.add(path)
    files = {}
    for path in sorted(paths):
        relative = path.relative_to(root).as_posix()
        content = path.read_bytes()
        if path.is_symlink():
            content = str(path.readlink()).encode() + b'\0' + content
        if policy.get('normalizeAppVersion') and relative in ('package.json', 'package-lock.json'):
            value = json.loads(content)
            value.pop('version', None)
            value.get('packages', {}).get('', {}).pop('version', None)
            content = json.dumps(value, sort_keys=True).encode()
        if b'\0' not in content:
            content = content.replace(b'\r\n', b'\n')
        files[relative] = hashlib.sha256(content).hexdigest()
    return files


def audit_source(root, manifest):
    actual = snapshot(root, manifest)
    changes = sorted(name for name in set(actual) | set(manifest['reviewed'])
                     if actual.get(name) != manifest['reviewed'].get(name))
    if changes:
        raise ValueError('Telemetry source review required for: ' + ', '.join(changes[:30]) +
                         (' (and more)' if len(changes) > 30 else '') +
                         '. Review default outbound reporting before updating telemetry-source.json.')
    print('Telemetry source audit passed: %s reviewed files' % len(actual))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    parser.add_argument('--bundle', type=Path)
    parser.add_argument('--archive', type=Path)
    parser.add_argument('--kind', choices=['wekan', 'mongosh', 'mongo-tools', 'ferretdb'])
    parser.add_argument('artifacts', nargs='*', type=Path)
    args = parser.parse_args()
    try:
        if args.source:
            manifest = json.loads(Path(__file__).with_name('telemetry-source.json').read_text())
            audit_source(args.source, manifest)
        if args.archive:
            scan_archive(args.archive)
        if args.bundle:
            scan_bundle(args.bundle)
        if args.artifacts:
            if not args.kind:
                raise ValueError('--kind is required for artifacts')
            for artifact in args.artifacts:
                scan_file(artifact, args.kind)
                print('Telemetry artifact audit passed: ' + str(artifact))
        if not (args.source or args.bundle or args.archive or args.artifacts):
            raise ValueError('Specify source, bundle or artifacts to audit')
    except (ValueError, OSError, KeyError, zipfile.BadZipFile, RuntimeError) as error:
        print('::error::Telemetry audit failed: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
