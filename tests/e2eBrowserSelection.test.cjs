'use strict';

// The standalone E2E runner must not select an x86 Chromium on an ARM host (or
// vice versa), and Playwright cache revisions must be discovered dynamically.
// Run: node tests/e2eBrowserSelection.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, 'e2e/list-regressions.js'),
  'utf8',
);
const build = fs.readFileSync(path.join(__dirname, '../build.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('e2eBrowserSelection:');

test('Playwright browser revisions are discovered instead of pinned', () => {
  assert.match(source, /fs\.readdirSync\(cache\)\.sort\(\)\.reverse\(\)/);
  assert.ok(!/chromium-\d+\/chrome-linux/.test(source),
    'a cache revision disappears whenever Playwright updates');
});

test('the repository and explicit Playwright caches support current ARM64 layouts', () => {
  const vm = require('node:vm');
  const functionSource = source.slice(source.indexOf('function findChromiumPath()'), source.indexOf('\nconst CHROMIUM_PATH'));
  const cache = path.join(path.sep, 'browser-cache');
  const executable = path.join(cache, 'chromium-999', 'chrome-linux-arm64', 'chrome');
  const elf = Buffer.alloc(20);
  elf.write('\x7fELF', 0, 'ascii');
  elf.writeUInt16LE(183, 18);
  const fakeFs = {
    constants: fs.constants,
    readdirSync: directory => directory === cache ? ['chromium-999'] : [],
    accessSync: file => { if (file !== executable) throw Error('missing'); },
    openSync: () => 1,
    readSync: (_fd, target) => elf.copy(target), closeSync: () => {},
  };
  const find = vm.runInNewContext(`(${functionSource})`, {
    fs: fakeFs, path, Buffer, __dirname: path.join(__dirname, 'e2e'),
    os: { homedir: () => path.join(path.sep, 'home') },
    process: { env: { PLAYWRIGHT_BROWSERS_PATH: cache }, platform: 'linux', arch: 'arm64' },
    require: () => { throw Error('standalone without Playwright module'); },
  });
  assert.strictEqual(find(), executable);
  elf.writeUInt16LE(62, 18);
  assert.notStrictEqual(find(), executable, 'an x86 binary in that directory is still rejected');
});

test('Linux ELF architecture must match Node before a browser is selected (negative)', () => {
  assert.match(source, /elf\.readUInt16LE\(18\)/);
  assert.match(source, /process\.arch === 'arm64' && machine === 183/);
  assert.match(source, /process\.arch === 'x64' && machine === 62/);
});

test('the all-tests flow uses the Playwright browser container when native Chromium is unsupported', () => {
  assert.match(build, /function run_node_e2e_docker\(\)/);
  assert.match(build,
    /e2e\)\s+if browser_needs_docker chromium; then[^\n]*run_node_e2e_docker/);
  assert.match(build, /CHROMIUM_PATH="\$browser_path" exec node tests\/e2e\/list-regressions\.js/);
});

test('a failed board render reports browser errors instead of only a blank body', () => {
  assert.match(source, /page\.on\('pageerror'/);
  assert.match(source, /page\.on\('requestfailed'/);
  assert.match(source, /debugInfo\.browserErrors/);
});

console.log(`\ne2eBrowserSelection: ${passed} tests passed`);
