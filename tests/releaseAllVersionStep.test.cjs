'use strict';

// releases/release-all.sh must always advance the release version by exactly
// one minor version, never "whatever gap the two newest CHANGELOG headings
// happen to have". Run: node tests/releaseAllVersionStep.test.cjs
//
// The bug this pins: the version step used to be MEASURED from
// RELEASED[0] vs RELEASED[1] (the two newest "# vNN.MM" headings) and then
// RE-APPLIED to compute the next version. That looked reasonable, but it made
// a single incident permanent: if a release number was ever prepared and
// never published, and its CHANGELOG section got deleted instead of renamed
// back to "# Upcoming WeKan ® release" (see the header comment on a failed
// vs. broken release), the two headings left behind were 2 apart - and the
// script read that as "the release cadence is +2 now" and applied +2 again,
// which read as +2 the NEXT time too. That is exactly how v11.56 -> v11.58 ->
// v11.60 -> v11.62 happened, silently skipping v11.57, v11.59 and v11.61: one
// missing heading compounded into a permanent, ever-repeating habit of
// skipping a number.
//
// The fix is a fixed +1 step with no history lookup, plus turning the other
// branch's "not the expected increment" case from a printed Note (which let
// the script proceed anyway) into a hard failure that requires an explicit
// override.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sh = fs.readFileSync(path.join(repoRoot, 'releases', 'release-all.sh'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseAllVersionStep:');

test('the Upcoming-rename branch computes NEW as a fixed +1, not a measured/re-applied STEP', () => {
  const renameBlock = sh.slice(
    sh.indexOf("elif grep -qE '^# Upcoming WeKan'"),
    sh.indexOf('Opening the next'),
  );
  assert.ok(/NEW="\$\(wekan_dec \$\(\( \$\(wekan_enc "\$OLD"\) \+ 1 \)\) \)"/.test(renameBlock),
    'NEW must be computed as wekan_enc(OLD) + 1, a literal fixed step');
  assert.ok(!/if \[ -n "\$\{RELEASED\[1\]:-\}" \]; then/.test(renameBlock),
    'the rename branch must not branch on RELEASED[1] to measure a historical STEP');
  assert.ok(!/STEP=\$\(\( \$\(wekan_enc/.test(renameBlock),
    'STEP must not be computed by subtracting two encoded historical versions');
});

test('a version gap in the no-Upcoming branch is a hard failure, not a printed Note', () => {
  const elseBlock = sh.slice(sh.indexOf('\nelse\n'), sh.indexOf('fi\n\necho "=== WeKan remote release'));
  assert.ok(/echo "Error: newest CHANGELOG version v\$NEW is not the \+1 increment/.test(elseBlock),
    'the mismatch message must be an Error');
  assert.ok(/exit 1/.test(elseBlock.slice(elseBlock.indexOf('is not the +1 increment'))),
    'a version gap must exit 1, not just warn and continue ("proceeding anyway" is the bug)');
  assert.ok(!/proceeding anyway/.test(sh), 'the old "proceeding anyway" wording must be gone entirely');
});

test('wekan_enc/wekan_dec are unchanged (the encoding itself was never the bug)', () => {
  assert.ok(sh.includes('wekan_enc() { local v="${1#v}"; local M="${v%%.*}"; local m="${v#*.}"; m="${m%%.*}"; echo $(( 10#$M * 100 + 10#$m )); }'));
  assert.ok(sh.includes("wekan_dec() { printf '%d.%02d' $(( $1 / 100 )) $(( $1 % 100 )); }"));
});

console.log(`\nreleaseAllVersionStep: ${passed} tests passed`);
