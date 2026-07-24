'use strict';

// docs/Security/gh/pull-security-reports.sh dumps every GitHub security and code
// quality alert for the repo. It fetches with `gh api --paginate --slurp`, which
// returns ONE ARRAY PER PAGE - so a list endpoint arrives as [[alert,...],[...]].
//
// Nothing flattened those pages, so `.[]` yielded PAGES rather than alerts and
// every `select(.state == "open")` ran against an array. jq failed, its error went
// to /dev/null, and the `>` redirect left a 0-byte file. The run therefore reported
// "OK" for every endpoint while writing empty split dumps and blank counts - a
// security report that silently claims there is nothing to see. The same shape also
// broke the secret-scanning redaction (empty output, source file deleted anyway) and
// the "newest analysis" lookup.
//
// This guards the fix: pages are flattened, single-object endpoints are left alone,
// a failed filter leaves a valid empty ARRAY plus a readable error, and the secrets
// dump is never kept around.
//
// Run: node tests/securityReportScript.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

let passed = 0;
let skipped = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'docs/Security/gh/pull-security-reports.sh');
const sh = fs.readFileSync(scriptPath, 'utf8');

// The flatten filter exactly as the script runs it, so the test breaks if the
// script's filter is edited without updating this guard.
const GUARD = /jq -e 'type == "array" and length > 0 and all\(\.\[\]; type == "array"\)'/;
const FLATTEN_GUARD = "type == \"array\" and length > 0 and all(.[]; type == \"array\")";

const hasJq = spawnSync('jq', ['--version']).status === 0;
function jq(filter, input) {
  return execFileSync('jq', ['-c', filter], { input, encoding: 'utf8' }).trim();
}
function jqExit(filter, input) {
  return spawnSync('jq', ['-e', filter], { input, encoding: 'utf8' }).status;
}

console.log('securityReportScript:');

test('the script is executable and syntactically valid POSIX sh', () => {
  assert.ok(fs.statSync(scriptPath).mode & 0o111, 'must stay executable');
  const r = spawnSync('sh', ['-n', scriptPath], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, `sh -n failed: ${r.stderr}`);
});

test('fetch() flattens the per-page arrays that --slurp produces', () => {
  const fetchBody = sh.slice(sh.indexOf('fetch() {'), sh.indexOf('# split <src.json>'));
  assert.ok(GUARD.test(fetchBody),
    'fetch() must detect the array-of-pages shape before counting or splitting');
  assert.ok(/jq 'add' < "\$raw"/.test(fetchBody),
    'fetch() must concatenate the pages into one list');
  assert.ok(/--paginate --slurp/.test(fetchBody),
    'the flatten exists because of --slurp; keep them together');
});

test('split() never leaves a 0-byte file behind', () => {
  const splitBody = sh.slice(sh.indexOf('split() {'), sh.indexOf('# render <dir>'));
  assert.ok(/echo '\[\]' > "\$out\.tmp"/.test(splitBody),
    'a failed filter must still produce a valid, empty JSON array');
  assert.ok(/2>"\$out\.error\.txt"/.test(splitBody),
    'the jq error must be kept, not discarded to /dev/null');
  assert.ok(!/> "\$RUN\/\$dir\/\$name\.json" 2>\/dev\/null/.test(splitBody),
    'writing straight to the destination truncates it to 0 bytes when jq fails');
});

test('the secret-scanning dump is redacted before the raw copy is dropped', () => {
  const at = sh.indexOf('secret-scanning-alerts-with-secrets.json');
  assert.ok(at > 0, 'the secret scanning step must exist');
  const block = sh.slice(at, at + 1600);
  assert.ok(/jq -e 'type == "array"'/.test(block),
    'the redacted copy must be validated before the unredacted one is deleted');
  // Whatever happens, the file holding live secrets must not survive the run.
  const removals = (block.match(/rm -f "\$RUN\/Raw\/secret-scanning-alerts-with-secrets\.json"/g) || []);
  assert.ok(removals.length >= 2,
    'the unredacted dump must be removed on the failure path too');
});

test('counts always print a number, never an empty column', () => {
  assert.ok(/^count\(\) \{$/m.test(sh), 'a count() helper must exist');
  const countBody = sh.slice(sh.indexOf('count() {'), sh.indexOf('fetch() {'));
  assert.ok(/\[ -n "\$n" \] \|\| n=0/.test(countBody),
    'an unreadable or empty dump must count as 0, not blank');
  assert.ok(!/o="-"; c_=""/.test(sh),
    'the summary must not start the closed column as an empty string');
});

if (!hasJq) {
  skipped += 1;
  console.log('  -- skipped (jq not installed): behavioural checks of the jq filters');
} else {
  test('the flatten filter concatenates pages but spares single objects', () => {
    // Paginated list endpoint: two pages -> one list.
    assert.strictEqual(jqExit(FLATTEN_GUARD, '[[{"a":1},{"a":2}],[{"a":3}]]'), 0);
    assert.strictEqual(jq('add', '[[{"a":1},{"a":2}],[{"a":3}]]'),
      '[{"a":1},{"a":2},{"a":3}]');
    // Single-object endpoint (/repos/{o}/{r}, sbom, default-setup): slurped to
    // [ {...} ] and must NOT be flattened, or the renders lose their .[0].
    assert.notStrictEqual(jqExit(FLATTEN_GUARD, '[{"private":false}]'), 0);
    // One empty page, and no pages at all.
    assert.strictEqual(jq('add', '[[]]'), '[]');
    assert.notStrictEqual(jqExit(FLATTEN_GUARD, '[]'), 0);
  });

  test('the state filter works on flattened alerts and failed on pages', () => {
    const flat = '[{"state":"open"},{"state":"fixed"},{"state":"open"}]';
    assert.strictEqual(jq('[ .[] | select(.state == "open") ] | length', flat), '2');
    // The pre-fix shape: select() against a page array is an error, which is
    // exactly how the dumps ended up empty.
    const paged = `[${flat}]`;
    const r = spawnSync('jq', ['[ .[] | select(.state == "open") ]'],
      { input: paged, encoding: 'utf8' });
    assert.notStrictEqual(r.status, 0,
      'selecting on an array-of-pages must fail - if this ever succeeds, the ' +
      'flatten guard is no longer what protects the split step');
  });
}

console.log(`\nsecurityReportScript: ${passed} tests passed` +
  (skipped ? `, ${skipped} group skipped` : ''));
