'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const fs = require('node:fs');
const path = require('node:path');
const fixtures = path.resolve(__dirname, '../../fixtures/import-formats');
const expected = require('../../fixtures/import-formats/expectations.json');
const { waitForImportedBoard } = require('../helpers/import');
const sources = ['jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit'];
const read = source => JSON.parse(fs.readFileSync(path.join(fixtures, `${source === 'zenkit' ? 'zenkit-adapter' : source}.json`)));

for (const source of sources) {
  test(`${source}: import adapter fixture text through the UI`, async ({ loggedInPage: page }, info) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${source}`);
      await page.locator('#import-textarea').fill(JSON.stringify(read(source)));
      await page.locator('.js-import-without-mapping').click();
      await waitForImportedBoard(page);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const cards = db.find('cards', { boardId });
      expect(cards).toHaveLength(1);
      expect(cards[0].title).toContain(expected.title);
      for (const line of expected.description.split('\n')) expect(cards[0].description).toContain(line);
      await expect(page.locator('.minicard-title').first()).toContainText(expected.title);
      expect(new Date(cards[0].dueAt).toISOString().slice(0, 10)).toBe('2026-09-30');
      if (source !== 'openproject') {
        const board = db.findOne('boards', { _id: boardId });
        const labels = board.labels.filter(label => cards[0].labelIds.includes(label._id));
        expect(labels.map(label => label.name)).toContain(expected.label);
      }
      // Record full-content evidence rather than calling a title-only import lossless.
      await info.attach('preservation.json', { contentType: 'application/json', body: Buffer.from(JSON.stringify({
        source, cards: cards.length, comments: db.find('card_comments', { boardId }).length,
        attachments: db.find('attachments', { 'meta.boardId': boardId }).length,
        note: 'External adapters have incomplete comments/files coverage; see format audit.',
      }, null, 2)) });
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
  test(`${source}: malformed JSON and wrong document shapes are rejected`, async ({ loggedInPage: page }) => {
    await navigateInApp(page, `/import/${source}`);
    await page.locator('#import-textarea').fill('{broken');
    await page.locator('.js-import-without-mapping').click();
    await expect(page.locator('.warning').first()).toBeVisible();
    const result = await page.evaluate(async source => {
      try { await Meteor.callAsync('importBoard', { unrelated: [] }, {}, source); return 'allowed'; }
      catch (e) { return e.error; }
    }, source);
    expect(result).toBe('invalid-import-format');
    await expect(page).toHaveURL(new RegExp(`/import/${source}$`));
  });
}

// What each external adapter now preserves beyond title/description/due/label,
// imported through the real UI and read back from the database.
const FIDELITY = {
  kanboard: {
    comments: [`kanboard-user: ${expected.comment}`],
    checklistItems: [['Audit subtask done', true], ['Audit subtask open', false]],
    card: card => {
      expect(card.color).toBe('crimson');
      expect(card.spentTime).toBe(1.5);
      expect(new Date(card.startAt).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(card.archived).toBe(false);
    },
    labels: ['Audit category', 'priority:2'],
  },
  deck: {
    comments: [`deck-user: ${expected.comment}`],
    checklistItems: [],
    card: card => {
      expect(new Date(card.createdAt).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(card.archived).toBe(false);
      expect(card.endAt).toBeFalsy();
    },
    labels: [expected.label],
  },
  openproject: {
    comments: [`op-user: ${expected.comment}`],
    checklistItems: [],
    card: card => {
      expect(new Date(card.startAt).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(new Date(card.createdAt).toISOString()).toBe('2026-08-01T10:00:00.000Z');
      expect(card.spentTime).toBe(1.5);
      const fields = db.find('customFields', { boardIds: card.boardId });
      const byId = Object.fromEntries(fields.map(f => [f._id, f]));
      const values = Object.fromEntries(card.customFields.map(v => [byId[v._id].name, v.value]));
      expect(values).toEqual({
        'Audit text field': 'Audit value', 'Audit list field': 'Option B',
        'Estimated time (hours)': 3, 'Progress (%)': 40,
      });
      expect(byId[card.customFields.find(v => v.value === 3)._id].type).toBe('number');
    },
    labels: ['Task', 'priority:High'],
  },
  asana: {
    comments: [`asana-user: ${expected.comment}`],
    checklistItems: [['Audit subtask', true]],
    card: card => {
      expect(new Date(card.startAt).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(new Date(card.createdAt).toISOString()).toBe('2026-08-01T10:00:00.000Z');
      const fields = Object.fromEntries(db.find('customFields', { boardIds: card.boardId }).map(f => [f._id, f.name]));
      expect(Object.fromEntries(card.customFields.map(v => [fields[v._id], v.value])))
        .toEqual({ 'Audit points': 5, 'Audit stage': 'Review' });
    },
    labels: [expected.label],
  },
  zenkit: {
    comments: [`zen-user: ${expected.comment}`],
    checklistItems: [['Audit item', true]],
    card: card => {
      const fields = Object.fromEntries(db.find('customFields', { boardIds: card.boardId }).map(f => [f._id, f.name]));
      expect(Object.fromEntries(card.customFields.map(v => [fields[v._id], v.value])))
        .toEqual({ 'Audit estimate': 3, 'Audit owner team': 'Blue' });
    },
    labels: [expected.label],
  },
  jira: {
    comments: [`jira-user: ${expected.comment}`],
    checklistItems: [['[AUDIT-9] Audit subtask', true]],
    card: card => {
      const fields = Object.fromEntries(db.find('customFields', { boardIds: card.boardId }).map(f => [f._id, f.name]));
      expect(Object.fromEntries(card.customFields.map(v => [fields[v._id], v.value])))
        .toEqual({ 'Audit points': 5, 'Audit team': 'Blue' });
      expect(card.sort).toBe(0);
    },
    labels: [expected.label, 'priority:High', 'Audit component', 'version:1.0'],
  },
};

test('zenkit: API entries import stages, checklists, fields and hierarchy', async ({ loggedInPage: page }) => {
  const doc = JSON.parse(fs.readFileSync(path.join(fixtures, 'zenkit-api.json')));
  let boardId;
  try {
    await navigateInApp(page, '/import/zenkit');
    await page.locator('#import-textarea').fill(JSON.stringify(doc));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards.map(c => c.title).sort()).toEqual(['Audit child', expected.title].sort());
    const first = cards.find(c => c.title === expected.title);
    const child = cards.find(c => c.title === 'Audit child');
    expect(child.parentId).toBe(first._id);
    expect(first.description).toBe(expected.description);
    const lists = Object.fromEntries(db.find('lists', { boardId }).map(l => [l._id, l.title]));
    expect([lists[first.listId], lists[child.listId]]).toEqual(['Audit list', 'Done']);
    expect(db.find('checklistItems', { boardId }).map(i => [i.title, i.isFinished])).toEqual([['Audit item', true]]);
    await expect(page.locator('.minicard')).toHaveCount(2);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('openproject: parent hierarchy and relations link the imported cards', async ({ loggedInPage: page }) => {
  const wp = (id, subject, extra = {}) => ({ id, subject, _links: { status: { title: 'Open' }, ...extra.links }, ...extra.body });
  const doc = { _embedded: { elements: [
    wp(10, 'Epic parent'),
    wp(11, 'Child item', {
      links: { parent: { href: '/api/v3/work_packages/10' } },
      body: { _embedded: { relations: { elements: [
        { type: 'blocks', _links: { from: { href: '/api/v3/work_packages/11' }, to: { href: '/api/v3/work_packages/12' } } },
      ] } } },
    }),
    wp(12, 'Blocked item', { links: { parent: { href: '/api/v3/work_packages/404' } } }),
  ] } };
  let boardId;
  try {
    await navigateInApp(page, '/import/openproject');
    await page.locator('#import-textarea').fill(JSON.stringify(doc));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const card = title => db.findOne('cards', { boardId, title });
    const [parent, child, blocked] = ['Epic parent', 'Child item', 'Blocked item'].map(card);
    expect(child.parentId).toBe(parent._id);
    expect(blocked.parentId || '').toBe('');
    expect(parent.parentId || '').toBe('');
    expect(child.cardDependencies.map(d => [d.cardId, d.type])).toEqual([[blocked._id, 'blocks']]);
    await expect(page.locator('.minicard')).toHaveCount(3);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

for (const [source, want] of Object.entries(FIDELITY)) {
  test(`${source}: comments, checklists and card fields survive a UI import`, async ({ loggedInPage: page }) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${source}`);
      await page.locator('#import-textarea').fill(JSON.stringify(read(source)));
      await page.locator('.js-import-without-mapping').click();
      await waitForImportedBoard(page);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const card = db.findOne('cards', { boardId });
      const comments = db.find('card_comments', { boardId });
      expect(comments.map(c => c.text).sort()).toEqual([...want.comments].sort());
      expect(comments.every(c => c.cardId === card._id)).toBe(true);
      const activities = db.find('activities', { boardId, activityType: 'addComment' });
      expect(activities).toHaveLength(want.comments.length);
      const items = db.find('checklistItems', { boardId }).sort((a, b) => a.sort - b.sort);
      expect(items.map(i => [i.title, i.isFinished])).toEqual(want.checklistItems);
      expect(items.every(i => i.cardId === card._id)).toBe(true);
      want.card(card);
      const board = db.findOne('boards', { _id: boardId });
      const names = board.labels.filter(l => card.labelIds.includes(l._id)).map(l => l.name);
      for (const label of want.labels) expect(names).toContain(label);
      // The comment and checklist are visible in the opened card, not only stored.
      // The title, not the minicard's middle: a minicard can show its
      // checklist, and a click there edits the checklist instead.
      await page.locator('.minicard .minicard-title').first().click();
      if (want.checklistItems.length) await expect(page.locator('.js-checklist-item').first()).toBeVisible();
      await expect(page.locator('.comment-text').first()).toContainText(expected.comment);
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
}

