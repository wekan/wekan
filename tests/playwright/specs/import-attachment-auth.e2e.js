'use strict';

// The import page's "Attachment files" fields (models/lib/importAttachmentAuth.js):
// the address, user and token each of Jira, Nextcloud Deck, OpenProject,
// Asana and GitLab needs, and none for a source whose export carries its files
// or names none. A Jira import with a sign-in for an address the SSRF guard
// refuses imports without the file, reports why, and the token is gone from
// the page.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

const FIELDS = {
  jira: [true, true], deck: [true, true], openproject: [true, false], asana: [false, false], gitlab: [true, false],
};

test('Attachment files: the fields each service needs', async ({ loggedInPage: page }) => {
  for (const [source, [url, username]] of Object.entries(FIELDS)) {
    await navigateInApp(page, `/import/${source}`);
    const box = page.locator('fieldset.import-attachment-auth');
    await expect(box).toBeVisible();
    await expect(box.locator('legend')).toHaveText('Attachment files');
    await expect(box.locator('.js-import-attachment-url')).toHaveCount(url ? 1 : 0);
    await expect(box.locator('.js-import-attachment-username')).toHaveCount(username ? 1 : 0);
    await expect(box.locator('.js-import-attachment-token')).toHaveAttribute('type', 'password');
  }
  // Negative: Trello and Zenkit get no such fields.
  for (const source of ['trello', 'zenkit']) {
    await navigateInApp(page, `/import/${source}`);
    await expect(page.locator('.js-import-json, #import-textarea').first()).toBeVisible();
    await expect(page.locator('fieldset.import-attachment-auth')).toHaveCount(0);
  }
});

test('Attachment files: a refused address is reported, the token is cleared', async ({ loggedInPage: page }) => {
  const name = `Jira files ${db.uniqueSuffix()}`;
  const source = { board: { name }, issues: [{ key: 'F-1', fields: { summary: 'With a file', status: { name: 'To Do' },
    attachment: [{ id: '1', filename: 'spec.pdf', content: 'http://127.0.0.1:9/rest/api/3/attachment/content/1' }] } }] };
  let boardId;
  try {
    await navigateInApp(page, '/import/jira');
    await page.locator('#import-textarea').fill(JSON.stringify(source));
    await page.locator('.js-import-attachment-url').fill('http://127.0.0.1:9');
    await page.locator('.js-import-attachment-username').fill('me@example.test');
    await page.locator('.js-import-attachment-token').fill('jira-token-e2e');
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('attachments', { 'meta.boardId': boardId })).toHaveLength(0);
    const report = db.find('recoveryEvents', { boardIds: boardId }).map(e => e.detail).join('\n');
    expect(report).toMatch(/spec\.pdf: not downloaded \(/);
    expect(report).not.toContain('jira-token-e2e');
    expect(await page.content()).not.toContain('jira-token-e2e');
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
  }
});
