'use strict';

// P3 (docs/Compliance/README.md): Problems / Summary says "a newer WeKan is
// available" from the last Check version an administrator ran - WeKan never
// asks wekan.fi on its own.
// Run: node --test tests/versionUpdateProblem.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('a newer WeKan found by the last check is a problem until the server runs it', async () => {
  const { updateProblem } = await import('../models/lib/versionCheck.js');
  const last = { versions: { wekan: '13.31' }, checkedAt: new Date(Date.UTC(2026, 10, 24)) };
  const p = updateProblem({ current: 'v13.30.0', last });
  assert.equal(p.id, 'wekan-update');
  assert.match(p.detail, /WeKan 13\.31 is out; this server runs 13\.30\.0/);
  assert.match(p.detail, /on 2026-11-24/);
  assert.equal(updateProblem({ current: 'v13.31.0', last }), null, 'the same version');
  assert.equal(updateProblem({ current: 'v13.32.0', last }), null, 'a newer one than the check found');
  assert.equal(updateProblem({ current: 'v13.30.0', last: null }), null, 'never checked: nothing to say');
});

test('negative: WeKan checks only when an administrator asks; Summary only reads what was kept', () => {
  const stats = read('server/statistics.js');
  assert.equal((stats.match(/fetch\('https:\/\/wekan\.fi\/version\.txt'/g) || []).length, 1);
  const method = stats.slice(stats.indexOf('async checkNewestVersions()'), stats.indexOf('async getStatistics()'));
  assert.match(method, /if \(!currentUser\?\.isAdmin\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.match(method, /VersionChecks\.upsertAsync\(\{ _id: 'last' \}/);
  const status = read('server/lib/systemStatus.js');
  const now = status.slice(status.indexOf('async function updateProblemNow()'));
  assert.doesNotMatch(now.slice(0, now.indexOf('\n}\n')), /fetch\(|checkNewestVersions/, 'Summary never fetches');
  assert.match(status, /\[await backupProblemNow\(\), await updateProblemNow\(\)\]/);
  for (const dir of ['server', 'models']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir), { recursive: true })) {
      if (!String(f).endsWith('.js') || String(f).includes('tests')) continue;
      const src = read(path.join(dir, String(f)));
      if (/wekan\.fi\/version\.txt/.test(src)) assert.equal(path.join(dir, String(f)), path.join('server', 'statistics.js'), 'only the button fetches');
    }
  }
});
