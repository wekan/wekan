'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const service = read('server/lib/attachmentsReport.js');
const publication = read('server/publications/attachments.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const response = read('server/lib/legacyHtml4AttachmentResponse.js');
const deletion = read('server/lib/permanentAttachmentDelete.js');
let run = 0;
let failed = 0;
function test(name, fn) {
  run += 1;
  try { fn(); process.stdout.write(`PASS ${name}\n`); }
  catch (error) {
    failed += 1;
    process.stderr.write(`FAIL ${name}: ${error.message}\n`);
  }
}

test('HTML5 and HTML4 share one bounded plain-collection report service', () => {
  assert.match(service,
    /export async function attachmentsReportForAdmin\(userId, options = \{\}\)/);
  assert.match(service, /await requireAdmin\(userId\)/);
  assert.match(service, /slice\(0, 500\)/);
  assert.match(service, /Attachments\.collection\.find\(/);
  assert.match(service, /sort: \{ name: 1 \}/);
  assert.match(publication, /attachmentsReportForAdmin\(this\.userId,/);
  assert.match(pages, /attachmentsReportForAdmin\(userId,/);
});

test('HTML4 retains seven columns and common preview/download components', () => {
  assert.match(pages, /path !== '\/admin\/problems\/files'/);
  for (const label of ['Filename', 'Size (kB)', 'MIME Type', 'Attachment ID',
    'Board ID', 'Card ID']) assert.ok(pages.includes(`'${label}'`), label);
  assert.match(pages, /uiAttachment\(\{/);
  assert.match(pages, /preview-admin-attachment-gif/);
  assert.match(pages, /download-admin-attachment-original/);
  assert.match(response, /adminOnly = false/);
  assert.match(response, /if \(adminOnly\)[\s\S]*user\?\.isAdmin/);
  assert.match(route, /adminOnly: true/);
});

test('permanent delete stays hidden by setting and shares audited service', () => {
  assert.match(pages, /getFeatureFlags\(\)\.enablePermanentDelete === true/);
  assert.match(pages, /if \(permanentDelete\) actions\.push/);
  assert.match(pages, /attachmentId: attachment\._id, q: search, page/);
  assert.match(route, /confirm-permanently-delete-admin-attachment/);
  assert.match(route, /permanently-delete-admin-attachment/);
  assert.match(deletion,
    /user\?\.isAdmin !== true[\s\S]{0,20}\|\| !getFeatureFlags\(\)\.enablePermanentDelete/);
  assert.match(deletion, /await Attachments\.removeAsync\(attachmentId\)/);
  assert.match(deletion,
    /ATTACHMENT_PERMANENTLY_DELETED[\s\S]*done: true, deletedData: true/);
  assert.match(deletion,
    /catch \(error\)[\s\S]*ATTACHMENT_PERMANENTLY_DELETED[\s\S]*done: false/);
  assert.match(pages,
    /Recovery logs setting changes and every successful, failed, or unauthorized permanent-delete attempt/);
});

test('search, paging and refusal are explicit', () => {
  assert.match(pages, /uiSearchForm\(\{/);
  assert.match(pages, /fields: \{ q: search, page: page [+-] 1 \}/);
  assert.match(pages, /error\?\.error !== 'not-authorized'/);
  assert.match(route, /authz\.legacy-html4-admin-attachment/);
});

process.stdout.write(`${run} run, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