test('imports with losses record one Recovery row; a complete import records none', async ({ loggedInPage: page, user, adminUser }) => {
  const boardIds = [];
  // An import with losses now stays on the import page and says what it could
  // not bring over; a complete one opens its board at once.
  const reports = {};
  const importText = async (source, doc) => {
    await navigateInApp(page, `/import/${source}`);
    await page.locator('#import-textarea').fill(JSON.stringify(doc));
    await page.locator('.js-import-without-mapping').click();
    reports[source] = await waitForImportedBoard(page);
    const id = page.url().match(/\/b\/([^/]+)/)[1];
    boardIds.push(id);
    return id;
  };
  try {
    const deckBoard = await importText('deck', read('deck'));
    const events = db.find('recoveryEvents', { boardIds: deckBoard });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('import-completed-with-warnings');
    expect(events[0].severity).toBe('warning');
    expect(events[0].source).toBe('import:deck');
    expect(events[0].detail).toContain('/acl');
    expect(events[0].detail).toContain('1 deleted card(s) skipped');
    expect(events[0].userId).toBe(user.id);
    // The import page showed the same report to the person who imported it.
    expect(reports.deck).toEqual([events[0].detail]);
    const gitlabBoard = await importText('gitlab', read('gitlab'));
    expect(db.find('recoveryEvents', { boardIds: gitlabBoard })).toHaveLength(0);
    expect(reports.gitlab).toBeNull();
    // The importer can ask for it again; another user (the admin below) gets nothing.
    expect(await page.evaluate(id => Meteor.callAsync('importReportForBoard', id), deckBoard)).toHaveLength(1);
    // The importing member cannot read the Recovery report; an administrator can.
    const row = page.locator('tr', { hasText: 'import-completed-with-warnings' }).filter({ hasText: '/acl' }).first();
    await navigateInApp(page, '/admin/problems/recovery');
    await expect(row).toHaveCount(0);
    await loginWithToken(page, adminUser.id, adminUser.token);
    expect(await page.evaluate(id => Meteor.callAsync('importReportForBoard', id), deckBoard)).toEqual([]);
    await navigateInApp(page, '/admin/problems/recovery');
    await expect(page.locator('tr', { hasText: 'import-completed-with-warnings' }).filter({ hasText: '/acl' }).first()).toBeVisible();
  } finally {
    db.deleteMany('recoveryEvents', { boardIds: { $in: boardIds } });
    db.cleanup({ boardIds });
  }
});

