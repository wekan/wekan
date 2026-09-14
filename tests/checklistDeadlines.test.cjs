'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseDueAt, checklistWithItems, cardWithChecklists } = require('../server/lib/checklistDeadlines');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
assert.deepEqual(parseDueAt({}), {});
assert.deepEqual(parseDueAt({ dueAt: null }), { dueAt: null });
for (const value of ['', '2026-02-30T12:00:00Z', 'bad', 0, {}, '2026-09-15']) assert.ok(parseDueAt({ dueAt: value }).error);
const date = '2026-09-15T12:30:00Z';
assert.equal(parseDueAt({ dueAt: date }).dueAt.toISOString(), '2026-09-15T12:30:00.000Z');
assert.equal(parseDueAt({ dueAt: '2026-09-15T14:30:00+02:00' }).dueAt.toISOString(), '2026-09-15T12:30:00.000Z');
(async () => {
 const cache = { getChecklists: async () => [{ _id: 'check', cardId: 'card', dueAt: new Date(date) }], getChecklistItems: async selector => {
  assert.equal(selector.cardId, 'card');
  return [{ _id: 'item', title: 'Item', dueAt: new Date(date), isFinished: false }];
 } };
 const card = { _id: 'card' };
 const result = await cardWithChecklists(card, cache);
 assert.equal(result.checklists[0].dueAt.toISOString(), new Date(date).toISOString());
 assert.equal(result.checklists[0].items[0].dueAt.toISOString(), new Date(date).toISOString());
 assert.equal(card.checklists, undefined, 'serialization does not mutate cached card');
 assert.equal((await checklistWithItems({ _id: 'check', cardId: 'card' }, cache)).dueAt, null);
 const src = read('server/models/checklists.js');
 const start = src.indexOf('WebApp.handlers.put(');
 const end = src.indexOf('WebApp.handlers.delete(', start);
 let handler; let updates = []; let response; let denied = false; let wrongCard = false;
 vm.runInNewContext(src.slice(start, end), {
  WebApp: { handlers: { put: (route, fn) => { handler = fn; } } }, parseDueAt,
  Authentication: { checkBoardWriteAccess: async () => { if (denied) throw Error('denied'); } },
  ReactiveCache: { getCard: async () => wrongCard ? null : card, getChecklist: async () => ({ _id: 'check' }) },
  Checklists: { direct: { updateAsync: async (...args) => updates.push(args) } },
  sendJsonResult: (res, data) => { response = data; },
 });
 const req = body => ({ userId: 'user', params: { boardId: 'board', cardId: 'card', checklistId: 'check' }, body });
 await handler(req({ dueAt: date }), {});
 assert.equal(response.code, 200); assert.equal(updates[0][1].$set.dueAt.toISOString(), new Date(date).toISOString());
 assert.equal(updates[0][1].$set.title, undefined);
 await handler(req({ dueAt: null }), {}); assert.equal(updates[1][1].$unset.dueAt, '');
 const count = updates.length;
 for (const body of [{ dueAt: 'bad' }, {}, { title: '' }]) { await handler(req(body), {}); assert.equal(response.code, 400); }
 assert.equal(updates.length, count);
 wrongCard = true; await handler(req({ dueAt: date }), {}); assert.equal(response.code, 404); assert.equal(updates.length, count);
 wrongCard = false; denied = true; await assert.rejects(handler(req({ dueAt: date }), {}), /denied/); assert.equal(updates.length, count);
 const itemSource = read('server/models/checklistItems.js');
 const itemStart = itemSource.indexOf('WebApp.handlers.put(');
 const itemEnd = itemSource.indexOf('WebApp.handlers.delete(', itemStart);
 let itemHandler; const itemUpdates = []; let itemResponse;
 vm.runInNewContext(itemSource.slice(itemStart, itemEnd), {
  WebApp: { handlers: { put: (route, fn) => { itemHandler = fn; } } }, parseDueAt,
  Authentication: { checkBoardWriteAccess: async () => {} },
  ReactiveCache: { getChecklistItem: async () => ({ _id: 'item', cardId: 'card', checklistId: 'check' }), getCard: async () => ({ _id: 'card', boardId: 'board' }) },
  ChecklistItems: { direct: { updateAsync: async (...args) => itemUpdates.push(args) } },
  sendJsonResult: (res, data) => { itemResponse = data; },
 });
 const itemReq = body => ({ ...req(body), params: { ...req(body).params, itemId: 'item' } });
 await itemHandler(itemReq({ dueAt: date }), {});
 assert.equal(itemResponse.code, 200); assert.equal(itemUpdates[0][1].$set.dueAt.toISOString(), new Date(date).toISOString());
 await itemHandler(itemReq({ dueAt: null }), {}); assert.equal(itemUpdates[1][1].$unset.dueAt, '');
 await itemHandler(itemReq({ dueAt: 'bad', title: 'Must not save' }), {});
 assert.equal(itemResponse.code, 400); assert.equal(itemUpdates.length, 2);
 await itemHandler({ ...itemReq({ dueAt: date }), params: { ...itemReq({}).params, checklistId: 'other' } }, {});
 assert.equal(itemResponse.code, 404); assert.equal(itemUpdates.length, 2);
 const model = read('models/checklists.js'); const field = model.match(/dueAt:\s*{[^}]*}/)[0]; assert.match(field, /type: Date/); assert.match(field, /optional: true/); assert.doesNotMatch(field, /defaultValue/);
 const jade = read('client/components/cards/checklists.jade'); assert.match(jade, /\+checklistDueDate\(checklist=checklist canModifyCard=canModifyCard\)/);
 assert.match(jade, /template\(name="editChecklistDueDatePopup"\)\n  \+editDateForm/);
 const client = read('client/components/cards/checklists.js'); assert.match(client, /storeDate\(date, currentChecklist\)\s*{\s*return currentChecklist.setDue\(date\)/);
 console.log('Checklist deadlines: parse/set/clear/read, invalid input, authorization, card ownership, and shared UI wiring verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
