'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const targets = JSON.parse(read('releases/bun/targets.json'));
const workflow = read('.github/workflows/bun.yml');
assert.equal(targets.length, 12);
assert.equal(new Set(targets.map(x => x.target)).size, 12);
for (const os of ['linux', 'macos', 'windows', 'freebsd', 'android']) {
  for (const arch of ['x64', 'arm64']) assert(targets.some(x => x.target === `${os}-${arch}`));
}
for (const arch of ['x64', 'arm64']) assert(targets.some(x => x.target === `linux-${arch}-musl`));
for (const item of targets.filter(x => ['linux', 'android'].includes(x.platform))) {
  assert.equal(item.runner, item.arch === 'arm64' ? 'ubuntu-24.04-arm' : 'ubuntu-24.04');
}
assert(!targets.some(x => /baseline|profile|i386|riscv/.test(x.target)));
assert(workflow.includes('--format=esm'));
assert(workflow.includes('bun_version: ${{ steps.plan.outputs.bun_version }}'));
assert(workflow.includes('bun-version: ${{ needs.plan.outputs.bun_version }}'));
assert(!workflow.includes('bun-version: ${{ needs.plan.outputs.bun_tag }}'));
assert(workflow.includes('BUN_TAG: ${{ needs.plan.outputs.bun_tag }}'));
assert(workflow.includes('BUN_SMOKE_BROWSER:'));
assert(read('releases/bun/live-smoke.mjs').includes('../../tests/bun-browser-smoke.cjs'));
assert(workflow.includes('ref: refs/tags/${{ needs.plan.outputs.tag }}'));
assert(workflow.includes('termux/termux-docker:$TERMUX_ARCH'));
assert(workflow.includes('vmactions/freebsd-vm@v1'));
assert(workflow.includes('fail-fast: false'));
assert(!workflow.includes('continue-on-error:'));
assert(!workflow.includes('self-hosted'));
assert(workflow.indexOf('build-target.sh') < workflow.indexOf('github-release-upload.sh'));
assert(workflow.includes("steps.ready.outcome == 'success' && inputs.publish"));
assert(workflow.includes('missing_only:'));
assert(!workflow.includes('gh release create'));
assert(!workflow.includes('git push'));
for (const name of ['release-all.yml', 'release-all-missing.yml']) {
  assert(read(`.github/workflows/${name}`).includes('uses: ./.github/workflows/bun.yml'));
}
assert(read('.github/workflows/release-all-missing.yml').includes('only: ${{ needs.plan.outputs.bun }}'));
const expected = spawnSync('bash', ['releases/expected-assets.sh', '12.34'], { cwd: root, encoding: 'utf8' });
assert.equal(expected.status, 0, expected.stderr);
for (const { target } of targets) assert(expected.stdout.includes(`bun ${target} wekan-12.34-bun-${target}.zip sums`));
const python = spawnSync('python3', ['-B', 'tests/bun-release.py'], { cwd: root, encoding: 'utf8' });
assert.equal(python.status, 0, python.stdout + python.stderr);
console.log(python.stdout + python.stderr);
console.log('Bun workflow coverage and release contract passed.');

// Exercise the smoke gate with child processes: a runtime exception must never
// be accepted merely because a database error also appears in its output.
if (process.platform !== 'win32') {
  const tmp = fs.mkdtempSync(path.join(root, '.tools/tmp/bun-smoke-test-'));
  try {
    const binary = path.join(tmp, 'bun');
    const marker = path.join(tmp, '.bun-smoke-ok');
    for (const [output, success] of [
      ['MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:1', true],
      ['::error::expected database rejection\nMongoServerSelectionError: refused', true],
      ['SyntaxError: broken bundle', false],
      ['MongoServerSelectionError: refused\nError: Cannot find module argon2', false],
      ['', false],
    ]) {
      fs.rmSync(marker, { force: true });
      fs.writeFileSync(binary, `#!/bin/sh\ncat <<'BUN_TEST_OUTPUT'\n${output}\nBUN_TEST_OUTPUT\nexit 1\n`, { mode: 0o755 });
      const result = spawnSync(process.execPath, ['releases/bun/smoke.mjs', tmp], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status === 0, success, result.stdout + result.stderr);
      assert.equal(fs.existsSync(marker), success);
      assert(!/^::error::/m.test(result.stdout + result.stderr), 'expected errors must not create CI annotations');
      if (!success && output) assert(result.stderr.includes(output.split('\n')[0]), 'real failure diagnostics must remain visible');
    }
    const launch = spawnSync('sh', ['releases/bun/start-wekan.sh'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, MONGO_URL: '', ROOT_URL: '' },
    });
    assert.notEqual(launch.status, 0);
    assert(launch.stderr.includes('Set MONGO_URL'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
console.log('Bun smoke positive/negative process tests passed.');

// Exercise the workflow's actual npm flags with offline local packages. A
// production-configured runner must still install its dev and optional tools.
const dependencyTmp = fs.mkdtempSync(path.join(root, '.tools/tmp/bun-build-deps-'));
try {
  const write = (file, value) => {
    const dest = path.join(dependencyTmp, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(value));
  };
  for (const name of ['build-tool', 'native-tool']) {
    write(`${name}/package.json`, { name, version: '1.0.0' });
  }
  write('package.json', {
    name: 'bun-build-deps-test', version: '1.0.0',
    devDependencies: { 'build-tool': 'file:build-tool' },
    optionalDependencies: { 'native-tool': 'file:native-tool' },
  });
  fs.writeFileSync(path.join(dependencyTmp, '.npmrc'), 'omit[]=dev\nomit[]=optional\ninstall-links=true\n');
  const env = { ...process.env, NODE_ENV: 'production',
    npm_config_cache: path.join(dependencyTmp, 'cache'),
    PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH };
  const npm = args => {
    const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
      [...args, '--offline', '--ignore-scripts', '--no-audit', '--no-fund'],
      { cwd: dependencyTmp, env, encoding: 'utf8', shell: process.platform === 'win32' });
    assert.equal(result.status, 0, result.error?.message || result.stdout + result.stderr);
  };
  npm(['install', '--package-lock-only']);
  const lock = fs.readFileSync(path.join(dependencyTmp, 'package-lock.json'), 'utf8');
  npm(['ci']);
  for (const name of ['build-tool', 'native-tool']) {
    assert(!fs.existsSync(path.join(dependencyTmp, 'node_modules', name)), 'control must omit tools');
  }
  const install = workflow.match(/^ +meteor npm (ci[^\n]*)$/m);
  assert(install, 'ESM build must use a locked npm install');
  npm(install[1].trim().split(/\s+/));
  for (const name of ['build-tool', 'native-tool']) {
    assert(fs.existsSync(path.join(dependencyTmp, 'node_modules', name, 'package.json')),
      `ESM build omitted ${name}`);
  }
  assert.equal(fs.readFileSync(path.join(dependencyTmp, 'package-lock.json'), 'utf8'), lock);
  const configCheck = 'test -s node_modules/@meteorjs/rspack/rspack.config.js';
  assert(workflow.indexOf(configCheck) > workflow.indexOf(install[0]));
  assert(workflow.indexOf(configCheck) < workflow.indexOf('meteor build ../esm-output'));
} finally {
  fs.rmSync(dependencyTmp, { recursive: true, force: true });
}
console.log('Bun build dependencies survive production npm settings; lockfile unchanged.');
