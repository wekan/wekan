'use strict';

// A promise that is not awaited, handled or marked `void` fails silently: a
// rejection is unhandled and the caller moves on (GitHub CodeQL "Missing await",
// found in models/cards.js getOriginalPositionDescription, which formatted a
// promise). `npm run lint:promises` runs typescript-eslint's
// no-floating-promises and no-misused-promises over models/lib, server/lib and
// imports/lib with type information read from tsconfig.lint.json. This test
// keeps the configuration in place and the tree clean.
//
// Run: node tests/promiseLint.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('promiseLint:');

test('the configuration enables both rules, with type information', () => {
  const config = JSON.parse(read('.eslintrc.promises.json'));
  assert.equal(config.rules['@typescript-eslint/no-floating-promises'], 'error');
  assert.equal(config.rules['@typescript-eslint/no-misused-promises'], 'error');
  assert.deepEqual(config.parserOptions.project, ['./tsconfig.lint.json']);
  const tsconfig = JSON.parse(read('tsconfig.lint.json'));
  for (const dir of ['models/lib', 'server/lib', 'imports/lib']) {
    assert.ok(tsconfig.include.some(pattern => pattern.startsWith(`${dir}/`)), `${dir} is covered`);
  }
  assert.equal(tsconfig.compilerOptions.checkJs, false, 'type information only, nothing is type-checked');
});

test('the script is wired and fails on any finding', () => {
  const script = JSON.parse(read('package.json')).scripts['lint:promises'];
  assert.match(script, /-c \.eslintrc\.promises\.json/);
  assert.match(script, /--max-warnings 0/);
  for (const dir of ['models/lib', 'server/lib', 'imports/lib']) assert.ok(script.includes(dir), dir);
});

test('negative: no unawaited, unhandled promise is left in the covered directories', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/eslint/bin/eslint.js'),
    '--no-eslintrc', '-c', '.eslintrc.promises.json', '--no-ignore', '--ext', '.js,.cjs', '--max-warnings', '0',
    'models/lib', 'server/lib', 'imports/lib'], { cwd: root, encoding: 'utf8', timeout: 240000 });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`.slice(0, 3000));
});

console.log(`promiseLint: ${passed} tests passed`);
