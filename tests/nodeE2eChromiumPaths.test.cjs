"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const launcher = source.slice(source.indexOf('function run_node_e2e_docker(){'),
  source.indexOf('// Back-compat wrapper:'));
const selector = launcher.match(/sh -c '(browser_path=[\s\S]*?)CHROMIUM_PATH=/)[1]
  .replace('/ms-playwright', '"$FIXTURE_ROOT"');
const temporary = path.join(root, '.tools/tmp');
fs.mkdirSync(temporary, { recursive: true });
const fixture = fs.mkdtempSync(path.join(temporary, 'chromium-paths-'));
function select(directory) {
  return spawnSync('sh', ['-c', selector + 'printf "%s\\n" "$browser_path"'], {
    encoding: 'utf8', env: { ...process.env, TMPDIR: temporary, FIXTURE_ROOT: directory },
  });
}
try {
  for (const directory of ['chrome-linux', 'chrome-linux64', 'chrome-linux-arm64']) {
    const candidate = path.join(fixture, directory, 'chromium-1243', directory, 'chrome');
    fs.mkdirSync(path.dirname(candidate), { recursive: true });
    fs.writeFileSync(candidate, '', { mode: 0o755 });
    const result = select(path.join(fixture, directory));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), candidate);
  }
  const absent = path.join(fixture, 'absent'); fs.mkdirSync(absent);
  assert.equal(select(absent).status, 127, 'missing browsers must fail visibly');
  const nonExecutable = path.join(absent, 'chrome-linux-arm64', 'chrome');
  fs.mkdirSync(path.dirname(nonExecutable)); fs.writeFileSync(nonExecutable, '', { mode: 0o644 });
  fs.writeFileSync(path.join(path.dirname(nonExecutable), 'chrome_crashpad_handler'), '', { mode: 0o755 });
  assert.equal(select(absent).status, 127, 'data files and non-executable Chrome must not match');
  console.log('Node E2E Chrome discovery: old Linux, Linux64 and ARM64 paths pass; absent/non-executable browsers fail');
} finally { fs.rmSync(fixture, { recursive: true, force: true }); }
