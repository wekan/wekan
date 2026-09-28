'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRuleCardDetails: prepare } = require('../server/lib/ruleCardDetails');
function fixture() {
  const f = { activity: { cardId: 'card', boardId: 'board', userId: 'actor' }, admin: false, allowed: true };
  f.card = { _id: 'card', boardId: 'board', title: 'Task', listId: 'list', swimlaneId: 'lane', dueAt: new Date('2027-01-01'),
    spentTime: 0, dueComplete: false, members: ['user'], labelIds: ['label'],
    customFields: [{ _id: 'field', value: 'choice' }, { _id: 'private', value: 'SECRET-CUSTOM' }],
    parentId: 'parent', cardDependencies: [{ cardId: 'secret', type: 'blocks' }] };
  f.board = { _id: 'board', title: 'Board', labels: [{ _id: 'label', name: 'Urgent' }], hasAdmin: () => f.admin };
  f.definitions = [{ _id: 'field', boardIds: ['board'], name: 'Priority', type: 'dropdown', settings: { dropdownItems: [{ _id: 'choice', name: 'High' }] } },
    { _id: 'private', boardIds: ['board'], name: 'Private', type: 'text', adminOnly: true }];
  f.notes = [{ cardId: 'card', boardId: 'board', title: 'Review', text: 'Visible note' }, { cardId: 'other', boardId: 'board', title: 'SECRET-NOTE', text: 'private' }];
  f.cards = { card: f.card, parent: { _id: 'parent', boardId: 'board', title: 'Parent task' }, secret: { _id: 'secret', boardId: 'private', title: 'SECRET-CARD' } };
  f.cache = { getCard: async id => f.cards[id], getBoard: async id => id === 'board' ? f.board : { _id: 'private' },
    getList: async () => ({ boardId: 'board', title: 'Doing' }), getSwimlane: async () => ({ boardId: 'board', title: 'Team' }),
    getCustomFields: async () => structuredClone(f.definitions), getCardTextNotes: async () => f.notes,
    getCards: async () => [], getUser: async () => ({ username: 'person', emails: [{ address: 'SECRET-EMAIL' }], services: { token: 'SECRET-TOKEN' } }) };
  f.canReadBoard = (_, board) => f.allowed && board?._id === 'board';
  return f;
}
test('renders public dates, zero/false, labels, people, dropdown names, notes and authorized relations', async () => {
  const f = fixture(), text = await prepare(f);
  for (const expected of ['Due: 2027-01-01T00:00:00.000Z', 'Spent time (hours): 0', 'Due complete: false', 'Labels: Urgent',
    'Members: person', 'Priority: High', 'Review: Visible note', 'Parent: Parent task']) assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('SECRET'));
  f.admin = true; assert.ok((await prepare(f)).includes('Private: SECRET-CUSTOM'));
});
test('assignment restrictions, revoked admin access and changed field policy abort the result', async () => {
  const f = fixture(); f.board.members = [{ userId: 'actor', isActive: true, isReadAssignedOnly: true }];
  await assert.rejects(prepare(f), /not-authorized/);
  const admin = fixture(); admin.admin = true; admin.cache.getCardTextNotes = async () => { admin.admin = false; return []; };
  await assert.rejects(prepare(admin), /not-authorized/);
  const changed = fixture(); let reads = 0;
  changed.cache.getCustomFields = async () => ++reads === 1 ? structuredClone(changed.definitions) : [];
  await assert.rejects(prepare(changed), /changed/);
});
test('linked cards never disclose stale local snapshots when their source is inaccessible', async () => {
  const f = fixture(); Object.assign(f.card, { type: 'cardType-linkedCard', linkedId: 'secret', locationName: 'SECRET-SNAPSHOT' });
  assert.equal(await prepare(f), '');
  f.card.linkedId = 'parent'; assert.equal(await prepare(f), 'Linked card: Parent task');
});
test('private foreign placement titles and unbounded note text are not exported', async () => {
  const f = fixture(); f.cache.getList = async () => ({ boardId: 'private', title: 'SECRET-LIST' });
  assert.ok(!(await prepare(f)).includes('SECRET'));
  f.notes[0].text = 'x'.repeat(768 * 1024); await assert.rejects(prepare(f), /too-large/);
});
test('custom dates, checkbox values, multiselect, currency and string templates keep their display semantics', async () => {
  const f = fixture();
  f.definitions.push(...[
    ['multi', 'dropdownMultiSelect', { dropdownItems: [{ _id: 'a', name: 'First' }, { _id: 'b', name: 'Second' }] }],
    ['date', 'date', {}], ['flag', 'checkbox', {}], ['money', 'currency', { currencyCode: 'EUR' }],
    ['template', 'stringtemplate', { stringtemplateFormat: '%{board.title}: %{value}', stringtemplateSeparator: '; ' }],
  ].map(([_id, type, settings]) => ({ _id, type, settings, name: _id, boardIds: ['board'] })));
  f.card.customFields.push(...[['multi', ['a', 'b']], ['date', new Date('2027-03-01')], ['flag', false], ['money', 0], ['template', ['one', 'two']]].map(([_id, value]) => ({ _id, value })));
  const text = await prepare(f);
  for (const expected of ['multi: First, Second', 'date: 2027-03-01T00:00:00.000Z', 'flag: false', 'money: 0 EUR', 'template: Board: one; Board: two']) assert.ok(text.includes(expected), expected);
});

