const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('release launcher positive and negative behavior (no remote writes)', () => {
  for (const file of ['tests/remoteRelease.test.py', 'tests/retryFailedRelease.test.py', 'tests/riskAudit.test.py']) {
    const result = spawnSync('python3', ['-B', file], {cwd: root, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
});
test('shell and Windows menus expose both release actions', () => {
  for (const extension of ['sh', 'bat']) {
    const source = fs.readFileSync(path.join(root, 'build.' + extension), 'utf8');
    for (const label of ['Release All', 'Release All Missing']) assert.ok(source.includes(label));
    for (const script of ['release-all.sh', 'release-all-missing.sh']) assert.ok(source.includes(script));
  }
});
test('release version preparation keeps reviewed runtime dependencies without network', () => {
  const tmpRoot = path.join(root, '.tools/tmp');
  fs.mkdirSync(tmpRoot, {recursive: true});
  const tmp = fs.mkdtempSync(path.join(tmpRoot, 'keep-release-deps-'));
  try {
    const source = fs.readFileSync(path.join(root, 'releases/version.sh'), 'utf8');
    const start = source.indexOf('  if [ "${RELEASE_KEEP_DEPENDENCIES:-0}"');
    const end = source.indexOf('  elif [ "${USE_LOCAL_DEP_VERSIONS:-0}"', start);
    assert.ok(start > 0 && end > start);
    const script = 'set -e\ncurl() { exit 91; }\nget_current_version_from_file() { grep -oE "$2" "$1" | head -1; }\n' +
      source.slice(start, end) + '  fi\nprintf "%s %s" "$NEW_NODE" "$MONGO_VER"\n';
    fs.writeFileSync(path.join(tmp, 'Dockerfile'), 'ARG NODE_VERSION=v26.9.0\n');
    fs.writeFileSync(path.join(tmp, 'snapcraft.yaml'), 'mongodb-linux-${MONGO_ARCH}-ubuntu2204-7.0.24.tgz\n');
    const options = {cwd: tmp, encoding: 'utf8', env: {...process.env, RELEASE_KEEP_DEPENDENCIES: '1'}};
    const result = spawnSync('bash', ['-c', script], options);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '26.9.0 7.0.24');
    fs.writeFileSync(path.join(tmp, 'Dockerfile'), 'ARG NODE_VERSION=unknown\n');
    assert.notEqual(spawnSync('bash', ['-c', script], options).status, 0);
    const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-all.yml'), 'utf8');
    assert.ok(workflow.includes("RELEASE_KEEP_DEPENDENCIES: '1'"));
    assert.ok(workflow.includes('Recheck dependency review after version preparation'));
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
});
