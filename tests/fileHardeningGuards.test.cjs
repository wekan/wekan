'use strict';

// Source-level guards for the upload/serve file-hardening wiring that cannot be
// require()d under plain Node (they pull in Meteor / ESM-only modules). These lock
// in that each requirement stays wired where it belongs.
//
// Run: node tests/fileHardeningGuards.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('fileHardeningGuards:');

check('upload rejects exploit filenames, EICAR virus test files, and corrects names', () => {
  const fv = read('models/fileValidation.js');
  assert.ok(/filenameLooksLikeExploit/.test(fv), 'exploit filename rejection');
  assert.ok(/looksLikeMalwareTestFile/.test(fv) && /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/.test(fv),
    'EICAR virus-test-file rejection');
});

check('attachments upload hook: sanitize exploits -> reject exploit name -> correct extension', () => {
  const s = read('models/attachments.server.js');
  assert.ok(/sanitizeUploadedFileExploits/.test(s), 'exploit sanitize before move');
  assert.ok(/filenameLooksLikeExploit/.test(s) && /Attachments\.removeAsync/.test(s), 'reject exploit filename');
  assert.ok(/detectStoredFileMime/.test(s) && /sanitizeUploadFileName/.test(s) && /rename\(fileObj/.test(s),
    'detect real type + correct stored name/extension');
});

check('avatars upload hook: sanitize exploits + correct extension', () => {
  const s = read('models/avatars.server.js');
  assert.ok(/sanitizeUploadedFileExploits/.test(s), 'exploit sanitize');
  assert.ok(/detectStoredFileMime/.test(s) && /sanitizeUploadFileName/.test(s) && /rename\(fileObj/.test(s),
    'correct stored name/extension');
});

check('exploit sanitize is a general function covering SVG JS + XML loops', () => {
  const s = read('models/lib/sanitizeUploadedFile.js');
  assert.ok(/sanitizeUploadedFileExploits/.test(s) && /isSvgFile/.test(s) && /sanitizeSvgFileSync/.test(s));
});

check('streaming move/copy: disk-space precheck + stop-and-remove partial on error', () => {
  const s = read('models/lib/fileStoreStrategy.js');
  assert.ok(/hasEnoughDiskSpace/.test(s), 'disk-space precheck before filesystem write');
  assert.ok(/unlink\(filePath\)/.test(s), 'moveToStorage removes partial destination on error');
  assert.ok(/unlink\(tempPath\)/.test(s), 'copyFile removes partial temp on error');
});

check('serve-time sanitizer removes exploits from existing files while streaming', () => {
  const s = read('models/lib/serveFileSanitizer.js');
  assert.ok(/headLooksDangerous/.test(s), 'sniffs the file start');
  assert.ok(/<!doctype\|<!entity/.test(s), 'detects start of an XML loop tag');
  assert.ok(/MAX_SANITIZE_BYTES/.test(s), 'bounded buffering (small text only)');
  const hs = read('models/lib/httpStream.js');
  assert.ok(/createServeSanitizer/.test(hs), 'wired into the single download choke point');
});

check('migrations fix + sanitize the filename, sanitize content, and number collisions', () => {
  const s = read('models/lib/fileStoreStrategy.js');
  // moveToStorage: content exploit sanitize + general name finalize (detect type,
  // fix extension/length, homoglyphs, numbering) saved at the destination.
  assert.ok(/sanitizeUploadedFileExploits/.test(s), 'moveToStorage sanitizes content exploits');
  assert.ok(/finalizeStoredFileName/.test(s), 'moveToStorage finalizes the name (type/ext/length/numbering)');
  // copyFile: sanitize content + name too.
  assert.ok(/copyName/.test(s) && /sanitizeUploadFileName/.test(s), 'copyFile sanitizes the copied name');
  const ft = read('models/lib/fileTypeCorrection.js');
  assert.ok(/disambiguateName/.test(ft) && /sameStoredContent/.test(ft), 'numbering for different-content same-name');
});

check('existing-file extension corrector reuses the general detector, admin-only + bounded', () => {
  const s = read('server/migrations/correctFileExtensions.js');
  assert.ok(/correctedNameForStoredFile/.test(s), 'reuses the general detector');
  assert.ok(/isAdmin/.test(s), 'admin only');
  assert.ok(/limit/.test(s) && /rename\(fileObj/.test(s), 'bounded batch + renames');
});

check('detector streams only a small header to temp and always deletes it', () => {
  const s = read('models/lib/fileTypeCorrection.js');
  assert.ok(/getReadStream/.test(s), 'reads via the storage strategy (any backend)');
  assert.ok(/HEADER_BYTES/.test(s) && /streamHeaderToTemp/.test(s), 'bounded header streaming');
  assert.ok(/execFile\('file'/.test(s), 'detects type with the file command (no shell)');
  assert.ok(/unlink\(tempPath\)/.test(s) && /finally/.test(s), 'temp file always deleted');
});

check('filename/content sanitization is logged to Admin Panel / Problems with context', () => {
  // Catalog keys for the sanitized events + EICAR malware.
  const cat = read('models/lib/securityCategories.js');
  assert.ok(/'file\.sanitize'/.test(cat) && /'file\.content'/.test(cat) && /'file\.malware'/.test(cat));
  // The logger records who (userId) + why + where (board/swimlane/list/card/org/team).
  const log = read('server/lib/filenameSanitizeLog.js');
  assert.ok(/logFilenameSanitized/.test(log) && /logContentSanitized/.test(log));
  assert.ok(/resolveFileContext/.test(log) && /action: 'sanitized'/.test(log));
  const ctx = read('server/lib/fileContext.js');
  assert.ok(/boardTitle/.test(ctx) && /swimlaneTitle/.test(ctx) && /cardTitle/.test(ctx), 'board/swimlane/card');
  assert.ok(/orgNames/.test(ctx) && /teamNames/.test(ctx) && /uploaderName/.test(ctx) && /uploadedAt/.test(ctx),
    'org/team/uploader/when');
  // Wired at every fix point: upload, migration, existing-file, and viewing.
  assert.ok(/logFilenameSanitized|logContentSanitized/.test(read('models/attachments.server.js')), 'attachment upload');
  assert.ok(/logFilenameSanitized|logContentSanitized/.test(read('models/avatars.server.js')), 'avatar upload');
  assert.ok(/logFilenameSanitized|logContentSanitized/.test(read('models/lib/fileStoreStrategy.js')), 'migration');
  assert.ok(/logFilenameSanitized/.test(read('server/migrations/correctFileExtensions.js')), 'existing-file');
  assert.ok(/logContentSanitized/.test(read('models/lib/httpStream.js')), 'viewing/serve');
  // The report shows the uploader column.
  assert.ok(/js-event-edit-user/.test(read('client/components/settings/adminReports.jade')), 'uploader column in report');
});

console.log(`\nfileHardeningGuards: ${passed} checks passed`);