test('timer and recurrence snapshots preserve dates and zero counts without exporting account data', async () => {
  const f = fixture(); Object.assign(f.card, {
    recurrenceInterval: 'weekly', lastRecurrenceAt: new Date('2027-01-02'),
    flowStartAt: new Date('2027-01-03'), flowInterruptions: 0, flowUserId: 'flow',
    pomodoroStartAt: new Date('2027-01-04'), pomodoroPhase: 'break', pomodoroCount: 4,
    pomodoroWorkMinutes: 25, pomodoroUserId: 'pomodoro',
  });
  f.cache.getUser = async id => ({ username: id, profile: { fullname: `${id} name` },
    emails: [{ address: 'SECRET-EMAIL' }], services: { token: 'SECRET-TOKEN' } });
  const text = await prepare(f);
  for (const expected of ['Recurrence: weekly', 'Last recurrence: 2027-01-02T00:00:00.000Z',
    'Flowtime started: 2027-01-03T00:00:00.000Z', 'Flowtime interruptions: 0', 'Flowtime user: flow name',
    'Pomodoro started: 2027-01-04T00:00:00.000Z', 'Pomodoro phase: break', 'Pomodoro completed intervals: 4',
    'Pomodoro work interval (minutes): 25', 'Pomodoro user: pomodoro name']) assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('SECRET'));
  f.cache.getUser = async () => null;
  assert.ok((await prepare(f)).includes('Flowtime user: Unknown user'));
});
test('absent or malformed timer values do not become serialized objects and access loss aborts export', async () => {
  const f = fixture();
  assert.doesNotMatch(await prepare(f), /Flowtime|Pomodoro|Recurrence/);
  Object.assign(f.card, { flowStartAt: new Date(NaN), pomodoroPhase: { secret: 'SECRET' },
    flowUserId: { secret: 'SECRET' }, recurrenceInterval: { secret: 'SECRET' } });
  assert.doesNotMatch(await prepare(f), /SECRET|Invalid Date|object Object|Flowtime|Pomodoro|Recurrence/);
  f.card.flowUserId = 'timer-owner';
  f.cache.getUser = async () => { f.allowed = false; return { username: 'person' }; };
  await assert.rejects(prepare(f), /not-authorized/);
});
test('private votes retain counts while public votes and ended poker resolve only public names', async () => {
  const f = fixture();
  f.card.vote = { question: 'Ship?', public: false, positive: ['yes'], negative: ['no'], end: new Date('2020-01-01') };
  f.card.poker = { question: true, end: new Date('2999-01-01'), one: ['poker-user'], estimation: 0 };
  f.cache.getUser = async id => ({ username: `${id}-name`, emails: ['SECRET-EMAIL'] });
  let text = await prepare(f);
  for (const expected of ['Vote question: Ship?', 'Votes for: 1', 'Votes against: 1', 'Poker estimation: 0']) assert.ok(text.includes(expected));
  assert.doesNotMatch(text, /yes-name|no-name|poker-user-name|Poker 1 votes|SECRET/);
  f.card.vote.public = true; f.card.poker.end = new Date('2020-01-01');
  text = await prepare(f);
  for (const expected of ['For voters: yes-name', 'Against voters: no-name', 'Poker 1 votes: 1', 'Poker 1 voters: poker-user-name', 'Poker 2 votes: 0']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /SECRET/);
});
test('hidden voting sections, unfinished poker and a visibility change during name lookup cannot leak results', async () => {
  const f = fixture(); f.card.vote = { question: 'SECRET-QUESTION', public: true, positive: ['voter'] };
  f.card.poker = { question: true, one: ['poker-user'], estimation: 42 };
  f.board.allowsVote = false; f.board.allowsPoker = false;
  assert.doesNotMatch(await prepare(f), /SECRET|Poker|voters/);
  f.board.allowsVote = true;
  f.cache.getUser = async () => { f.card.vote.public = false; return { username: 'VOTER' }; };
  await assert.rejects(prepare(f), /details-changed/);
});
test('linked-board voting uses the readable target, not cached wrapper votes, and respects both boards', async () => {
  const f = fixture(); Object.assign(f.card, { type: 'cardType-linkedBoard', linkedId: 'target',
    vote: { question: 'STALE-WRAPPER-VOTE', public: true, positive: ['wrapper'] } });
  const target = { _id: 'target', title: 'Target board',
    vote: { question: 'Board decision', public: true, positive: ['voter'], negative: [] },
    poker: { question: true, end: new Date('2020-01-01'), two: ['voter'], estimation: 2 } };
  f.cache.getBoard = async id => id === 'target' ? target : f.board;
  f.canReadBoard = (_, board) => !!board;
  let text = await prepare(f);
  for (const expected of ['Vote question: Board decision', 'Votes for: 1', 'For voters: person',
    'Poker 2 votes: 1', 'Poker 2 voters: person']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /STALE|SECRET/);
  target.vote.public = false; target.poker.end = new Date('2999-01-01');
  text = await prepare(f); assert.ok(text.includes('Votes for: 1'));
  assert.doesNotMatch(text, /For voters|Poker 2 votes|Poker 2 voters/);
  for (const board of [f.board, target]) {
    board.allowsVote = false; board.allowsPoker = false;
    assert.doesNotMatch(await prepare(f), /Vote question|Votes for|Poker/);
    delete board.allowsVote; delete board.allowsPoker;
  }
  target.vote.public = true;
  f.cache.getUser = async () => { target.vote.public = false; return { username: 'person' }; };
  await assert.rejects(prepare(f), /details-changed/);
});
test('Scrum details honor six visibility flags and resolve only same-board names', async () => {
  const f = fixture(); f.board.scrum = { visibility: Object.fromEntries(
    ['Sprint', 'PastSprints', 'Release', 'IssueType', 'AcceptanceCriteria', 'BacklogRank'].map(key => [`card${key}`, true])) };
  f.card.scrum = { sprintId: 'sprint', pastSprintIds: ['past', 'foreign', 'missing'], releaseId: 'release',
    issueType: 'Story', acceptanceCriteria: 'Reviewed by owner', backlogRank: 0, private: 'SECRET' };
  const rows = { sprint: { _id: 'sprint', boardId: 'board', name: 'Current sprint' },
    past: { _id: 'past', boardId: 'board', name: 'Past sprint' },
    release: { _id: 'release', boardId: 'board', name: 'Release one' },
    foreign: { _id: 'foreign', boardId: 'other', name: 'SECRET' } };
  f.readScrumRecord = async (_, id) => rows[id];
  const text = await prepare(f);
  for (const expected of ['Scrum sprint: Current sprint', 'Past Scrum sprints: Past sprint',
    'Scrum release: Release one', 'Scrum issue type: Story', 'Scrum acceptance criteria: Reviewed by owner',
    'Scrum backlog rank: 0']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /SECRET|missing/);
  f.board.scrum.visibility = {}; f.readScrumRecord = () => assert.fail('hidden references must not be read');
  assert.doesNotMatch(await prepare(f), /Scrum/);
});
test('Scrum reference movement and visibility revocation during reads stop mail preparation', async () => {
  for (const change of ['reference', 'policy']) {
    const f = fixture(); f.board.scrum = { visibility: { cardSprint: true } }; f.card.scrum = { sprintId: 'sprint' };
    let reads = 0;
    f.readScrumRecord = async () => {
      reads++;
      if (change === 'policy') f.board.scrum.visibility.cardSprint = false;
      return { _id: 'sprint', boardId: change === 'reference' && reads > 1 ? 'other' : 'board', name: 'Sprint' };
    };
    await assert.rejects(prepare(f), /changed/);
  }
});
test('creator, stickers and lifecycle metadata use public scalar fields only', async () => {
  const f = fixture(); Object.assign(f.card, { userId: 'author', archivedAt: new Date('2027-01-01'),
    dateLastActivity: new Date('2027-01-02'), sort: 0, subtaskSort: 2, lastMoveReason: 'Review complete',
    stickers: [{ name: 'Approved', icon: 'check', highlight: 'round', position: 0, private: 'SECRET' },
      { name: { secret: 'SECRET' } }, null] });
  const text = await prepare(f);
  for (const expected of ['Created by: person', 'Sticker: Approved, check, round, 0',
    'Archived at: 2027-01-01T00:00:00.000Z', 'Last activity: 2027-01-02T00:00:00.000Z',
    'Sort: 0', 'Subtask sort: 2', 'Last move reason: Review complete']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /SECRET|object Object/);
});
test('related links use live readable titles, retain their source evidence and refuse late revocation', async () => {
  const f = fixture();
  f.cards.parent = { _id: 'parent', boardId: 'board', type: 'cardType-linkedCard', linkedId: 'actual', title: 'STALE' };
  f.cards.actual = { _id: 'actual', boardId: 'board', title: 'Current parent title' };
  const collected = []; f.onRelatedSource = binding => collected.push(binding);
  assert.match(await prepare(f), /Parent: Current parent title/);
  assert.deepEqual(collected[0].cards.map(row => row[0]), ['parent', 'actual']);
  f.cards.parent.linkedId = 'secret';
  assert.doesNotMatch(await prepare(f), /Parent:|STALE|SECRET/);
  f.cards.parent.linkedId = 'actual';
  f.onRelatedSource = () => { f.cards.actual.deletedAt = new Date(); };
  await assert.rejects(prepare(f), /not-authorized/);
});
test('legacy Gantt targets share authorization and source capture with canonical relations', async () => {
  const f = fixture(); delete f.card.parentId;
  f.card.cardDependencies = [{ cardId: 'parent', type: 'blocks' }, { cardId: 'parent', type: 'blocks' }];
  f.card.targetId_gantt = ['parent', 'secret']; f.card.linkType_gantt = [0, 1]; f.card.linkId_gantt = ['SECRET-INTERNAL'];
  const sources = []; f.onRelatedSource = source => sources.push(source);
  const text = await prepare(f);
  assert.match(text, /blocks \/ Gantt finish-to-start: Parent task/);
  assert.equal(text.split('Parent task').length, 2); assert.equal(sources.length, 1);
  assert.doesNotMatch(text, /SECRET/);
});

