const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => readFileSync(path.join(root, f), 'utf8');

test('current checkout has a reviewed telemetry source inventory', () => {
  const result = spawnSync('python3', ['-B', 'releases/check-telemetry.py', '--source', '.'], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('source and binary telemetry gates reject regressions while preserving local logging', () => {
  const result = spawnSync('python3', ['-B', 'tests/release-telemetry.py'], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('both releases and every repack path enforce the gates', () => {
  const launcher = read('releases/release-all.sh');
  const preflight = launcher.indexOf('python3 "$REPO_DIR/releases/check-telemetry.py" --source "$REPO_DIR"');
  assert.ok(preflight > 0);
  for (const later of ['ensure_tools git gh', 'bash "$(dirname "$0")/fix-changelog-hashes.sh"',
    'git add --all', '\n  git push', 'gh workflow run']) {
    assert.ok(launcher.indexOf(later) > preflight, `${later} must follow the source audit`);
  }
  for (const file of ['release-all.yml', 'release-all-missing.yml']) {
    assert.match(read('.github/workflows/' + file), /check-telemetry.py --source/);
  }
  const all = read('.github/workflows/release-all.yml');
  const steps = all.split(/(?=^      - )/m);
  for (const step of steps.filter(s => /(?:zip -r|7z a).* bundle/m.test(s))) {
    assert.match(step, /check-telemetry.py.*--bundle bundle/, step.slice(0, 120));
  }
  for (const file of ['releases/build-release-bundle.sh', 'releases/repack-bundle-for-arch.sh',
                      'releases/mac/package-app.sh', '.github/workflows/AppImage.yml',
                      '.github/workflows/Flatpak.yml']) {
    assert.match(read(file), /check-telemetry.py.*--bundle/, file);
  }
  for (const file of ['Dockerfile', 'snapcraft.yaml', 'snapcraft-core26.yaml']) {
    assert.match(read(file), /check-telemetry.py --bundle/, file);
  }
  assert.match(read('sandstorm-src/build-deps.sh'), /check-telemetry.py.*--kind ferretdb/);
  for (const name of ['build-win64', 'build-win32', 'build-win-arm64']) {
    const job = all.split('\n  ' + name + ':\n')[1].split(/\n  [a-z][a-z0-9-]*:\n/)[0];
    assert.match(job, /python3 src\/releases\/check-telemetry.py --source src/);
    assert.match(job, /python src\/releases\/check-telemetry.py --bundle bundle/);
  }
  assert.match(read('.github/workflows/windows.yml'), /check-telemetry.py --archive/);
  // These logging/metrics features are deliberately retained, not removed by keyword.
  assert.match(read('.meteor/packages'), /^package-stats-opt-out@1.0.8$/m);
  assert.match(read('.meteor/packages'), /^instrumentation$/m);
  for (const workflow of ['release-all.yml', 'release-all-missing.yml']) {
    assert.match(read('.github/workflows/' + workflow), /DO_NOT_TRACK: '1'/);
  }
  assert.match(read('models/server/metrics.js'), /WebApp.handlers.use\('\/metrics'/);
});

// A `meteor test` run with METEOR_LOCAL_DIR=.meteor/local-test (the full-app
// Mocha run) writes public/build-assets-local-test-app-test/, a bundle holding
// every dependency's URLs. The scanner skips every generated build context
// (gitignored as */build-assets* and */build-chunks*), and still reports a
// new origin in ordinary public/ source.
test('generated build contexts are skipped, public/ source is still scanned', () => {
  const fs = require('node:fs');
  fs.mkdirSync(path.join(root, '.tools/tmp'), { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, '.tools/tmp', 'risk-audit-'));
  try {
    const policy = path.join(dir, 'policy.json');
    fs.writeFileSync(policy, JSON.stringify({ initialized: true, roots: ['public'], files: {} }));
    const write = (rel, text) => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text);
    };
    const run = () => spawnSync('python3', ['-B', path.join(root, 'releases/risk-audit.py'), '--source', dir, '--policy', policy], {
      cwd: dir, encoding: 'utf8',
    });
    for (const generated of ['public/build-assets-local-test-app-test/a.js', 'public/build-chunks-x/b.js', 'private/build-assets/c.js']) {
      write(generated, 'fetch("https://generated.example/x")');
    }
    let result = run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    write('public/source.js', 'fetch("https://source.example/x")');
    result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /public\/source\.js: new URL origin https:\/\/source\.example/);
    assert.doesNotMatch(result.stdout + result.stderr, /generated\.example/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
