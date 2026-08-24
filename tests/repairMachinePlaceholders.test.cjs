'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const script = path.join(
  ROOT, 'releases/translations/repair-machine-placeholders.mjs',
);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('all machine placeholders have been repaired', () => {
  const result = spawnSync(node, [script, '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Found 0 machine placeholder markers/);
});

test('locale data contains no PH marker spelling variants', () => {
  const data = path.join(ROOT, 'imports/i18n/data');
  for (const filename of fs.readdirSync(data).filter(name =>
    name.endsWith('.i18n.json'))) {
    const value = fs.readFileSync(path.join(data, filename), 'utf8');
    assert.doesNotMatch(
      value,
      /(?:@\s*){1,2}PH\d+(?:\s*@){1,2}/,
      filename,
    );
  }
});

console.log(`\nrepairMachinePlaceholders: ${passed} tests passed`);
