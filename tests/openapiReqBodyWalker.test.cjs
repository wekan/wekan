'use strict';

// Regression guard for a failed release: the `bump` job of release-all.yml
// stopped in openapi/generate_openapi.py with
//   AttributeError: 'NoneType' object has no attribute 'type'
// (.tools/log/wekan5). A REST handler declared a variable with no
// initializer (`let x;`), and get_req_body_elems() walked the declarator's
// `init`, which esprima reports as None. The walker now returns early on an
// absent node. The same run skipped models/lib/importedAttachmentsByCard.js
// with "cannot parse" because esprima does not know logical assignment
// (`||=`), and req.body fields read inside a `?:` were never documented
// because ConditionalExpression was not walked.
//
// Run: node tests/openapiReqBodyWalker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GENERATOR = path.join(ROOT, 'openapi/generate_openapi.py');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('openapiReqBodyWalker:');

const src = fs.readFileSync(GENERATOR, 'utf8');
const walker = src.slice(src.indexOf('def get_req_body_elems('), src.indexOf('\ndef ', src.indexOf('def get_req_body_elems(') + 1));

test('the walker returns early on an absent node before reading .type', () => {
  const guard = walker.indexOf('if obj is None:');
  assert.ok(guard > 0, 'a None guard exists');
  assert.ok(guard < walker.indexOf('obj.type'), 'the guard comes before the first obj.type read');
});

test('the walker descends into a ConditionalExpression', () => {
  assert.match(walker, /obj\.type == 'ConditionalExpression':[\s\S]*?obj\.test[\s\S]*?obj\.consequent[\s\S]*?obj\.alternate/);
});

test('downlevel_js rewrites logical assignment, which esprima cannot parse', () => {
  const at = src.indexOf('def downlevel_js(');
  const body = src.slice(at, src.indexOf('\nclass ', at));
  for (const op of ['??=', '||=', '&&=']) {
    assert.ok(body.includes(`data.replace('${op}', '  =')`), `${op} is rewritten length-neutrally`);
  }
  assert.ok(body.indexOf("'??='") < body.indexOf("'??', '||'"), '??= is rewritten before ?? (else it becomes ||=)');
});

test('the walker survives the shapes that broke it (python3 + esprima, when available)', () => {
  const probe = spawnSync('python3', ['-c', 'import esprima'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    console.log('    (python3 with esprima not available here - skipped; CI has it)');
    return;
  }
  const js = [
    '(async function (req, res) {',
    '  let later;',
    '  const a = req.body?.title ? req.body.title : req.body.fallback;',
    '  const [x, , y] = [req.body.first, , req.body.second];',
    '  later ||= req.body.orElse;',
    '});',
  ].join('\n');
  const script = [
    'import esprima, importlib.util, json, sys',
    `spec = importlib.util.spec_from_file_location('gen', ${JSON.stringify(GENERATOR)})`,
    'gen = importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)',
    `fn = esprima.parseScript(gen.downlevel_js(${JSON.stringify(js)})).body[0]`,
    'elems = []; gen.get_req_body_elems(fn, elems)',
    'print(json.dumps(sorted(elems)))',
  ].join('\n');
  const run = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  assert.strictEqual(run.status, 0, `walker crashed: ${run.stderr.slice(-600)}`);
  assert.deepStrictEqual(JSON.parse(run.stdout), ['fallback', 'first', 'orElse', 'second', 'title']);
});

test('the whole generator runs and skips no file (python3 + esprima, when available)', () => {
  const probe = spawnSync('python3', ['-c', 'import esprima'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    console.log('    (python3 with esprima not available here - skipped; CI has it)');
    return;
  }
  const gen = spawnSync('python3', [GENERATOR, '--release', 'vtest', 'models', 'server/models'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.strictEqual(gen.status, 0, `generator failed: ${gen.stderr.slice(-600)}`);
  assert.ok(/^swagger:/.test(gen.stdout), 'the output is a spec');
  assert.ok(!/cannot parse/.test(gen.stderr), `a file was skipped: ${gen.stderr.slice(0, 600)}`);
  const copy = gen.stdout.slice(gen.stdout.indexOf('  /api/boards/{board}/copy:'));
  assert.match(copy.slice(0, copy.indexOf('\n  /api/', 1)), /name: title/, 'a req.body field read inside ?: is documented');
});

console.log(`\nopenapiReqBodyWalker: ${passed} tests passed`);
