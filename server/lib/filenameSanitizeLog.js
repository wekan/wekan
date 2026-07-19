'use strict';

// Log filename / file-content SANITIZATION events (not just blocks) to the Admin
// Panel → Problems → Security stream, so an admin can see EVERY time a filename or
// file required sanitization, FOR WHAT REASON (which exploit kind, wrong file type,
// typosquatting, too long, …), WHO originally uploaded it, WHEN, and WHERE it was
// uploaded (board › swimlane › list › card, organization and team).
//
// These are the `action:'sanitized'` companions to the `action:'blocked'` events
// already recorded by models/fileValidation.js. The uploader is stored as `userId`
// (shown, clickable, in the report) and the full context is appended to `detail`.
// Best-effort and server-only: never throws into the upload/migration/view path.

const { resolveFileContext, formatFileContext } = require('/server/lib/fileContext');

function record(evt) {
  try {
    require('/server/lib/securityLog').record(evt);
  } catch (e) { /* logging must never break the caller */ }
}

// Record that a stored filename was sanitized. `reasons` is the array from
// uploadFileName.sanitizationReasons(); `fileObj` supplies the uploader + location.
async function logFilenameSanitized({ fileObj, source, reasons, from, to }) {
  try {
    const why = Array.isArray(reasons) && reasons.length ? reasons.join('; ') : 'normalized';
    let context = '';
    try { context = formatFileContext(await resolveFileContext(fileObj)); } catch (e) { /* omit */ }
    record({
      key: 'file.sanitize',
      action: 'sanitized',
      source: source || 'fileUpload',
      userId: (fileObj && fileObj.userId) || undefined,
      detail: `${why}: "${from}" → "${to}"${context ? ' | ' + context : ''}`,
    });
  } catch (e) { /* never throw */ }
}

// Record that exploits were removed from a file's CONTENT (e.g. JavaScript / XML
// loop stripped from an SVG). `kinds` is the array from classifyExploitKinds().
async function logContentSanitized({ fileObj, source, kinds }) {
  try {
    const what = Array.isArray(kinds) && kinds.length ? kinds.join(', ') : 'active content (JavaScript / XML)';
    const name = (fileObj && fileObj.name) || '';
    let context = '';
    try { context = formatFileContext(await resolveFileContext(fileObj)); } catch (e) { /* omit */ }
    record({
      key: 'file.content',
      action: 'sanitized',
      source: source || 'fileUpload',
      userId: (fileObj && fileObj.userId) || undefined,
      detail: `removed ${what} from file content "${name}"${context ? ' | ' + context : ''}`,
    });
  } catch (e) { /* never throw */ }
}

module.exports = { logFilenameSanitized, logContentSanitized };
