'use strict';
// Leo .leo outline import through the import page, and an outline that is not
// Leo refused without creating a board (models/lib/leoOutline.js). The export
// link is covered by import-export-format-audit.e2e.js with every other format.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

const outline = `<?xml version="1.0" encoding="utf-8"?>
<leo_file xmlns:leo="http://leoeditor.com/namespaces/leo-python-editor/1.1">
<leo_header file_format="2" wekan_board="Leo audit"/>
<vnodes>
<v t="w.1"><vh>Outline list</vh>
<v t="w.2" a="M"><vh>Leo card &amp; more</vh>
<v t="w.3"><vh>Steps</vh><v t="w.4" a="M"><vh>First</vh></v><v t="w.5"><vh>Second</vh></v></v>
</v>
</v>
</vnodes>
<tnodes>
<t tx="w.2">Body line 1 &amp; a &lt; b
Body &lt;script&gt;alert(1)&lt;/script&gt;2</t>
</tnodes>
</leo_file>`;

for (const language of ['en', 'ku', 'ckb', 'tt', 'tk_TM', 'yi', 'so', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'mi', 'sm', 'fj', 'to', 'haw', 'pap', 'om', 'rw', 'rn', 'lg', 'ary', 'wa', 'wa-RR', 'ace', 'gv', 'se', 've-CC', 'rup', 'ak', 'bm', 'ee', 'wo', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'qu', 'ay', 'gn', 'ks', 'ff', 've-PP', 'vo', 'tlh', 'kl', 'iu', 'nah', 'zgh', 'tig', 'wal', 'chr']) {
const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
test(`a Leo outline imports lists, cards, bodies and checklists (${language})`, async ({ loggedInPage: page }) => {
  let boardId;
  try {
    await page.evaluate(async language => await Meteor.callAsync('setLanguage', language), language);
    await navigateInApp(page, '/import/leo');
    await expect(page.locator('label[for="import-textarea"]')).toContainText(locale['import-board-instruction-leo']);
    await page.locator('#import-textarea').fill(outline);
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.findOne('boards', { _id: boardId }).title).toBe('Leo audit');
    const cards = db.find('cards', { boardId });
    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe('Leo card & more');
    // The parsed tasks pass the shared import sanitizer: the script is removed
    // and, as for every importer, a string that carried markup comes back
    // entity-encoded (the Markdown viewer shows `&amp;` as `&`).
    expect(cards[0].description).toBe('Body line 1 &amp; a &lt; b\nBody 2');
    const list = db.findOne('lists', { _id: cards[0].listId });
    expect(list.title).toBe('Outline list');
    const checklists = db.find('checklists', { cardId: cards[0]._id });
    expect(checklists.map(c => c.title)).toEqual(['Steps']);
    const items = db.find('checklistItems', { checklistId: checklists[0]._id })
      .sort((a, b) => a.sort - b.sort).map(i => [i.title, Boolean(i.isFinished)]);
    expect(items).toEqual([['First', true], ['Second', false]]);
    await expect(page.locator('.minicard-title').first()).toContainText('Leo card & more');
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});
}

test('text that is not a Leo outline is refused without creating a board', async ({ loggedInPage: page, user }) => {
  await navigateInApp(page, '/import/leo');
  const before = db.find('boards', { 'members.userId': user.id }).length;
  const results = await page.evaluate(async () => {
    const out = [];
    for (const text of ['# Markdown\n- [ ] x', '<leo_file></leo_file>', '']) {
      try { await Meteor.callAsync('importBoard', text, {}, 'leo'); out.push('allowed'); }
      catch (error) { out.push(error.error); }
    }
    return out;
  });
  expect(results).toEqual(['invalid-import-format', 'invalid-import-format', 'invalid-import-format']);
  expect(db.find('boards', { 'members.userId': user.id })).toHaveLength(before);
});
