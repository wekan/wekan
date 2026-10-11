#!/usr/bin/env python3
"""Prepare and upload UCS app definitions. Portal writes run only in release CI.

No git refs are written. Published portal versions are immutable; retries finish
an existing draft. The Provider Portal still requires human/Univention approval.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

FILES = ('compose', 'preinst', 'inst', 'uinst', 'test', 'README_EN', 'README_DE')


def version(value):
    if not re.fullmatch(r'[0-9]+\.[0-9]+(?:\.[0-9]+)?', value):
        raise ValueError('Expected a numeric WeKan version without v')
    return value


def app_id(value):
    if not re.fullmatch(r'[0-9]+\.[0-9]+/wekan=[A-Za-z0-9][A-Za-z0-9. +_-]*', value):
        raise ValueError('Expected UCS-section/wekan=version, for example 4.4/wekan=6.09')
    return value


def images(compose, replacements):
    """Replace only active image lines and retain every prior reference/comment."""
    service = None
    seen = set()
    result = []
    for line in compose.splitlines(keepends=True):
        match = re.fullmatch(r'  (\w+):\s*\n?', line)
        if match:
            service = match[1]
        match = re.fullmatch(r'    image: (.+?)\s*\n?', line)
        if match and service in replacements:
            old = match[1].strip('"\'')
            new = replacements[service]
            if old != new:
                result.append(f'    # Image was: {old}\n')
            result.append(f'    image: {new}\n')
            seen.add(service)
        else:
            result.append(line)
    if seen != set(replacements):
        raise ValueError('Compose must contain both wekan and wekandb images')
    return ''.join(result)


def prepare(repo, output, release, database_image=''):
    release = version(release)
    source = Path(repo) / 'component'
    compose = (source / 'compose').read_text()
    if not database_image:
        database_image = re.search(r'^    image: (ghcr.io/wekan/ferretdb@sha256:[a-f0-9]{64})$', compose, re.M).group(1)
    if not re.fullmatch(r'ghcr\.io/wekan/ferretdb@sha256:[a-f0-9]{64}', database_image):
        raise ValueError('Pin the wekan/FerretDB v1 GHCR image by digest, not upstream FerretDB v2 or latest')
    app_image = f'ghcr.io/wekan/wekan:v{release}'
    helper_image = f'ghcr.io/wekan/wekan-ucs-migration:v{release}'
    destination = Path(output) / 'component'
    destination.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.copy2(source / name, destination / name)
    shutil.copytree(source / 'migration', destination / 'migration', dirs_exist_ok=True)
    (destination / 'compose').write_text(images(compose, {'wekan': app_image, 'wekandb': database_image}))
    hook = (destination / 'preinst').read_text()
    for key, value in [('image', app_image), ('helper', helper_image), ('dbimage', database_image)]:
        hook, count = re.subn(rf'^{key}=.*$', f'{key}={value}', hook, flags=re.M)
        if count != 1:
            raise ValueError(f'Missing/duplicate preinst {key}')
    (destination / 'preinst').write_text(hook)
    dockerfile = destination / 'migration/Dockerfile'
    dockerfile.write_text(re.sub(r'^ARG WEKAN_IMAGE=.*$', f'ARG WEKAN_IMAGE={app_image}', dockerfile.read_text(), flags=re.M))
    return {'app_image': app_image, 'helper_image': helper_image, 'database_image': database_image}


def catalog_versions(data):
    """Official CLI list --json is vendor -> app list -> versions."""
    if isinstance(data, dict):
        if all(key in data for key in ('id', 'version', 'ucs_version')):
            yield data
        for value in data.values():
            yield from catalog_versions(value)
    elif isinstance(data, list):
        for value in data:
            yield from catalog_versions(value)


def lookup(catalog, identifier):
    section, rest = app_id(identifier).split('/', 1)
    name, release = rest.split('=', 1)
    matches = [item for item in catalog_versions(catalog)
               if (item['ucs_version'], item['id'], item['version']) == (section, name, release)]
    # A top-level summary may duplicate a version: retain its published status.
    return next((item for item in matches if item.get('in_appcenter')), matches[0] if matches else None)


class Portal:
    def __init__(self, cli, username, password_file):
        self.cli = cli
        self.authentication = ['--noninteractive', '--username', username, '--pwdfile', str(password_file)]

    def call(self, action, *arguments, json_result=False):
        command = ['python3', self.cli, action, *self.authentication, *arguments]
        if json_result:
            command.append('--json')
        result = subprocess.run(command, text=True, capture_output=True)
        if result.returncode:
            # get/list output may contain private app settings. Never echo it.
            raise RuntimeError(f'Provider Portal {action} failed (exit {result.returncode}); check credentials, app access and CLI API version')
        return json.loads(result.stdout) if json_result else None


def plan(portal, source_app, target_app):
    catalog = portal.call('list', json_result=True)
    target = lookup(catalog, target_app)
    if target and target.get('in_appcenter'):
        return 'published'
    if not target and not lookup(catalog, source_app):
        raise ValueError('Source App Center version does not exist or is not accessible')
    return 'draft' if target else 'new'


def upload(portal, directory, source_app, target_app):
    files = [Path(directory) / 'component' / name for name in FILES]
    for file in files:
        if not file.is_file() or file.stat().st_size == 0:
            raise ValueError(f'Missing upload file: {file.name}')
    state = plan(portal, source_app, target_app)
    if state == 'published':
        return state
    if state == 'new':
        portal.call('new-version', source_app, target_app)
    portal.call('upload', target_app, *(str(file) for file in files))
    # The CLI's upload can skip missing files without returning an error, hence
    # the local checks above and a read-back of the critical migration pair.
    actual = portal.call('get', target_app, json_result=True)
    for name in ('compose', 'preinst'):
        expected = (Path(directory) / 'component' / name).read_text()
        if actual.get(name, '').replace('\r\n', '\n') != expected.replace('\r\n', '\n'):
            raise RuntimeError(f'Portal {name} read-back differs; release remains an unverified draft')
    return 'uploaded'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('prepare', 'plan', 'upload'))
    parser.add_argument('--version', required=True, type=version)
    parser.add_argument('--repo', default='univention')
    parser.add_argument('--directory', default='.tools/ucs-release')
    parser.add_argument('--cli', default='.tools/univention-appcenter-control')
    args = parser.parse_args()
    if args.action == 'prepare':
        result = prepare(args.repo, args.directory, args.version, os.getenv('UCS_FERRETDB_IMAGE', ''))
        print(json.dumps(result))
        if os.getenv('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
                for key, value in result.items():
                    output.write(f'{key}={value}\n')
        return
    source = app_id(os.environ['UCS_SOURCE_APP'])
    target = app_id(f"{os.environ['UCS_TARGET_UCS']}/wekan={args.version}")
    # TMPDIR is set to .tools/tmp by the workflow. Never put credentials in args.
    with tempfile.TemporaryDirectory(prefix='ucs-provider-') as temporary:
        password_file = Path(temporary) / 'password'
        password_file.write_text(os.environ['UNIVENTION_APP_PROVIDER_PASSWORD'])
        password_file.chmod(0o600)
        portal = Portal(args.cli, os.environ['UNIVENTION_APP_PROVIDER_USER'], password_file)
        result = plan(portal, source, target) if args.action == 'plan' else upload(portal, args.directory, source, target)
    print(f'{target}: {result}; production release still requires Univention approval')
    if os.getenv('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(f'skip={str(result == "published").lower()}\n')
            output.write(f'result={result}\n')


if __name__ == '__main__':
    main()