test('linked-board state and people come from current target display fields', async () => {
  const f = fixture(); Object.assign(f.card, { type: 'cardType-linkedBoard', linkedId: 'target',
    archived: true, dueComplete: true, isOvertime: true, members: ['SECRET-WRAPPER'] });
  const target = { _id: 'target', title: 'Target', archived: false, dueComplete: false, isOvertime: false,
    spentTime: 0, members: [{ userId: 'active', isActive: true, isAdmin: true },
      { userId: 'active', isActive: true }, { userId: 'inactive', isActive: false },
      { userId: 'missing', isActive: true }, null, { userId: {}, isActive: true }] };
  f.cache.getBoard = async id => id === 'target' ? target : f.board;
  f.canReadBoard = (_, board) => !!board && f.allowed;
  const lookedUp = [];
  f.cache.getUser = async id => { lookedUp.push(id); return id === 'active'
    ? { profile: { fullname: 'Active member' }, emails: ['SECRET-EMAIL'], services: { token: 'SECRET' } } : null; };
  const text = await prepare(f);
  for (const part of ['Archived: false', 'Due complete: false', 'Overtime: false', 'Spent time (hours): 0',
    'Members: Active member', 'Assignees: Active member']) assert.ok(text.includes(part), part);
  assert.deepEqual(lookedUp, ['active', 'missing']);
  assert.doesNotMatch(text, /SECRET|isAdmin|inactive|missing/);
  let targetReadable = true;
  f.canReadBoard = (_, board) => !!board && (board._id !== 'target' || targetReadable);
  f.cache.getUser = async () => { targetReadable = false; return { username: 'Active member' }; };
  await assert.rejects(prepare(f), /not-authorized/);
});

