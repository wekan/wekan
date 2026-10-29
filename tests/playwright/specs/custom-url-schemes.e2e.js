'use strict';
// #3218: custom URL schemes in card text are clickable only when the
// administrator lists them, and javascript: never is.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const CardPage = require('../pages/CardPage');

const TEXT = [
  'Links:', '', 'thunderlink://message-1', '', '[mail](thunderlink://message-2)', '',
  'onenote:section-1', '', '[bad](javascript:alert(1))', '',
  '<a href="thunderlink://raw-3">raw</a>', '', 'https://wekan.fi',
].join('\n');

test('only listed custom schemes become links', async ({ boardPage: page, board }) => {
  const setting = db.findOne('settings', {});
  const previous = setting.automaticLinkedUrlSchemes;
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description: TEXT } });
  const hrefs = viewer => viewer.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')));
  try {
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: '' } });
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    const viewer = page.locator('.card-details .viewer', { hasText: 'Links:' }).first();
    await expect(viewer).toContainText('thunderlink://message-1');
    // Off by default: only the web link.
    await expect.poll(() => hrefs(viewer)).toEqual(['https://wekan.fi']);

    // Listed, the scheme links everywhere it appears - bare, markdown and raw
    // HTML; onenote was not listed, and javascript: never links.
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: 'thunderlink\njavascript' } });
    await expect.poll(() => hrefs(viewer)).toEqual([
      'thunderlink://message-1', 'thunderlink://message-2', 'thunderlink://raw-3', 'https://wekan.fi']);
    await expect(viewer).toContainText('onenote:section-1');
    await expect(viewer.locator('a', { hasText: 'bad' })).toHaveCount(0);
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: previous || '' } });
  }
});

// Operating-system handlers with a code-execution history (Follina's ms-msdt:,
// search-ms:, the 2026 Edge full chain's telnet:) never link, even when an
// administrator lists them, and writing a link to one shows in Admin Panel ->
// Problems as HandlerLink, with who wrote it.
test('OS handlers never link even when listed, and a link to one is shown in Problems', async ({ boardPage: page, board, user }) => {
  const setting = db.findOne('settings', {});
  const previous = setting.automaticLinkedUrlSchemes;
  const card = db.findOne('cards', { boardId: board.boardId });
  const handlers = [
    'Handlers:', '', '[follina](ms-msdt:/id PCWDiagnostic)', '', '<a href="search-ms:query=x">search</a>', '',
    'telnet://example.invalid', '', '[ok](thunderlink://message-4)',
  ].join('\n');
  db.updateOne('cards', { _id: card._id }, { $set: { description: handlers } });
  const hrefs = viewer => viewer.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')));
  const problems = () => db.find('eventlog', { stream: 'security', bleed: 'HandlerLink' })
    .reduce((sum, row) => sum + (row.count || 1), 0);
  try {
    db.updateOne('settings', { _id: setting._id }, { $set: {
      automaticLinkedUrlSchemes: 'ms-msdt\nsearch-ms\ntelnet\nthunderlink' } });
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
    const viewer = page.locator('.card-details .viewer', { hasText: 'Handlers:' }).first();
    // Listing them changes nothing: only thunderlink links.
    await expect.poll(() => hrefs(viewer)).toEqual(['thunderlink://message-4']);
    await expect(viewer).toContainText('telnet://example.invalid');
    await expect(viewer.locator('a', { hasText: 'follina' })).toHaveCount(0);

    // Negative: an edit that keeps a link the description already had records
    // nothing - only a link a write adds is an attempt.
    const cardPage = new CardPage(page);
    const kept = `${handlers}\n\nEdited.`;
    const before = problems();
    await cardPage.setDescription(kept);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).description).toBe(kept);
    await page.waitForTimeout(500);
    expect(problems()).toBe(before);

    // Saved with the description editor onto plain text: the text is kept as
    // written, and the attempt is recorded, naming the writer.
    db.updateOne('cards', { _id: card._id }, { $set: { description: 'Plain text.' } });
    await expect(page.locator('.card-details .viewer', { hasText: 'Plain text.' }).first()).toBeVisible();
    const written = 'Saved [run](ms-msdt:/id PCWDiagnostic /skip force)';
    await cardPage.setDescription(written);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).description).toBe(written);
    await expect.poll(problems).toBeGreaterThan(before);
    const row = db.find('eventlog', { stream: 'security', bleed: 'HandlerLink' })
      .sort((a, b) => new Date(b.at) - new Date(a.at))[0];
    expect(row.userId).toBe(user.id);
    expect(row.detail).toContain('ms-msdt');

    // Negative: the same word in a comment's prose is not an attempt.
    const after = problems();
    const prose = 'ms-msdt: that was Follina, CVE-2022-30190';
    await cardPage.addComment(prose);
    await expect.poll(() => db.findOne('card_comments', { cardId: card._id, text: prose }) ? 1 : 0).toBe(1);
    await page.waitForTimeout(500);
    expect(problems()).toBe(after);
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: { automaticLinkedUrlSchemes: previous || '' } });
  }
});
