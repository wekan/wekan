'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const { safeDocumentTableHtml } = require('../models/lib/documentPreviewTable');
const { uiDocumentPage } = require('../imports/lib/uiComponentLibrary');
const { renderLegacyHtml4Page } = require('../imports/lib/legacyHtml4');

test('only generated Excel table grammar reaches raw HTML4 markup', () => {
  const safe = '<table border="1" cellspacing="0" cellpadding="4"><tr>'
    + '<td style="font-weight:bold;background-color:#AABBCC">A &amp; B</td>'
    + '<td style="text-align:right">2</td></tr></table>';
  assert.equal(safeDocumentTableHtml(safe), safe);
  for (const attack of [
    '<table border="1" cellspacing="0" cellpadding="4"><script>alert(1)</script></table>',
    '<table border="1" cellspacing="0" cellpadding="4"><tr><td style="background:url(x)">x</td></tr></table>',
    '<table border="1" cellspacing="0" cellpadding="4"><tr><td><img src=x></td></tr></table>',
    '<table><tr><td>x</td></tr></table>',
  ]) assert.equal(safeDocumentTableHtml(attack), '');
});

test('shared document-page component renders bounded data without executable markup', () => {
  const component = uiDocumentPage({
    name: 'Report <Q1>', number: 1, pageCount: 2,
    text: '<script>alert(1)</script>',
    html: '<table border="1" cellspacing="0" cellpadding="4"><tr><td>Safe</td></tr></table>',
    images: [{ number: 1, dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==' }],
  });
  const html = renderLegacyHtml4Page('/b/board/card', {
    productName: 'WeKan', authenticated: true, username: 'member',
    actionFields: () => null, translate: key => key,
    page: { heading: 'Card', columns: ['Name', 'Description'],
      rows: [{ cells: ['Preview', component] }] },
  });
  assert.match(html, /Report &lt;Q1&gt;: 1 \/ 2/);
  assert.match(html, /data:image\/gif;base64,R0lGODlhAQABAIAAAAUEBA==/);
  assert.match(html, /<table border="1" cellspacing="0" cellpadding="4">/);
  assert.doesNotMatch(html, /<script>alert/);
});

test('document page service repeats exact scope, limits, cache and page bounds', () => {
  const service = read('server/lib/legacyHtml4AttachmentResponse.js');
  const route = read('server/legacyHtml4.js');
  const pages = read('server/lib/legacyHtml4Pages.js');
  assert.match(service, /exactAuthorizedAttachment\(\{[\s\S]*?userId, boardId, cardId, attachmentId/);
  assert.match(service, /DocumentPreviews\.findOneAsync\(\{[\s\S]*?omiGifCacheKey/);
  assert.match(service, /Number\.isSafeInteger\(number\)/);
  assert.match(service, /responseBytes > 16 \* 1024 \* 1024/);
  assert.match(route, /legacyOperation === 'preview-attachment-document'/);
  assert.match(pages, /kind\.isPDF \|\| kind\.isOffice/);
  assert.match(pages, /documentPage: preview\.number - 1/);
  assert.match(pages, /documentPage: preview\.number \+ 1/);
});
