#!/usr/bin/env python3
"""Automated release indicators, not a comprehensive security certification.

Changed hashes alone never fail. Known-bad hashes, newly introduced suspicious
keywords and new URL literals fail with paths/evidence. Baseline edits are ordinary
maintainer configuration; no AI approval or whole-dependency review is required.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

SKIP = {'.git', '.tools', '_tools', '_patches', '_build', '.build', 'node_modules',
        '__pycache__', 'out', 'dist', 'coverage', 'test', 'tests', '__tests__',
        'fixtures', '__fixtures__', 'testdata', 'docs', 'old-CHANGELOG'}
EXTENSIONS = {'.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.go', '.py', '.sh',
              '.c', '.cc', '.cpp', '.h', '.hpp', '.rs', '.patch', '.bat', '.html', '.jade', '.json', '.yaml', '.yml', '.css'}
KEYWORDS = ('TelemetryClient', 'ThrottledAnalytics', 'sendTelemetry', 'emitApiCallTelemetry',
            'Sentry.init', '@sentry/', 'sentry-sdk', 'mixpanel', 'posthog',
            'api.segment.io', 'api.amplitude.com', 'mongosh-telemetry.mongodb.com',
            'beacon.ferretdb.com', 'activity.meteor.com')
# Standard package distribution URLs are dependency resolution, not usage reporting.
REGISTRY = ('https://registry.npmjs.org/', 'https://proxy.golang.org/', 'https://sum.golang.org/')
URL = re.compile(r'https?://[^\s\x00-\x20<>"\'`\\)\]}]+')


def collect(root, policy):
    root = Path(root).resolve()
    files = {}
    excluded = policy.get('exclude', [])
    def visit(path):
        rel = path.relative_to(root).as_posix()
        if any(rel == x or rel.startswith(x + '/') for x in excluded):
            return
        if path.is_symlink():
            # Never follow links outside the inspected tree.
            return
        if path.is_dir():
            for child in sorted(path.iterdir()):
                if child.name not in SKIP or (path != root and child.name in {'out', 'dist', '_build', '.build'}):
                    visit(child)
        elif path.is_file() and (path.suffix in EXTENSIONS or path.name in {
                'go.mod', 'go.sum', 'go.work', 'Cargo.toml', 'Cargo.lock',
                'requirements.txt', '.npmrc', 'packages', 'versions', 'release'}):
            if path.name.endswith(('_test.go', '.test.js', '.test.ts', '.spec.ts')):
                return
            data = path.read_bytes()
            text = data.decode('utf-8', errors='replace')
            if path.suffix == '.patch':
                text = '\n'.join(line[1:] for line in text.splitlines()
                                 if line.startswith('+') and not line.startswith('+++'))
            urls = sorted(set(u.rstrip('.,;:') for u in URL.findall(text)
                              if not u.startswith(REGISTRY)))
            keywords = {k: text.count(k) for k in KEYWORDS if k in text}
            files[rel] = {'sha256': hashlib.sha256(data).hexdigest(),
                          'urls': urls, 'keywords': keywords}
    for relative in policy.get('roots', ['.']):
        path = root / relative
        if path.exists():
            visit(path)
    return files


def inspect(root, policy):
    actual = collect(root, policy)
    baseline = policy.get('files', {})
    known_urls = set(policy.get('allowUrls', []))
    for entry in baseline.values():
        known_urls.update(entry.get('urls', []))
    initialized = policy.get('initialized', bool(baseline))
    if not initialized:
        print('::warning::No URL baseline yet; checking known hashes and keywords only.', file=sys.stderr)
    findings = []
    changed = 0
    for name, entry in actual.items():
        old = baseline.get(name, {})
        if entry['sha256'] != old.get('sha256'):
            changed += 1
        if entry['sha256'] in policy.get('denyHashes', []):
            findings.append(name + ': known telemetry/security hash ' + entry['sha256'])
        for keyword, count in entry['keywords'].items():
            if count > old.get('keywords', {}).get(keyword, 0):
                findings.append(name + ': new suspicious keyword ' + keyword)
        for url in entry['urls']:
            if initialized and url not in known_urls:
                # Do not expose query strings or credentials in logs.
                from urllib.parse import urlsplit
                parsed = urlsplit(url)
                findings.append(name + ': new URL origin ' + parsed.scheme + '://' + (parsed.hostname or '(dynamic)'))
    for name in set(baseline) - set(actual):
        changed += 1
    print(f'Automated dependency/source check: {len(actual)} files, {changed} changed hashes (informational).')
    if findings:
        raise ValueError('\n'.join(findings[:40]) +
                         ('\nAdditional findings omitted.' if len(findings) > 40 else '') +
                         '\nCheck these indicators; fix unwanted reporting or update the allowlist for legitimate URLs/keywords. No AI approval is required.')


def artifact(path, policy):
    data = Path(path).read_bytes()
    if not data:
        raise ValueError('Empty artifact: ' + str(path))
    if hashlib.sha256(data).hexdigest() in policy.get('denyHashes', []):
        raise ValueError('Known telemetry/security artifact hash: ' + str(path))
    if 'artifactUrls' in policy:
        for url in set(URL.findall(data.decode('utf-8', errors='ignore'))):
            if url not in policy['artifactUrls'] and not url.startswith(REGISTRY):
                raise ValueError('New URL literal in artifact: ' + str(path))
    for keyword in ('mongosh-telemetry.mongodb.com', 'beacon.ferretdb.com',
                    'api.segment.io/v1', 'api.mixpanel.com/track', 'api.amplitude.com/2/httpapi'):
        if keyword.encode() in data:
            raise ValueError('Telemetry indicator in artifact ' + str(path) + ': ' + keyword)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path)
    p.add_argument('--artifact', type=Path)
    p.add_argument('--record-baseline', action='store_true', help='record current source hashes/URLs/keywords as an explicit local baseline')
    p.add_argument('--policy', type=Path, default=Path(__file__).with_name('risk-baseline.json'))
    args = p.parse_args()
    try:
        try:
            policy = json.loads(args.policy.read_text())
        except (OSError, ValueError) as error:
            print('::warning::Indicator baseline unavailable: ' + str(error), file=sys.stderr)
            policy = {}
        if args.source and args.record_baseline:
            policy['files'] = collect(args.source, policy)
            policy['initialized'] = True
            args.policy.write_text(json.dumps(policy, indent=2) + '\n')
            print('Recorded indicator baseline: ' + str(args.policy))
        elif args.source:
            inspect(args.source, policy)
        if args.artifact:
            artifact(args.artifact, policy)
        if args.record_baseline and not args.source:
            p.error('--record-baseline requires --source')
        if not args.source and not args.artifact:
            p.error('specify --source or --artifact')
    except (ValueError, OSError) as error:
        print('::error::Automated risk indicators found: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
