'use strict';

// Admin Panel / Problems / Files reuses the card attachment preview contract.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('filesReportPreview:');

test('Files Report puts preview controls in its leftmost column', () => {
  const reports = read('client/components/settings/adminProblems.js');
  const tables = reports.slice(reports.indexOf('const REPORT_TABLES = {'));
  const files = tables.slice(tables.indexOf("'report-files':"),
    tables.indexOf("'report-rules':"));
  assert.ok(files.indexOf("labelKey: 'preview'") < files.indexOf("label: 'Filename'"));
  assert.match(files, /attachmentKind\(d\)/);
  assert.match(files, /Attachments\.link\.call\(d\)/);
  assert.match(files, /name: cleanFileName\(d\.name\)/);
});

test('the shared cell has thumbnail, preview and sanitized download controls', () => {
  const jade = read('client/components/settings/tablePage.jade');
  assert.match(jade, /\.table-page-attachment/);
  assert.match(jade, /img\.table-page-attachment-thumbnail/);
  assert.match(jade, /\.js-table-page-attachment-preview/);
  assert.match(jade, /a\.js-table-page-attachment-download/);
  assert.match(jade, /download="\{\{attachment\.name\}\}"/);
});

test('preview uses the card viewer and only the displayed report page', () => {
  const table = read('client/components/settings/tablePage.js');
  const attachments = read('client/components/cards/attachments.js');
  const reports = read('client/components/settings/adminProblems.jade');
  assert.match(reports, /\+attachmentViewer/);
  assert.match(table, /openAttachmentSlideshow/);
  assert.match(table, /findAll\('\.js-table-page-attachment-preview'\)/);
  assert.doesNotMatch(table, /Attachments\.collection\.find/,
    'unpublished or unrelated Minimongo files must not enter the slideshow');
  assert.match(attachments, /export function openAttachmentSlideshow/);
  assert.match(attachments, /slideshowAttachmentIds/);
});

console.log(`\nfilesReportPreview: ${passed} tests passed`);
