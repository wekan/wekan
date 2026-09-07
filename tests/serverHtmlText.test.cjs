'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { parseDocument } = require('htmlparser2');

const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'server/lib/serverHtmlText.js');
const source = fs.readFileSync(filename, 'utf8')
  .replace("import { parseDocument } from 'htmlparser2';", '')
  .replace('export function serverHtmlToPlainText', 'function serverHtmlToPlainText')
  .concat('\nmodule.exports = { serverHtmlToPlainText };\n');
const moduleRecord = { exports: {} };
vm.runInNewContext(`(function(module, exports, parseDocument) {${source}\n})`, {
})(moduleRecord, moduleRecord.exports, parseDocument);
const { serverHtmlToPlainText } = moduleRecord.exports;

test('server HTML sanitizer keeps visible text and drops active nodes', () => {
  assert.equal(serverHtmlToPlainText(
    '<b>safe</b><img src=x onerror=alert(1)><script>alert(2)</script><style>x{}</style>',
  ), 'safe');
});

test('server HTML sanitizer never decodes encoded markup into active markup', () => {
  assert.equal(serverHtmlToPlainText('&lt;img src=x onerror=alert(1)&gt;'),
    '&lt;img src=x onerror=alert(1)&gt;');
});

test('server input sanitizer has a DOM-less parser fallback', () => {
  const sanitizer = fs.readFileSync(path.join(root, 'server/lib/inputSanitizer.js'), 'utf8');
  assert.match(sanitizer, /typeof DOMPurify\?\.sanitize === 'function'/);
  assert.match(sanitizer, /serverHtmlToPlainText\(input\)/);
});

