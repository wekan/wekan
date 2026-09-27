'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp, openBoard } = require('../helpers/auth');

test('Jira status names that match object properties retain lists and Scrum categories', async ({ loggedInPage: page }) => {
  const title = `Jira status names ${db.uniqueSuffix()}`;
  const names = ['constructor', 'toString', '__proto__'];
  const source = { board: { name: title }, issues: names.map((name, index) => ({
    key: `NAMES-${index + 1}`,
    fields: { summary: `Card ${index}`, status: { name, statusCategory: { key: 'done' } },
      issuelinks: [
        { type: { name: 'Blocks' }, outwardIssue: { key: 'constructor' } },
        ...(index === 0 ? [{ type: { name: 'Blocks' }, outwardIssue: { key: 'NAMES-2' } }] : []),
      ],
    },
  })) };
  try {
    const id = await page.evaluate(input => Meteor.callAsync('importBoard', input, {}, 'jira'), source);
    const lists = db.find('lists', { boardId: id });
    expect(lists.map(list => list.title).sort()).toEqual(names.slice().sort());
    await openBoard(page, id, db.findOne('boards', { _id: id }).slug);
    for (const [index, name] of names.entries()) {
      const list = lists.find(list => list.title === name);
      expect(list.scrum.category).toBe('done');
      const card = db.findOne('cards', { boardId: id, listId: list._id });
      expect(card.title).toContain(`Card ${index}`);
      if (index === 0) {
        const target = db.findOne('cards', { boardId: id, listId: lists.find(list => list.title === 'toString')._id });
        expect(card.cardDependencies).toHaveLength(1);
        expect(card.cardDependencies[0]).toMatchObject({ cardId: target._id, type: 'blocks' });
      } else expect(card.cardDependencies || []).toEqual([]);
      // List titles use Markdown: double underscores render as bold text.
      await expect(page.locator('.list-header-name').filter({ hasText: name === '__proto__' ? 'proto' : name }).first()).toBeVisible();
      await expect(page.locator('.minicard-title').filter({ hasText: `Card ${index}` })).toBeVisible();
    }
  } finally {
    for (const board of db.find('boards', { title })) db.cleanup({ boardIds: [board._id] });
  }
});

test('Jira Scrum metadata imports hidden, exports and survives native import', async ({ loggedInPage: page, request, user }) => {
  const ids = [];
  const source = { board: { name: `Jira Scrum ${db.uniqueSuffix()}` }, issues: [
    { key: 'SCRUM-1', fields: { summary: 'Story card', issuetype: { name: 'Story' }, status: { name: 'Finished', statusCategory: { key: 'done' } } } },
    { key: 'SCRUM-2', fields: { summary: 'Task card', issuetype: { name: 'Task' }, status: { name: 'Working', statusCategory: { key: 'indeterminate' } } } },
  ] };
  try {
    await navigateInApp(page, '/import/jira');
    await page.locator('#import-textarea').fill(JSON.stringify(source));
    await page.locator('.js-import-without-mapping').click();
    await page.waitForURL(/\/b\//);
    const id = page.url().match(/\/b\/([^/]+)/)[1]; ids.push(id);
    expect(db.findOne('cards', { boardId: id, 'scrum.issueType': 'Story' })).toBeTruthy();
    expect(db.findOne('lists', { boardId: id, title: 'Finished' }).scrum.category).toBe('done');
    expect(db.findOne('lists', { boardId: id, title: 'Working' }).scrum.category).toBe('doing');
    const board = db.findOne('boards', { _id: id });
    expect(board.scrum?.enabled || false).toBe(false);
    expect(board.scrum?.visibility?.minicardIssueType || false).toBe(false);
    await expect(page.locator('.minicard-title').filter({ hasText: 'Story card' })).toBeVisible();
    const exportBoard = async (suffix) => {
      const response = await request.get(`/api/boards/${id}/export${suffix}`, { headers: { Authorization: `Bearer ${user.token}` } });
      expect(response.status()).toBe(200); return response.json();
    };
    const jira = await exportBoard('/jira');
    const story = jira.issues.find(issue => issue.fields.summary.includes('Story card'));
    expect(story.fields.issuetype).toEqual({ name: 'Story' });
    expect(story.fields.status.statusCategory).toEqual({ key: 'done' });
    const excluded = await exportBoard('/jira?fields=dates');
    expect(excluded.issues.every(issue => !issue.fields.issuetype && !issue.fields.status.statusCategory)).toBe(true);
    const native = await exportBoard('');
    for (const [document, format] of [[native, 'wekan'], [jira, 'jira']]) {
      const copied = await page.evaluate(({ document, format }) => Meteor.callAsync('importBoard', document, {}, format), { document, format }); ids.push(copied);
      expect(db.findOne('cards', { boardId: copied, 'scrum.issueType': 'Story' })).toBeTruthy();
      expect(db.findOne('lists', { boardId: copied, title: 'Finished' }).scrum.category).toBe('done');
    }
    await navigateInApp(page, '/import/jira');
    const toggle = page.locator('.js-import-part-toggle[data-field="scrum"]');
    await toggle.click();
    await page.locator('#import-textarea').fill(JSON.stringify(source));
    await page.locator('.js-import-without-mapping').click(); await page.waitForURL(/\/b\//);
    const omitted = page.url().match(/\/b\/([^/]+)/)[1]; ids.push(omitted);
    expect(db.find('cards', { boardId: omitted }).every(card => !card.scrum?.issueType)).toBe(true);
    expect(db.find('lists', { boardId: omitted }).every(list => !list.scrum?.category)).toBe(true);
  } finally { for (const id of ids) db.cleanup({ boardIds: [id] }); }
});

test('invalid Jira issue types and conflicting categories fail before board creation', async ({ loggedInPage: page }) => {
  for (const issues of [
    [{ fields: { issuetype: { name: 42 } } }],
    ['new', 'done'].map(key => ({ fields: { status: { name: 'Same', statusCategory: { key } } } })),
  ]) {
    const source = { board: { name: `Invalid Scrum ${db.uniqueSuffix()}` }, issues };
    const error = await page.evaluate(async input => {
      try { await Meteor.callAsync('importBoard', input, {}, 'jira'); return null; }
      catch (error) { return error.error; }
    }, source);
    expect(error).toBe('invalid-jira-scrum');
    expect(db.find('boards', { title: source.board.name })).toHaveLength(0);
  }
});
