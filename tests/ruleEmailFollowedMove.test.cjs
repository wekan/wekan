'use strict';
// An email after a rule's own move to another board (maintainer decision of
// 2026-10-03). The source check of server/lib/ruleEmailSource.js refuses a
// card that left the activity's board; a rule's email may read it on the
// destination only when THIS run of the rule moved it there, the destination
// opted into Sync effects, and it is still there. The ordinary engine proves
// it with RulesHelper.emailActivity (the run's own move), durable Sync with
// storedRulePlans.js ruleEmailActivity (ruleCardNow: a saved move of the same
// plan). The negative tests pin that nothing else can claim a followed move.
// Run: node tests/ruleEmailFollowedMove.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const strip = text => text.replace(/^\s*(\/\/|\*).*$/gm, '');

test('the ordinary engine follows only the run\'s own move to a board that opted in', () => {
  const helper = read('server/rulesHelper.js');
  const body = helper.slice(helper.indexOf('  async emailActivity('), helper.indexOf('  async findMatchingRules('));
  assert.ok(body.length > 0, 'emailActivity is defined before findMatchingRules');
  assert.match(body, /!ruleRun\?\.movedTo \|\| ruleRun\.movedTo !== card\.boardId/);
  assert.match(body, /destination\.syncEffectsEnabled !== true\) return \{ activity, followedFrom: null \}/);
  assert.match(body, /return \{ activity: \{ \.\.\.activity, boardId: card\.boardId \}, followedFrom: activity\.boardId \}/);
  // movedTo is set only after this rule's own move to another board.
  const sets = strip(helper).match(/ruleRun\.movedTo = [^;]+;/g);
  assert.deepEqual(sets, ['ruleRun.movedTo = target.boardId;', 'ruleRun.movedTo = actionBoardId;']);
  assert.match(helper, /card\.move\(target\.boardId, target\.swimlaneId, target\.listId, target\.sort\)\);\s*if \(ruleRun && target\.boardId !== here\) ruleRun\.movedTo = target\.boardId;/);
  assert.match(helper, /if \(ruleRun && card && c\._id === card\._id && actionBoardId !== here\) ruleRun\.movedTo = actionBoardId;/);
  // One fresh run per rule, per button press and per scheduled card.
  assert.match(helper, /const ruleRun = \{\};\s*const action = await rule\.getAction\(\);/);
  assert.match(read('server/rulesButton.js'), /const ruleRun = \{\};\s*for \(const action of actions\)/);
  assert.match(read('server/scheduledRules.js'), /const ruleRuns = new Map\(cards\.map\(card => \[card\._id, \{\}\]\)\);/);
});

test('durable Sync follows only a saved move of the same plan, and rechecks it before sending', () => {
  const plans = read('server/notifications/storedRulePlans.js');
  const body = plans.slice(plans.indexOf('async function ruleEmailActivity('), plans.indexOf('// The card an activity names'));
  assert.match(body, /const now = await ruleCardNow\(plan, context\);/);
  assert.match(body, /await assertDestinationBoard\(now\.boardId, plan, trigger\);/);
  assert.match(body, /followedFrom: plan\.boardId/);
  assert.match(plans, /if \(command\.sourceBinding\?\.version === 6 && \(where\.followedFrom !== command\.sourceBinding\.followedFrom \|\|\s*where\.activity\.boardId !== command\.sourceBinding\.cards\[0\]\[1\]\)\) throw new Error\('rule-email-source-not-authorized'\);/);
  // And the destination's rules may now include email after a move there.
  assert.ok(require('../server/lib/listSyncSteps').FOLLOWER_SAFE.has('sendEmail'));
});

test('NEGATIVE: nothing else passes followedFrom, so no other caller can move an email\'s source', () => {
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'tests', '_build', '.build', '.meteor', '.tools', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) files.push(full);
    }
  };
  for (const dir of ['server', 'models', 'imports', 'client']) walk(path.join(ROOT, dir));
  const passing = {};
  for (const file of files) {
    const found = strip(fs.readFileSync(file, 'utf8')).match(/followedFrom(: | = |,)[^,)}\n]*/g);
    if (found) passing[path.relative(ROOT, file)] = found;
  }
  assert.deepEqual(Object.keys(passing).sort(), ['server/lib/ruleEmailSource.js',
    'server/notifications/storedRulePlans.js', 'server/rulesHelper.js']);
  // Every value handed on comes from a proven placement.
  for (const file of ['server/notifications/storedRulePlans.js', 'server/rulesHelper.js']) {
    for (const use of strip(read(file)).match(/followedFrom: [^,)}\n]+/g)) {
      assert.match(use, /^followedFrom: (placed\.followedFrom|null|activity\.boardId|plan\.boardId|where\.followedFrom)\b/, `${file}: ${use}`);
    }
  }
});
