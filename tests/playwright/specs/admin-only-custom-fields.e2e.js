'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return { value: await Meteor.callAsync(method, ...args) }; }
  catch (error) { return { error: error.error || error.message }; }
}, { method, args });
function setup(owner, member) {
  const board = db.seedBoard({ ownerId: owner.id, cardTitlesPerList: [['Protected card']] });
  db.addBoardMember({ boardId: board.boardId, userId: member.id });
  const card = db.findOne('cards', { boardId: board.boardId });
  const secret = db.uid('secret'), ordinary = db.uid('ordinary');
  for (const [id, adminOnly] of [[secret, true], [ordinary, false]]) db.insertOne('customFields', {
    _id: id, boardIds: [board.boardId], name: adminOnly ? 'Secret budget' : 'Public note', type: 'text', settings: {}, adminOnly,
  });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: secret, value: 'CLASSIFIED-9999' }, { _id: ordinary, value: 'VISIBLE' }] } });
  return { board, card, secret, ordinary };
}
test('REST and live eager/lazy DDP conceal values and react to admin/definition changes', async ({ page, user, user2 }) => {
  const f = setup(user, user2);
  try {
    await loginWithToken(page, user2.id, user2.token);
    const get = token => page.request.get(`/api/cards/${f.card._id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(await (await get(user2.token)).text()).not.toContain('CLASSIFIED-9999');
    expect(await (await get(user.token)).text()).toContain('CLASSIFIED-9999');
    { // Run this scenario under both CARDS_LOADING=all and CARDS_LOADING=lazy.
      await page.evaluate(({ board, card }) => new Promise((resolve, reject) => {
        window.fieldSubs?.forEach(s => s.stop());
        window.fieldSubs = [Meteor.subscribe('board', board.boardId, false, { onReady: resolve, onStop: reject }),
          Meteor.subscribe('boardCardsWindow', board.boardId, { listId: card.listId }, { sort: 1 }, 20)];
      }), f);
      await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards?._getCollection().findOne(id)?.customFields?.[1]?.value, f.card._id)).toBe('VISIBLE');
      expect(await page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id).customFields[0].value, f.card._id)).toBeNull();
    }
    const members = db.findOne('boards', { _id: f.board.boardId }).members;
    db.updateOne('boards', { _id: f.board.boardId }, { $set: { members: members.map(m => m.userId === user2.id ? { ...m, isAdmin: true } : m) } });
    await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id)?.customFields?.[0]?.value, f.card._id)).toBe('CLASSIFIED-9999');
    db.updateOne('boards', { _id: f.board.boardId }, { $set: { members } });
    await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id)?.customFields?.[0]?.value, f.card._id)).toBeNull();
    db.updateOne('customFields', { _id: f.secret }, { $set: { adminOnly: false } });
    await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id)?.customFields?.[0]?.value, f.card._id)).toBe('CLASSIFIED-9999');
    db.updateOne('customFields', { _id: f.secret }, { $set: { adminOnly: true } });
    await expect.poll(() => page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id)?.customFields?.[0]?.value, f.card._id)).toBeNull();
    const exported = await page.request.get(`/api/boards/${f.board.boardId}/export?authToken=${user2.token}`);
    expect(exported.ok()).toBe(false); expect(await exported.text()).not.toContain('CLASSIFIED-9999');
  } finally { db.cleanup({ boardIds: [f.board.boardId] }); }
});
for (const attack of ['insert', 'replace', 'push', 'unset', 'copy', 'rest', 'definition', 'definition-insert']) test(`member cannot forge admin-only fields through ${attack}`, async ({ page, user, user2 }) => {
  const f = setup(user, user2);
  try {
    await loginWithToken(page, user2.id, user2.token);
    // Positive control: editing a public value on the same card remains allowed.
    expect((await call(page, '/cards/update', { _id: f.card._id }, { $set: { 'customFields.1.value': 'changed' } })).error).toBeUndefined();
    let result;
    if (attack === 'insert') result = await call(page, '/cards/insert', { title: 'forged', boardId: f.board.boardId, listId: f.card.listId, swimlaneId: f.card.swimlaneId, type: 'cardType-card', customFields: [{ _id: f.secret, value: 'FORGED' }] });
    if (attack === 'replace') result = await call(page, '/cards/update', { _id: f.card._id }, { $set: { customFields: [{ _id: f.secret, value: 'FORGED' }] } });
    if (attack === 'push') result = await call(page, '/cards/update', { _id: f.card._id }, { $push: { customFields: { _id: f.secret, value: 'FORGED' } } });
    if (attack === 'unset') result = await call(page, '/cards/update', { _id: f.card._id }, { $unset: { customFields: '' } });
    if (attack === 'copy') result = await call(page, 'copyCard', f.card._id, f.board.boardId, f.card.swimlaneId, f.card.listId, false, { customFields: [{ _id: f.secret, value: 'FORGED' }] });
    if (attack === 'definition-insert') result = await call(page, '/customFields/insert', { boardIds: [f.board.boardId], name: 'Forged private field', type: 'text', settings: {}, adminOnly: true });
    if (attack === 'definition') result = await call(page, '/customFields/update', { _id: f.secret }, { $set: { adminOnly: false } });
    if (attack === 'rest') {
      const response = await page.request.put(`/api/boards/${f.board.boardId}/lists/${f.card.listId}/cards/${f.card._id}`, { headers: { Authorization: `Bearer ${user2.token}` }, data: { customFields: [{ _id: f.secret, value: 'FORGED' }] } });
      result = { error: !response.ok() };
    }
    expect(result.error).toBeTruthy();
    expect(db.findOne('cards', { _id: f.card._id }).customFields[0].value).toBe('CLASSIFIED-9999');
    expect(db.findOne('customFields', { _id: f.secret }).adminOnly).toBe(true);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'AdminFieldBleed', action: 'blocked', username: user2.username })?.count).toBeGreaterThan(0);
  } finally { db.cleanup({ boardIds: [f.board.boardId] }); }
});

test('value queries and History search cannot infer a hidden value; admin mutations remain allowed', async ({ page, user, user2 }) => {
  const f = setup(user, user2);
  try {
    await loginWithToken(page, user2.id, user2.token);
    const denied = await page.request.get(`/api/boards/${f.board.boardId}/cardsByCustomField/${f.secret}/CLASSIFIED-9999`, { headers: { Authorization: `Bearer ${user2.token}` } });
    expect(denied.status()).toBe(403);
    for (const value of ['CLASSIFIED-9999', 'VISIBLE']) {
      const subscribe = () => page.evaluate(({ boardId, value }) => new Promise((resolve, reject) => {
        window.probeSubscription?.stop();
        window.probeStopped = false;
        window.probeSubscription = Meteor.subscribe('boardCardsWindow', boardId, { customFields: { $elemMatch: { value } } }, { sort: 1 }, 20,
          { onReady: resolve, onStop(error) { window.probeStopped = true; if (error) reject(error); else resolve(); } });
      }), { boardId: f.board.boardId, value });
      await subscribe();
      await expect.poll(async () => {
        // Metadata observers may deliver a policy change after the query starts.
        // Its frozen selector is safely retracted; request a fresh subscription.
        if (await page.evaluate(() => window.probeStopped)) await subscribe();
        return page.evaluate(id => !!Meteor.connection._stores.cards?._getCollection().findOne(id), f.card._id);
      }).toBe(value === 'VISIBLE');
    }
    db.insertOne('changeHistory', { _id: db.uid('private-history'), boardId: f.board.boardId, cardId: f.card._id,
      entityType: 'card', entityId: f.card._id, group: 'customFields', changeType: 'modified', userId: user.id, createdAt: new Date(),
      newContent: { field: 'customFields', value: [{ _id: f.secret, value: 'CLASSIFIED-9999' }] } });
    const history = await call(page, 'changeHistory.page', { scope: 'card', scopeId: f.card._id, search: 'CLASSIFIED-9999' });
    expect(history.error).toBeUndefined(); expect(history.value.total).toBe(0);
    await loginWithToken(page, user.id, user.token);
    expect((await call(page, '/cards/update', { _id: f.card._id }, { $set: { 'customFields.0.value': 'ADMIN-UPDATED' } })).error).toBeUndefined();
    expect(db.findOne('cards', { _id: f.card._id }).customFields[0].value).toBe('ADMIN-UPDATED');
  } finally { db.cleanup({ boardIds: [f.board.boardId] }); }
});

test('blocked field attacks appear as a Problems summary without secret values', async ({ page, adminUser, user, user2 }) => {
  const { navigateInApp } = require('../helpers/auth');
  const f = setup(user, user2);
  try {
    await loginWithToken(page, user2.id, user2.token);
    expect((await call(page, '/cards/update', { _id: f.card._id }, { $set: { 'customFields.0.value': 'FORGED-PRIVATE-VALUE' } })).error).toBeTruthy();
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/security-report');
    await expect(page.locator('.main-body')).toContainText('AdminFieldBleed');
    await expect(page.locator('.main-body')).not.toContainText('FORGED-PRIVATE-VALUE');
    await expect(page.locator('.main-body')).not.toContainText('CLASSIFIED-9999');
  } finally { db.cleanup({ boardIds: [f.board.boardId] }); }
});

test('ordinary member copying retains public values and omits protected values', async ({ page, user, user2 }) => {
  const f = setup(user, user2);
  try {
    await loginWithToken(page, user2.id, user2.token);
    const copied = await call(page, 'copyCard', f.card._id, f.board.boardId, f.card.swimlaneId, f.card.listId, false, {});
    expect(copied.error).toBeUndefined();
    const saved = db.findOne('cards', { _id: copied.value });
    expect(saved.customFields.find(field => field._id === f.ordinary)?.value).toBe('VISIBLE');
    expect(JSON.stringify(saved.customFields)).not.toContain('CLASSIFIED-9999');
    expect(db.findOne('cards', { _id: f.card._id }).customFields[0].value).toBe('CLASSIFIED-9999');
  } finally { db.cleanup({ boardIds: [f.board.boardId] }); }
});
