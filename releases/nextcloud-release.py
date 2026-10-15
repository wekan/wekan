#!/usr/bin/env python3
"""Validate Nextcloud metadata and detect an already-published app release."""
import argparse
import json
import os
from pathlib import Path
import re
import tarfile
import urllib.request
import xml.etree.ElementTree as ET


def app_version(release):
    if not re.fullmatch(r'[0-9]+\.[0-9]+(?:\.[0-9]+)?', release):
        raise ValueError('Expected a numeric WeKan version without v')
    parts = [str(int(part)) for part in release.split('.')]
    if len(parts) == 2:
        parts.append('0')
    return '.'.join(parts)


def prepare(info, release):
    tree = ET.parse(info)
    root = tree.getroot()
    name = root.findtext('id', '')
    if not re.fullmatch('[a-z_]+', name):
        raise ValueError('Invalid Nextcloud app id')
    current = root.find('version')
    image_tag = root.find('external-app/docker-install/image-tag')
    if current is None or image_tag is None:
        raise ValueError('Missing app version or ExApp docker image tag')
    current.text = app_version(release)
    image_tag.text = 'v' + release
    tree.write(info, encoding='utf-8', xml_declaration=True)
    return name


def published(catalog, name, release):
    if not isinstance(catalog, list):
        raise ValueError('Unexpected App Store catalog response')
    wanted = app_version(release)
    return any(app.get('id') == name and any(item.get('version') == wanted
               for item in app.get('releases', [])) for app in catalog)


def verify_archive(archive, name, release):
    with tarfile.open(archive, 'r:gz') as package:
        seen = set()
        for member in package.getmembers():
            parts = Path(member.name).parts
            private = {'.git', '.tools', '.env', 'node_modules', '__pycache__'}
            if (not parts or parts[0] != name or '..' in parts or private.intersection(parts)
                    or Path(member.name).is_absolute() or parts in seen
                    or not (member.isfile() or member.isdir())
                    or any(part.endswith(('.key', '.pem', '.p12', '.pfx')) for part in parts)):
                raise ValueError('Unsafe or private archive member')
            seen.add(parts)
        info = package.getmember(f'{name}/appinfo/info.xml')
        if not info.isfile() or info.size > 1024 * 1024:
            raise ValueError('Invalid packaged metadata')
        root = ET.fromstring(package.extractfile(info).read())
        if root.findtext('id') != name or root.findtext('version') != app_version(release):
            raise ValueError('Archive belongs to a different app or release')
        if root.findtext('external-app/docker-install/image-tag') != 'v' + release:
            raise ValueError('Archive references a different ExApp image')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', required=True)
    parser.add_argument('--info', default='exapp/appinfo/info.xml')
    parser.add_argument('--archive')
    parser.add_argument('--app-id')
    args = parser.parse_args()
    app_version(args.version)
    if args.archive:
        verify_archive(args.archive, args.app_id, args.version)
        return
    # Read the authoritative public catalog before changing any remote resource.
    name = ET.parse(args.info).getroot().findtext('id', '')
    if not re.fullmatch('[a-z_]+', name):
        raise ValueError('Invalid Nextcloud app id')
    with urllib.request.urlopen('https://apps.nextcloud.com/api/v1/apps.json', timeout=60) as response:
        exists = published(json.load(response), name, args.version)
    if not exists:
        name = prepare(args.info, args.version)
    if os.getenv('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write(f'app_id={name}\nskip={str(exists).lower()}\n')
    print('Nextcloud: already published' if exists else 'Nextcloud: publication needed')


if __name__ == '__main__':
    main()
