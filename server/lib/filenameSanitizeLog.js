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

// Sanitizing a filename is routine - names get trimmed, unicode gets normalised,
// an extension gets corrected - and routine is not worth an admin's attention.
// What IS worth it is a name that carried an EXPLOIT: markup, a shell
// metacharacter, a path trying to leave its directory. Those reasons, and only
// those, also trip a canary, so the Security report separates "somebody uploaded
// a file with an awkward name" from "somebody is probing the upload path"
// (docs/Security/Remediation/WeKan.md §12.6).
//
// "URL-encoded name" is not one of them. Browsers and older WeKan percent-encode
// any non-ASCII name, so every Cyrillic, Chinese or Finnish filename had it, and
// opening a board of 2019 photos tripped "uploaded a filename carrying an exploit
// pattern". What an encoding could hide is found anyway: the exploit, path
// traversal, null-byte and invisible-character reasons are worked out from the
// DECODED name (models/lib/uploadFileName.js sanitizationReasons).
const DANGEROUS_REASON = /^exploit: |traversal|null byte|invisible characters/i;

// The canary is about somebody probing the UPLOAD path now. A name repaired
// while a file is read (source 'fileRead') was uploaded years ago - the
// repair is recorded, but it is not an attempt, and the reader did nothing.
const NOT_AN_UPLOAD = new Set(['fileRead']);

function canaryForReasons(reasons, fileObj, source) {
  try {
    if (NOT_AN_UPLOAD.has(source)) return;
    const list = Array.isArray(reasons) ? reasons : [];
    const dangerous = list.filter(r => typeof r === 'string' && DANGEROUS_REASON.test(r));
    if (!dangerous.length) return;

    const traversal = dangerous.some(r => /traversal/i.test(r));
    const { tripCanary } = require('/server/lib/canary');
    tripCanary(traversal ? 'sanitize.path-traversal' : 'sanitize.dangerous-filename', {
      userId: (fileObj && (fileObj.userId || (fileObj.meta && fileObj.meta.userId))) || undefined,
      // The REASONS, which are a short fixed vocabulary - never the filename,
      // which is the attacker's own text.
      detail: dangerous.slice(0, 4).join(', '),
    });
  } catch (e) { /* a canary must never break an upload */ }
}

// Record that a stored filename was sanitized. `reasons` is the array from
// uploadFileName.sanitizationReasons(); `fileObj` supplies the uploader + location.
async function logFilenameSanitized({ fileObj, source, reasons, from, to }) {
  try {
    canaryForReasons(reasons, fileObj, source);
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

module.exports = { canaryForReasons, DANGEROUS_REASON, logFilenameSanitized, logContentSanitized };
