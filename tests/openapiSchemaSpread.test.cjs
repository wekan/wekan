'use strict';

// Regression guard for a failed release: the `bump` job of release-all.yml
// stopped in openapi/generate_openapi.py with
//   AttributeError: 'NoneType' object has no attribute 'name'
// (.tools/log/wekan8). Notification delivery (#3695) builds part of four
// schemas with a spread - `...deliverySchemaFields('notificationDelivery')` in
// models/boards.js, integrations.js, settings.js and users.js - and the
// generator read `statement.key` of every schema property, which a spread does
// not have. A spread is now documented as one optional object named by the
// helper's first string argument, and one with no such name is skipped with a
// warning instead of stopping the release.
//
// Run: node tests/openapiSchemaSpread.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GENERATOR = path.join(ROOT, 'openapi/generate_openapi.py');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The Python that has esprima: the repository's own .tools environment when it
// exists (releases/rebuild-docs.sh installs esprima for the release), else python3.
function python() {
  for (const candidate of [path.join(ROOT, '.tools/openapi-venv/bin/python'), 'python3']) {
    if (candidate !== 'python3' && !fs.existsSync(candidate)) continue;
    if (spawnSync(candidate, ['-c', 'import esprima'], { encoding: 'utf8' }).status === 0) return candidate;
  }
  return null;
}

console.log('openapiSchemaSpread:');

const src = fs.readFileSync(GENERATOR, 'utf8');
const init = src.slice(src.indexOf('class SchemaProperty('), src.indexOf('    @property', src.indexOf('class SchemaProperty(')));

test('a spread is handled before any schema property key is read', () => {
  const spread = init.indexOf("statement.type == 'SpreadElement'");
  assert.ok(spread > 0, 'SchemaProperty recognises a SpreadElement');
  assert.ok(spread < init.indexOf('statement.key.name'), 'before statement.key is read');
  assert.match(src, /key = getattr\(self\.statement, 'key', None\)/, 'process_jsdocs does not assume a key either');
  assert.match(src, /if field\.name is None:[\s\S]{0,200}continue/, 'an unnamed spread is skipped, not fatal');
});

test('every schema spread in models/ names its fields with a string literal (negative: none left undocumented)', () => {
  const offenders = [];
  for (const file of fs.readdirSync(path.join(ROOT, 'models')).filter(f => f.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(ROOT, 'models', file), 'utf8');
    if (!text.includes('attachSchema(')) continue;
    for (const m of text.matchAll(/^\s+\.\.\.(\w+)\(([^)]*)\),?$/gm)) {
      if (!/Schema|Fields/.test(m[1])) continue;
      if (!/^\s*['"]/.test(m[2])) offenders.push(`${file}: ...${m[1]}(${m[2]})`);
    }
  }
  assert.deepStrictEqual(offenders, []);
});

test('the whole generator runs and documents notificationDelivery (python + esprima, when available)', () => {
  const py = python();
  if (!py) { console.log('    (no python with esprima here - skipped; the release installs it)'); return; }
  const gen = spawnSync(py, [GENERATOR, '--release', 'vtest', 'models', 'server/models'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.strictEqual(gen.status, 0, gen.stderr.slice(-1500));
  assert.ok(!/AttributeError|Traceback/.test(gen.stderr), gen.stderr.slice(-1500));
  assert.match(gen.stdout, /^swagger: '2\.0'/);
  const defs = gen.stdout.slice(gen.stdout.indexOf('\ndefinitions:'));
  // One definition: from "  Name:" to the next line indented two spaces.
  const block = name => {
    const at = defs.indexOf(`\n  ${name}:\n`);
    if (at < 0) return null;
    const rest = defs.slice(at + 1);
    const next = rest.slice(1).search(/\n {2}\S/);
    return next < 0 ? rest : rest.slice(0, next + 1);
  };
  for (const schema of ['Boards', 'Integrations', 'Settings', 'UsersProfile']) {
    const body = block(schema);
    assert.ok(body, `${schema} is documented`);
    assert.match(body, /\n {6}notificationDelivery:\n/, `${schema} documents notificationDelivery`);
  }
});

console.log(`\nopenapiSchemaSpread: ${passed} tests passed`);
