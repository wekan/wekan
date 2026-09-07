'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { renderLegacyHtml4Page } = require('../imports/lib/legacyHtml4');
const { uiHistoryTable } = require('../imports/lib/uiComponentLibrary');
const {
  changeTypeKey,
  summariseChangeHistory,
} = require('../models/lib/changeHistoryPresentation');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('history presentation is shared and safely summarizes stored content', () => {
  assert.equal(changeTypeKey('moved'), 'history-change-moved');
  assert.equal(changeTypeKey('added'), 'added');
  assert.equal(summariseChangeHistory({ newContent: { value: '<b>unsafe</b>' } }),
    '<b>unsafe</b>');
  assert.equal(summariseChangeHistory({ newContent: { value: null } }), '—');
  assert.equal(summariseChangeHistory({ newContent: { deleted: true } },
    key => `translated:${key}`), 'translated:history-change-removed');
});

test('HTML4 history component is a labelled semantic table and POST form', () => {
  const history = uiHistoryTable({
    action: '/b/board/slug/card', title: 'History', canRestore: true,
    fields: { boardId: 'board', cardId: 'card', historyCardId: 'card' },
    rows: [{ _id: 'row1', change: 'Edited - Title', content: '<b>unsafe</b>',
      contributor: 'Alice', when: '2026- melt' }],
    contributors: [{ userId: 'alice', name: 'Alice', count: 1 }],
    page: 1, totalPages: 2, total: 26,
    labels: { select: 'Select', action: 'Action', details: 'Details',
      contributor: 'Contributor', date: 'Date', restore: 'Restore', next: 'Next' },
  });
  const html = renderLegacyHtml4Page('/b/board/slug/card', {
    authenticated: true, username: 'alice', translate: key => key,
    actionFields: () => ({ legacySession: 'session', legacyCounter: '1',
      legacySignature: 'signature' }),
    page: { heading: 'Card', columns: ['Card', 'Action'], rows: [{ cells: [history, ''] }] },
  });
  assert.match(html, /<table border="1"[^>]*><thead>/);
  assert.match(html, /<th scope="col">Select<\/th>/);
  assert.match(html, /name="historyRowId" type="checkbox" value="row1"/);
  assert.match(html, /name="legacyOperation" value="restore-card-history"/);
  assert.match(html, /name="legacyOperation" value="show-card-history"/);
  assert.match(html, /&lt;b&gt;unsafe&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>unsafe<\/b>/);
});

test('HTML4 restore is URL-card-bound, bounded and delegates to shared restore', () => {
  const route = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const client = read('client/components/history/historyTable.js');
  assert.match(route, /legacyOperation === 'restore-card-history'/);
  assert.match(route, /routeCard\.type === 'cardType-linkedCard'/);
  assert.match(route, /selected\.length > 200/);
  assert.match(route, /cardId: historyCardId/);
  assert.match(route, /method_handlers\['changeHistory\.restore'\]/);
  assert.match(route, /legacy-html4\.history-cross-scope/);
  assert.match(page, /method_handlers\['changeHistory\.page'\]/);
  assert.match(page, /uiHistoryTable\(/);
  assert.match(client, /summariseChangeHistory/);
});
