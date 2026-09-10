'use strict';

// Pure decision module for GitHub issue #3274: detect a MEANINGFUL mismatch
// between the client-declared MIME type of an uploaded attachment and the
// REAL type sniffed from its content (magic bytes), so a renamed executable
// or script cannot pass itself off as an image/document by spoofing its
// extension and Content-Type.
//
// Deliberately narrow: this only flags a DANGEROUS mismatch - the sniffed
// content is executable/script-like while the declared type claims to be
// something an executable/script is not (image, document, audio, video,
// plain text/csv, archive, ...). It never flags compatible/ambiguous
// textual cases (e.g. declared text/plain, sniffed text/csv) - see
// isCompatibleTextual() below. No server, no I/O: pure functions over
// strings, so this is unit-testable without Meteor or a filesystem.

// MIME types `file-type` (magic-byte sniffing) or `file --mime-type` report
// for binaries that can run code once launched or executed by the OS/shell.
// Kept as a Set (not a prefix check) because false positives here reject a
// legitimate upload.
const EXECUTABLE_DETECTED_MIMES = new Set([
  'application/x-msdownload',      // Windows PE .exe/.dll/.scr
  'application/x-dosexec',
  'application/vnd.microsoft.portable-executable',
  'application/x-elf',             // Linux ELF binary
  'application/x-executable',
  'application/x-sharedlib',
  'application/x-mach-binary',     // macOS Mach-O
  'application/x-msi',             // Windows installer
  'application/vnd.ms-cab-compressed',
  'application/x-apple-diskimage', // .dmg
  'application/java-archive',      // executable via `java -jar`
  'application/x-java-archive',
  'application/vnd.android.package-archive', // .apk
]);

// Declared MIME categories that legitimately describe an image, document,
// audio, video, plain text or archive upload. An executable/script sniffed
// under any of these is the spoof this module exists to catch.
const NON_EXECUTABLE_DECLARED_PREFIXES = [
  'image/', 'audio/', 'video/', 'text/', 'font/',
];
const NON_EXECUTABLE_DECLARED_EXACT = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/json',
  'application/xml',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream', // generic/unspecified - not itself a spoof claim
]);

function declaredLooksNonExecutable(declaredMime) {
  const mime = String(declaredMime || '').toLowerCase().trim();
  if (!mime) return false;
  if (NON_EXECUTABLE_DECLARED_PREFIXES.some(prefix => mime.startsWith(prefix))) return true;
  return NON_EXECUTABLE_DECLARED_EXACT.has(mime);
}

// Two textual/compatible declared vs detected types are never flagged, even
// though they differ, because they carry the same (non-dangerous) risk
// profile - e.g. text/plain vs text/csv, or an unspecified octet-stream.
function isCompatibleTextual(declaredMime, detectedMime) {
  const d1 = String(declaredMime || '').toLowerCase().trim();
  const d2 = String(detectedMime || '').toLowerCase().trim();
  if (!d1 || !d2) return true; // nothing to compare - not this function's job
  if (d1.startsWith('text/') && d2.startsWith('text/')) return true;
  if (d1 === d2) return true;
  return false;
}

// Shebang-style script markers. `file-type` deliberately does not identify
// plain-text script formats (shell/batch/python/perl/...) since they have no
// binary magic bytes, so this is checked separately against a small text
// head read of the upload, mirroring the dangerous-markup sniff already used
// for HTML/SVG/XML in models/fileValidation.js.
const SCRIPT_SHEBANG_RE = /^\s*#!\s*\/(?:usr\/)?(?:bin|local\/bin)\//;
// A Windows batch/PowerShell heuristic: no shebang concept exists there, so a
// couple of unambiguous first-line markers are checked instead.
const WINDOWS_SCRIPT_HEAD_RE = /^\s*@echo\s+off\b|^\s*#requires\s+-version/i;

function looksLikeScriptHead(headText) {
  if (!headText) return false;
  const firstLine = String(headText).slice(0, 4096).split(/\r?\n/, 1)[0] || '';
  return SCRIPT_SHEBANG_RE.test(firstLine) || WINDOWS_SCRIPT_HEAD_RE.test(firstLine);
}

// The decision function. Returns { blocked, reason } and never throws.
//   declaredMime - the client-supplied Content-Type / fileObj.type
//   detectedMime - the real type sniffed from content (file-type / `file`)
//   headText     - optional small text head of the file, for the shebang check
function isDangerousUploadMismatch({ declaredMime, detectedMime, headText } = {}) {
  const detected = String(detectedMime || '').toLowerCase().trim();
  const declared = String(declaredMime || '').toLowerCase().trim();

  const detectedIsExecutable = EXECUTABLE_DETECTED_MIMES.has(detected);
  const detectedIsScript = looksLikeScriptHead(headText);

  if (!detectedIsExecutable && !detectedIsScript) {
    return { blocked: false, reason: null };
  }

  // The declared type itself already admits to being an
  // executable/script/octet-stream: no spoofing is happening, nothing to
  // reject here (the general allow-list/deny-list in fileValidation.js is
  // responsible for whether executables are allowed at all).
  if (EXECUTABLE_DETECTED_MIMES.has(declared) || declared === 'application/octet-stream' || !declared) {
    return { blocked: false, reason: null };
  }

  // isCompatibleTextual only judges the two sniffed MIME strings; a shebang
  // match with no binary-detected mime (detected === '') has nothing to
  // compare there and must fall through to the script check below instead of
  // being waved through as "compatible".
  if (detected && isCompatibleTextual(declared, detected)) {
    return { blocked: false, reason: null };
  }

  if (!declaredLooksNonExecutable(declared)) {
    // Declared type is not a recognized non-executable category either - be
    // conservative and don't guess; the allow-list handles unknown types.
    return { blocked: false, reason: null };
  }

  const detectedLabel = detectedIsExecutable ? detected : 'script (shebang)';
  return {
    blocked: true,
    reason: `declared "${declared}" but content sniffs as executable/script (${detectedLabel})`,
  };
}

module.exports = {
  EXECUTABLE_DETECTED_MIMES,
  declaredLooksNonExecutable,
  isCompatibleTextual,
  looksLikeScriptHead,
  isDangerousUploadMismatch,
};