test('linked-board local content reuses local custom-field and related-source policies', async () => {
  const f = fixture(); f.localLinkedBoard = true;
  Object.assign(f.card, { type: 'cardType-linkedBoard', linkedId: 'target', title: 'STALE TITLE',
    stickers: [{ name: 'Local sticker' }], locations: [{ name: 'Local place' }],
    vote: { question: 'STALE VOTE' }, userId: 'creator' });
  const target = { _id: 'target', title: 'Live board title' };
  const originalGetBoard = f.cache.getBoard;
  f.cache.getBoard = async id => id === 'target' ? target : originalGetBoard(id);
  f.canReadBoard = (_, board) => ['board', 'target'].includes(board?._id);
  const policies = [], related = [];
  f.onCustomFieldPolicy = (id, defs) => policies.push([id, defs]);
  f.onRelatedSource = binding => related.push(binding);
  const text = await prepare(f);
  for (const part of ['Priority: High', 'Sticker: Local sticker', 'Location: Local place',
    'Review: Visible note', 'Created by: person', 'Parent: Parent task']) assert.ok(text.includes(part), part);
  assert.doesNotMatch(text, /SECRET|STALE|Due:|Spent time|Votes|Members:|Assignees:/);
  assert.equal(policies[0][0], 'board'); assert.equal(related.length, 1);
  // A definition becoming admin-only during preparation must reject the result.
  const originalGetUser = f.cache.getUser;
  f.cache.getUser = async id => { f.definitions[0].adminOnly = true; return originalGetUser(id); };
  await assert.rejects(prepare(f), /details-changed/);
});
test('local linked-board content rejects retargeting and use with a copied linked-card wrapper', async () => {
  const f = fixture(); f.localLinkedBoard = true;
  Object.assign(f.card, { type: 'cardType-linkedCard', linkedId: 'target' });
  await assert.rejects(prepare(f), /local-board-required/);
  f.card.type = 'cardType-linkedBoard';
  const saved = { ...f.card }; let reads = 0;
  f.cache.getCard = async id => id === 'card' ? (++reads === 1 ? saved : { ...saved, linkedId: 'other' }) : f.cards[id];
  f.cache.getBoard = async id => id === 'target' ? { _id: 'target', title: 'Board' } : f.board;
  f.canReadBoard = () => true;
  await assert.rejects(prepare(f), /details-changed/);
});
