'use strict';

// Execute the production writer and sanitizer, mocking only database/HTTP I/O.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const sanitizerSource = read('server/lib/inputSanitizer.js');
const sanitizeInput = new Function('require', sanitizerSource
  .replace(/import (\w+) from '([^']+)';/g, 'const $1 = require("$2");')
  .replace(/export /g, '') + '\nreturn sanitizeInput;')(require);
const sanitizeTransferValue = new Function(read('models/lib/importExportBoundary.js')
  .replace(/export \{[^}]+\};/, '') + '\nreturn sanitizeTransferValue;')();
const secureTransfer = new Function('sanitizeTransferValue', 'sanitizeInput', 'require',
  read('server/lib/secureTransfer.js').replace(/^import .*;$/gm, '')
    .replace('export default secureTransfer;', '').replace(/export /g, '')
    + '\nreturn secureTransfer;')(sanitizeTransferValue, sanitizeInput,
  () => ({ record() {} }));
const source = read('models/exporter.js');
const method = source.slice(source.indexOf('  async buildStream(res) {'), source.indexOf('  async buildCsv('));
const writeWithBackpressure = new Function(source.slice(source.indexOf('export function writeWithBackpressure'),
  source.indexOf('// GHSA-4mxf')).replace('export ', '') + '\nreturn writeWithBackpressure;')();
const bytes = Buffer.from('Attachment data: ää 日本語\n'.repeat(5000));
const temp = fs.mkdtempSync(path.join(process.env.TMPDIR || path.join(root, '.tools/tmp'), 'json-export-'));
const file = path.join(temp, 'attachment.bin');
fs.writeFileSync(file, bytes);
const docs = {
  cards: [{ _id: 'card1', title: 'Roadmap', description: '<b>Meteor 3</b><script>alert(1)</script>', members: [] }],
  attachments: [{ _id: 'attachment1', meta: { cardId: 'card1' }, name: 'attachment.bin', versions: { original: { path: file } } }],
  lists: [{ _id: 'list1' }], swimlanes: [{ _id: 'swimlane1' }],
  cardComments: [{ _id: 'comment1', cardId: 'card1', text: '<img src=x onerror=alert(1)>Comment' }],
};
const raw = name => ({ find(selector) {
  const values = selector._id === '__none__' || (name === 'cards' && selector.parentId) ? [] : (docs[name] || []);
  return { async *[Symbol.asyncIterator]() { yield* structuredClone(values); } };
} });
const injected = {
  assertExportEnabled: async () => {}, Npm: { require },
  require(name) {
    if (name === '/server/lib/secureTransfer') return { secureTransfer };
    const collection = raw(name.split('/').pop());
    return { default: { rawCollection: () => collection, collection: { rawCollection: () => collection } } };
  },
  ReactiveCache: { getBoard: async () => ({ _id: 'board1', title: 'Roadmap', members: [] }) },
  getImportExportSecuritySettings: async () => ({ disableExportAvatars: true }),
  writeWithBackpressure, isReadableStoredFilePath: p => p === file,
  ...require('../models/lib/base64Chunk'),
};
const writer = new Function(...Object.keys(injected), `return { ${method} };`)(...Object.values(injected));
const routeSource = read('models/export.js');
const route = new Function('sendJsonResult', 'console', routeSource.slice(
  routeSource.indexOf('  async function streamJsonBoardExport'),
  routeSource.indexOf('  // Build a Kanboard-style')) + '\nreturn streamJsonBoardExport;')(
  (res, result) => { res.statusCode = result.code; res.end(JSON.stringify(result.data)); }, { error() {} });
function response() {
  const res = new EventEmitter();
  res.body = ''; res.headersSent = false;
  res.setHeader = () => {};
  res.write = chunk => { res.headersSent = true; res.body += chunk; return true; };
  res.end = chunk => { if (chunk) res.body += chunk; res.ended = true; };
  res.destroy = () => { res.destroyed = true; };
  return res;
}
(async () => {
  try {
    for (const excludeAttachments of [false, true]) {
      const res = response();
      const exporter = { ...writer, _boardId: 'board1', _scope: {}, _excludeAttachments: excludeAttachments,
        hasField: () => true, hasScope: () => false, _scopedCardSelector: async () => ({ boardId: 'board1' }) };
      await route(res, exporter);
      assert.equal(res.destroyed, undefined);
      assert.equal(res.ended, true);
      const board = JSON.parse(res.body);
      assert.equal(board.cards[0].description, 'Meteor 3');
      assert.equal(board.comments[0].text, 'Comment');
      for (const key of ['lists', 'swimlanes', 'customFields', 'cards', 'comments', 'activities', 'checklists', 'checklistItems', 'subtaskItems', 'rules', 'triggers', 'actions', 'users']) {
        assert.ok(Array.isArray(board[key]), key);
      }
      assert.equal(board.attachments.length, 1);
      if (excludeAttachments) assert.equal(board.attachments[0].file, undefined);
      else assert.deepEqual(Buffer.from(board.attachments[0].file, 'base64'), bytes);
      console.log('ok: complete JSON with HTML cards, attachments excluded =', excludeAttachments);
    }
    for (const partial of [false, true]) {
      const res = response();
      await route(res, { async buildStream(r) { if (partial) r.write('{"cards":['); throw new Error('read failed'); } });
      if (partial) { assert.equal(res.destroyed, true); assert.equal(res.ended, undefined); }
      else { assert.equal(res.statusCode, 500); assert.deepEqual(JSON.parse(res.body), { error: 'Export failed' }); }
      console.log('ok: export failure does not finish a successful download, partial =', partial);
    }
    assert.equal(sanitizeInput('<svg onload=alert(1)><script>alert(1)</script></svg>Safe'), 'Safe');
    assert.equal(sanitizeInput('Plain 日本語'), 'Plain 日本語');
    console.log('ok: server sanitizer removes active markup and preserves plain text');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
