'use strict';

// Guard for client/components/settings/adminProblems.js: the report subscription
// must NOT be created inside a reactive computation that also depends on the
// count/page/search that loadReport itself sets. Run:
//   node tests/adminProblemsSubscriptionLifetime.test.cjs
//
// The Files (and every) admin report opened BY ITS URL drew its headers, "No
// results" and a "1 / 1" pager over data that was plainly there - while the
// count METHOD reported five. The onCreated autorun opens the pane / subscribes
// when problemsOpenPane or the logged-in user changes. It used to call
// openReportPane()/loadReport() directly in its reactive body, so:
//   * it became reactive on cfg.count (loadReport reads it through pageInfo), and
//   * loadReport's own count method then did cfg.count.set(...), which RE-RAN the
//     autorun - and a Meteor.subscribe made inside an autorun is auto-cancelled
//     when that autorun re-runs. The re-run took the "same user, same pane"
//     branch, did not re-subscribe, and left the report with no subscription:
//     "attachments in minimongo: 0".
// From the menu it worked because switchMenu opens the pane from an EVENT, not a
// computation, so that subscribe was never auto-managed. Only the URL failed.
//
// The fix runs the autorun body inside Tracker.nonreactive (so only paneId +
// userId can re-run it, and the subscribe is not auto-cancelled) and stops the
// subscription in onDestroyed instead. This pins both, so the reactive form
// cannot come back.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = fs.readFileSync(
  path.join(repoRoot, 'client/components/settings/adminProblems.js'), 'utf8',
);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Isolate the autorun that reacts to the URL pane + the user.
function paneAutorunBody() {
  const marker = "Session.get('problemsOpenPane')";
  const at = src.indexOf(marker);
  assert.notStrictEqual(at, -1, 'adminProblems must have the problemsOpenPane autorun');
  // Walk back to the enclosing this.autorun( and forward far enough to cover it.
  const start = src.lastIndexOf('this.autorun(', at);
  assert.notStrictEqual(start, -1, 'the problemsOpenPane read must be inside this.autorun(...)');
  return src.slice(start, at + 1500);
}

test('Tracker is imported', () => {
  assert.ok(/import\s*\{\s*Tracker\s*\}\s*from\s*'meteor\/tracker'/.test(src),
    "adminProblems must import Tracker from 'meteor/tracker'");
});

test('the pane/user autorun runs its body inside Tracker.nonreactive', () => {
  const body = paneAutorunBody();
  // paneId and userId are the reactive triggers, read BEFORE nonreactive.
  const nrAt = body.indexOf('Tracker.nonreactive');
  assert.notStrictEqual(nrAt, -1,
    'the autorun body must be wrapped in Tracker.nonreactive, or a cfg.count.set re-runs it and auto-cancels the subscription');
  assert.ok(
    body.indexOf("Session.get('problemsOpenPane')") < nrAt &&
      body.indexOf('Meteor.userId()') < nrAt,
    'paneId and userId must be read reactively (before Tracker.nonreactive); everything else is nonreactive');
  // openReportPane / loadReport (which subscribe) must sit inside the nonreactive
  // region, not before it.
  const opAt = body.indexOf('openReportPane(this');
  const lrAt = body.indexOf('loadReport(paneId');
  assert.ok(opAt > nrAt, 'openReportPane must be called inside Tracker.nonreactive');
  assert.ok(lrAt > nrAt, 'loadReport must be called inside Tracker.nonreactive');
});

test('the subscription is stopped in onDestroyed (nonreactive no longer tears it down)', () => {
  assert.ok(/Template\.adminProblems\.onDestroyed\(/.test(src),
    'adminProblems must have an onDestroyed');
  const at = src.indexOf('Template.adminProblems.onDestroyed(');
  const block = src.slice(at, at + 200);
  assert.ok(/this\.subscription\s*\)?\s*[\s\S]{0,40}\.stop\(\)/.test(block),
    'onDestroyed must stop this.subscription');
});

console.log(`\nadminProblemsSubscriptionLifetime: all ${passed} tests passed`);
