'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const utils = fs.readFileSync('client/lib/utils.js', 'utf8');
const block = utils.slice(utils.indexOf('setBoardView(view) {'),
  utils.indexOf('\n\n  unsetBoardView()', utils.indexOf('setBoardView(view) {')));
const authenticated = block.slice(0,
  block.indexOf("} else if (view === 'board-view-swimlanes')"));

assert.match(authenticated, /pendingBoardView\.set\(view\)/,
  'Calendar/Gantt must become reactive immediately');
assert.match(authenticated, /Meteor\.call\('setBoardView', view/,
  'the chosen view must remain persisted');
assert.doesNotMatch(authenticated, /Utils\.reload\(\)/,
  'an authenticated view change must not reload back to the old view');
assert.doesNotMatch(authenticated, /\}\s*pendingBoardView\.set\(null\);\s*\}\);/,
  'a successful callback must not clear pending before profile reactivity catches up');
assert.match(utils,
  /if \(currentUser && \(currentUser\.profile \|\| \{\}\)\.boardView === pending\)/,
  'the pending view is acknowledged only after the reactive profile matches');
assert.match(authenticated, /if \(error\) \{[\s\S]*?pendingBoardView\.set\(null\);/,
  'a failed persistence call releases the pending view');

console.log('boardViewPersistence6657: reactive persisted views passed');
