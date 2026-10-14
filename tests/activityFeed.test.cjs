'use strict';

// #2026 / #1377: an all-boards activity feed.
// Run: node tests/activityFeed.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { feedEntry, visibleActivities, cleanLimit, withoutUnfilledPlaceholders, humanActivityType, activityTitleParams } = require('../models/lib/activityFeed.js');

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
const { params, sentenceKey, ...base } = entry;
assert.deepEqual(base, { _id: 'a1', activityType: 'moveCard', createdAt: new Date(0), boardId: 'b1', boardTitle: 'Team',
  boardSlug: 'team', cardId: 'c1', cardTitle: 'Fix login', listTitle: 'Doing', username: 'alice' });
assert.equal(sentenceKey, 'act-moveCard');
assert.equal(params.card, 'Fix login');
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
// The ids of what the sentence names, and a rename's new title - never a value.
assert.match(server, /fields: \{ activityType: 1, createdAt: 1, boardId: 1, cardId: 1, listId: 1, userId: 1, oldListId: 1, swimlaneId: 1,/, 'only those fields are read');
assert.match(read('config/router.js'), /FlowRouter\.route\('\/activity', \{\s*name: 'activity-feed',\s*triggersEnter: \[ensureSignedInUnlessSandstorm\],/);
assert.match(read('client/components/users/userHeader.jade'), /a\(href="\{\{pathFor 'activity-feed'\}\}"\)/);
console.log('  ok - signed in, honours the switches that hide activities');

// What the sentence names (the feed showed __checklistItem__, __oldList__ ...).
const more = {
  ...maps,
  boards: new Map([['b1', { _id: 'b1', title: 'Team', slug: 'team', labels: [{ _id: 'lb', name: 'Bug', color: 'red' }],
    members: [{ userId: 'reader', isNoComments: false }, { userId: 'quiet', isNoComments: true }] }],
  ['b0', { _id: 'b0', title: 'Old board' }]]),
  lists: new Map([['l1', { _id: 'l1', title: 'Doing' }], ['l0', { _id: 'l0', title: 'Todo' }]]),
  swimlanes: new Map([['s1', { _id: 's1', title: 'Team A' }], ['s0', { _id: 's0', title: 'Team B' }]]),
  checklists: new Map([['k1', { _id: 'k1', title: 'Release' }]]),
  checklistItems: new Map([['i1', { _id: 'i1', title: 'Tag it' }]]),
  comments: new Map([['m1', { _id: 'm1', text: 'Looks good' }]]),
  users: new Map([['u1', { _id: 'u1', username: 'alice' }], ['u2', { _id: 'u2', username: 'bob' }]]),
  viewerId: 'reader',
};
const full = feedEntry({ _id: 'a2', activityType: 'checkedItem', boardId: 'b1', cardId: 'c1', listId: 'l1', oldListId: 'l0',
  swimlaneId: 's1', oldSwimlaneId: 's0', checklistId: 'k1', checklistItemId: 'i1', commentId: 'm1', labelId: 'lb',
  assigneeId: 'u2', memberId: 'u2', attachmentName: 'spec.pdf', oldBoardId: 'b0', userId: 'u1', value: 'SECRET' }, more).params;
assert.deepEqual(
  [full.checklist, full.checkList, full.checklistItem, full.list, full.oldList, full.swimlane, full.oldSwimlane,
    full.comment, full.label, full.assignee, full.member, full.attachment, full.oldBoard],
  ['Release', 'Release', 'Tag it', 'Doing', 'Todo', 'Team A', 'Team B', 'Looks good', 'Bug', 'bob', 'bob', 'spec.pdf', 'Old board']);
// A rename names its new title; a swimlane's activity keeps the swimlane's id in listId.
assert.deepEqual(activityTitleParams({ activityType: 'changedSwimlaneTitle', title: 'Ops' }), { swimlane: 'Ops' });
assert.deepEqual(activityTitleParams({ activityType: 'changedListTitle', title: 'Done' }), { list: 'Done' });
assert.deepEqual(activityTitleParams({ activityType: 'changedBoardTitle', title: 'New' }), { board: 'New' });
assert.equal(feedEntry({ activityType: 'restoredSwimlane', boardId: 'b1', listId: 's1', title: 'Ops' }, more).params.swimlane, 'Ops');
// What nothing filled is left out, not shown.
assert.equal(withoutUnfilledPlaceholders('checked __checklistItem__ of checklist __checklist__ at card X : __comment__'),
  'checked of checklist at card X:');
assert.equal(humanActivityType('removedChecklistItem'), 'removed checklist item');
console.log('  ok - the sentence names the checklist, item, old list, swimlanes, label, people, file and comment');

// Negative: never a value; no comment text for a member who may not read
// comments; another board only when the member sees it.
assert.doesNotMatch(JSON.stringify(full), /SECRET/);
assert.equal(feedEntry({ activityType: 'addComment', boardId: 'b1', commentId: 'm1' }, { ...more, viewerId: 'quiet' }).params.comment, '');
assert.equal(feedEntry({ activityType: 'moveCardBoard', boardId: 'b1', oldBoardId: 'hidden' }, more).params.oldBoard, '');
console.log('  ok - no values, no comments for no-comments members, no board the member does not see');

// Every kind of activity WeKan stores has a sentence (rule triggers named
// like activities are not activities).
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const TRIGGERS = new Set(['advancedFilterTrigger', 'button', 'changed', 'scheduledTrigger', 'textContainsTrigger', 'moveCardDirection']);
const stored = new Set();
const walk = dir => {
  for (const item of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${item.name}`;
    if (item.isDirectory()) { if (!['node_modules', '_build', 'tests'].includes(item.name)) walk(rel); continue; }
    if (!/\.js$/.test(item.name)) continue;
    for (const m of read(rel).matchAll(/activityType: '([a-zA-Z]+)'/g)) stored.add(m[1]);
  }
};
['models', 'server'].forEach(walk);
assert.deepEqual([...stored].filter(type => !TRIGGERS.has(type) && !en[`act-${type}`]).sort(), [], 'an activity with no sentence shows its raw name');
const feedServer = read('server/activityFeed.js');
assert.doesNotMatch(feedServer.slice(feedServer.indexOf('Activities.find('), feedServer.indexOf('.fetchAsync()', feedServer.indexOf('Activities.find('))),
  /\bvalue: 1\b/, 'the feed never reads a value');
assert.match(read('client/components/main/activityFeed.js'), /return withoutUnfilledPlaceholders\(text\);/);
assert.match(read('server/models/activities.js'), /for \(const \[key, value\] of Object\.entries\(activityTitleParams\(activity\)\)\) \{\s*if \(!params\[key\]\) params\[key\] = normalizeActivityText\(value\);/);
console.log('  ok - every stored activity has a sentence; the notifications get the renamed titles too');

console.log('\nactivityFeed: all tests passed');
