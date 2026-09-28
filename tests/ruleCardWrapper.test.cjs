'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRuleCardWrapper: prepare } = require('../server/lib/ruleCardWrapper');
function fixture() {
  const card = { _id: 'link', boardId: 'local', type: 'cardType-linkedCard', linkedId: 'source',
    listId: 'list', swimlaneId: 'lane', title: 'STALE TITLE', description: 'STALE DESCRIPTION',
    stickers: [{ name: 'STALE STICKER' }], recurrenceInterval: 'weekly', lastRecurrenceAt: new Date('2027-01-01'), sort: 0, flowInterruptions: 2, flowUserId: 'person',
    scrum: { sprintId: 'sprint', issueType: 'SECRET HIDDEN', backlogRank: 0 } };
  const board = { _id: 'local', title: 'Local board', scrum: { visibility: { cardSprint: true, cardBacklogRank: true } } };
  const args = { activity: { cardId: 'link', boardId: 'local', userId: 'actor' }, canReadBoard: () => true,
    cache: { getCard: async () => ({ ...card }), getBoard: async () => board,
      getList: async () => ({ boardId: 'local', title: 'Local list' }),
      getSwimlane: async () => ({ boardId: 'foreign', title: 'SECRET LANE' }),
      getUser: async () => ({ username: 'Visible person', emails: ['SECRET EMAIL'] }) },
    readScrumRecord: async () => ({ _id: 'sprint', boardId: 'local', name: 'Local sprint' }) };
  return { card, board, args };
}
test('local wrapper fields use local scope, visible Scrum and public names without cached content', async () => {
  for (const type of ['cardType-linkedCard']) {
    const { card, args } = fixture(); card.type = type;
    const text = await prepare(args);
    for (const part of ['Linked card local details:', 'Board: Local board', 'List: Local list', 'Sort: 0',
      'Recurrence: weekly', 'Last recurrence: 2027-01-01T00:00:00.000Z', 'Flowtime interruptions: 2', 'Flowtime user: Visible person', 'Scrum sprint: Local sprint', 'Scrum backlog rank: 0']) assert.ok(text.includes(part), part);
    assert.doesNotMatch(text, /STALE|SECRET|source/);
  }
});
test('ordinary cards add no duplicate wrapper section', async () => {
  const { card, args } = fixture(); delete card.type;
  assert.equal(await prepare(args), '');
});
test('access loss, retarget and changed Scrum visibility reject the snapshot', async () => {
  for (const change of ['access', 'target', 'visibility']) {
    const { card, board, args } = fixture(); let allowed = true;
    args.canReadBoard = () => allowed;
    args.cache.getList = async () => {
      if (change === 'access') allowed = false;
      if (change === 'target') card.linkedId = 'other';
      if (change === 'visibility') board.scrum.visibility.cardSprint = false;
      return null;
    };
    await assert.rejects(prepare(args), /rule-email-wrapper/);
  }
});
test('foreign Scrum references and malformed timer objects cannot become text', async () => {
  const { card, args } = fixture(); card.pomodoroPhase = { secret: 'SECRET' };
  args.readScrumRecord = async () => ({ _id: 'sprint', boardId: 'foreign', name: 'SECRET SPRINT' });
  assert.doesNotMatch(await prepare(args), /SECRET|Scrum sprint|Pomodoro phase/);
});
test('deleted, foreign-board and unassigned wrappers are rejected', async () => {
  for (const failure of ['deleted', 'board', 'assignment']) {
    const { card, board, args } = fixture();
    if (failure === 'deleted') card.deletedAt = new Date();
    if (failure === 'board') card.boardId = 'foreign';
    if (failure === 'assignment') board.members = [{ userId: 'actor', isActive: true, isReadAssignedOnly: true }];
    await assert.rejects(prepare(args), /rule-email-wrapper-not-authorized/);
  }
});

test('linked-card placement lifecycle is local and excludes source-owned number and color', async () => {
  const { card, args } = fixture();
  Object.assign(card, { archived: false, archivedAt: new Date('2027-01-01'),
    createdAt: new Date('2026-01-01'), modifiedAt: new Date('2027-02-01'),
    dateLastActivity: new Date('2027-03-01'), cardNumber: 999, color: 'STALE-COLOR' });
  const text = await prepare(args);
  for (const value of ['Archived: false', 'Archived at: 2027-01-01T00:00:00.000Z',
    'Created: 2026-01-01T00:00:00.000Z', 'Modified: 2027-02-01T00:00:00.000Z',
    'Last activity: 2027-03-01T00:00:00.000Z']) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /999|STALE-COLOR|Card number|Color:/);
  card.archived = true; card.archivedAt = new Date('invalid');
  assert.match(await prepare(args), /Archived: true/);
  assert.doesNotMatch(await prepare(args), /Archived at:|Invalid Date/);
});
