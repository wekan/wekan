import { Meteor } from 'meteor/meteor';
import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

let asyncExecFile;
let asyncExec;

if (Meteor.isServer) {
  asyncExecFile = promisify(execFile);
  // Shell-based exec, used only for the admin-configured external scanner
  // command line below (which intentionally contains an arbitrary command and
  // a {file} placeholder). MIME detection uses asyncExecFile to avoid any shell.
  asyncExec = promisify(exec);
}

// POSIX-safe shell quoting for a single argument.  Wraps the value in single
// quotes and escapes any embedded single quote as '\'' .  Inside single quotes
// the shell interprets no metacharacters ($ ` \ ; | & > < * ? ( ) etc.), so the
// value cannot break out of the argument or inject additional commands.  This is
// used for the file path interpolated into the admin-configured external scanner
// command line, which is executed through /bin/sh (CWE-78 shell injection).
function shellQuote(value) {
  return "'" + String(value).replace(/'/g, "'\\''") + "'";
}

// Dependency-free content sniff used as a fallback when the `file` binary is
// unavailable (GHSA-jhph-whx8-wq6p). It looks for definitive HTML / SVG / XML /
// script signatures — deliberately NOT looser event-handler heuristics — so it
// does not misfire on a genuine binary upload (e.g. a real PNG) read as text. A
// match forces the dangerous-content scan regardless of the client-supplied MIME
// type, closing the spoofed-"image/png" stored-XSS bypass. Exported for testing.
export function looksLikeDangerousMarkup(text) {
  if (!text) return false;
  if (/<\s*(script|html|svg|iframe|object|embed|foreignobject|meta\b)/i.test(text)) return true;
  if (/^\s*(<\?xml|<!doctype)/i.test(text)) return true;
  if (/<!entity/i.test(text)) return true;
  return false;
}

// Detect known "virus test" files that must be refused like real malware even
// though they are harmless. The EICAR standard antivirus test file is the
// canonical example: any real scanner flags it, so WeKan blocks it too (so an
// operator can verify upload scanning works, and so a genuine scanner downstream
// is never handed it). Matches the stable EICAR marker and its exact signature
// prefix. Exported for testing.
export function looksLikeMalwareTestFile(text) {
  if (!text) return false;
  if (text.indexOf('EICAR-STANDARD-ANTIVIRUS-TEST-FILE') !== -1) return true;
  if (/X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/.test(text)) return true;
  return false;
}

// Warn only once (per server process) that the `file` binary is unavailable, so
// operators of minimal images notice that content-based MIME detection is degraded
// without flooding the log on every upload.
let fileBinaryUnavailableWarned = false;

async function detectMimeFromFile(filePath) {
  if (!Meteor.isServer) return undefined;

  try {
    // Use execFile instead of exec so no shell is spawned and the path is
    // passed as a direct argument — this eliminates shell injection entirely.
    const { stdout } = await asyncExecFile('file', ['--mime-type', '-b', String(filePath)]);
    const mime = (stdout || '').trim().toLowerCase();
    if (!mime) return undefined;
    return { mime };
  } catch (e) {
    // The `file` command is missing (ENOENT, common on minimal Docker/Alpine
    // images) or failed. GHSA-jhph-whx8-wq6p: previously this was silent and the
    // caller then trusted the client-supplied MIME type, which let a spoofed
    // "image/png" HTML file bypass the dangerous-content check (stored XSS). We
    // now warn once, and the caller falls back to a dependency-free JS content
    // sniff instead of trusting the client type.
    if (!fileBinaryUnavailableWarned) {
      fileBinaryUnavailableWarned = true;
      console.warn(
        "fileValidation: the 'file' command is unavailable (" +
        ((e && (e.code || e.message)) || 'unknown error') +
        "); falling back to JS content sniffing. Install the 'file' package for full MIME detection.",
      );
    }
  }

  return undefined;
}

// Record an upload rejection to the Admin Panel security log (server-only,
// best-effort — never breaks validation). See docs/Security/Remediation/WeKan.md.
function logUploadBlock(key, detail) {
  try {
    require('/server/lib/securityLog').record({ key, action: 'blocked', source: 'fileValidation', detail });
  } catch (e) { /* logging must never break validation */ }
}

const { filenameLooksLikeExploit } = require('./lib/uploadFileName');

export async function isFileValid(fileObj, mimeTypesAllowed, sizeAllowed, externalCommandLine) {
  // Reject uploads whose FILENAME itself looks like an exploit: HTML/script
  // markup, an XML doctype/entity (billion-laughs), template-injection payloads,
  // php/asp tags, javascript:/data: URIs, inline event handlers, null bytes or
  // path traversal. (File CONTENT is validated separately below.)
  if (filenameLooksLikeExploit(fileObj && fileObj.name)) {
    logUploadBlock('file.name', 'rejected exploit-looking filename');
    return false;
  }
  let isValid = true;
  // Always validate uploads. The previous migration flag disabled validation and enabled XSS.
  try {
    // Helper: read up to a limit from a file as UTF-8 text
    const readTextHead = (filePath, limit = parseInt(process.env.UPLOAD_DANGEROUS_MIME_SCAN_LIMIT || '1048576')) => new Promise((resolve, reject) => {
      try {
        const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
        let data = '';
        let exceeded = false;
        stream.on('data', chunk => {
          data += chunk;
          if (data.length >= limit) {
            exceeded = true;
            stream.destroy();
          }
        });
        stream.on('error', err => reject(err));
        stream.on('close', () => {
          if (exceeded) {
            // If file exceeds scan limit, treat as unsafe
            resolve({ text: data.slice(0, limit), complete: false });
          } else {
            resolve({ text: data, complete: true });
          }
        });
      } catch (e) {
        reject(e);
      }
    });

    // Helper: quick content safety checks for HTML/SVG/XML
    const containsJsOrXmlBombs = (text) => {
      if (!text) return false;
      const t = text.toLowerCase();
      // JavaScript execution vectors
      const patterns = [
        /<script\b/i,
        /on[a-z\-]{1,20}\s*=\s*['"]/i, // event handlers
        /javascript\s*:/i,
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /<meta\s+http-equiv\s*=\s*['"]?refresh/i,
        /<foreignobject\b/i,
        /style\s*=\s*['"][^'"]*url\(\s*javascript\s*:/i,
      ];
      if (patterns.some((re) => re.test(text))) return true;
      // XML entity expansion / DTD based bombs
      if (t.includes('<!doctype') || t.includes('<!entity') || t.includes('<?xml-stylesheet')) return true;
      return false;
    };

    const checkDangerousMimeAllowance = async (mime, filePath, fileSize) => {
      // Allow only if content is scanned and clean
      const { text, complete } = await readTextHead(filePath);
      if (!complete) {
        // Too large to confidently scan
        return false;
      }
      // For JS MIME, only allow empty files
      if (mime === 'application/javascript' || mime === 'text/javascript') {
        return (text.trim().length === 0);
      }
      return !containsJsOrXmlBombs(text);
    };

    // Detect MIME type from file content when possible
    const mimeTypeResult = await detectMimeFromFile(fileObj.path);
    const detectedMime = mimeTypeResult?.mime || (fileObj.type || '').toLowerCase();
    const baseMimeType = detectedMime.split('/', 1)[0] || '';

    // Reject known virus TEST files (EICAR) — harmless but must be blocked like
    // real malware. Sniff a small head; the EICAR file is tiny.
    try {
      const { text: malwareHead } = await readTextHead(fileObj.path, 65536);
      if (looksLikeMalwareTestFile(malwareHead)) {
        console.log('Validation of uploaded file failed (known virus test file): ' + fileObj.path);
        logUploadBlock('file.malware', 'rejected known virus test file (EICAR)');
        return false;
      }
    } catch (e) {
      // Head unreadable — the checks below still apply.
    }

    // GHSA-jhph-whx8-wq6p (CWE-434): when content-based detection via the `file`
    // binary is unavailable, `detectedMime` above falls back to the CLIENT-supplied
    // fileObj.type, which an attacker can spoof to "image/png" so the dangerous-MIME
    // deny-list below is skipped and HTML+JS is stored (stored XSS). In exactly that
    // case, sniff the real bytes for markup and force the dangerous-content scan
    // when the content looks dangerous — never trusting the claimed type.
    let contentLooksDangerous = false;
    if (!mimeTypeResult) {
      try {
        const { text } = await readTextHead(fileObj.path, 65536);
        contentLooksDangerous = looksLikeDangerousMarkup(text);
      } catch (e) {
        // Head unreadable — fail closed and force the scan below.
        contentLooksDangerous = true;
      }
    }

    // Hard deny-list for obviously dangerous types which can be allowed if content is safe
    const dangerousMimes = new Set([
      'text/html',
      'application/xhtml+xml',
      'image/svg+xml',
      'text/xml',
      'application/xml',
      'application/javascript',
      'text/javascript'
    ]);
    if (dangerousMimes.has(detectedMime) || contentLooksDangerous) {
      const allowedByContentScan = await checkDangerousMimeAllowance(detectedMime, fileObj.path, fileObj.size || 0);
      if (!allowedByContentScan) {
        console.log("Validation of uploaded file failed (dangerous MIME content): file " + fileObj.path + " - mimetype " + detectedMime);
        logUploadBlock('xss.mime', 'rejected dangerous upload content (' + detectedMime + ')');
        return false;
      }
    }

    // Optional allow-list: if provided, enforce it using exact or base type match
    if (Array.isArray(mimeTypesAllowed) && mimeTypesAllowed.length) {
      isValid = mimeTypesAllowed.includes(detectedMime)
        || (baseMimeType && mimeTypesAllowed.includes(baseMimeType + '/*'))
        || mimeTypesAllowed.includes('*');

      if (!isValid) {
        console.log("Validation of uploaded file failed: file " + fileObj.path + " - mimetype " + detectedMime);
        logUploadBlock('file.mime', 'upload mime type not allowed (' + detectedMime + ')');
      }
    }

    // Size check
    if (isValid && sizeAllowed && fileObj.size > sizeAllowed) {
      console.log("Validation of uploaded file failed: file " + fileObj.path + " - size " + fileObj.size);
      logUploadBlock('file.size', 'upload over size limit (' + fileObj.size + ' > ' + sizeAllowed + ')');
      isValid = false;
    }

    // External scanner (e.g., antivirus) – expected to delete/quarantine bad files
    if (isValid && externalCommandLine) {
      // Shell-quote the file path so a malicious filename cannot inject shell
      // commands into the admin-configured scanner command line (CWE-78 RCE).
      await asyncExec(externalCommandLine.replace("{file}", shellQuote(fileObj.path)));
      isValid = fs.existsSync(fileObj.path);

      if (!isValid) {
        console.log("Validation of uploaded file failed: file " + fileObj.path + " has been deleted externally");
      }
    }

    if (isValid) {
      console.debug("Validation of uploaded file successful: file " + fileObj.path);
    }
  } catch (e) {
    console.error('Error during file validation:', e);
    isValid = false;
  }
  return isValid;
}
