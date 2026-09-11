'use strict';

// Regression guard for a failed release: the `bump` job of release-all.yml
// regenerates public/api/wekan.yml with openapi/generate_openapi.py and then
// renders it with @redocly/cli, which stopped the release with
//   Error: bad indentation of a mapping entry in ".../public/api/wekan.yml" (1232:2)
// (.tools/wekan13). A @param whose description continues on the next JSDoc
// lines (models/exportCharts.js's chartKey: "one of dashboard, burndown, ...")
// was emitted under `description: |` with only its FIRST line indented; the
// continuation lines landed at column 1, which is not a block scalar any more.
// The generator now indents every line. The same job also warned "unknown
// type object" for the rules API's trigger/action params; those are now
// emitted as `type: string` / `format: json`, which OpenAPI 2.0 accepts.
//
// Two checks: the generator source (always), and - when python3 with PyYAML
// is available, as it is in CI - the generated spec really parses.
//
// Run: node tests/openapiParamMultiline.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('openapiParamMultiline:');

test('print_openapi_param indents every line of a multi-line description', () => {
  const src = fs.readFileSync(path.join(ROOT, 'openapi/generate_openapi.py'), 'utf8');
  const at = src.indexOf('def print_openapi_param(');
  const body = src.slice(at, src.indexOf('@property', at));
  assert.ok(/for line in str\(pdesc\)\.split\('\\n'\):\s*\n\s*print\('\{\}\{\}'\.format\(' ' \* \(indent \+ 2\), line\.strip\(\)\)\)/.test(body),
    'each description line must be printed at indent + 2');
  assert.ok(!/print\('\{\}\{\}'\.format\(' ' \* \(indent \+ 2\), pdesc\)\)/.test(body),
    'the old single print of the whole (multi-line) description is gone (negative)');
  assert.ok(/if ptype == 'object':[\s\S]*?type: string[\s\S]*?format: json/.test(body),
    'an object param is emitted as a JSON string, not an invalid type');
});

test('the JSDoc that broke the release still has its multi-line @param (the case is real)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'models/exportCharts.js'), 'utf8');
  assert.ok(/@param \{string\} chartKey one of dashboard, burndown, burnup, cumulativeFlow,\n\s*\* controlChart/.test(src));
});

test('the generated spec parses as YAML (python3 + PyYAML, when available)', () => {
  const python = spawnSync('python3', ['-c', 'import yaml'], { encoding: 'utf8' });
  if (python.status !== 0) {
    console.log('    (python3 with PyYAML not available here - skipped; CI has it)');
    return;
  }
  const outDir = path.join(ROOT, '.tools', 'tmp', 'openapi-test');
  fs.mkdirSync(outDir, { recursive: true });
  const yml = path.join(outDir, 'wekan.yml');
  const gen = spawnSync('python3', ['openapi/generate_openapi.py', '--release', 'vtest', 'models', 'server/models'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.strictEqual(gen.status, 0, `generator failed: ${gen.stderr.slice(0, 500)}`);
  fs.writeFileSync(yml, gen.stdout);
  assert.ok(!/unknown type object/.test(gen.stderr), 'no "unknown type object" warnings');
  const check = spawnSync('python3', ['-c', [
    'import sys, yaml',
    `d = yaml.safe_load(open(${JSON.stringify(yml)}))`,
    "p = d['paths']['/api/boards/{board}/charts/{chartKey}/exportPDF']['get']['parameters']",
    "ck = [x for x in p if x['name'] == 'chartKey'][0]",
    "assert 'controlChart' in ck['description'] and 'time' in ck['description'], ck",
    "print('ok', len(d['paths']))",
  ].join('\n')], { encoding: 'utf8' });
  assert.strictEqual(check.status, 0, `generated wekan.yml does not parse: ${check.stderr.slice(0, 600)}`);
  assert.ok(/^ok \d+/.test(check.stdout.trim()));
});

console.log(`\nopenapiParamMultiline: ${passed} tests passed`);
