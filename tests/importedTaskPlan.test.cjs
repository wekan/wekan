'use strict';

// What KanboardCreator writes for one normalized external task.
// Run: node tests/importedTaskPlan.test.cjs
//
// Every external import (Kanboard, Deck, OpenProject, GitHub/GitLab/Gitea,
// Asana, Zenkit, Markdown) goes through KanboardCreator, which used to write a
// card and nothing else: subtasks, comments, start dates, archive state and
// colors a parser found had nowhere to go. models/lib/importedTaskPlan.js now
// decides all of it; the creator only inserts what the plan says.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const {
    importedDate, importedColor, importedComment, importedChecklists, planImportedTask,
  } = await import('../models/lib/importedTaskPlan.js');

  // Dates: Kanboard's unix seconds, ISO strings, milliseconds; "0" and junk are no date.
  assert.equal(importedDate('1790771696').toISOString(), '2026-09-30T12:34:56.000Z');
  assert.equal(importedDate(1790771696000).toISOString(), '2026-09-30T12:34:56.000Z');
  assert.equal(importedDate('2026-09-30T12:34:56Z').toISOString(), '2026-09-30T12:34:56.000Z');
  for (const none of ['0', 0, '', null, undefined, 'not a date', {}, [], false, -5]) {
    assert.equal(importedDate(none), undefined, `no date for ${JSON.stringify(none)}`);
  }

  // Colors: palette names, hex with or without '#', nothing else.
  const palette = ['green', 'red'];
  assert.equal(importedColor('Green', palette), 'green');
  assert.equal(importedColor('0082C9', palette), '#0082c9');
  assert.equal(importedColor('#0082c9', palette), '#0082c9');
  for (const bad of ['mauve', '#fff', 'javascript:x', 42, null]) assert.equal(importedColor(bad, palette), undefined);

  // Comments: a mapped author posts it; otherwise the name leads the text.
  assert.deepEqual(importedComment({ text: ' Looks good ', author: 'alice', date: '1790771696' }, { alice: 'uA' }),
    { text: 'Looks good', userId: 'uA', createdAt: new Date('2026-09-30T12:34:56Z') });
  assert.deepEqual(importedComment({ text: 'Hi', author: 'bob' }, { alice: 'uA' }),
    { text: 'bob: Hi', userId: null, createdAt: undefined });
  assert.equal(importedComment({ text: 'Anonymous' }).text, 'Anonymous');
  for (const empty of [null, {}, { text: '   ' }, { text: { html: '<b>' } }]) assert.equal(importedComment(empty), null);

  // Checklists: empty titles and empty checklists are dropped; order is kept.
  assert.deepEqual(importedChecklists([
    { title: 'Subtasks', items: [{ title: 'one', done: true }, { title: '' }, { title: 'two' }] },
    { title: 'Empty', items: [] },
    { items: [{ title: 'untitled list item' }] },
    'junk',
  ]), [
    { title: 'Subtasks', sort: 0, items: [{ title: 'one', isFinished: true, sort: 0 }, { title: 'two', isFinished: false, sort: 1 }] },
    { title: 'Checklist', sort: 2, items: [{ title: 'untitled list item', isFinished: false, sort: 0 }] },
  ]);
  assert.deepEqual(importedChecklists(undefined), []);

  // The whole task.
  const plan = planImportedTask({
    title: 'Task', description: 'Body', date_due: '1790771696', date_started: '2026-09-01',
    date_end: '0', archived: true, color: 'red', spent_hours: '2.5', owner_username: 'alice',
    requested_by: 'carol', checklists: [{ title: 'Subtasks', items: [{ title: 'a', done: true }] }],
    comments: [{ text: 'c1', author: 'bob' }, { text: '' }],
  }, { members: { alice: 'uA' }, allowedColors: palette });
  assert.deepEqual(plan.card, {
    title: 'Task', description: 'Body', archived: true, requestedBy: 'carol',
    dueAt: new Date('2026-09-30T12:34:56Z'), startAt: new Date('2026-09-01'), color: 'red', spentTime: 2.5,
  });
  assert.deepEqual(plan.memberIds, ['uA']);
  // Further assignees join the owner; unmapped and duplicate identities do not.
  assert.deepEqual(planImportedTask({ owner_username: 'alice', assignees: ['bob', 'alice', 'zed', 7, null, {}] },
    { members: { alice: 'uA', bob: 'uB', 7: 'u7' } }).memberIds, ['uA', 'uB', 'u7']);
  assert.equal(plan.checklists.length, 1);
  assert.deepEqual(plan.comments.map(c => c.text), ['bob: c1']);

  // Negative: a task with only the original fields imports exactly as before.
  const minimal = planImportedTask({ title: 'Old', tags: ['x'], owner_username: 'nobody' }, { members: {} });
  assert.deepEqual(minimal, { card: { title: 'Old', description: '', archived: false }, memberIds: [],
    watcherIds: [], unwatchedCount: 0, checklists: [], comments: [] });
  for (const spent of [0, -1, 'NaN', null]) {
    assert.equal(planImportedTask({ spent_hours: spent }).card.spentTime, undefined);
  }
  assert.equal(planImportedTask({ archived: 'yes' }).card.archived, false, 'only a real true archives');

  // The creator writes what the plan says, and nothing bypasses the plan.
  const creator = fs.readFileSync(path.join(__dirname, '../models/kanboardCreator.js'), 'utf8');
  // The creator also passes the new board's active members, the only users a
  // source watcher may become (see the watcher case below).
  assert.match(creator, /planImportedTask\(task, \{ members: this\.members, allowedColors: CARD_COLORS,\s*boardMemberIds: \(board\.members \|\| \[\]\)/);
  assert.match(creator, /if \(plan\.watcherIds\.length\) cardToCreate\.watchers = plan\.watcherIds;/);
  assert.match(creator, /\.\.\.plan\.card/);
  assert.match(creator, /cardToCreate\.members = plan\.memberIds/);
  assert.match(creator, /sort: index,/, 'cards keep their source order');
  assert.match(creator, /insertImportedChecklists\(plan\.checklists, \{ boardId, cardId/);
  assert.match(creator, /insertImportedComments\(plan\.comments, \{ boardId, cardId/);
  const children = fs.readFileSync(path.join(__dirname, '../models/lib/importedCardChildren.js'), 'utf8');
  assert.match(children, /activityType: 'addComment'/);
  assert.match(children, /writeImportedEntity\(CardComments,/);
  assert.match(children, /writeImportedEntity\(Checklists,/);
  // Jira maps users by account id but shows a display name.
  assert.deepEqual(importedComment({ text: 'x', author: 'acc-1', authorName: 'Ann' }, {}).text, 'Ann: x');
  assert.equal(importedComment({ text: 'x', author: 'acc-1', authorName: 'Ann' }, { 'acc-1': 'uA' }).text, 'x');
  assert.doesNotMatch(creator, /cardToCreate\.dueAt = /, 'dates come only from the plan');

  console.log('  ok - imported tasks carry checklists, comments, dates, archive state and colors');

  // Source watchers/followers: a card watcher only when mapped to a member of
  // the new board. Watching grants no access, but a non-member watching a
  // private board would receive its notifications.
  const watched = planImportedTask({ title: 'W', watchers: ['me', 'colleague', 'stranger', 'me', ''] },
    { members: { me: 'uMe', colleague: 'uColleague' }, boardMemberIds: ['uMe'] });
  assert.deepEqual(watched.watcherIds, ['uMe']);
  assert.equal(watched.unwatchedCount, 2, 'the non-member and the unmapped watcher are counted');
  const noBoard = planImportedTask({ title: 'W', watchers: ['me'] }, { members: { me: 'uMe' } });
  assert.deepEqual(noBoard.watcherIds, [], 'without board members nobody watches (negative)');
  console.log('  ok - source watchers become card watchers only for board members');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
