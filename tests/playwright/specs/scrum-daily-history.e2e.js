'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

test('daily Scrum observations retain measured estimates and obey assigned-card access', async ({ page, browser, user, user2, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user2.id, user2.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Daily history', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 3, assignees: [user2.id] } });
    db.updateOne('cards', { _id: cards[1]._id }, { $set: { 'poker.estimation': 999 } });
    for (const card of cards) await call(page, 'scrum.updateCard', board.boardId, card._id, { sprintId: sprint._id }, 0);
    await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    db.updateOne('scrumSprints', { _id: sprint._id }, { $set: { scrumImportPending: true } });
    await expect(call(page, 'scrum.getDailyHistory', board.boardId, sprint._id)).rejects.toThrow(/import is incomplete/);
    expect(db.find('scrumDailySnapshots', { boardId: board.boardId })).toHaveLength(0);
    db.updateOne('scrumSprints', { _id: sprint._id }, { $unset: { scrumImportPending: '' } });
    const history = await call(page, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ consistency: 'observed', scope: { count: 3, estimate: 1002, unknown: 1 } });
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 8, dueComplete: true } });
    const retry = await call(page, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(retry.rows).toEqual(history.rows);
    expect(db.find('scrumDailySnapshots', { boardId: board.boardId })).toHaveLength(1);
    const denied = await second.evaluate(async ({ boardId, sprintId }) => {
      try { await Meteor.callAsync('scrum.getDailyHistory', boardId, sprintId); return 'accepted'; }
      catch (error) { return error.error; }
    }, { boardId: board.boardId, sprintId: sprint._id });
    expect(denied).toBe('not-authorized');
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: user2.id, isActive: true, isAdmin: false, isReadAssignedOnly: true,
    } } });
    const restricted = await call(second, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(restricted.partial).toBe(true);
    expect(restricted.rows[0].scope).toEqual({ count: 1, estimate: 3, unknown: 0 });
    expect(restricted.rows[0].remaining.estimate).toBe(3);
    expect(JSON.stringify(restricted)).not.toContain('999');
  } finally {
    await secondContext.close();
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});

