'use strict';
// CrossBoardExportBleed (GHSA-8885-xrq4-j47h), as the reporter ran it:
//  1. GET /api/boards/<own board>/export?checklistId=<a private board's
//     checklist> streamed that checklist, its items and its creator.
//  2. GET /api/boards/<board>/export/csv ignored "Disable all export" and
//     "Anonymize export users" - and so did Excel, PDF, the calendar feed and
//     the other exporters, which are checked here too.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const settingsDoc = () => db.findOne('settings', {});
async function withSetting(field, value, fn) {
  const settings = settingsDoc();
  const original = settings[field];
  db.updateOne('settings', { _id: settings._id }, { $set: { [field]: value } });
  try { return await fn(); } finally {
    db.updateOne('settings', { _id: settings._id },
      original === undefined ? { $unset: { [field]: '' } } : { $set: { [field]: original } });
  }
}
const url = (boardId, route, token, query = '') => `/api/boards/${boardId}/${route}?authToken=${encodeURIComponent(token)}${query}`;

test('a checklist of another board is not exported through this board\'s checklist scope', async ({ request, user, board, user2 }) => {
  const other = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  try {
    const privateCard = db.findOne('cards', { boardId: other.boardId });
    const foreign = db.uid('checklist');
    db.insertOne('checklists', { _id: foreign, cardId: privateCard._id, boardId: other.boardId, userId: user2.id,
      title: 'Secret checklist', sort: 0, createdAt: new Date() });
    db.insertOne('checklistItems', { _id: db.uid('item'), cardId: privateCard._id, boardId: other.boardId,
      checklistId: foreign, title: 'Secret item', sort: 0, isFinished: false });
    const ownCard = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const own = db.uid('checklist');
    db.insertOne('checklists', { _id: own, cardId: ownCard._id, boardId: board.boardId, userId: user.id,
      title: 'Own checklist', sort: 0, createdAt: new Date() });

    const attack = await request.get(url(board.boardId, 'export', user.token, `&checklistId=${foreign}`));
    expect(attack.status()).toBe(200);
    const leaked = await attack.json();
    expect(leaked.checklists).toEqual([]);
    expect(leaked.checklistItems).toEqual([]);
    expect(JSON.stringify(leaked)).not.toMatch(/Secret checklist|Secret item/);
    expect((leaked.users || []).map(u => u._id)).not.toContain(user2.id);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'CrossBoardExportBleed', key: 'authz.export-checklist-scope' })?.count
      ?? db.findOne('eventlog', { bleed: 'CrossBoardExportBleed', detail: 'checklist scope from another board' })?.count).toBeGreaterThan(0);

    // Positive: this board's own checklist scope still exports it.
    const ownExport = await (await request.get(url(board.boardId, 'export', user.token, `&checklistId=${own}`))).json();
    expect(ownExport.checklists.map(c => c.title)).toEqual(['Own checklist']);
  } finally { db.cleanup({ boardIds: [other.boardId] }); }
});

test('"Disable all export" refuses every export route, the streaming CSV/TSV first among them', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const routes = ['export', 'export/csv', 'exportZip', 'exportExcel', 'exportPDF', 'calendar.ics',
    'charts/burndown/exportPDF', 'charts/burndown/exportExcel', 'export/kanboard'];
  const refused = await withSetting('disableAllExport', true, async () => {
    const statuses = {};
    for (const route of routes) {
      const response = await request.get(url(board.boardId, route, user.token, route === 'export/csv' ? '&delimiter=%09' : ''));
      statuses[route] = [response.status(), (await response.text()).slice(0, 60)];
    }
    const cardPdf = await request.get(`/api/boards/${board.boardId}/lists/${card.listId}/cards/${card._id}/exportPDF?authToken=${encodeURIComponent(user.token)}`);
    statuses['card exportPDF'] = [cardPdf.status(), (await cardPdf.text()).slice(0, 60)];
    return statuses;
  });
  for (const [route, [status, body]] of Object.entries(refused)) {
    expect(status, route).toBe(403);
    expect(body, route).toBe('Export is disabled by the administrator.');
  }
  await expect.poll(() => db.findOne('eventlog', { bleed: 'CrossBoardExportBleed', detail: 'export while all export is disabled' })?.count)
    .toBeGreaterThan(0);
  // Negative: with export allowed again the same CSV answers.
  const allowed = await request.get(url(board.boardId, 'export/csv', user.token));
  expect(allowed.status()).toBe(200);
  expect(await allowed.text()).toContain('Alpha Card');
});

test('"Anonymize export users" leaves no real name in the streaming CSV/TSV or the external formats', async ({ request, user, board }) => {
  const realName = db.findOne('users', { _id: user.id }).username;
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { title: `Alpha Card for @${realName}`, members: [user.id],
    assignees: [user.id], requestedBy: realName, assignedBy: realName } });
  const bodies = await withSetting('anonymizeExportUsers', true, async () => {
    const out = {};
    for (const route of ['export/csv', 'export/kanboard']) {
      const response = await request.get(url(board.boardId, route, user.token, route === 'export/csv' ? '&delimiter=%09' : ''));
      out[route] = [response.status(), await response.text()];
    }
    return out;
  });
  for (const [route, [status, body]] of Object.entries(bodies)) {
    expect(status, route).toBe(200);
    expect(body, route).toContain('Alpha Card for @');
    expect(body, `${route} carries no real username`).not.toContain(realName);
  }
  // Negative: without the setting the CSV names the person, so the check
  // above is about anonymization and not about a missing column.
  const plain = await (await request.get(url(board.boardId, 'export/csv', user.token))).text();
  expect(plain).toContain(realName);
});
