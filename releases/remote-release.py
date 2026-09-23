#!/usr/bin/env python3
"""Human-run release launcher. --check and --audit never prepare or publish a release.

Identical standalone copies live in the six release repositories. Review records
are comparison baselines; findings are advisory and never require AI approval.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

DEPENDENCY_NAMES = {
    'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock',
    'pnpm-lock.yaml', 'go.mod', 'go.sum', 'go.work', 'go.work.sum', 'Cargo.toml',
    'Cargo.lock', 'requirements.txt', 'pyproject.toml', 'poetry.lock', 'uv.lock',
    'Gemfile', 'Gemfile.lock', 'composer.json', 'composer.lock', 'packages',
    'versions', 'release', 'node-major.txt',
}


def run(root, *args):
    return subprocess.check_output(args, cwd=root, text=True).strip()


def inventory(root):
    # Includes untracked, non-ignored manifests: git add --all would publish them.
    names = run(root, 'git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0')
    result = {}
    for name in sorted(set(names)):
        path = root / name
        if not name or path.name not in DEPENDENCY_NAMES:
            continue
        if path.name in {'packages', 'versions', 'release'} and not name.startswith('.meteor/'):
            continue
        if not path.exists():
            continue
        if path.is_symlink() or not path.is_file():
            raise ValueError('Dependency metadata must be a regular file: ' + name)
        data = path.read_bytes().replace(b'\r\n', b'\n')
        if path.name in {'package.json', 'package-lock.json'}:
            doc = json.loads(data)
            # A release number is not a dependency change. Nested package versions
            # remain covered, including every resolved package in the lockfile.
            if name in {'package.json', 'package-lock.json'}:
                doc.pop('version', None)
            if name == 'package-lock.json':
                doc.get('packages', {}).get('', {}).pop('version', None)
            data = json.dumps(doc, sort_keys=True, separators=(',', ':')).encode()
        result[name] = hashlib.sha256(data).hexdigest()
    return result


def audit(root, config):
    """Best-effort diagnostics only; never approve or block dependency changes."""
    warnings = []
    try:
        expected = json.loads((root / 'releases/dependency-review.json').read_text())
        actual = inventory(root)
        changes = sorted(k for k in set(actual) | set(expected['files'])
                         if actual.get(k) != expected['files'].get(k))
        if changes:
            warnings.append('Dependency fingerprints changed: ' + ', '.join(changes))
        for name in actual:
            text = (root / name).read_text(errors='replace')
            keywords = sorted(set(re.findall(r'(?i)telemetry|segment|mixpanel|amplitude|posthog|sentry', text)))
            if keywords:
                warnings.append('Dependency keyword hints in ' + name + ': ' + ', '.join(keywords))
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        warnings.append('Dependency inventory unavailable: ' + str(error))
    for command in config.get('audits', []):
        try:
            result = subprocess.run(command, cwd=root, check=False)
            if result.returncode:
                warnings.append('Source audit reported findings or could not complete: ' + ' '.join(command))
        except OSError as error:
            warnings.append('Source audit unavailable: ' + str(error))
    for warning in warnings:
        print('::warning::' + warning, file=sys.stderr)
    indicator = config.get('indicatorCommand')
    if indicator:
        result = subprocess.run(indicator, cwd=root, check=False)
        if result.returncode == 1:
            raise ValueError('Automated source/dependency risk indicators found; see findings above.')
        if result.returncode:
            print('::warning::Indicator scan could not complete; continuing best effort.', file=sys.stderr)
    print('Best-effort dependency audit completed' +
          (' with warnings; release may continue.' if warnings else '; no metadata changes found.'), flush=True)


def notes(root, config, missing=False):
    text = (root / 'CHANGELOG.md').read_text()
    heading = config['upcoming']
    if missing and heading not in text.splitlines():
        # Completing a release does not require new notes or a new version.
        if re.search(r'^#{1,2} (?:\[)?(?:v\d|main-|[0-9a-f]{40})', text, re.M):
            return text
    if text.splitlines().count(heading) != 1:
        raise ValueError('CHANGELOG.md must have exactly one ' + heading)
    rest = text.split(heading + '\n', 1)[1]
    body = re.split(r'^#{1,2} (?!#)', rest, maxsplit=1, flags=re.M)[0]
    if not re.search(r'<summary>.*?<a href=|^- \S', body, re.M):
        raise ValueError('Upcoming must contain real changelog entries before releasing.')
    return text


def source_version(root, config, requested=''):
    upstream = config.get('upstream')
    if not upstream:
        return requested
    try:
        record = json.loads((root / upstream['review']).read_text())
    except (ValueError, OSError):
        record = {}
    approved = record.get('upstreamCommit') or ''
    if config['kind'] == 'node':
        version = requested or run(root, 'bash', 'releases/newest-release.sh', str(root))
        major = (root / 'node-major.txt').read_text().strip()
        if not re.fullmatch(r'v' + re.escape(major) + r'\.\d+\.\d+', version):
            raise ValueError('Invalid Node release tag')
        lines = run(root, 'git', 'ls-remote', upstream['url'], 'refs/tags/' + version,
                    'refs/tags/' + version + '^{}').splitlines()
        sha = lines[-1].split()[0] if lines else ''
    elif config['kind'] == 'mongosh':
        result = json.loads(run(root, 'node', 'releases/resolve-source.mjs', requested))
        sha, version = result['commit'], result['release']
    else:
        # mongo-tools uses an immutable commit as the release/build identity.
        ref = requested or 'master'
        if re.fullmatch(r'master-[0-9a-f]{7,12}', ref) and approved.startswith(ref.split('-')[1]):
            sha = approved
        elif re.fullmatch('[0-9a-f]{40}', ref):
            sha = ref
        else:
            lines = run(root, 'git', 'ls-remote', upstream['url'], 'refs/heads/' + ref,
                        'refs/tags/' + ref, 'refs/tags/' + ref + '^{}').splitlines()
            sha = lines[-1].split()[0] if lines else ''
        version = sha
    if not re.fullmatch('[0-9a-f]{40}', sha):
        raise ValueError('Unable to resolve an immutable upstream commit')
    if sha != approved:
        print('::warning::Upstream fingerprint changed or has no baseline: ' + sha +
              '. Continuing with best-effort dependency checks.', file=sys.stderr)
    return version


def latest(root, config):
    # Network/API errors are fatal; never mistake an outage for a first release.
    rows = json.loads(run(root, 'gh', 'api', '--paginate', '--slurp',
                          'repos/' + config['repo'] + '/releases?per_page=100'))
    return [x['tag_name'] for page in rows for x in page if not x['draft']]


def prepare_version(root, config, text, missing, requested):
    kind = config['kind']
    if kind in {'node', 'mongosh', 'mongo-tools'}:
        if not missing:
            return source_version(root, config, requested)
        published = latest(root, config)
        version = requested or (published[0] if published else '')
        if version not in published:
            raise ValueError('Release All Missing needs an existing published release.')
        source_version(root, config, version)
        return version
    published = latest(root, config)
    if missing:
        version = requested or (published[0] if published else '')
        if version not in published:
            raise ValueError('Release All Missing needs an existing published release.')
        return version
    if kind == 'ferretdb':
        local = re.findall(r'^## \[(v1\.\d+\.\d+)\]\(https://github.com/wekan/FerretDB/', text, re.M)
        remote_tags = run(root, 'git', 'ls-remote', '--tags', 'origin', 'refs/tags/v1.*')
        remote = re.findall(r'refs/tags/(v1\.\d+\.\d+)(?:\^\{\})?(?:\n|$)', remote_tags)
        versions = [v for v in published + local + remote + run(root, 'git', 'tag', '--list').splitlines()
                    if re.fullmatch(r'v1\.\d+\.\d+', v)]
        if not versions:
            raise ValueError('No previous FerretDB v1 version found.')
        newest = max(versions, key=lambda v: tuple(map(int, v[1:].split('.'))))
        version = run(root, 'bash', 'build/ferretdb/next-version.sh', newest)
    else:
        versions = published + re.findall(r'^# (v\d+) ', text, re.M)
        version = 'v' + str(max([int(v[1:]) for v in versions if re.fullmatch(r'v\d+', v)] + [0]) + 1)
    if requested and requested != version:
        raise ValueError('Expected next version ' + version)
    return version


def publish(root, config, text, version, missing):
    branch = config['branch']
    if not missing:
        date = datetime.date.today().isoformat()
        if config['kind'] == 'ferretdb':
            heading = f"## [{version}](https://github.com/{config['repo']}/releases/tag/{version}) ({date})"
        else:
            heading = f"# {version} {date} {config['repo'].split('/')[1]} release"
        (root / 'CHANGELOG.md').write_text(text.replace(config['upcoming'], heading, 1))
    run(root, 'git', 'add', '--all')
    if run(root, 'git', 'diff', '--cached', '--name-only'):
        subprocess.run(['git', 'commit', '-m', ('Complete ' if missing else 'Prepare ') + version + ' release'], cwd=root, check=True)
    subprocess.run(['git', 'push', 'origin', 'HEAD:refs/heads/' + branch], cwd=root, check=True)
    workflow = 'release-all-missing.yml' if missing else 'release-all.yml'
    if config['kind'] == 'wekan':
        version = version.removeprefix('v')
    subprocess.run(['gh', 'workflow', 'run', workflow, '--repo', config['repo'],
                    '--ref', branch, '-f', 'version=' + version], cwd=root, check=True)
    print('Dispatched ' + workflow + ' for ' + version)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['all', 'missing'], nargs='?', default='all')
    parser.add_argument('version', nargs='?', default='')
    parser.add_argument('--check', action='store_true', help='read-only full preflight (uses network)')
    parser.add_argument('--upstream-version', action='store_true', help='verify upstream review and print immutable build input')
    parser.add_argument('--audit', action='store_true', help='offline dependency/source audit only')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    config = json.loads((root / 'releases/remote-release.json').read_text())
    os.environ['DO_NOT_TRACK'] = '1'
    os.environ['GOTELEMETRY'] = 'off'
    (root / '.tools/tmp').mkdir(parents=True, exist_ok=True)
    os.environ['TMPDIR'] = str(root / '.tools/tmp')
    if args.upstream_version:
        print(source_version(root, config, args.version))
        return
    if args.audit:
        audit(root, config)
        return
    text = notes(root, config, args.mode == 'missing')
    audit(root, config)
    if run(root, 'git', 'branch', '--show-current') != config['branch']:
        raise ValueError('Release from ' + config['branch'] + ' only.')
    remote = run(root, 'git', 'remote', 'get-url', 'origin')
    if remote not in ['https://github.com/' + config['repo'] + '.git',
                      'https://github.com/' + config['repo'],
                      'git@github.com:' + config['repo'] + '.git']:
        raise ValueError('origin must point to ' + config['repo'])
    if run(root, 'git', 'diff', '--name-only', '--diff-filter=U'):
        raise ValueError('Resolve merge conflicts before releasing.')
    run(root, 'gh', 'auth', 'status')
    version = prepare_version(root, config, text, args.mode == 'missing', args.version)
    print('Release preflight passed: ' + version, flush=True)
    if not args.check:
        publish(root, config, text, version, args.mode == 'missing')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('::error::Release stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
