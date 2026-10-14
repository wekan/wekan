'use strict';

// #2026 / #1377: an all-boards activity feed.
// Run: node tests/activityFeed.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { feedEntry, visibleActivities, cleanLimit } = require('../models/lib/activityFeed.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const maps = {
  boards: new Map([['b1', { _id: 'b1', title: 'Team', slug: 'team' }]]),
  cards: new Map([['c1', { _id: 'c1', title: 'Fix login' }]]),
  lists: new Map([['l1', { _id: 'l1', title: 'Doing' }]]),
  users: new Map([['u1', { _id: 'u1', username: 'alice' }]]),
};

// Positive.
const entry = feedEntry({ _id: 'a1', activityType: 'moveCard', boardId: 'b1', cardId: 'c1', listId: 'l1', userId: 'u1',
  createdAt: new Date(0), value: 'SECRET' }, maps);
assert.deepEqual(entry, { _id: 'a1', activityType: 'moveCard', createdAt: new Date(0), boardId: 'b1', boardTitle: 'Team',
  boardSlug: 'team', cardId: 'c1', cardTitle: 'Fix login', listTitle: 'Doing', username: 'alice' });
assert.deepEqual(visibleActivities([{ boardId: 'b1', cardId: 'c9' }, { boardId: 'b2', cardId: 'c2' }],
  { assignedOnlyBoardIds: ['b2'], assignedCardIds: ['c2'] }).length, 2, 'assigned card on a limited board');
console.log('  ok - who, what, which card and board, and when');

// Negative.
assert.doesNotMatch(JSON.stringify(entry), /SECRET/, 'never a value');
assert.equal(feedEntry({ boardId: 'gone' }, maps), null, 'not a board the member sees');
assert.deepEqual(visibleActivities([{ boardId: 'b2', cardId: 'c3' }, { boardId: 'b2' }],
  { assignedOnlyBoardIds: ['b2'], assignedCardIds: ['c2'] }), [], 'assigned-only: nothing else from that board');
assert.equal(cleanLimit(10000), 100);
assert.equal(cleanLimit('x'), 50);
console.log('  ok - no values, no other boards, assigned-only respected, bounded');

const server = read('server/activityFeed.js');
assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(server, /if \(getFeatureFlags\(\)\.disableActivities\) return \[\];/);
assert.match(server, /if \(setting && setting\.hideBoardActivitiesOnAllBoards\) return \[\];/);
assert.match(server, /const boards = await visibleAllBoards\(user,/, 'the boards the member sees in All Boards');
assert.match(server, /fields: \{ activityType: 1, createdAt: 1, boardId: 1, cardId: 1, listId: 1, userId: 1 \}/, 'only those fields are read');
assert.match(read('config/router.js'), /FlowRouter\.route\('\/activity', \{\s*name: 'activity-feed',\s*triggersEnter: \[ensureSignedInUnlessSandstorm\],/);
assert.match(read('client/components/users/userHeader.jade'), /a\(href="\{\{pathFor 'activity-feed'\}\}"\)/);
console.log('  ok - signed in, honours the switches that hide activities');
console.log('\nactivityFeed: all tests passed');
