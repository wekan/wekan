'use strict';

// releases/charts-values-reference.mjs regenerates the Helm chart's commented
// settings reference from docker-compose.yml, so values.yaml cannot fall behind
// again (it had, by 74 settings). Runs against a temporary values.yaml.
// Run: node tests/chartsValuesReference.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const tmp = fs.mkdtempSync(path.join(root, '.tools', 'tmp', 'charts-reference-'));
const values = path.join(tmp, 'values.yaml');
fs.writeFileSync(values, [
  'env:', '  - name: "WITH_API"', '    value: "true"',
  '## EVERY OTHER SETTING WeKan takes, copied from docker-compose.yml.',
  '## ---------------------------------------------------------------------------',
  '#  - name: "OLD_SETTING"', '#    value: "gone"',
  '## ---------------------------------------------------------------------------',
  'extraEnvFrom: ""', '',
].join('\n'));
const run = () => spawnSync(process.execPath, [path.join(root, 'releases/charts-values-reference.mjs'), values], { encoding: 'utf8' });

try {
  test('every setting docker-compose.yml documents is written, and only inside the block', () => {
    const r = run();
    assert.strictEqual(r.status, 0, r.stderr);
    const out = fs.readFileSync(values, 'utf8');
    const compose = fs.readFileSync(path.join(root, 'docker-compose.yml'), 'utf8');
    const settings = new Set([...compose.matchAll(/^\s*#?\s*-\s+([A-Z][A-Z_0-9]{2,})=/gm)].map(m => m[1]));
    for (const name of settings) assert.ok(out.includes(`#  - name: "${name}"`), name);
    assert.ok(!out.includes('OLD_SETTING'), 'the old block is replaced, not appended to');
    assert.ok(out.startsWith('env:\n  - name: "WITH_API"'), 'what is above it is untouched');
    assert.ok(out.endsWith('\nextraEnvFrom: ""\n'), 'and what is below it');
  });

  test('a comment after a value goes on the line above, not into the value', () => {
    const out = fs.readFileSync(values, 'utf8');
    assert.match(out, /#  - name: "ROOT_URL"\n#    value: "http:\/\/localhost"\n/);
    assert.doesNotMatch(out, /value: "[^"\n]*\s#\s/, 'no value carries a comment');
  });

  test('negative: a second run changes nothing', () => {
    const before = fs.readFileSync(values, 'utf8');
    const r = run();
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /already up to date/);
    assert.strictEqual(fs.readFileSync(values, 'utf8'), before);
  });

  test('release-charts.sh runs it on every chart release', () => {
    assert.match(fs.readFileSync(path.join(root, 'releases/release-charts.sh'), 'utf8'),
      /node "\$REPO_DIR\/releases\/charts-values-reference\.mjs" "\$CHART_VALUES"/);
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nchartsValuesReference: ${passed} passed`);