test('WeKan JSON import keeps each card creation date (#1992)', async ({ boardPage: page, board, user }) => {
  const card = db.findOne('cards', { boardId: board.boardId });
  const createdAt = new Date('2020-01-02T03:04:05Z');
  db.updateOne('cards', { _id: card._id }, { $set: { createdAt } });
  const response = await page.request.get(`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user.token)}`);
  expect(response.status()).toBe(200);
  const exported = await response.json();
  exported.title += ` dates ${db.uniqueSuffix()}`;
  let boardId;
  try {
    await navigateInApp(page, '/import/wekan');
    await page.locator('#import-textarea').fill(JSON.stringify(exported));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const imported = db.findOne('cards', { boardId, title: card.title });
    expect(new Date(imported.createdAt).toISOString()).toBe(createdAt.toISOString());
    // A card whose export carried no date of its own still gets one.
    const others = db.find('cards', { boardId, title: { $ne: card.title } });
    expect(others.length).toBeGreaterThan(0);
    for (const other of others) expect(Number.isNaN(new Date(other.createdAt).getTime())).toBe(false);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('Trello ZIP imports comment, checklist and exact attachment bytes; JSON round-trip preserves them', async ({ loggedInPage: page, user }, info) => {
  test.setTimeout(90000);
  const JSZip = require('jszip');
  const document = read('trello');
  document.name += ` ${db.uniqueSuffix()}`;
  const zip = new JSZip();
  zip.file('board.json', JSON.stringify(document));
  const bytes = fs.readFileSync(path.join(fixtures, 'audit.txt'));
  zip.file('attachments/audit.txt', bytes);
  const boardIds = [];
  try {
    await navigateInApp(page, '/import/trello');
    await page.locator('.js-import-zip-file').setInputFiles({ name: 'trello.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) });
    await page.locator('.js-import-without-mapping').click();
    await expect.poll(() => db.find('boards', { title: document.name }).length).toBe(1);
    const board = db.findOne('boards', { title: document.name }); boardIds.push(board._id);
    await expect.poll(() => db.find('checklistItems', { boardId: board._id }).length).toBe(1);
    expect(db.find('card_comments', { boardId: board._id }).map(c => c.text)).toContain(expected.comment);
    const attachments = db.find('attachments', { 'meta.boardId': board._id });
    expect(attachments).toHaveLength(1);
    await openBoard(page, board._id, board.slug);
    const mtok = await page.evaluate(() => Meteor.connection._lastSessionId);
    const file = await page.request.get(`/cdn/storage/attachments/${attachments[0]._id}/original/audit.txt`, { headers: { 'x-mtok': mtok } });
    expect(file.status()).toBe(200);
    expect(await file.body()).toEqual(bytes);
    const response = await page.request.get(`/api/boards/${board._id}/export?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const exported = await response.json();
    expect(Buffer.from(exported.attachments[0].file, 'base64')).toEqual(bytes);
    await info.attach('wekan-export.json', { contentType: 'application/json', body: Buffer.from(JSON.stringify(exported)) });
    exported.title += ' round trip';
    await navigateInApp(page, '/import/wekan');
    await page.locator('#import-textarea').fill(JSON.stringify(exported));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    const restored = page.url().match(/\/b\/([^/]+)/)[1]; boardIds.push(restored);
    expect(db.find('card_comments', { boardId: restored }).map(c => c.text)).toContain(expected.comment);
    expect(db.find('checklistItems', { boardId: restored })).toHaveLength(1);
    const restoredCard = db.findOne('cards', { boardId: restored });
    expect(restoredCard.title).toBe(expected.title);
    expect(restoredCard.description).toBe(expected.description);
    const again = await page.request.get(`/api/boards/${restored}/export?authToken=${encodeURIComponent(user.token)}`);
    expect(again.status()).toBe(200);
    expect(Buffer.from((await again.json()).attachments[0].file, 'base64')).toEqual(bytes);
  } finally { db.cleanup({ boardIds }); }
});

test('every external export menu link returns text and refuses an unrelated user', async ({ boardPage: page, board, user2 }) => {
  const bp = new BoardPage(page);
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  // Include description through the actual shared selection controls.
  const details = page.locator('.js-export-card-details-toggle');
  if (await details.getAttribute('aria-checked') !== 'true') await details.click();
  for (const format of ['trello', 'jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit', 'markdown', 'leo', 'todotxt', 'taskwarrior', 'focalboard', 'todoist', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'opml', 'orgmode']) {
    await test.step(format, async () => {
      const anchor = page.locator(`.js-pop-over a[href*="/export/${format}?"]`);
      await expect(anchor).toBeVisible();
      const href = await anchor.getAttribute('href');
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('Alpha Card');
      const unauthorized = new URL(href, page.url());
      unauthorized.searchParams.set('authToken', user2.token);
      const refused = await page.request.get(unauthorized.toString());
      expect([401, 403]).toContain(refused.status());
    });
  }
});

// A Kanri single-board export: columns, a card with its description, due date,
// tasks, colored tags and card color (models/lib/kanriFormat.js).
test('Kanri: a board export imports with its columns, description, due date, tasks, tags and colors', async ({ loggedInPage: page }) => {
  let boardId;
  const tag = { id: 'g1', text: expected.label, color: '#E44057', style: 'background-color: #E44057; color: #f4f4f5' };
  try {
    await navigateInApp(page, '/import/kanri');
    await page.locator('#import-textarea').fill(JSON.stringify({
      id: 'kb1', title: 'From Kanri', background: null, lastEdited: '2026-10-01T00:00:00.000Z', globalTags: [tag],
      columns: [
        { id: 'c1', title: 'Doing', cards: [{
          id: 'k1', name: expected.title, description: 'Two of them', color: 'bg-red-600',
          dueDate: '2026-10-10T12:00:00.000Z', isDueDateCompleted: true,
          tasks: [{ id: 't1', name: 'Call vendor', finished: true }, { id: 't2', name: 'Pay', finished: false }],
          tags: [tag],
        }] },
        { id: 'c2', title: 'Done', cards: [{ name: 'Finished task', color: '#0D9488' }] },
      ],
    }, null, 2));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('From Kanri');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id)).map(l => [l.name, l.color]))
      .toEqual([[expected.label, '#e44057']]);
    expect(open.description).toBe('Two of them');
    expect(open.color).toBe('red');
    expect(open.dueComplete).toBe(true);
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished]))
      .toEqual([['Call vendor', true], ['Pay', false]]);
    const finished = cards.find(card => card.title === 'Finished task');
    expect(finished.color).toBe('#0d9488');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === finished.listId).title).toBe('Done');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Kanri's all-data export holds every board: one import makes one board, the
// first, and the rest are reported rather than silently dropped.
test('Kanri: an all-data export imports its first board; other documents are refused', async ({ loggedInPage: page }) => {
  let boardId;
  const kanriBoard = (id, title, card) => ({ id, title, columns: [{ id: `${id}-c`, title: 'Todo', cards: [{ name: card }] }] });
  try {
    await navigateInApp(page, '/import/kanri');
    await page.locator('#import-textarea').fill(JSON.stringify({
      activeTheme: 'dark', colors: {}, pins: [],
      boards: [kanriBoard('a', 'First Kanri board', expected.title), kanriBoard('b', 'Second Kanri board', 'Not imported')],
    }));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('First Kanri board');
    expect(db.find('cards', { boardId }).map(card => card.title)).toEqual([expected.title]);
    expect(db.find('boards', { title: 'Second Kanri board' })).toHaveLength(0);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  // Negative: malformed JSON, a document without columns or boards, and an
  // all-data file without boards create nothing.
  await navigateInApp(page, '/import/kanri');
  await page.locator('#import-textarea').fill('{broken');
  await page.locator('.js-import-without-mapping').click();
  await expect(page.locator('.warning').first()).toBeVisible();
  const results = await page.evaluate(async () => {
    const attempt = async doc => {
      try { await Meteor.callAsync('importBoard', doc, {}, 'kanri'); return 'allowed'; } catch (e) { return e.error; }
    };
    return [await attempt({ title: 'Not a Kanri board' }), await attempt({ boards: [], colors: {} })];
  });
  expect(results).toEqual(['invalid-import-format', 'invalid-import-format']);
  await expect(page).toHaveURL(/\/import\/kanri$/);
});

// Pivotal Tracker's stories CSV: states as lists, repeated Owned By, Comment
// and Task columns, the estimate as the Story points field.
test('Pivotal Tracker: a stories CSV imports with its states, labels, comments and tasks', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/pivotal');
    await page.locator('#import-textarea').fill([
      'Id,Title,Labels,Iteration,Iteration Start,Iteration End,Type,Estimate,Priority,Current State,Created at,Accepted at,Deadline,Requested By,Description,URL,Owned By,Owned By,Comment,Task,Task Status,Task,Task Status',
      `101,${expected.title},"${expected.label}, urgent",,,,bug,2,p1 - High,started,"Oct 1, 2026",,,Ana Lee,"Two of them, DN50",,Ana Lee,Bo Chen,"Looks good (Ana Lee - Oct 2, 2026)",Call,completed,Pay,not completed`,
      '102,Finished story,,,,,feature,,,accepted,"Sep 1, 2026","Sep 3, 2026",,Ana Lee,,,,,,,,,',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual(['bug', expected.label, 'urgent'].sort());
    expect(open.description).toBe('Two of them, DN50');
    expect(open.requestedBy).toBe('Ana Lee');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Started');
    const done = cards.find(card => card.title === 'Finished story');
    expect(lists.find(list => list._id === done.listId).title).toBe('Accepted');
    expect(new Date(done.endAt).toISOString()).toBe('2026-09-03T00:00:00.000Z');
    expect(db.find('card_comments', { cardId: open._id }).map(c => c.text)).toEqual(['Ana Lee: Looks good']);
    const items = db.find('checklistItems', { cardId: open._id });
    expect(items.map(item => [item.title, item.isFinished]).sort()).toEqual([['Call', true], ['Pay', false]]);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A Tasks.org backup as its exporter writes it: defaults left out, the list
// from caldavTasks[].calendar, a subtask from remoteParent, priority 0 = high.
test('Tasks.org: a backup imports with its lists, notes, tags, priority, due date and subtask', async ({ loggedInPage: page }) => {
  const due = Date.UTC(2026, 9, 10, 8, 0) + 1000;
  const backup = { version: 151300, timestamp: due, data: {
    tasks: [
      { task: { title: expected.title, priority: 0, dueDate: due, notes: 'Two of them, DN50', remoteId: 'audit-1' },
        tags: [{ name: expected.label, tagUid: 'audit-tag' }],
        caldavTasks: [{ calendar: 'audit-list', remoteId: 'audit-1', object: 'audit-1.ics' }] },
      { task: { title: 'Audit subtask', completionDate: due, remoteId: 'audit-2' },
        caldavTasks: [{ calendar: 'audit-list', remoteId: 'audit-2', object: 'audit-2.ics', remoteParent: 'audit-1' }] },
    ],
    tags: [{ remoteId: 'audit-tag', name: expected.label }],
    caldavAccounts: [{ uuid: 'audit-account', name: 'From Tasks.org', accountType: 2 }],
    caldavCalendars: [{ account: 'audit-account', uuid: 'audit-list', name: 'Doing' }],
  } };
  let boardId;
  try {
    await navigateInApp(page, '/import/tasksorg');
    await page.locator('#import-textarea').fill(JSON.stringify(backup));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('From Tasks.org');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const sub = cards.find(card => card.title === 'Audit subtask');
    expect(sub.parentId).toBe(open._id);
    expect(new Date(sub.endAt).toISOString()).toBe(new Date(due).toISOString());
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual([expected.label]);
    expect(open.description).toBe('Two of them, DN50');
    expect(new Date(open.dueAt).toISOString()).toBe('2026-10-10T08:00:00.000Z');
    const priority = db.find('customFields', { boardIds: boardId }).find(field => field.name === 'Priority');
    expect(open.customFields.find(value => value._id === priority._id).value).toBe('High');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A ClickUp workspace export: status, list, assignee, tags, a due date in milliseconds and a subtask.
test('ClickUp: a task export imports with its status, list, tags, due date and subtask', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/clickup');
    await page.locator('#import-textarea').fill([
      'Task ID,Task Name,Task Content,Status,Due date,Parent ID,Subtask IDs,Tags,Priority,List Name,Space Name',
      `t1,${expected.title},"Two of them, DN50",in progress,${Date.UTC(2026, 9, 10)},,[t2],[${expected.label},web],high,Website,From ClickUp`,
      't2,Child task,,to do,,t1,,[],,Website,From ClickUp',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('From ClickUp');
    const cards = db.find('cards', { boardId });
    const open = cards.find(card => card.title === expected.title);
    expect(open.description).toBe('Two of them, DN50');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(cards.find(card => card.title === 'Child task').parentId).toBe(open._id);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([expected.label, 'web'].sort());
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Website');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A TickTick backup: the preamble, a list as swimlane, a column, tags, a due date and a checklist.
test('TickTick: a backup imports with its list, column, tags, due date and checklist', async ({ loggedInPage: page }) => {
  let boardId;
  const q = value => `"${String(value).replace(/"/g, '""')}"`;
  try {
    await navigateInApp(page, '/import/ticktick');
    await page.locator('#import-textarea').fill([
      q('Date: 2026-10-08+0000'), q('Version: 7.2'), q('Status: \n0 Normal\n1 Completed\n2 Archived'),
      ['Folder Name', 'List Name', 'Title', 'Kind', 'Tags', 'Content', 'Is Check list', 'Due Date', 'Status', 'Column Name', 'taskId', 'parentId'].map(q).join(','),
      ['', 'Sprint', expected.title, 'CHECKLIST', expected.label, 'Two of them\n▪Quote\n▫Order', 'Y', '2026-10-10T08:00:00+0000', '0', 'Doing', '1', ''].map(q).join(','),
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const [card] = db.find('cards', { boardId });
    expect(card.title).toBe(expected.title);
    expect(card.description).toBe('Two of them');
    expect(new Date(card.dueAt).toISOString()).toBe('2026-10-10T08:00:00.000Z');
    expect(db.find('checklistItems', { cardId: card._id }).map(item => [item.title, item.isFinished])).toEqual([['Quote', true], ['Order', false]]);
    expect(db.find('lists', { boardId }).find(list => list._id === card.listId).title).toBe('Doing');
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Sprint');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Linear's CSV export: statuses, a team swimlane, labels, priority and the parent issue.
test('Linear: a CSV export imports with its statuses, team, labels, priority and parent issue', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/linear');
    await page.locator('#import-textarea').fill([
      'ID,Team,Title,Description,Status,Priority,Labels,Due Date,Parent issue',
      `ENG-1,Engineering,${expected.title},"Two of them, DN50",In Progress,High,"${expected.label}, UI",2026-10-10,`,
      'ENG-2,Engineering,Child task,,Done,No priority,,,ENG-1',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const child = cards.find(card => card.title === 'Child task');
    expect(open.description).toBe('Two of them, DN50');
    expect(child.parentId).toBe(open._id);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([expected.label, 'UI'].sort());
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Engineering');
    expect(db.find('customFields', { boardIds: boardId }).map(field => field.name)).toContain('Priority');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// An Obsidian Kanban plugin board: a lane limit, tags, a date, a Complete lane
// and the settings footer (models/lib/obsidianKanbanFormat.js).
test('Obsidian Kanban: a plugin board imports with its lanes, limit, tags, due date and done cards', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/obsidian');
    await page.locator('#import-textarea').fill([
      '---', '', 'kanban-plugin: board', '', '---', '',
      '## Doing (2)', '', `- [ ] ${expected.title} #${expected.label.replace(/ /g, '-')} @{2026-10-10}`, '    Two of them', '', '', '',
      '## Done', '', '**Complete**', '- [x] Finished task', '', '', '',
      '%% kanban:settings', '```', '{"kanban-plugin":"board"}', '```', '%%',
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    expect(open.description).toBe('Two of them');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    const lists = db.find('lists', { boardId });
    const doing = lists.find(list => list._id === open.listId);
    expect(doing.title).toBe('Doing');
    expect(doing.wipLimit).toMatchObject({ value: 2, enabled: true });
    const board = db.findOne('boards', { _id: boardId });
    const done = cards.find(card => card.title === 'Finished task');
    expect(done.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual(['done']);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// MeisterTask's own import sample shape: sections, notes, due date, status and tags.
test('MeisterTask: a project CSV imports with its sections, notes, due date and tags', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/meistertask');
    await page.locator('#import-textarea').fill([
      'project,section,name,notes,due_date,status,tags',
      `From MeisterTask,Doing,${expected.title},"Two of them, DN50",2026-10-10T08:00:00+00:00,1,${expected.label}; urgent`,
      'From MeisterTask,Done,Finished task,,,2,',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('From MeisterTask');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([expected.label, 'urgent'].sort());
    expect(open.description).toBe('Two of them, DN50');
    expect(new Date(open.dueAt).toISOString()).toBe('2026-10-10T08:00:00.000Z');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A Nullboard .nbx board: notes split into title and description, a raw note.
test('Nullboard: a .nbx board imports with its lists, notes and raw note', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/nullboard');
    await page.locator('#import-textarea').fill(JSON.stringify({
      format: 20190412, id: 1791100000000, revision: 3, title: 'From Nullboard', lists: [
        { title: 'Doing', notes: [
          { text: 'Backend', raw: true, min: false },
          { text: `${expected.title}\nTwo of them, DN50`, raw: false, min: false },
        ] },
        { title: 'Done', notes: [{ text: 'Finished note', raw: false, min: true }] },
      ],
    }));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('From Nullboard');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(3);
    const note = cards.find(card => card.title === expected.title);
    expect(note.description).toBe('Two of them, DN50');
    const heading = cards.find(card => card.title === 'Backend');
    expect(heading.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual(['raw']);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === note.listId).title).toBe('Doing');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// monday.com's Excel export: a group, the Status column, a person, a date and an update.
test('monday.com: a board export imports with its group, status, person, date and update', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  let boardId;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('from monday');
    [['From monday'], ['Ideas'], ['Name', 'Person', 'Status', 'Date', 'Tags'],
      [expected.title, 'Alice Example', 'Working on it', '2026-10-10', expected.label]].forEach(row => sheet.addRow(row));
    const updates = workbook.addWorksheet('from monday-updates');
    [['From monday', 'Updates'], ['Item ID', 'Item Name', 'Content Type', 'Content Type', 'User', 'Created At', 'Update Content', 'Likes Count'],
      ['', expected.title, 'Update', '', 'Alice Example', '27/May/2025 03:26:42 PM', 'Ordered', 0]].forEach(row => updates.addRow(row));
    await navigateInApp(page, '/import/monday');
    await page.locator('.js-import-excel-file').setInputFiles({
      name: 'monday.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('From monday');
    const [card] = db.find('cards', { boardId });
    expect(card.title).toBe(expected.title);
    expect(new Date(card.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('lists', { boardId }).find(list => list._id === card.listId).title).toBe('Working on it');
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Ideas');
    expect(db.find('card_comments', { cardId: card._id }).map(comment => comment.text)).toEqual(['Alice Example: Ordered']);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Microsoft Planner's export is an Excel workbook, not text: its own case.
test('Microsoft Planner: the export menu link returns a Planner workbook and refuses an unrelated user', async ({ boardPage: page, user2 }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  const bp = new BoardPage(page);
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  const anchor = page.locator('.js-pop-over a[href*="/export/planner?"]');
  await expect(anchor).toBeVisible();
  const href = await anchor.getAttribute('href');
  const response = await page.request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('spreadsheetml.sheet');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.body());
  const sheet = workbook.getWorksheet('Tasks');
  expect(sheet.getRow(1).values.slice(1)).toEqual(['Plan name', expect.any(String)]);
  expect(sheet.getRow(5).values.slice(1, 4)).toEqual(['Task ID', 'Task Name', 'Bucket Name']);
  const titles = [];
  sheet.eachRow((row, number) => { if (number > 5) titles.push(row.getCell(2).value); });
  expect(titles).toContain('Alpha Card');
  const unauthorized = new URL(href, page.url());
  unauthorized.searchParams.set('authToken', user2.token);
  expect([401, 403]).toContain((await page.request.get(unauthorized.toString())).status());
});

// A real Planner export (tests/fixtures/planner/, from the plannr package):
// buckets, tasks, the owner, dates, the checklist and the custom fields.
test('Microsoft Planner: an exported plan imports through the page', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/planner');
    await page.locator('.js-import-excel-file').setInputFiles(path.resolve(__dirname, '../../fixtures/planner/plannr-test_plan.xlsx'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Test Plan');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(32);
    const task2 = cards.find(card => card.title === 'Task 2');
    expect(db.find('lists', { boardId }).find(list => list._id === task2.listId).title).toBe('Bucket 2');
    expect(new Date(task2.endAt).toISOString().slice(0, 10)).toBe('2020-10-07');
    expect(db.find('checklistItems', { cardId: task2._id }).map(item => item.title).sort())
      .toEqual(['Important Task 1', 'Important Task 2', 'Important Task 4']);
    const fields = db.find('customFields', { boardIds: boardId }).map(field => field.name).sort();
    expect(fields).toEqual(['Completed By', 'Priority', 'Progress']);
    await expect(page.locator('.minicard-title', { hasText: 'Task 2' })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Focalboard's board.jsonl: the group-by property's lists, labels, dates, the
// card's text, checklist and comments (models/lib/focalboardFormat.js).
test('Focalboard: a board.jsonl imports with its lists, labels, description, checklist and comments', async ({ loggedInPage: page }) => {
  let boardId;
  const line = (type, data) => JSON.stringify({ type, data });
  try {
    await navigateInApp(page, '/import/focalboard');
    await page.locator('#import-textarea').fill([
      JSON.stringify({ version: 1, date: 1 }),
      line('board', { id: 'b1', title: 'From Focalboard', cardProperties: [
        { id: 'st', name: 'Status', type: 'select', options: [{ id: 'o1', value: 'Doing' }, { id: 'o2', value: 'Done' }] },
        { id: 'lb', name: 'Labels', type: 'multiSelect', options: [{ id: 'l1', value: expected.label }] },
        { id: 'dt', name: 'Due', type: 'date' }] }),
      line('block', { id: 'v1', parentId: 'b1', type: 'view', fields: { viewType: 'board', groupById: 'st' } }),
      line('block', { id: 'c1', parentId: 'b1', type: 'card', title: expected.title,
        fields: { contentOrder: ['t1', 'x1'], properties: { st: 'o1', lb: ['l1'], dt: JSON.stringify({ from: Date.UTC(2026, 9, 10) }) } } }),
      line('block', { id: 't1', parentId: 'c1', type: 'text', title: 'Two of them' }),
      line('block', { id: 'x1', parentId: 'c1', type: 'checkbox', title: 'Call vendor', fields: { value: true } }),
      line('block', { id: 'm1', parentId: 'c1', type: 'comment', title: 'Ordered' }),
      line('block', { id: 'c2', parentId: 'b1', type: 'card', title: 'Finished task', fields: { properties: { st: 'o2' } } }),
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(label => label._id === id).name)).toEqual([expected.label]);
    expect(open.description).toBe('Two of them');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('card_comments', { cardId: open._id }).map(comment => comment.text)).toEqual(['Ordered']);
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished])).toEqual([['Call vendor', true]]);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === cards.find(card => card.title === 'Finished task').listId).title).toBe('Done');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A Todoist project template: sections, @labels and priority, the description,
// sub-tasks as a checklist and notes as comments (models/lib/todoistCsvFormat.js).
test('Todoist: a project template imports with its sections, labels, description, sub-tasks and notes', async ({ loggedInPage: page }) => {
  let boardId;
  const label = expected.label.replace(/ /g, '_');
  try {
    await navigateInApp(page, '/import/todoist');
    await page.locator('#import-textarea').fill([
      'TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG',
      'meta,view_style=board,,,,,,,,,,,,',
      'section,Doing,,,,,,,,,,,,',
      `task,${expected.title} @${label},"Two of them, DN50",1,1,,,2026-10-10,en,UTC,,,,`,
      'task,Call vendor,,4,2,,,,,,,,,',
      'note,Ordered,,,,,,,,,,,,',
      'section,Done,,,,,,,,,,,,',
      'task,Finished task,,4,1,,,,,,,,,',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([label, 'p1'].sort());
    expect(open.description).toBe('Two of them, DN50');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('card_comments', { cardId: open._id }).map(comment => comment.text)).toEqual(['Ordered']);
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished])).toEqual([['Call vendor', false]]);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === cards.find(card => card.title === 'Finished task').listId).title).toBe('Done');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// An OPML outline as Workflowy writes it: lists, cards with their notes, a
// checklist and the done state (models/lib/opmlOutline.js).
test('OPML: an outline imports with its lists, notes, checklist and done state', async ({ loggedInPage: page }) => {
  let boardId;
  const attr = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/\n/g, '&#10;');
  try {
    await navigateInApp(page, '/import/opml');
    await page.locator('#import-textarea').fill([
      '<?xml version="1.0"?>',
      '<opml version="2.0"><head><title>From OPML</title></head><body>',
      `<outline text="Doing"><outline text="${attr(expected.title)}" _note="${attr(expected.description)}">`,
      '<outline text="Call vendor" _complete="true"/></outline></outline>',
      '<outline text="Done"><outline text="Finished task" _complete="true"/></outline>',
      '</body></opml>',
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    expect(open.description).toBe(expected.description);
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished])).toEqual([['Call vendor', true]]);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === cards.find(card => card.title === 'Finished task').listId).title).toBe('Done');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// An Org mode outline: keyword, priority, tags, deadline, body and checkboxes
// (models/lib/orgModeFormat.js).
test('Org mode: headings import with their keyword, priority, tags, deadline, body and checkboxes', async ({ loggedInPage: page }) => {
  let boardId;
  const tag = expected.label.replace(/ /g, '_');
  try {
    await navigateInApp(page, '/import/orgmode');
    await page.locator('#import-textarea').fill([
      '#+TITLE: From Org',
      '* Doing',
      `** TODO [#A] ${expected.title} :${tag}:`,
      '   DEADLINE: <2026-10-10 Sat>',
      '   Two of them',
      '   - [X] Call vendor',
      '* Done',
      '** DONE Finished task',
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual(['priority:A', tag].sort());
    expect(open.description).toBe('Two of them');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished])).toEqual([['Call vendor', true]]);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === cards.find(card => card.title === 'Finished task').listId).title).toBe('Done');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// todo.txt has no description, so it gets its own case: title, list, labels and dates.
test('todo.txt: tasks import with their list, labels, priority and dates', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/todotxt');
    await page.locator('#import-textarea').fill([
      `(A) 2026-09-01 ${expected.title} +${expected.label.replace(/ /g, '_')} @phone due:2026-10-10`,
      'x 2026-10-09 2026-09-02 Finished task list:Done',
    ].join('\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    const labelNames = open.labelIds.map(id => board.labels.find(label => label._id === id).name).sort();
    expect(labelNames).toEqual(['@phone', expected.label, 'priority:A'].sort());
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    const lists = db.find('lists', { boardId });
    const done = cards.find(card => card.title === 'Finished task');
    expect(lists.find(list => list._id === done.listId).title).toBe('Done');
    expect(new Date(done.endAt).toISOString().slice(0, 10)).toBe('2026-10-09');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Taskwarrior's export: an array of task objects, with dependencies by uuid.
test('Taskwarrior: tasks import with their list, labels, dates, annotations and dependencies', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/taskwarrior');
    await page.locator('#import-textarea').fill(JSON.stringify([
      { uuid: 'aaaaaaaa-0000-4000-8000-000000000001', status: 'pending', entry: '20260901T120000Z',
        description: expected.title, project: 'Plant', priority: 'H', tags: [expected.label],
        due: '20261010T000000Z', annotations: [{ entry: '20260902T080000Z', description: 'Call the vendor' }] },
      { uuid: 'aaaaaaaa-0000-4000-8000-000000000002', status: 'completed', entry: '20260901T120000Z',
        end: '20261009T120000Z', description: 'Finished task', depends: ['aaaaaaaa-0000-4000-8000-000000000001'] },
      { uuid: 'aaaaaaaa-0000-4000-8000-000000000003', status: 'deleted', description: 'Gone' },
    ]));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const board = db.findOne('boards', { _id: boardId });
    const labelNames = open.labelIds.map(id => board.labels.find(label => label._id === id).name).sort();
    expect(labelNames).toEqual([expected.label, 'priority:H', 'project:Plant'].sort());
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(db.find('card_comments', { cardId: open._id }).map(comment => comment.text)).toEqual(['Call the vendor']);
    const lists = db.find('lists', { boardId });
    const done = cards.find(card => card.title === 'Finished task');
    expect(lists.find(list => list._id === done.listId).title).toBe('Done');
    expect((done.cardDependencies || []).map(dep => dep.cardId)).toEqual([open._id]);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

for (const source of ['csv', 'markdown', 'excel']) {
  test(`${source}: multiline Unicode text survives real file or text import`, async ({ loggedInPage: page }) => {
    let boardId;
    try {
      await navigateInApp(page, `/import/${source}`);
      if (source === 'excel') {
        const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Board');
        sheet.addRow(['Title', 'Description', 'Status']);
        sheet.addRow([expected.title, expected.description, 'Audit list']);
        await page.locator('.js-import-excel-file').setInputFiles({
          name: 'audit.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        });
        await page.locator('form input[type=submit]').first().click();
      } else {
        await page.locator('#import-textarea').fill(fs.readFileSync(path.join(fixtures, source === 'csv' ? 'csv.csv' : 'markdown.md'), 'utf8'));
        await page.locator('.js-import-without-mapping').click();
      }
      await waitForImportedBoard(page);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      const cards = db.find('cards', { boardId });
      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe(expected.title);
      expect(cards[0].description).toBe(expected.description);
      await expect(page.locator('.minicard-title').first()).toContainText(expected.title);
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
  test(`${source}: empty imports fail without creating a board`, async ({ loggedInPage: page, user }) => {
    const before = db.find('boards', { 'members.userId': user.id }).length;
    const result = await page.evaluate(async source => {
      try { await Meteor.callAsync('importBoard', source === 'csv' ? [] : source === 'excel' ? { excelBase64: '' } : '', {}, source); return 'allowed'; }
      catch (error) { return error.error; }
    }, source);
    expect(result).not.toBe('allowed');
    expect(db.find('boards', { 'members.userId': user.id })).toHaveLength(before);
  });
}

test('Trello HTTP import enforces the Admin Panel import switch and rejects invalid requests', async ({ page, adminUser, request }) => {
  const { loginWithToken } = require('../helpers/auth');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/security');
  const selector = page.locator('.js-toggle-disable-all-import');
  const settings = db.findOne('settings', {});
  const original = !!settings.disableAllImport;
  const count = () => db.find('boards', { 'members.userId': adminUser.id }).length;
  const before = count();
  try {
    if (!original) await selector.click();
    await expect.poll(() => db.findOne('settings', { _id: settings._id }).disableAllImport).toBe(true);
    for (const contentType of ['application/json', 'application/zip']) {
      const response = await request.post('/import-trello', {
        headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': contentType },
        data: contentType === 'application/json' ? { board: read('trello') } : Buffer.from('invalid zip'),
      });
      expect(response.status()).toBe(403);
      expect((await response.json()).error).toBe('import-disabled');
    }
    await selector.click();
    await expect.poll(() => db.findOne('settings', { _id: settings._id }).disableAllImport).toBe(false);
    const invalid = await request.post('/import-trello', {
      headers: { Authorization: `Bearer ${adminUser.token}` }, data: { board: { unrelated: [] } },
    });
    expect(invalid.status()).toBe(400);
    const corruptZip = await request.post('/import-trello', {
      headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': 'application/zip' },
      data: Buffer.from('not a ZIP archive'),
    });
    expect(corruptZip.status()).toBe(400);
    const anonymous = await request.post('/import-trello', { data: { board: read('trello') } });
    expect(anonymous.status()).toBe(401);
    expect(count()).toBe(before);
  } finally {
    db.updateOne('settings', { _id: settings._id }, { $set: { disableAllImport: original } });
  }
});

for (const language of ['ary', 'ckb', 'ku', 'bho', 'mai', 'or_IN', 'kok', 'tk_TM', 'tt', 'yi', 'so', 'om', 'rw', 'rn', 'ny', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'bi', 'tpi', 'mi', 'sm', 'haw', 'pap', 'xh', 'nd', 'ak', 'lg', 'wo', 'ss', 'ts', 've', 'wa-RR', 've-CC', 'ace', 'bm', 'ee', 'ff', 'fj', 'to', 'bua', 'cv', 'sah', 'se', 'bo', 'dz', 'ks', 'gv', 'wa', 'rup', 'gn', 'qu', 'ay', 'ti', 'tlh', 'vo', 've-PP', 'kl', 'nah', 'wal', 'iu', 'zgh', 'tig', 'chr']) {
  test(`import loss report keeps its localized explanation and board action in ${language}`, async ({ loggedInPage: page }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    let boardId;
    try {
      await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
      await navigateInApp(page, '/import/deck');
      await page.locator('#import-textarea').fill('{broken');
      await page.locator('.js-import-without-mapping').click();
      await expect(page.locator('.warning').first()).toBeVisible();
      await expect(page.locator('.js-import-report')).toHaveCount(0);
      await page.locator('#import-textarea').fill(JSON.stringify(read('deck')));
      await page.locator('.js-import-without-mapping').click();
      const report = page.locator('.js-import-report');
      await expect(report).toBeVisible();
      await expect(report.locator('h2')).toHaveText(strings['import-report-heading']);
      await expect(report.locator('p')).toHaveText(strings['import-report-description']);
      await expect(report.locator('.js-open-imported-board')).toHaveText(strings['import-report-open-board']);
      await expect(page).toHaveURL(/\/import\/deck$/);
      await waitForImportedBoard(page);
      boardId = page.url().match(/\/b\/([^/]+)/)[1];
      await expect(page.locator('.minicard-title').first()).toContainText(expected.title);
    } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
  });
}
