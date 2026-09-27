'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
// Opt-in: exercises real Meteor methods and Mongo, never a mocked collection.
const url = process.env.WEKAN_SCRUM_TEST_URL;
test('Scrum DDP lifecycle, snapshots, permissions and revision conflicts', { skip: !url, timeout: 180000 }, async () => {
  process.env.WEKAN_BASE_URL = url;
  const db = require('./playwright/helpers/db');
  const { loginWithToken } = require('./playwright/helpers/auth');
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH) process.env.PLAYWRIGHT_BROWSERS_PATH = require('node:path').resolve('.tools/ms-playwright');
  const { chromium } = require('./playwright/node_modules/playwright');
  const browser = await chromium.launch({ headless: true });
  const admin = db.seedUser();
  const reader = db.seedUser();
  const otherReaders = [db.seedUser(), db.seedUser()];
  const allUserIds = [admin.id, reader.id, ...otherReaders.map(user => user.id)];
  const board = db.seedBoard({ ownerId: admin.id, title: 'Scrum method regression', cardTitlesPerList: [['Zero', 'Missing', 'Done']] });
  const foreign = db.seedBoard({ ownerId: admin.id, title: 'Foreign Scrum board' });
  db.addBoardMember({ boardId: board.boardId, userId: reader.id });
  db.updateOne('boards', { _id: board.boardId, 'members.userId': reader.id }, { $set: { 'members.$.isNoComments': false, 'members.$.isReadOnly': false, 'members.$.isReadAssignedOnly': true } });
  for (const user of otherReaders) {
    db.addBoardMember({ boardId: board.boardId, userId: user.id });
    db.updateOne('boards', { _id: board.boardId, 'members.userId': user.id }, { $set: { 'members.$.isReadOnly': true } });
  }
  try {
    const page = await browser.newPage();
    await loginWithToken(page, admin.id, admin.token);
    const call = (method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args).catch(error => { throw new Error(`${error.error}: ${error.reason}`); }), { method, args });
    const b = board.boardId;
    let config = await call('scrum.configure', b, { enabled: true, visibility: { cardSprint: true } }, 0);
    config = await call('scrum.configure', b, { visibility: { listCategory: true } }, config.settingsRevision);
    assert.equal(config.settings.visibility.cardSprint, true);
    assert.equal(config.settings.visibility.listCategory, true);
    await assert.rejects(call('scrum.configure', b, { visibility: { isAdmin: true } }, config.settingsRevision), /invalid-scrum/);
    await assert.rejects(call('scrum.configure', b, { productGoal: 'Stale' }, 0), /scrum-conflict/);
    const release = await call('scrum.saveRelease', b, null, { name: 'Release', state: 'planned' }, null);
    const create = (id, name) => call('scrum.saveSprint', id, null, { name, plannedStart: '2026-09-28', plannedEnd: '2026-10-09', capacity: 10, capacityUnit: 'points' }, null);
    const sprint = await create(b, 'Current');
    const next = await create(b, 'Next');
    const foreignSprint = await create(foreign.boardId, 'Foreign');
    const cards = db.find('cards', { boardId: b }).sort((a, z) => a.title.localeCompare(z.title));
    for (const card of cards) {
      await call('scrum.updateCard', b, card._id, { sprintId: sprint._id, releaseId: release._id }, 0);
    }
    const zero = cards.find(c => c.title === 'Zero');
    db.updateOne('cards', { _id: zero._id }, { $set: { assignees: [reader.id] } });
    const done = cards.find(c => c.title === 'Done');
    db.updateOne('cards', { _id: zero._id }, { $set: { 'poker.estimation': 0 } });
    db.updateOne('cards', { _id: done._id }, { $set: { dueComplete: true, 'poker.estimation': 5 } });
    await assert.rejects(call('scrum.updateCard', b, zero._id, { sprintId: foreignSprint._id }, 1), /invalid-scrum/);
    await assert.rejects(call('scrum.updateCard', b, zero._id, { isAdmin: true }, 1), /invalid-scrum/);
    await assert.rejects(call('/cards/update', { _id: zero._id }, { $set: { scrum: { sprintId: foreignSprint._id } } }), /denied|403|Access/i);
    const active = await call('scrum.startSprint', b, sprint._id, sprint.revision);
    assert.equal(active.state, 'active');
    assert.equal(active.startSnapshot.missingEstimates, 1);
    assert.equal(active.startSnapshot.totalEstimate, 5);
    await assert.rejects(call('scrum.configure', b, { estimateUnit: 'hours' }, config.settingsRevision), /invalid-scrum/);
    await assert.rejects(call('scrum.startSprint', b, sprint._id, sprint.revision), /scrum-conflict/);
    const event = await call('scrum.saveEvent', b, null, { kind: 'review', sprintId: sprint._id, startsAt: '2026-10-09T12:00:00Z', followUpCardIds: [zero._id] }, null);
    assert.equal(event.kind, 'review');
    db.updateOne('cards', { _id: done._id }, { $set: { archived: true } });
    const closed = await call('scrum.closeSprint', b, sprint._id, active.revision, next._id);
    assert.equal(closed.state, 'closed');
    assert.equal(closed.closeSnapshot.cards.find(c => c.cardId === done._id).done, true);
    assert.equal(db.findOne('cards', { _id: done._id }).scrum.sprintId, null);
    assert.equal(db.findOne('cards', { _id: zero._id }).scrum.sprintId, next._id);
    assert.ok(db.findOne('cards', { _id: zero._id }).scrum.pastSprintIds.includes(sprint._id));
    const retried = await call('scrum.closeSprint', b, sprint._id, active.revision, next._id);
    assert.equal(retried.revision, closed.revision);
    const cancelled = await call('scrum.cancelSprint', b, next._id, next.revision, 'Objective changed');
    assert.equal(cancelled.state, 'cancelled');
    const data = await call('scrum.getBoardData', b);
    assert.equal(data.sprints.length, 2);
    assert.equal(data.canAdmin, true);
    // A dedicated DDP connection isolates authorization from UI session navigation.
    await page.evaluate(async ({ url, token }) => {
      window.scrumReaderConnection = DDP.connect(url);
      await window.scrumReaderConnection.callAsync('login', { resume: token });
    }, { url, token: reader.token });
    const readCall = (method, ...args) => page.evaluate(({ method, args }) => window.scrumReaderConnection.callAsync(method, ...args).catch(error => { throw new Error(`${error.error}: ${error.reason}`); }), { method, args });
    assert.equal((await readCall('scrum.getBoardData', b)).canAdmin, false);
    const scoped = await readCall('scrum.getBoardData', b);
    assert.deepEqual(scoped.cards.map(c => c._id), [zero._id]);
    assert.deepEqual(scoped.sprints.find(s => s._id === sprint._id).startSnapshot.cards.map(c => c.cardId), [zero._id]);
    assert.equal(scoped.partial, true);
    await assert.rejects(readCall('scrum.configure', b, { enabled: false }, config.settingsRevision), /not-authorized/);
    await page.evaluate(token => window.scrumReaderConnection.callAsync('login', { resume: token }).catch(error => { throw new Error(`${error.error}: ${error.reason}`); }), otherReaders.shift().token);
    assert.equal((await readCall('scrum.getBoardData', b)).canAdmin, false);
    await assert.rejects(readCall('scrum.updateCard', b, zero._id, { issueType: 'story' }), /not-authorized/);
    await page.evaluate(token => window.scrumReaderConnection.callAsync('login', { resume: token }).catch(error => { throw new Error(`${error.error}: ${error.reason}`); }), otherReaders.shift().token);
    assert.equal((await readCall('scrum.getBoardData', b)).canAdmin, false);
    await assert.rejects(readCall('scrum.getBoardData', foreign.boardId), /not-authorized/);
  } finally {
    await browser.close();
    for (const collection of ['scrumSprints', 'scrumReleases', 'scrumEvents']) db.deleteMany(collection, { boardId: { $in: [board.boardId, foreign.boardId] } });
    db.cleanup({ boardIds: [board.boardId, foreign.boardId], userIds: allUserIds });
  }
});
