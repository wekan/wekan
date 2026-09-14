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
// The fix is a fixed +1 step with no history lookup. Releases now also
// require real Upcoming notes before any tool installation or forge contact.

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
    sh.indexOf('# An Upcoming section with real entries'),
    sh.indexOf('Opening the next'),
  );
  assert.ok(/NEW="\$\(wekan_dec \$\(\( \$\(wekan_enc "\$OLD"\) \+ 1 \)\) \)"/.test(renameBlock),
    'NEW must be computed as wekan_enc(OLD) + 1, a literal fixed step');
  assert.ok(!/if \[ -n "\$\{RELEASED\[1\]:-\}" \]; then/.test(renameBlock),
    'the rename branch must not branch on RELEASED[1] to measure a historical STEP');
  assert.ok(!/STEP=\$\(\( \$\(wekan_enc/.test(renameBlock),
    'STEP must not be computed by subtracting two encoded historical versions');
});

test('missing Upcoming notes cannot fall back to an already released heading', () => {
  const guard = sh.indexOf('bash "$REPO_DIR/releases/check-upcoming-release.sh"');
  assert.ok(guard > -1 && guard < sh.indexOf('ensure_tools git gh'));
  assert.ok(guard < sh.indexOf('bash "$(dirname "$0")/fix-changelog-hashes.sh"'));
  assert.ok(!sh.includes('NEW="${RELEASED[0]:-}"'),
    'a published section must never be reused when Upcoming notes are missing');
  assert.ok(!sh.includes('treating it as the prepared release'));
});

test('wekan_enc/wekan_dec are unchanged (the encoding itself was never the bug)', () => {
  assert.ok(sh.includes('wekan_enc() { local v="${1#v}"; local M="${v%%.*}"; local m="${v#*.}"; m="${m%%.*}"; echo $(( 10#$M * 100 + 10#$m )); }'));
  assert.ok(sh.includes("wekan_dec() { printf '%d.%02d' $(( $1 / 100 )) $(( $1 % 100 )); }"));
});

console.log(`\nreleaseAllVersionStep: ${passed} tests passed`);
