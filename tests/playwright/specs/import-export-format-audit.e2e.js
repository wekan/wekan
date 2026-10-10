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
// A comment by a person of an imported file is by their placeholder user (the
// default people choice, models/lib/importMembersMode.js): the text as written,
// and the person's name on the account - no longer a "name: " prefix.
function expectCommentsBy(comments, wanted) {
  expect(comments.map(c => c.text)).toEqual(wanted.map(([text]) => text));
  comments.forEach((comment, i) => {
    const author = db.findOne('users', { _id: comment.userId });
    expect(author && author.profile && author.profile.fullname).toBe(wanted[i][1]);
    expect(author.loginDisabled).toBe(true);
  });
}

const FIDELITY = {
  kanboard: {
    // The author is a placeholder user keeping the name (the default people
    // choice), not a prefix on the text.
    comments: [expected.comment], author: 'kanboard-user',
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
    // The author is a placeholder user keeping the name (the default people
    // choice), not a prefix on the text.
    comments: [expected.comment], author: 'deck-user',
    checklistItems: [],
    card: card => {
      expect(new Date(card.createdAt).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(card.archived).toBe(false);
      expect(card.endAt).toBeFalsy();
    },
    labels: [expected.label],
  },
  openproject: {
    // The author is a placeholder user keeping the name (the default people
    // choice), not a prefix on the text.
    comments: [expected.comment], author: 'op-user',
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
    // The author is a placeholder user keeping the name (the default people
    // choice), not a prefix on the text.
    comments: [expected.comment], author: 'asana-user',
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
    // The author is a placeholder user keeping the name (the default people
    // choice), not a prefix on the text.
    comments: [expected.comment], author: 'zen-user',
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
      if (want.author) {
        // Each comment is by a placeholder for the file's person: their name
        // kept, unable to log in - and not by the person importing.
        for (const comment of comments) {
          const author = db.findOne('users', { _id: comment.userId });
          expect(author && author.profile && author.profile.fullname).toBe(want.author);
          expect(author.loginDisabled).toBe(true);
        }
      }
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
  for (const format of ['trello', 'jira', 'kanboard', 'deck', 'openproject', 'github', 'gitlab', 'gitea', 'forgejo', 'asana', 'zenkit', 'markdown', 'leo', 'todotxt', 'taskwarrior', 'focalboard', 'todoist', 'meistertask', 'obsidian', 'linear', 'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'redmine', 'tasksorg', 'superproductivity', 'taiga', 'quire', 'notion', 'opml', 'orgmode']) {
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
  // The Wrike workflow is the board's lists, not its cards: Wrike's GET
  // /workflows JSON with a custom status per list (models/lib/wrikeWorkflow.js).
  await test.step('wrikeworkflow', async () => {
    const anchor = page.locator('.js-pop-over a[href*="/export/wrikeworkflow?"]');
    await expect(anchor).toBeVisible();
    const href = await anchor.getAttribute('href');
    const response = await page.request.get(href);
    expect(response.status()).toBe(200);
    const workflow = await response.json();
    expect(workflow.kind).toBe('workflows');
    const lists = db.find('lists', { boardId: board.boardId, archived: false }).map(list => list.title);
    expect(workflow.data[0].customStatuses.map(status => status.name)).toEqual(expect.arrayContaining(lists));
    const unauthorized = new URL(href, page.url());
    unauthorized.searchParams.set('authToken', user2.token);
    expect([401, 403]).toContain((await page.request.get(unauthorized.toString())).status());
  });
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

// Kanri's all-data export holds every board. Each is read into a swimlane of
// its own, and "One board per project" (models/lib/importSplit.js) makes each
// its own WeKan board - the whole Kanri app in one import.
test('Kanri: an all-data export imports every board, one board per project; other documents are refused', async ({ loggedInPage: page }) => {
  const boardIds = [];
  const kanriBoard = (id, title, card) => ({ id, title, columns: [{ id: `${id}-c`, title: 'Todo', cards: [{ name: card }] }] });
  try {
    await navigateInApp(page, '/import/kanri');
    await page.locator('#import-textarea').fill(JSON.stringify({
      activeTheme: 'dark', colors: {}, pins: [],
      boards: [kanriBoard('a', 'First Kanri board', expected.title), kanriBoard('b', 'Second Kanri board', 'Second card')],
    }));
    await page.locator('.js-import-split-toggle').click();
    await expect(page.locator('.js-import-split-toggle .materialCheckBox')).toHaveClass(/is-checked/);
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    const first = db.findOne('boards', { title: 'First Kanri board' });
    const second = db.findOne('boards', { title: 'Second Kanri board' });
    boardIds.push(first._id, second._id);
    expect(db.find('cards', { boardId: first._id }).map(card => card.title)).toEqual([expected.title]);
    expect(db.find('cards', { boardId: second._id }).map(card => card.title)).toEqual(['Second card']);
    await page.evaluate(() => Session.set('importSplitByProject', false));
  } finally { db.cleanup({ boardIds }); }
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

// "Import many boards" (models/lib/importManyFiles.js): several files, and a
// .zip holding more, each its own board, with what each became listed.
test('Import many boards: several files and a .zip of them become one board each', async ({ loggedInPage: page }) => {
  const { zipSync, strToU8 } = require('../../../node_modules/fflate');
  const titles = ['Many A', 'Many B', 'Many C'];
  try {
    await navigateInApp(page, '/import/markdown');
    await page.locator('.js-import-many-files').setInputFiles([
      { name: 'a.md', mimeType: 'text/markdown', buffer: Buffer.from(`# ${titles[0]}\n\n## To Do\n\n- [ ] ${expected.title}\n`) },
      { name: 'more.zip', mimeType: 'application/zip', buffer: Buffer.from(zipSync({
        'b.md': strToU8(`# ${titles[1]}\n\n## To Do\n\n- [ ] One\n`),
        'c.md': strToU8(`# ${titles[2]}\n\n## Doing\n\n- [ ] Two\n`),
        '__MACOSX/._b.md': strToU8('x'),
      })) },
      { name: 'broken.md', mimeType: 'text/markdown', buffer: Buffer.from('') },
    ]);
    await page.locator('.js-import-without-mapping').click();
    const results = page.locator('.js-import-many-results li');
    await expect(results).toHaveCount(4, { timeout: 60_000 });
    await expect(page.locator('.js-import-many-results li.is-imported')).toHaveCount(3);
    await expect(page.locator('.js-import-many-results li.is-failed')).toContainText('broken.md');
    for (const title of titles) expect(db.find('boards', { title })).toHaveLength(1);
    expect(db.find('cards', { boardId: db.findOne('boards', { title: titles[0] })._id }).map(c => c.title)).toEqual([expected.title]);
    await page.locator('.js-import-many-all-boards').click();
    await expect(page).toHaveURL(/\/$/);
  } finally {
    db.cleanup({ boardIds: titles.map(title => db.findOne('boards', { title })).filter(Boolean).map(board => board._id) });
  }
});

// "Export all boards" (server/routes/exportAllBoards.js): Excel is one
// workbook with a sheet per board named after it; another format is a .zip
// with a file per board; another user's token gets none of them.
test('Export all boards: one workbook with a sheet per board, or a .zip with a file per board', async ({ boardPage: page, board, user, user2 }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  const { unzipSync } = require('../../../node_modules/fflate');
  const extra = db.seedBoard({ ownerId: user.id, title: 'Second: board' });
  try {
    // The All Boards sidebar offers it, each format a download link.
    await navigateInApp(page, '/');
    const settings = page.locator('.js-export-all-boards');
    if (!(await settings.isVisible().catch(() => false))) await page.locator('.js-toggle-page-sidebar').first().click();
    await settings.click();
    await expect(page.locator('.js-pop-over a.export-all-boards-format[href*="/api/export-all-boards/excel?"]')).toBeVisible();
    await expect(page.locator('.js-pop-over a.export-all-boards-format[href*="/api/export-all-boards/wrike?"]')).toBeVisible();
    const excel = await page.request.get(`/api/export-all-boards/excel?authToken=${encodeURIComponent(user.token)}`);
    expect(excel.status()).toBe(200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await excel.body());
    const sheets = workbook.worksheets.map(sheet => sheet.name);
    expect(sheets).toEqual(expect.arrayContaining([db.findOne('boards', { _id: board.boardId }).title.slice(0, 31), 'Second board']));
    expect(sheets).not.toContain('Activities');
    const zip = await page.request.get(`/api/export-all-boards/markdown?authToken=${encodeURIComponent(user.token)}&boardIds=${board.boardId},${extra.boardId}`);
    expect(zip.status()).toBe(200);
    const files = Object.keys(unzipSync(new Uint8Array(await zip.body())));
    expect(files).toHaveLength(2);
    expect(files).toContain('Second-board.md');
    const theirs = await page.request.get(`/api/export-all-boards/markdown?authToken=${encodeURIComponent(user2.token)}&boardIds=${extra.boardId}`);
    expect(theirs.status()).toBe(404);
    expect((await page.request.get(`/api/export-all-boards/pdf?authToken=${encodeURIComponent(user.token)}`)).status()).toBe(404);
  } finally { db.cleanup({ boardIds: [extra.boardId] }); }
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
    expectCommentsBy(db.find('card_comments', { cardId: open._id }), [['Looks good', 'Ana Lee']]);
    const items = db.find('checklistItems', { cardId: open._id });
    expect(items.map(item => [item.title, item.isFinished]).sort()).toEqual([['Call', true], ['Pay', false]]);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Redmine's issues CSV in a ';' locale with its byte order mark: statuses as
// lists, the tracker as a label, the parent id and "Related issues".
test('Redmine: an issues CSV imports with its statuses, tracker, parent task and relations', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/redmine');
    await page.locator('#import-textarea').fill('﻿' + [
      '#;Tracker;Status;Priority;Subject;Assignee;Due date;Estimated time;Parent task;Related issues;Description',
      `42;Bug;In Progress;High;${expected.title};;10/05/2026;3,00;;Blocked by #41;"Two of them; DN50"`,
      '41;Feature;New;Normal;Footer;;;;;Blocks #42;',
      '43;Support;New;Low;Child task;;;;42;;',
    ].join('\r\n'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(3);
    const open = cards.find(card => card.title === expected.title);
    const footer = cards.find(card => card.title === 'Footer');
    const child = cards.find(card => card.title === 'Child task');
    expect(open.description).toBe('Two of them; DN50');
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual(['Bug']);
    expect(new Date(open.dueAt).toISOString()).toBe('2026-10-05T00:00:00.000Z');
    expect(child.parentId).toBe(open._id);
    expect((open.cardDependencies || []).map(dep => [dep.cardId, dep.type])).toEqual([[footer._id, 'is-blocked-by']]);
    expect(footer.cardDependencies || []).toEqual([]);
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('In Progress');
    expect(db.find('customFields', { boardIds: boardId }).map(field => field.name).sort()).toEqual(['Estimated time', 'Priority']);
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

// A Super Productivity backup: projects as swimlanes, done state and the
// in-progress tag as lists, tags as labels, a sub-task as a sub-task card.
test('Super Productivity: a backup imports with its projects, lists, labels and sub-tasks', async ({ loggedInPage: page }) => {
  let boardId;
  const advancedCfg = { worklogExportSettings: { cols: ['DATE'], roundWorkTimeTo: null, roundStartTimeTo: null, roundEndTimeTo: null, groupBy: 'DATE', separateTasksBy: '' } };
  const task = (id, fields) => ({ id, subTaskIds: [], timeSpentOnDay: {}, timeSpent: 0, timeEstimate: 0, isDone: false, notes: '', tagIds: [], created: 1733000000000, attachments: [], projectId: 'p1', ...fields });
  const backup = {
    timestamp: 1733100000000, lastUpdate: 1733100000000, crossModelVersion: 4.5,
    data: {
      project: { ids: ['p1'], entities: { p1: { id: 'p1', title: 'From Super Productivity', taskIds: ['t1', 't2'], backlogTaskIds: [], noteIds: [], theme: {}, advancedCfg } } },
      tag: { ids: ['l1', 'KANBAN_IN_PROGRESS'], entities: {
        l1: { id: 'l1', title: expected.label, taskIds: ['t1'], created: 1, theme: {}, advancedCfg },
        KANBAN_IN_PROGRESS: { id: 'KANBAN_IN_PROGRESS', title: 'in-progress', taskIds: ['t2'], created: 1, theme: {}, advancedCfg } } },
      task: { ids: ['t1', 't1a', 't2'], entities: {
        t1: task('t1', { title: expected.title, notes: 'Two of them, DN50', tagIds: ['l1'], subTaskIds: ['t1a'], dueDay: '2026-10-10', timeSpent: 1800000, timeSpentOnDay: { '2026-10-01': 1800000 } }),
        t1a: task('t1a', { title: 'Sub-task from Super Productivity', parentId: 't1', isDone: true, doneOn: 1733050000000 }),
        t2: task('t2', { title: 'Started task', tagIds: ['KANBAN_IN_PROGRESS'] }) },
        currentTaskId: null, selectedTaskId: null, lastCurrentTaskId: null, isDataLoaded: false },
    },
  };
  try {
    await navigateInApp(page, '/import/superproductivity');
    await page.locator('#import-textarea').fill(JSON.stringify(backup));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('From Super Productivity');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(3);
    const lists = db.find('lists', { boardId });
    const listOf = card => lists.find(list => list._id === card.listId).title;
    const open = cards.find(card => card.title === expected.title);
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual([expected.label]);
    expect(open.description).toBe('Two of them, DN50');
    expect(new Date(open.dueAt).toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(open.spentTime).toBe(0.5);
    expect(listOf(open)).toBe('To Do');
    expect(listOf(cards.find(card => card.title === 'Started task'))).toBe('In Progress');
    const sub = cards.find(card => card.title === 'Sub-task from Super Productivity');
    expect(listOf(sub)).toBe('Done');
    expect(sub.parentId).toBe(open._id);
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('From Super Productivity');
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// A Taiga project dump (tests/fixtures/taiga/project-dump.json): statuses as
// lists, stories as cards with their tasks as subtasks, epics and issues in
// swimlanes of their own, comments, custom fields, tag colors and the open
// sprint (models/lib/taigaFormat.js). The page leaves the embedded attachment
// bytes out before sending.
test('Taiga: a project dump imports with its stories, tasks, epics, issues, comments, fields and sprint', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/taiga');
    await page.locator('#import-textarea').fill(fs.readFileSync(path.resolve(__dirname, '../../fixtures/taiga/project-dump.json'), 'utf8'));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const board = db.findOne('boards', { _id: boardId });
    expect(board.title).toBe('Website relaunch');
    expect(board.labels.find(label => label.name === 'copy').color).toBe('red');
    const lists = db.find('lists', { boardId });
    expect(lists.map(list => list.title).sort()).toEqual(['Archived', 'Done', 'In progress', 'Needs Info', 'New', 'Ready']);
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title).sort()).toEqual(['Default', 'Epics', 'Issues']);
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(7);
    const story = cards.find(card => card.title === 'Write copy');
    expect(lists.find(list => list._id === story.listId).title).toBe('In progress');
    expect(story.requestedBy).toBe('carol@example.com');
    expect(new Date(story.dueAt).toISOString().slice(0, 10)).toBe('2024-03-15');
    expectCommentsBy(db.find('card_comments', { cardId: story._id }), [['Looks good', 'Ann']]);
    const epic = cards.find(card => card.title === 'Content');
    expect(story.parentId).toBe(epic._id);
    expect(cards.filter(card => card.parentId === story._id).map(card => card.title).sort()).toEqual(['Intro paragraph', 'Outro paragraph']);
    expect(cards.find(card => card.title === 'Old landing page').archived).toBe(true);
    const issue = cards.find(card => card.title === 'Broken footer link');
    expect(issue.labelIds.map(id => board.labels.find(l => l._id === id).name).sort())
      .toEqual(['priority:High', 'severity:Critical', 'type:Bug']);
    const fields = db.find('customFields', { boardIds: boardId }).map(field => field.name);
    for (const name of ['Audience', 'Words', 'Story points', 'Task status', 'Blocked']) expect(fields).toContain(name);
    const sprints = db.find('scrumSprints', { boardId });
    expect(sprints.map(sprint => [sprint.name, sprint.state])).toEqual([['Sprint 1', 'planned']]);
    expect(story.scrum.sprintId).toBe(sprints[0]._id);
    expect(db.find('attachments', { 'meta.boardId': boardId })).toHaveLength(0);
    await expect(page.locator('.minicard-title', { hasText: 'Write copy' })).toBeVisible();
  } finally {
    if (boardId) {
      db.deleteMany('scrumSprints', { boardId });
      db.deleteMany('scrumImportSteps', { boardId });
      db.cleanup({ boardIds: [boardId] });
    }
  }
});

test('Taiga: malformed JSON and a document that is not a dump are rejected', async ({ loggedInPage: page }) => {
  await navigateInApp(page, '/import/taiga');
  await page.locator('#import-textarea').fill('{broken');
  await page.locator('.js-import-without-mapping').click();
  await expect(page.locator('.warning').first()).toBeVisible();
  const result = await page.evaluate(async () => {
    try { await Meteor.callAsync('importBoard', { name: 'not a dump', tasks: [] }, {}, 'taiga'); return 'allowed'; }
    catch (e) { return e.error; }
  });
  expect(result).toBe('invalid-import-format');
  await expect(page).toHaveURL(/\/import\/taiga$/);
});

// A ClickUp workspace export: status, list, assignee, tags, a due date in milliseconds and a subtask.
test('ClickUp: a task export imports with its status, list, tags, due date and subtask', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/clickup');
    await page.locator('#import-textarea').fill([
      'Task ID,Task Name,Task Content,Status,Due date,Parent ID,Subtask IDs,Tags,Priority,List Name,Space Name',
      // A cell holding a comma is quoted, as ClickUp's export (and WeKan's,
      // formatClickUpCsv) writes it; the unquoted tag list split into two cells
      // and moved every later column one to the right.
      `t1,${expected.title},"Two of them, DN50",in progress,${Date.UTC(2026, 9, 10)},,[t2],"[${expected.label},web]",high,Website,From ClickUp`,
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

// A Quire project CSV in the shape of the sample file Quire's guide links:
// repeated ID columns give the depth, dates are "Jun 2, 2026" (models/lib/quireCsvFormat.js).
test('Quire: a project CSV imports with its statuses, subtask, tags, dates and priority', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/quire');
    await page.locator('#import-textarea').fill([
      '"ID","ID",Name,Status,Completed,Priority,Start,Due,Assignee,Tag,Tag,Created,Created by,Description',
      `#1,,${expected.title},In progress,,High,"Oct 1, 2026","Oct 10, 2026",,${expected.label},UI,"Sep 30, 2026",Peggy,"Two of them, DN50"`,
      ',#2,Child task,Completed,"Oct 5, 2026",Medium,,,,,,"Sep 30, 2026",Peggy,',
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
    expect(new Date(open.dueAt).toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(new Date(child.endAt).toISOString()).toBe('2026-10-05T00:00:00.000Z');
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([expected.label, 'UI'].sort());
    expect(db.find('lists', { boardId }).map(list => list.title)).toEqual(expect.arrayContaining(['In progress', 'Completed']));
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
    await page.locator('.js-import-file').setInputFiles({
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
    expectCommentsBy(db.find('card_comments', { cardId: card._id }), [['Ordered', 'Alice Example']]);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Wrike's Excel import template, as in its official sample: a folder row,
// Key, Status, Assigned To "Name <email>", date cells and a 13FS dependency.
test('Wrike: an import template imports with its folder, status, dates and dependency', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  let boardId;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tasks');
    [['Key', 'Title', 'Status', 'Priority', 'Assigned To', 'Start Date', 'Duration', 'End Date', 'Depends On', 'Start Date Constraint', 'Description'],
      [1, '/Folder 1/'],
      [13, 'Task 9', 'Active', 'High', '', new Date(Date.UTC(2026, 9, 1)), '1 day', new Date(Date.UTC(2026, 9, 2)), '', '', ''],
      [14, expected.title, 'Active', 'Normal', 'Name Surname <name@company.com>', new Date(Date.UTC(2026, 9, 3)), '4 days', new Date(Date.UTC(2026, 9, 10)), '13FS', '', 'task description'],
    ].forEach(row => sheet.addRow(row));
    await navigateInApp(page, '/import/wrike');
    await page.locator('.js-import-file').setInputFiles({
      name: 'wrike.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const cards = db.find('cards', { boardId });
    const card = cards.find(c => c.title === expected.title);
    expect(card.description).toBe('task description');
    expect(new Date(card.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(new Date(card.startAt).toISOString().slice(0, 10)).toBe('2026-10-03');
    expect(db.find('lists', { boardId }).find(list => list._id === card.listId).title).toBe('Active');
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Folder 1');
    expect(db.find('customFields', { boardIds: boardId }).map(field => field.name).sort()).toEqual(['Duration', 'Priority']);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// The custom-status columns of Wrike's import, in the order its help article
// gives them, as WeKan's own Wrike export writes them: the Custom Status is the
// list and the one Workflow the board's title.
test('Wrike: custom statuses of a workflow import as lists, the workflow as the board title', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  let boardId;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tasks');
    [['Key', 'Parent Task', 'Title', 'Default task workflow', 'Default project workflow', 'Workflow', 'Status', 'Custom Status', 'Priority'],
      [1, '', '/Release/', 'Delivery'],
      [2, '', expected.title, '', '', 'Delivery', 'Active', 'Building', 'High'],
      [3, '', 'Second task', '', '', 'Delivery', 'Completed', 'Shipped', ''],
    ].forEach(row => sheet.addRow(row));
    await navigateInApp(page, '/import/wrike');
    await page.locator('.js-import-file').setInputFiles({
      name: 'wrike-workflow.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Delivery');
    const lists = db.find('lists', { boardId });
    const cards = db.find('cards', { boardId });
    expect(lists.find(list => list._id === cards.find(c => c.title === expected.title).listId).title).toBe('Building');
    expect(lists.find(list => list._id === cards.find(c => c.title === 'Second task').listId).title).toBe('Shipped');
    expect(db.find('customFields', { boardIds: boardId }).map(field => field.name)).toEqual(['Priority']);
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Release');
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Teamwork.com's Excel task import template: a task list, a task with its
// people, due date, priority, estimate and tags, and a "-" subtask.
test('Teamwork.com: an import template imports with its task list, fields and subtask', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  let boardId;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('From Teamwork');
    [['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status'],
      ['Audit list', expected.title, expected.description, 'ann@example.com', '', '2026-10-10', 'high', '1h 30m', expected.label, 'Active'],
      ['', '-Audit child', '', '', '', '', '', '', '', 'Complete']].forEach(row => sheet.addRow(row));
    await navigateInApp(page, '/import/teamwork');
    await page.locator('.js-import-file').setInputFiles({
      name: 'teamwork.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('From Teamwork');
    const cards = db.find('cards', { boardId });
    const first = cards.find(c => c.title === expected.title);
    const child = cards.find(c => c.title === 'Audit child');
    expect(child.parentId).toBe(first._id);
    expect(first.description).toBe(expected.description);
    expect(new Date(first.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
    const lists = Object.fromEntries(db.find('lists', { boardId }).map(l => [l._id, l.title]));
    expect([lists[first.listId], lists[child.listId]]).toEqual(['Audit list', 'Audit list']);
    const fields = Object.fromEntries(db.find('customFields', { boardIds: boardId }).map(f => [f._id, f.name]));
    expect(Object.fromEntries(first.customFields.map(v => [fields[v._id], v.value])))
      .toEqual({ Priority: 'High', 'Estimated time (hours)': 1.5 });
    expect(Object.fromEntries(child.customFields.map(v => [fields[v._id], v.value]))).toEqual({ Complete: true });
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Businessmap (Kanbanize): the documented import columns, with a parent link.
test('Businessmap: a workbook imports with its column, lane, deadline, priority, comment and parent', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  let boardId;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    [['Card ID', 'Title', 'Board name', 'Column', 'Lane', 'Deadline', 'Priority', 'Tags', 'Color', 'Comment', 'Links'],
      [101, expected.title, 'From Businessmap', 'Requested', 'Expedite', '10/28/2026', 'high', expected.label, '#067DB7', 'Ordered', 'Children: 102'],
      [102, 'Businessmap child', 'From Businessmap', 'Requested', 'Expedite', '', '', '', '', '', '']].forEach(row => sheet.addRow(row));
    await navigateInApp(page, '/import/businessmap');
    await page.locator('.js-import-file').setInputFiles({
      name: 'businessmap.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('From Businessmap');
    const cards = db.find('cards', { boardId });
    const card = cards.find(c => c.title === expected.title);
    const child = cards.find(c => c.title === 'Businessmap child');
    expect(new Date(card.dueAt).toISOString().slice(0, 10)).toBe('2026-10-28');
    expect(card.color).toBe('#067db7');
    expect(child.parentId).toBe(card._id);
    expect(db.find('lists', { boardId }).find(list => list._id === card.listId).title).toBe('Requested');
    expect(db.find('swimlanes', { boardId }).map(lane => lane.title)).toContain('Expedite');
    const fields = Object.fromEntries(db.find('customFields', { boardIds: boardId }).map(f => [f._id, f.name]));
    expect(Object.fromEntries(card.customFields.map(v => [fields[v._id], v.value]))).toEqual({ 'Card ID': 101, Priority: 'high' });
    expect(db.find('card_comments', { cardId: card._id }).map(comment => comment.text)).toEqual(['Ordered']);
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
    await page.locator('.js-import-file').setInputFiles(path.resolve(__dirname, '../../fixtures/planner/plannr-test_plan.xlsx'));
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
    // Exact: "Task 2" is also the start of Task 20 to Task 29 in this plan.
    await expect(page.locator('.minicard-title').getByText('Task 2', { exact: true })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Vikunja's export is a .zip of data.json, filters.json and VERSION
// (models/lib/vikunjaFormat.js, server/lib/vikunjaArchive.js): its own case.
test('Vikunja: the export menu link returns a Vikunja export zip and refuses an unrelated user', async ({ boardPage: page, user2 }) => {
  const { unzipSync, strFromU8 } = require('../../../node_modules/fflate');
  const bp = new BoardPage(page);
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  const anchor = page.locator('.js-pop-over a[href*="/export/vikunja?"]');
  await expect(anchor).toBeVisible();
  const href = await anchor.getAttribute('href');
  const response = await page.request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/zip');
  const files = unzipSync(new Uint8Array(await response.body()));
  expect(Object.keys(files).sort()).toEqual(['VERSION', 'data.json', 'filters.json']);
  expect(strFromU8(files.VERSION)).toBe('v1.0.0');
  const projects = JSON.parse(strFromU8(files['data.json']));
  const tasks = projects.flatMap(project => project.tasks);
  expect(tasks.map(task => task.title)).toContain('Alpha Card');
  const kanban = projects.flatMap(project => project.views).find(view => view.view_kind === 'kanban');
  expect(kanban.bucket_configuration_mode).toBe('manual');
  const unauthorized = new URL(href, page.url());
  unauthorized.searchParams.set('authToken', user2.token);
  expect([401, 403]).toContain((await page.request.get(unauthorized.toString())).status());
});

// A Vikunja export in the current layout, built from the structure Vikunja's
// pkg/models/export.go writes: a kanban view with two buckets, a task with a
// TipTap task list, labels, a due date, priority, a comment and a done task.
function vikunjaExportZip() {
  const { zipSync, strToU8 } = require('../../../node_modules/fflate');
  const T = '2026-10-01T10:00:00Z';
  const ZERO = '0001-01-01T00:00:00Z';
  const project = {
    id: 3, title: 'Vikunja Website', description: '', hex_color: '', parent_project_id: 0, is_archived: false, position: 65536,
    views: [{ id: 12, title: 'Kanban', project_id: 3, view_kind: 'kanban', position: 400, bucket_configuration_mode: 'manual',
      default_bucket_id: 20, done_bucket_id: 21 }],
    tasks: [
      { id: 101, title: expected.title, description: '<p>Two of them</p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>Quote</p></li><li data-checked="false" data-type="taskItem"><p>Order</p></li></ul>',
        done: false, done_at: ZERO, due_date: '2026-09-30T12:00:00Z', start_date: ZERO, end_date: ZERO, priority: 4, hex_color: '',
        percent_done: 0.5, labels: [{ id: 4, title: expected.label, hex_color: '' }], assignees: [], related_tasks: {},
        attachments: [], created: T, updated: T,
        comments: [{ id: 5, comment: '<p>Looks good</p>', author: { id: 1, username: 'ann' }, created: T, updated: T }] },
      { id: 102, title: 'Finished task', description: '', done: true, done_at: '2026-10-02T09:00:00Z', due_date: ZERO, priority: 0,
        related_tasks: { parenttask: [{ id: 101 }] }, created: T, updated: T },
    ],
    buckets: [
      { id: 20, title: 'Doing', project_view_id: 12, limit: 0, position: 65536 },
      { id: 21, title: 'Done', project_view_id: 12, limit: 0, position: 131072 },
    ],
    task_buckets: [{ bucket_id: 20, task_id: 101, project_view_id: 12 }, { bucket_id: 21, task_id: 102, project_view_id: 12 }],
    positions: [],
  };
  return Buffer.from(zipSync({ 'data.json': strToU8(JSON.stringify([project])), 'filters.json': strToU8('[]'), VERSION: strToU8('v1.0.0') }));
}

test('Vikunja: an export .zip imports through the page with its buckets, checklist, comment, fields and parent', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/vikunja');
    await page.locator('.js-import-file').setInputFiles({ name: 'vikunja-export.zip', mimeType: 'application/zip', buffer: vikunjaExportZip() });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Vikunja Website');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const done = cards.find(card => card.title === 'Finished task');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('Doing');
    expect(lists.find(list => list._id === done.listId).title).toBe('Done');
    expect(open.description).toBe('Two of them');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(new Date(done.endAt).toISOString().slice(0, 10)).toBe('2026-10-02');
    expect(done.parentId).toBe(open._id);
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual([expected.label]);
    expect(db.find('checklistItems', { cardId: open._id }).map(item => [item.title, item.isFinished])).toEqual([['Quote', true], ['Order', false]]);
    expectCommentsBy(db.find('card_comments', { cardId: open._id }), [['Looks good', 'ann']]);
    const fields = db.find('customFields', { boardIds: boardId }).map(field => field.name).sort();
    expect(fields).toEqual(['Done', 'Percent Done', 'Priority']);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('Vikunja: a pasted data.json imports, and a broken one or an unrelated zip is refused', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/vikunja');
    await page.locator('#import-textarea').fill('{broken');
    await page.locator('.js-import-without-mapping').click();
    await expect(page.locator('.warning').first()).toBeVisible();
    const refused = await page.evaluate(async zipBase64 => {
      try { await Meteor.callAsync('importBoard', { zipBase64 }, {}, 'vikunja'); return 'allowed'; }
      catch (e) { return `${e.error} ${e.reason}`; }
    }, Buffer.from(require('../../../node_modules/fflate').zipSync({ 'readme.txt': new Uint8Array([104, 105]) })).toString('base64'));
    expect(refused).toMatch(/^invalid-import-format .*no data\.json/);
    await expect(page).toHaveURL(/\/import\/vikunja$/);
    await page.locator('#import-textarea').fill(JSON.stringify([{ id: 1, title: 'Pasted Vikunja', tasks: [{ id: 1, title: expected.title }] }]));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Pasted Vikunja');
    expect(db.find('cards', { boardId }).map(card => card.title)).toEqual([expected.title]);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Notion's Markdown & CSV export (models/lib/notionFormat.js,
// server/lib/notionArchive.js): a database CSV with its _all.csv, and the row
// pages whose body becomes the description. File names end in the page id.
function notionExportZip() {
  const { zipSync, strToU8 } = require('../../../node_modules/fflate');
  const id = '1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6';
  const csv = [
    'Name,Status,Assignee,Due,Tags,Approved',
    `${expected.title},In progress,ann,"October 8, 2026","${expected.label}, docs",Yes`,
    'Second page,Done,,,,No',
  ].join('\r\n');
  return Buffer.from(zipSync({
    [`Notion Tasks ${id}.csv`]: strToU8(csv.split('\r\n').slice(0, 2).join('\r\n')),
    [`Notion Tasks ${id}_all.csv`]: strToU8(csv),
    [`Notion Tasks ${id}/${expected.title.replace(/[\\/:*?"<>|]/g, ' ')} 0f1e2d3c4b5a49687766554433221100.md`]:
      strToU8(`# ${expected.title}\n\nStatus: In progress\nAssignee: ann\n\nBody of the page.\n`),
  }));
}

test('Notion: an export .zip imports through the page with its status lists, page body, labels, date and checkbox', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/notion');
    await page.locator('.js-import-file').setInputFiles({ name: 'notion-export.zip', mimeType: 'application/zip', buffer: notionExportZip() });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Notion Tasks');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(2);
    const open = cards.find(card => card.title === expected.title);
    const done = cards.find(card => card.title === 'Second page');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('In progress');
    expect(lists.find(list => list._id === done.listId).title).toBe('Done');
    expect(open.description).toBe('Body of the page.');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-10-08');
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name).sort()).toEqual([expected.label, 'docs'].sort());
    expect(db.find('customFields', { boardIds: boardId }).map(field => [field.name, field.type])).toEqual([['Approved', 'checkbox']]);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('Notion: a pasted database CSV imports, and a zip without a database is refused', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/notion');
    const refused = await page.evaluate(async zipBase64 => {
      try { await Meteor.callAsync('importBoard', { zipBase64 }, {}, 'notion'); return 'allowed'; }
      catch (e) { return `${e.error} ${e.reason}`; }
    }, Buffer.from(require('../../../node_modules/fflate').zipSync({ 'page.md': new Uint8Array([35, 32, 104, 105]) })).toString('base64'));
    expect(refused).toMatch(/^invalid-import-format .*no database CSV/);
    await page.locator('#import-textarea').fill(`Name,Stage\n${expected.title},Doing\nOther,Review\n`);
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('lists', { boardId }).map(list => list.title).sort()).toEqual(expect.arrayContaining(['Doing', 'Review']));
    expect(db.find('cards', { boardId }).map(card => card.title).sort()).toEqual([expected.title, 'Other'].sort());
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Plane's issue export (Workspace Settings > Exports), import only: a .zip with
// one file per project, built as Plane's IssueExportSerializer and its JSON and
// CSV formatters write it (models/lib/planeFormat.js, tests/planeFormat.test.cjs).
function planeIssue(fields) {
  return {
    project_name: 'Plane Website', project_identifier: 'WEB', parent: '', identifier: '', sequence_id: 0, name: '',
    state_name: 'Todo', priority: 'none', assignees: [], subscribers: [], created_by_name: 'Jane Doe', start_date: null,
    target_date: null, completed_at: null, created_at: '2026-09-27T14:03:00.123456Z', updated_at: '2026-10-01T09:15:00.000000Z',
    archived_at: null, estimate: '', labels: [], cycles: [], modules: [], links: [], relations: [], comments: [],
    sub_issues_count: 0, link_count: 0, attachment_count: 0, is_draft: false, ...fields,
  };
}
function planeExportZip() {
  const { zipSync, strToU8 } = require('../../../node_modules/fflate');
  const web = [
    planeIssue({ identifier: 'WEB-1', sequence_id: 1, name: expected.title, state_name: 'In Progress', priority: 'high',
      target_date: '2026-09-30', estimate: '3', labels: [expected.label], cycles: ['Sprint 7'],
      links: [{ url: 'https://example.com/spec', title: 'Spec' }],
      comments: [{ comment: 'Looks good', created_by: 'John Smith', created_at: '2026-09-28 08:00:00' }] }),
    planeIssue({ parent: 'WEB-1', identifier: 'WEB-2', sequence_id: 2, name: 'Child issue', state_name: 'Done',
      completed_at: '2026-10-02T09:00:00Z' }),
  ];
  // The second project as CSV: prettified headers, lists as JSON text.
  const keys = Object.keys(planeIssue({}));
  const header = keys.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(',');
  const row = planeIssue({ project_name: 'Plane Mobile', project_identifier: 'MOB', identifier: 'MOB-1', sequence_id: 1, name: 'Mobile issue' });
  const csv = `${header}\r\n${keys.map(key => {
    const value = row[key];
    const text = Array.isArray(value) ? JSON.stringify(value) : value === null ? '' : value === false ? 'False' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(',')}\r\n`;
  return Buffer.from(zipSync({ 'acme-p1.json': strToU8(JSON.stringify(web, null, 2)), 'acme-p2.csv': strToU8(csv) }));
}

test('Plane: an export .zip imports through the page with its states, projects, parent, comment and fields', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/plane');
    await page.locator('.js-import-file').setInputFiles({ name: 'export-acme-abc123-2026-10-08.zip', mimeType: 'application/zip', buffer: planeExportZip() });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Imported Plane issues');
    const cards = db.find('cards', { boardId });
    expect(cards.map(card => card.title).sort()).toEqual([expected.title, 'Child issue', 'Mobile issue'].sort());
    const open = cards.find(card => card.title === expected.title);
    const child = cards.find(card => card.title === 'Child issue');
    const lists = db.find('lists', { boardId });
    expect(lists.find(list => list._id === open.listId).title).toBe('In Progress');
    expect(lists.find(list => list._id === child.listId).title).toBe('Done');
    const swimlanes = db.find('swimlanes', { boardId });
    expect(swimlanes.find(lane => lane._id === cards.find(card => card.title === 'Mobile issue').swimlaneId).title).toBe('Plane Mobile');
    expect(child.parentId).toBe(open._id);
    expect(open.description).toBe('Links:\n- [Spec](https://example.com/spec)');
    expect(new Date(open.dueAt).toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(new Date(child.endAt).toISOString().slice(0, 10)).toBe('2026-10-02');
    const board = db.findOne('boards', { _id: boardId });
    expect(open.labelIds.map(id => board.labels.find(l => l._id === id).name)).toEqual([expected.label]);
    expectCommentsBy(db.find('card_comments', { cardId: open._id }), [['Looks good', 'John Smith']]);
    const fields = db.find('customFields', { boardIds: boardId }).map(field => field.name).sort();
    expect(fields).toEqual(['Cycle', 'Estimate', 'Priority']);
    await expect(page.locator('.minicard-title', { hasText: expected.title })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('Plane: a pasted JSON export imports, and broken text or a zip without export files is refused', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/plane');
    await page.locator('#import-textarea').fill('[broken');
    await page.locator('.js-import-without-mapping').click();
    await expect(page.locator('.warning').first()).toBeVisible();
    const refused = await page.evaluate(async zipBase64 => {
      try { await Meteor.callAsync('importBoard', { zipBase64 }, {}, 'plane'); return 'allowed'; }
      catch (e) { return `${e.error} ${e.reason}`; }
    }, Buffer.from(require('../../../node_modules/fflate').zipSync({ 'readme.txt': new Uint8Array([104, 105]) })).toString('base64'));
    expect(refused).toMatch(/^invalid-import-format .*no \.json, \.csv or \.xlsx/);
    await expect(page).toHaveURL(/\/import\/plane$/);
    await page.locator('#import-textarea').fill(JSON.stringify([planeIssue({ project_name: 'Pasted Plane', identifier: 'WEB-9', name: expected.title })]));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Pasted Plane');
    expect(db.find('cards', { boardId }).map(card => card.title)).toEqual([expected.title]);
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
        await page.locator('.js-import-file').setInputFiles({
          name: 'audit.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        });
        await page.locator('form input[type=submit]').first().click();
      } else {
        await page.locator('#import-textarea').fill(fs.readFileSync(path.join(fixtures, source === 'csv' ? 'csv.csv' : 'markdown.md'), 'utf8'));
        await page.locator('.js-import-without-mapping').click();
      }
      // CSV and Excel ask which column is which field before importing.
      if (source !== 'markdown') await page.locator('.js-csv-mapping-import').click();
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

// The column mapping step of the CSV/TSV import (client/components/import/csvMapping.js):
// a file with no list column is not imported as one list per row - the step
// asks for the one list every card goes into.
test('CSV: the mapping step asks for a list when the file has none, and every card goes into it', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await navigateInApp(page, '/import/csv');
    await page.locator('#import-textarea').fill('Task\tNotes\nBuy milk, eggs\tfrom the shop\nPaint fence\t\nCall Bob\tafter 5\n');
    await page.locator('.js-import-without-mapping').click();
    const step = page.locator('.js-csv-mapping');
    await expect(step).toBeVisible();
    // The title was matched from the file's first column, the list was not.
    await expect(page.locator('#csv-map-title')).toHaveValue('0');
    await expect(page.locator('#csv-map-list')).toHaveValue('');
    await expect(page.locator('.js-csv-mapping-list-missing')).toBeVisible();
    await page.locator('#csv-map-description').selectOption('1');
    // Negative: an empty list name is refused on the page.
    await page.locator('.js-csv-map-list-name').fill('');
    await page.locator('.js-csv-mapping-import').click();
    await expect(page.locator('.js-csv-mapping-error')).toBeVisible();
    expect(page.url()).not.toMatch(/\/b\//);
    await page.locator('.js-csv-map-list-name').fill('Shopping');
    await page.locator('.js-csv-mapping-import').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const lists = db.find('lists', { boardId });
    expect(lists.map(list => list.title)).toEqual(['Shopping']);
    const cards = db.find('cards', { boardId });
    expect(cards.map(card => card.title).sort()).toEqual(['Buy milk, eggs', 'Call Bob', 'Paint fence']);
    expect(cards.every(card => card.listId === lists[0]._id)).toBe(true);
    expect(cards.find(card => card.title === 'Call Bob').description).toBe('after 5');
    await expect(page.locator('.minicard-title', { hasText: 'Buy milk, eggs' })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('CSV: a mapping whose columns are not in the file is refused without creating a board', async ({ loggedInPage: page, user }) => {
  const before = db.find('boards', { 'members.userId': user.id }).length;
  const results = await page.evaluate(async () => {
    const rows = [['Title', 'List'], ['A', 'Doing']];
    const out = [];
    for (const csvMapping of [{ columns: { title: 5 } }, { columns: { nope: 0 } }, { columns: { title: '0' } }, { extra: 1 }]) {
      try { await Meteor.callAsync('importBoard', rows, { csvMapping }, 'csv'); out.push('allowed'); }
      catch (error) { out.push(error.error); }
    }
    return out;
  });
  expect(results).not.toContain('allowed');
  expect(results[0]).toBe('invalid-import-mapping');
  expect(db.find('boards', { 'members.userId': user.id })).toHaveLength(before);
});

// WeKan's own Excel export read back: the streaming table ExporterExcel
// writes (title in A1, header in row 7 in the exporter's language - Finnish
// here - and an Activity sheet), as "Export all boards" writes it: one sheet
// per board. Each sheet becomes its own board; the Activity sheet is skipped.
test('Excel: a WeKan export workbook in Finnish with a sheet per board imports as several boards', async ({ loggedInPage: page }) => {
  const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
  const fi = require('../../../imports/i18n/data/fi.i18n.json');
  const layout = ['number', 'title', 'description', 'parent-card', 'owner', 'createdAt', 'last-modified-at',
    'card-received', 'card-start', 'card-due', 'card-end', 'list', 'swimlane', 'assignee', 'members',
    'requested-by', 'assigned-by', 'labels', 'overtime-hours', 'spent-time-hours'];
  const titles = [`Excel round trip A ${Date.now()}`, `Excel round trip B ${Date.now()}`];
  const boardIds = [];
  try {
    const workbook = new ExcelJS.Workbook();
    titles.forEach((title, b) => {
      const ws = workbook.addWorksheet(`Sheet ${b + 1}`);
      ws.mergeCells('A1:H1');
      ws.getCell('A1').value = title;
      ws.addRow(['']);
      ws.addRow([fi.description, '']);
      ws.addRow(['']);
      ws.addRow([fi.createdAt, new Date(), fi['last-modified-at'], new Date(), fi.members, '']);
      ws.addRow(['']);
      ws.addRow(layout.map(key => fi[key]));
      ws.addRow(['1', `Card ${b + 1}`, 'Text', '', '', new Date(), new Date(), ' ', ' ',
        new Date('2026-10-10T00:00:00Z'), ' ', b ? 'Valmis' : 'Työn alla', 'Default', '', '', '', '', '', 'false', '']);
      ws.getCell('C8').value = { formula: 'UPPER("text")', result: 'TEXT' };
    });
    const activity = workbook.addWorksheet(fi.activity);
    activity.addRow([titles[0]]);
    activity.addRow(['']);
    activity.addRow([fi.number, fi.activity, fi.card, fi.owner, fi.createdAt, fi['last-modified-at']]);
    await navigateInApp(page, '/import/excel');
    await page.locator('.js-import-file').setInputFiles({
      name: 'wekan-boards.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
    await page.locator('form input[type=submit]').first().click();
    await expect(page.locator('.js-csv-mapping')).toBeVisible();
    await expect(page.locator('#csv-map-title')).toHaveValue('1');
    await expect(page.locator('#csv-map-list')).toHaveValue('11');
    await expect(page.locator('.js-csv-mapping-boards')).toContainText(titles[1]);
    await expect(page.locator('.js-csv-mapping-skipped')).toContainText(fi.activity);
    await page.locator('.js-csv-mapping-import').click();
    await waitForImportedBoard(page);
    for (const [b, title] of titles.entries()) {
      const board = db.findOne('boards', { title });
      expect(board).toBeTruthy();
      boardIds.push(board._id);
      const [card] = db.find('cards', { boardId: board._id });
      expect(card.title).toBe(`Card ${b + 1}`);
      expect(card.description).toBe('TEXT');
      expect(new Date(card.dueAt).toISOString().slice(0, 10)).toBe('2026-10-10');
      expect(db.find('lists', { boardId: board._id }).map(list => list.title)).toEqual([b ? 'Valmis' : 'Työn alla']);
    }
    expect(page.url()).toContain(`/b/${boardIds[0]}/`);
  } finally { if (boardIds.length) db.cleanup({ boardIds }); }
});

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

test('kanboard: task links import as a parent card and one dependency per link', async ({ loggedInPage: page }) => {
  // Kanboard keeps each link from both tasks; getAllTaskLinks lists the
  // OTHER task as task_id. Both rows of a link make one parent or dependency.
  const doc = {
    board: { name: 'Kanboard links' },
    columns: [{ id: 1, title: 'Backlog' }],
    tasks: [
      { id: 1, title: 'Kanboard epic', column_id: 1, links: [
        { id: 1, task_id: 2, label: 'is a parent of' }, { id: 3, task_id: 3, label: 'blocks' }] },
      { id: 2, title: 'Kanboard story', column_id: 1, links: [{ id: 2, task_id: 1, label: 'is a child of' }] },
      { id: 3, title: 'Kanboard blocked', column_id: 1, links: [
        { id: 4, task_id: 1, label: 'is blocked by' }, { id: 5, task_id: 404, label: 'relates to' }] },
    ],
  };
  let boardId;
  try {
    await navigateInApp(page, '/import/kanboard');
    await page.locator('#import-textarea').fill(JSON.stringify(doc));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const card = title => db.findOne('cards', { boardId, title });
    const [epic, story, blocked] = ['Kanboard epic', 'Kanboard story', 'Kanboard blocked'].map(card);
    expect(story.parentId).toBe(epic._id);
    expect(epic.parentId || '').toBe('');
    expect(blocked.parentId || '').toBe('');
    expect(epic.cardDependencies.map(d => [d.cardId, d.type])).toEqual([[blocked._id, 'blocks']]);
    expect(blocked.cardDependencies || []).toEqual([]);
    expect(story.cardDependencies || []).toEqual([]);
    // The link to task 404, which is not in the file, is in the loss report.
    const events = db.find('recoveryEvents', { boardIds: boardId });
    expect(events.map(e => e.detail).join('\n')).toContain('/tasks/2/links/1');
    await expect(page.locator('.minicard')).toHaveCount(3);
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('github: an embedded issue comment becomes a card comment, not description text', async ({ loggedInPage: page }) => {
  const issues = [{
    number: 5, title: 'GitHub commented issue', body: 'Issue body only', state: 'open', comments: 1,
    comments_data: [{ id: 50, body: 'Embedded GitHub reply', user: { login: 'gh-commenter' }, created_at: '2026-09-02T10:00:00Z' }],
  }];
  let boardId;
  try {
    await navigateInApp(page, '/import/github');
    await page.locator('#import-textarea').fill(JSON.stringify(issues));
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    const card = db.findOne('cards', { boardId, title: 'GitHub commented issue' });
    expect(card.description).not.toContain('Embedded GitHub reply');
    expect(card.description).toContain('Issue body only');
    const comments = db.find('card_comments', { boardId });
    expect(comments.map(c => c.cardId)).toEqual([card._id]);
    expectCommentsBy(comments, [['Embedded GitHub reply', 'gh-commenter']]);
    expect(new Date(comments[0].createdAt).toISOString()).toBe('2026-09-02T10:00:00.000Z');
    await page.locator('.minicard .minicard-title').first().click();
    await expect(page.locator('.comment-text').first()).toContainText('Embedded GitHub reply');
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

// Hawaiian instructions preserve the external tools' commands and exclusions.
for (const source of ['opml', 'orgmode', 'meistertask', 'obsidian', 'linear',
  'ticktick', 'clickup', 'nullboard', 'kanri', 'pivotal', 'tasksorg', 'monday',
  'superproductivity', 'taiga', 'vikunja', 'quire', 'wrike', 'teamwork',
  'businessmap', 'redmine', 'notion', 'plane']) {
  test(`Hawaiian ${source} import instructions render without an English fallback`, async ({ loggedInPage: page }) => {
    const strings = require('../../../imports/i18n/data/haw.i18n.json');
    const english = require('../../../imports/i18n/data/en.i18n.json');
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'haw'));
    await navigateInApp(page, `/import/${source}`);
    const instruction = page.locator('label[for="import-textarea"]');
    await expect(instruction).toContainText(strings[`import-board-instruction-${source}`]);
    await expect(instruction).not.toContainText(english[`import-board-instruction-${source}`]);
  });
}
