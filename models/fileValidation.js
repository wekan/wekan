import { Meteor } from 'meteor/meteor';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';
import FileType from 'file-type';

let asyncExec;

if (Meteor.isServer) {
  asyncExec = promisify(exec);
}

export async function isFileValid(fileObj, mimeTypesAllowed, sizeAllowed, externalCommandLine) {
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
    const mimeTypeResult = await FileType.fromFile(fileObj.path).catch(() => undefined);
    const detectedMime = mimeTypeResult?.mime || (fileObj.type || '').toLowerCase();
    const baseMimeType = detectedMime.split('/', 1)[0] || '';

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
    if (dangerousMimes.has(detectedMime)) {
      const allowedByContentScan = await checkDangerousMimeAllowance(detectedMime, fileObj.path, fileObj.size || 0);
      if (!allowedByContentScan) {
        console.log("Validation of uploaded file failed (dangerous MIME content): file " + fileObj.path + " - mimetype " + detectedMime);
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
      }
    }

    // Size check
    if (isValid && sizeAllowed && fileObj.size > sizeAllowed) {
      console.log("Validation of uploaded file failed: file " + fileObj.path + " - size " + fileObj.size);
      isValid = false;
    }

    // External scanner (e.g., antivirus) – expected to delete/quarantine bad files
    if (isValid && externalCommandLine) {
      await asyncExec(externalCommandLine.replace("{file}", '"' + fileObj.path + '"'));
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
