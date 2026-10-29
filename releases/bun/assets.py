#!/usr/bin/env python3
"""Resolve release inputs once, verify Bun downloads, and package tested bundles."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent
TARGETS = json.loads((ROOT / 'targets.json').read_text(encoding='utf-8'))


def sha256_file(path):
    # hashlib.file_digest is Python 3.11+, and macOS still ships 3.9 as python3.
    digest = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def api(path):
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'wekan-bun-build'}
    if os.environ.get('GH_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GH_TOKEN']
    with urllib.request.urlopen(urllib.request.Request('https://api.github.com/' + path, headers=headers), timeout=60) as response:
        return json.load(response)


def validate_tag(tag):
    if not re.fullmatch(r'v[0-9]+\.[0-9]+(?:\.[0-9]+)?', tag):
        raise ValueError('Expected a WeKan release tag such as v12.33')
    return tag


def asset_name(tag, target):
    validate_tag(tag)
    if target not in {item['target'] for item in TARGETS}:
        raise ValueError('Unknown Bun target: ' + target)
    return f'wekan-{tag[1:]}-bun-{target}.zip'


def plan(release, bun_release, only='', missing=False):
    tag = validate_tag(release['tag_name'])
    if not re.fullmatch(r'bun-v[0-9]+\.[0-9]+\.[0-9]+', bun_release['tag_name']):
        raise ValueError('Expected a stable Bun release')
    if release.get('draft'):
        raise ValueError('Publish the WeKan release before attaching Bun bundles')
    supported = {item['asset'] for item in TARGETS}
    published = {item['name'] for item in bun_release['assets']}
    runtimes = {name for name in published if name.startswith('bun-') and name.endswith('.zip')
                and '-profile' not in name and '-baseline' not in name}
    if runtimes != supported:
        raise ValueError(f'Bun target catalog changed: missing={supported - runtimes}, new={runtimes - supported}')
    selectors = json.loads(only) if only else [item['target'] for item in TARGETS]
    if not isinstance(selectors, list) or not selectors or any(not isinstance(x, str) for x in selectors):
        raise ValueError('only must be a nonempty JSON array of target names')
    if set(selectors) - {item['target'] for item in TARGETS}:
        raise ValueError('Unknown target in only')
    existing = {item['name'] for item in release['assets']}
    rows = []
    for item in TARGETS:
        name = asset_name(tag, item['target'])
        if item['target'] in selectors and not (missing and {name, name + '.sha256sum'} <= existing):
            rows.append(item)
    # setup-bun expects semver; GitHub runtime download URLs need the full tag.
    return {'tag': tag, 'bun_tag': bun_release['tag_name'],
            'bun_version': bun_release['tag_name'].removeprefix('bun-v'),
            'matrix': {'include': rows}, 'count': len(rows)}


def download(url, destination, attempts=5):
    # Do not send the repository token to release asset/CDN URLs. A server
    # error is retried: one HTTP 500 from GitHub's CDN failed the windows-x64
    # Bun bundle of v12.44. A 4xx is not - the asset is not there.
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(url, timeout=120) as response, open(destination, 'wb') as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
            return
        except urllib.error.HTTPError as error:
            if error.code < 500 or attempt == attempts:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt == attempts:
                raise
        time.sleep(attempt * 10)


def fetch_runtime(bun_tag, target):
    if not re.fullmatch(r'bun-v[0-9]+\.[0-9]+\.[0-9]+', bun_tag):
        raise ValueError('Expected a stable Bun version tag')
    item = next(item for item in TARGETS if item['target'] == target)
    work = Path('.tools/tmp/bun-runtime')
    work.mkdir(parents=True, exist_ok=True)
    base = f'https://github.com/oven-sh/bun/releases/download/{bun_tag}/'
    archive = work / item['asset']
    sums = work / 'SHASUMS256.txt'
    download(base + item['asset'], archive)
    download(base + sums.name, sums)
    expected = next(line.split()[0] for line in sums.read_text(encoding='utf-8').splitlines()
                    if line.split()[-1].lstrip('*') == archive.name)
    actual = sha256_file(archive)
    if actual != expected:
        raise ValueError('Bun archive checksum mismatch')
    binary = 'bun.exe' if item['platform'] == 'win32' else 'bun'
    # Extract only the executable, never arbitrary archive paths.
    with zipfile.ZipFile(archive) as source:
        members = [name for name in source.namelist() if name.endswith('/' + binary)]
        if len(members) != 1:
            raise ValueError('Expected exactly one Bun executable')
        output = Path('bundle') / binary
        output.write_bytes(source.read(members[0]))
        output.chmod(0o755)
    (Path('bundle') / 'bun-build.json').write_text(json.dumps({
        'bun': bun_tag, 'target': target, 'runtime_sha256': actual,
        'wekan_commit': os.environ.get('WEKAN_COMMIT'),
    }, indent=2) + '\n', encoding='utf-8')


def package(tag, target):
    name = asset_name(tag, target)
    bundle = Path('bundle')
    if not (bundle / '.bun-smoke-ok').is_file():
        raise ValueError('Refusing to package a bundle without successful target smoke tests')
    (bundle / '.bun-smoke-ok').unlink()
    output = Path('dist')
    output.mkdir(exist_ok=True)
    with zipfile.ZipFile(output / name, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
        # Dereference dependency links, including directories, as the tar bundles did.
        # ZipFile.write records Unix executable permissions for Bun and launchers.
        for directory, directories, files in os.walk(bundle, followlinks=True):
            directories.sort()
            archive.write(directory)
            for filename in sorted(files):
                archive.write(Path(directory) / filename)
    digest = sha256_file(output / name)
    # LF on every platform: on Windows text mode wrote CRLF, and `sha256sum -c`
    # then looked for a file named "<zip>\r" (bun-single-file windows-arm64).
    # Path's write_text takes newline= only from Python 3.10; open() takes it on 3.9 too.
    with (output / (name + '.sha256sum')).open('w', encoding='utf-8', newline='\n') as sums:
        sums.write(f'{digest}  {name}\n')


if __name__ == '__main__':
    command, *args = sys.argv[1:]
    if command == 'plan':
        repository = os.environ['GITHUB_REPOSITORY']
        tag = os.environ.get('RELEASE_TAG', '')
        if tag:
            validate_tag(tag)
        release = api(f'repos/{repository}/releases/' + ('tags/' + tag if tag else 'latest'))
        result = plan(release, api('repos/oven-sh/bun/releases/latest'),
                      os.environ.get('ONLY', ''), os.environ.get('MISSING_ONLY') == 'true')
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as out:
            for key, value in result.items():
                out.write(f'{key}={json.dumps(value, separators=(",", ":")) if isinstance(value, dict) else value}\n')
    elif command == 'fetch':
        fetch_runtime(*args)
    elif command == 'package':
        package(*args)
    else:
        raise ValueError('Unknown command: ' + command)
