'use strict';

// The Quay registry went read-only after Docker Hub had received a complete
// image. Exercise the actual Actions shell step with a mocked docker command.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/release-all.yml'), 'utf8');
const build = workflow.slice(workflow.indexOf('      - name: Build and push multi-arch image'));
const copy = workflow.slice(workflow.indexOf('      - name: Copy published manifest to Quay'));
const script = copy.match(/      - name: Copy published manifest to Quay\n        run: \|\n([\s\S]*?)(?=\n      - name: )/);
assert.ok(script, 'Quay copy step exists');
const shell = script[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');

test('the expensive build publishes to Docker Hub and GHCR without a Quay push', () => {
  const command = build.match(/docker buildx build \\\n([\s\S]*?)\n            \./);
  assert.ok(command, 'buildx command exists');
  assert.match(command[0], /wekanteam\/wekan:v\$\{VERSION\}/);
  assert.match(command[0], /ghcr\.io\/wekan\/wekan:v\$\{VERSION\}/);
  assert.doesNotMatch(command[0], /-t quay\.io\//);
  assert.match(copy, /docker buildx imagetools create/);
});

function runCopy(exit, message) {
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-quay-test-'));
  try {
    const docker = path.join(root, 'docker');
    const githubEnv = path.join(root, 'github-env');
    fs.writeFileSync(docker, '#!/bin/sh\nprintf "%s\\n" "$MOCK_DOCKER_MESSAGE"\nexit "$MOCK_DOCKER_EXIT"\n', { mode: 0o755 });
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', shell], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, VERSION: '11.80',
        GITHUB_ENV: githubEnv, MOCK_DOCKER_EXIT: String(exit), MOCK_DOCKER_MESSAGE: message },
    });
    return { status: result.status, output: result.stdout + result.stderr,
      env: fs.existsSync(githubEnv) ? fs.readFileSync(githubEnv, 'utf8') : '' };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('successful Quay copy is marked published', () => {
  const result = runCopy(0, 'manifest copied');
  assert.equal(result.status, 0);
  assert.match(result.env, /QUAY_PUBLISHED=true/);
});

test('Quay-wide read-only outage keeps available registries published', () => {
  const result = runCopy(1, 'denied: System is currently read-only. Pulls will succeed but all write operations are currently suspended.');
  assert.equal(result.status, 0);
  assert.match(result.output, /::warning::Quay is in read-only mode/);
  assert.match(result.env, /QUAY_PUBLISHED=false/);
});

test('permission failures still fail and do not mark Quay published', () => {
  const result = runCopy(1, 'unauthorized: access to the requested resource is not authorized');
  assert.equal(result.status, 1);
  assert.match(result.output, /::error::Could not copy/);
  assert.doesNotMatch(result.env, /QUAY_PUBLISHED=true/);
});

test('Quay manifest and public-pull checks run only when its copy succeeded', () => {
  assert.match(workflow, /name: Verify Quay manifest platforms\n        if: env\.QUAY_PUBLISHED == 'true'/);
  assert.match(workflow, /if \[ "\$\{QUAY_PUBLISHED:-false\}" = true \]; then\n            anon_check "quay\.io\/wekan\/wekan:v\$\{VERSION\}"/);
});

// v12.44: "stream error: stream ID 117; PROTOCOL_ERROR; received from peer" -
// an HTTP/2 reset on the way, not a refusal. It is retried; a refusal is not.
function runFlakyCopy(failures, message) {
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-quay-retry-'));
  try {
    const count = path.join(root, 'count');
    fs.writeFileSync(count, '0');
    fs.writeFileSync(path.join(root, 'docker'), `#!/bin/sh
n=$(($(cat "${count}") + 1)); echo "$n" > "${count}"
if [ "$n" -le ${failures} ]; then printf "%s\\n" "$MOCK_DOCKER_MESSAGE"; exit 1; fi
echo "manifest copied"; exit 0
`, { mode: 0o755 });
    fs.writeFileSync(path.join(root, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const githubEnv = path.join(root, 'github-env');
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', shell], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, VERSION: '11.80', GITHUB_ENV: githubEnv, MOCK_DOCKER_MESSAGE: message },
    });
    return { status: result.status, output: result.stdout + result.stderr, calls: Number(fs.readFileSync(count, 'utf8')),
      env: fs.existsSync(githubEnv) ? fs.readFileSync(githubEnv, 'utf8') : '' };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('a dropped connection on the way to Quay is retried, and then published', () => {
  const result = runFlakyCopy(2, 'ERROR: failed to copy: stream error: stream ID 117; PROTOCOL_ERROR; received from peer');
  assert.equal(result.status, 0, result.output);
  assert.equal(result.calls, 3);
  assert.match(result.output, /::warning::Quay copy attempt 1: a transport error; retrying\./);
  assert.match(result.env, /QUAY_PUBLISHED=true/);
});

test('a refusal is not retried, and a transport error that never clears still fails (negative)', () => {
  const refused = runFlakyCopy(9, 'unauthorized: access to the requested resource is not authorized');
  assert.equal(refused.status, 1);
  assert.equal(refused.calls, 1, 'one try only');
  const never = runFlakyCopy(9, 'stream error: PROTOCOL_ERROR');
  assert.equal(never.status, 1);
  assert.equal(never.calls, 4);
  assert.match(never.output, /::error::Could not copy/);
  assert.doesNotMatch(never.env, /QUAY_PUBLISHED=true/);
});