test('daily report renders measured gaps, exports scoped observations and ignores stale responses', async ({ page, request, user2, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
    userId: user2.id, isActive: true, isAdmin: false, isReadAssignedOnly: true,
  } } });
  db.updateOne('cards', { _id: card._id }, { $set: { assignees: [user2.id] } });
  const start = new Date('2026-09-01T10:00:00Z');
  const policy = { at: start, estimateSource: 'poker', completionPolicy: 'dueComplete', unit: 'points', cards: [] };
  const ids = ['measured', 'delayed', 'empty'].map(name => `${name}-${board.boardId}`);
  for (const id of ids) db.insertOne('scrumSprints', { _id: id, boardId: board.boardId,
    name: id, state: 'closed', startSnapshot: policy });
  for (const day of ['2026-09-01', '2026-09-03']) db.insertOne('scrumDailySnapshots', {
    _id: `${ids[0]}-${day}`, boardId: board.boardId, sprintId: ids[0], startedAt: start,
    capturedAt: new Date(`${day}T10:00:00Z`), day,
    snapshot: { ...policy, cards: [{ cardId: card._id, estimate: day.endsWith('01') ? 3 : null, done: false },
      { cardId: 'hidden', estimate: 999, done: false }] },
  });
  try {
    await loginWithToken(page, user2.id, user2.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprint-report-view').click();
    await page.locator('.js-scrum-sprint').selectOption(ids[0]);
    const report = page.locator('.scrum-daily-history');
    await expect(report.locator('.scrum-daily-row')).toHaveCount(2);
    await expect(report).toContainText('Missing days are omitted');
    await expect(report.locator('.scrum-partial-report')).toBeVisible();
    await report.locator('.js-scrum-daily-metric').selectOption('estimate');
    await expect(report.locator('.scrum-chart-label').first()).toHaveText('Observed scope: 3');
    await expect(report.locator('.scrum-daily-row').last()).toContainText('1 unknown');
    await expect(report).not.toContainText('999');
    await expect(report).not.toContainText('2026-09-02');
    await report.locator('.js-export-chart').click();
    const link = page.locator('.pop-over a').filter({ hasText: 'Excel' });
    await expect(link).toHaveAttribute('href', /charts\/scrumDaily\/exportExcel/);
    const href = await link.getAttribute('href');
    expect(new URL(href, 'http://localhost').searchParams.get('sprintId')).toBe(ids[0]);
    const excelResponse = await request.get(href);
    expect(excelResponse.status()).toBe(200);
    const Excel = require('../../../node_modules/@wekanteam/exceljs');
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(await excelResponse.body());
    expect(workbook.worksheets[0].rowCount).toBe(4);
    expect(workbook.worksheets[0].getRow(3).getCell(3).value).toBe('2026-09-01T10:00:00.000Z');
    expect(workbook.worksheets[0].getRow(3).getCell(6).value).toBe(3);
    expect(workbook.worksheets[0].getRow(4).getCell(7).value).toBe(1);
    expect(JSON.stringify(workbook.model)).not.toContain('999');
    expect(JSON.stringify(workbook.getWorksheet('Notes').model)).toContain('assigned');
    const pdfResponse = await request.get(href.replace('exportExcel', 'exportPDF'));
    expect(pdfResponse.status()).toBe(200);
    const { getDocument } = await import('../../../node_modules/pdfjs-dist/legacy/build/pdf.mjs');
    const pdfTask = getDocument({ data: new Uint8Array(await pdfResponse.body()), useSystemFonts: true });
    try {
      const pdf = await pdfTask.promise;
      const text = [];
      for (let index = 1; index <= pdf.numPages; index++) {
        text.push((await (await pdf.getPage(index)).getTextContent()).items.map(item => item.str).join(' '));
      }
      expect(text.join(' ')).toContain('2026-09-01T10:00:00.000Z');
      expect(text.join(' ')).toContain('assigned');
      expect(text.join(' ')).not.toContain('999');
    } finally { await pdfTask.destroy(); }
    const wrongSprint = new URL(href, 'http://localhost'); wrongSprint.searchParams.set('sprintId', 'foreign-sprint');
    expect((await request.get(wrongSprint.pathname + wrongSprint.search)).status()).not.toBe(200);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await report.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.evaluate(delayedId => {
      const original = Meteor.callAsync;
      window.restoreDailyCall = () => { Meteor.callAsync = original; };
      Meteor.callAsync = function (method, ...args) {
        if (method === 'scrum.getDailyHistory' && args[1] === delayedId) {
          return new Promise(resolve => { window.resolveDaily = resolve; });
        }
        return original.call(this, method, ...args);
      };
    }, ids[1]);
    await page.locator('.js-scrum-sprint').selectOption(ids[1]);
    await expect(report).toContainText('Loading');
    await page.waitForFunction(() => typeof window.resolveDaily === 'function');
    await page.locator('.js-scrum-sprint').selectOption(ids[2]);
    await expect(report).toContainText('No daily observations');
    await page.evaluate(() => {
      window.resolveDaily({ rows: [], partial: true, truncated: true });
      window.restoreDailyCall();
    });
    await expect(report).not.toContainText('366');
    await expect(report).toContainText('No daily observations');
  } finally {
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});

test('daily history streams a bounded recent window and labels truncation', async ({ page, user, board }) => {
  const sprintId = `daily-window-${board.boardId}`;
  const end = new Date();
  const start = new Date(end.getTime() - 367 * 86400000);
  const policy = { at: start, estimateSource: 'poker', completionPolicy: 'dueComplete', unit: 'points', cards: [] };
  db.insertOne('scrumSprints', { _id: sprintId, boardId: board.boardId, name: 'History window', state: 'closed', startSnapshot: policy });
  db.insertMany('scrumDailySnapshots', Array.from({ length: 367 }, (_, index) => {
    const capturedAt = new Date(start.getTime() + (index + 1) * 86400000);
    return { _id: `${sprintId}-${index}`, boardId: board.boardId, sprintId,
      startedAt: start, capturedAt, day: capturedAt.toISOString().slice(0, 10), snapshot: { ...policy, at: capturedAt } };
  }));
  try {
    await loginWithToken(page, user.id, user.token);
    const result = await call(page, 'scrum.getDailyHistory', board.boardId, sprintId);
    expect(result.truncated).toBe(true);
    expect(result.rows).toHaveLength(366);
    expect(result.rows[0].day).toBe(new Date(start.getTime() + 2 * 86400000).toISOString().slice(0, 10));
    expect(result.rows.at(-1).day).toBe(end.toISOString().slice(0, 10));
  } finally {
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});
