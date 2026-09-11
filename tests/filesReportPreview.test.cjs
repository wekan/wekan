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

test('the Files report offers no per-attachment delete (History.md §12.3)', () => {
  const reports = read('client/components/settings/adminProblems.js');
  const jade = read('client/components/settings/tablePage.jade');
  const table = read('client/components/settings/tablePage.js');
  const server = read('server/attachmentApi.js');
  // The button, its handler, its method and the flag that used to show it are
  // all gone: the only way an attachment is ever removed is deleting an
  // archived board with the permanent-delete setting enabled.
  assert.doesNotMatch(jade, /js-table-page-attachment-delete/);
  assert.doesNotMatch(table, /permanentlyDeleteAttachmentFromFilesReport/);
  assert.doesNotMatch(server, /async permanentlyDeleteAttachmentFromFilesReport\(/);
  assert.doesNotMatch(server, /await Attachments\.removeAsync\(/);
  assert.doesNotMatch(reports, /canPermanentlyDelete:/);
  // The pane says so, in the description the Files report shows.
  const tables = reports.slice(reports.indexOf('const REPORT_TABLES = {'));
  const files = tables.slice(tables.indexOf("'report-files':"),
    tables.indexOf("'report-rules':"));
  assert.match(files, /additionalDesc: FILES_REPORT_DELETE_DESCRIPTION/);
  assert.match(reports, /Attachments are never deleted one at a time/);
  // The board purge keeps its Recovery description; it no longer claims a
  // file-deletion record it cannot write.
  assert.doesNotMatch(reports,
    /PERMANENT_DELETE_RECOVERY_DESCRIPTION =[^;]*file deletion records/);
});

console.log(`\nfilesReportPreview: ${passed} tests passed`);
