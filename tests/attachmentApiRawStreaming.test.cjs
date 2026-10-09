'use strict';

// The attachment REST API streams files when asked to, beside its base64 JSON
// form: a raw upload (the body is the file) and ?raw=1 downloads, for cards
// and for board backgrounds, never holding a file whole or as base64 (#6745).
// Run: node tests/attachmentApiRawStreaming.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const api = read('server/routes/attachmentApi.js');
const route = name => api.slice(api.indexOf(`WebApp.handlers.use('${name}'`), api.indexOf('WebApp.handlers.use(', api.indexOf(`WebApp.handlers.use('${name}'`) + 10));
let passed = 0;
const check = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

check('a raw card upload streams after the same checks, limited before and while reading', () => {
  const upload = route('/api/attachment/upload');
  const raw = upload.slice(upload.indexOf('// A raw upload'), upload.indexOf("let body = '';"));
  assert.match(raw, /if \(!\/application\\\/json\/i\.test\(String\(req\.headers\['content-type'\] \|\| ''\)\)\) \{/);
  assert.match(raw, /if \(Number\.isFinite\(declared\) && declared > effectiveApiUploadMaxBytes\) \{\s*return sendErrorResponse\(res, 413/);
  assert.match(raw, /const checked = await checkCardUploadTarget\(target, userId\);\s*if \(checked\.status\) return sendErrorResponse/);
  assert.match(raw, /addAttachmentFromStream\(limitStream\(req, effectiveApiUploadMaxBytes\),/);
  assert.ok(raw.indexOf('checkCardUploadTarget(') < raw.indexOf('addAttachmentFromStream('), 'checked before anything is written');
  assert.doesNotMatch(raw, /Buffer\.from\(|toString\('base64'\)|Buffer\.concat|body \+=/, 'negative: nothing held whole');
  // The JSON form keeps the same checks, in one place.
  assert.match(upload, /const checked = await checkCardUploadTarget\(\{ boardId, swimlaneId, listId, cardId \}, userId\);/);
});

check('the shared checks: card, board, swimlane, list, write access, attachments allowed', () => {
  const helper = api.slice(api.indexOf('async function checkCardUploadTarget'), api.indexOf('async function apiUploadStorage'));
  for (const message of ['Card not found', 'Board not found', 'Card does not belong to the specified board',
    'Swimlane ID does not match', 'List ID does not match', 'You do not have permission to modify this card',
    'Attachments are not allowed on this board']) assert.ok(helper.includes(message), message);
  assert.match(helper, /await userHasBoardWriteAccess\(board, userId\)/);
});

check('a raw background upload is board-admin gated and streams', () => {
  const upload = route('/api/attachment/upload-background');
  const raw = upload.slice(upload.indexOf('// A raw upload'), upload.indexOf("let body = '';"));
  assert.match(raw, /if \(!isAdmin\) return sendErrorResponse\(res, 403, 'Board admin required'\);/);
  assert.ok(raw.indexOf('if (!isAdmin)') < raw.indexOf('addAttachmentFromStream('));
  assert.match(raw, /await board\.setBackgroundImage\(fileRef\._id\);/);
});

check('raw downloads stream after the checks, as downloads that cannot run here', () => {
  for (const name of ['/api/attachment/download/:attachmentId', '/api/attachment/download-background/:boardId']) {
    const download = route(name);
    const rawAt = download.indexOf("req.query.raw === '1'");
    assert.ok(rawAt > 0, name);
    assert.ok(rawAt > download.indexOf('effectiveApiDownloadMaxBytes) {'), `${name}: after the size check`);
    assert.match(download, /sendRawFile\(res, readStream, attachment, effectiveApiDownloadMaxBytes\);/);
  }
  assert.ok(route('/api/attachment/download/:attachmentId').indexOf('mayReadBoardAttachment') < route('/api/attachment/download/:attachmentId').indexOf("req.query.raw === '1'"));
  assert.ok(route('/api/attachment/download-background/:boardId').indexOf('isOwnBoardBackground') < route('/api/attachment/download-background/:boardId').indexOf("req.query.raw === '1'"),
    'the BackgroundBleed check comes first');
  const send = api.slice(api.indexOf('function sendRawFile'), api.indexOf('async function userHasBoardWriteAccess'));
  assert.match(send, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(send, /'Content-Security-Policy': "default-src 'none'; sandbox"/);
  assert.match(send, /attachmentDisposition\(file\.name \|\| 'attachment'\)/);
  assert.match(send, /limitStream\(readStream, maxBytes\)/);
});

check('api.py uses the raw forms, streaming from and to disk', () => {
  const py = read('api.py');
  assert.match(py, /response = requests\.post\(upload_url, headers=headers, params=params, data=f\)/);
  assert.match(py, /requests\.get\(download_url, headers=headers, params=\{'raw': '1'\}, stream=True\)/);
  assert.match(py, /requests\.get\(url, headers=headers, params=\{'raw': '1'\}, stream=True\)/);
  assert.doesNotMatch(py, /'fileData': base64_data/, 'negative: no base64 upload left');
});

console.log(`\nattachmentApiRawStreaming: ${passed} checks passed`);
