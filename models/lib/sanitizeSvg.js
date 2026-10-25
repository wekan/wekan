import { Meteor } from 'meteor/meteor';
import fs from 'fs';

// SVG sanitization for uploaded files.
//
// SVG is XML and can carry active content: <script> elements, inline event
// handlers (onload=, onclick=, ...), javascript:/vbscript: URIs, HTML embedded
// via <foreignObject>/<iframe>/<object>/<embed>, and XML DOCTYPE/ENTITY
// declarations that enable entity-expansion ("billion laughs" / XML loop) and
// external-entity (XXE) attacks.
//
// Rather than rejecting such files we strip the dangerous constructs so the
// image still uploads but cannot execute script or expand entities.
//
// The work is done by models/lib/svgSanitizer.js, a streaming tokenizer: any
// size, in one pass, with bounded memory, and nothing split across two chunks
// escapes it. It replaced a set of regular expressions over the whole text,
// which read a file into memory, missed an entity-encoded scheme such as
// `&#106;avascript:`, and saw nothing in a UTF-16 file.

const { sanitizeSvgString, createSvgSanitizeStream } = require('./svgSanitizer');

export function sanitizeSvgContent(svg) {
  return sanitizeSvgString(svg);
}

// Returns true when a file looks like an SVG (by MIME type or .svg extension).
export function isSvgFile(mimeType, fileName) {
  const mime = (mimeType || '').toLowerCase();
  if (mime === 'image/svg+xml' || mime === 'image/svg') {
    return true;
  }
  return /\.svg$/i.test(fileName || '');
}

// Sanitize an SVG file in place, streaming - any size. Resolves with the new
// byte size when active content was removed (the file is then rewritten), or
// null when it was clean or could not be processed.
export async function sanitizeSvgFile(filePath) {
  if (!Meteor.isServer || !filePath) return null;
  const { pipeline } = require('stream/promises');
  const tmp = `${filePath}.sanitizing-${process.pid}-${Date.now()}`;
  try {
    const sanitizer = createSvgSanitizeStream();
    await pipeline(fs.createReadStream(filePath), sanitizer, fs.createWriteStream(tmp));
    if (!sanitizer.changed) {
      await fs.promises.unlink(tmp).catch(() => {});
      return null;
    }
    await fs.promises.rename(tmp, filePath);
    return (await fs.promises.stat(filePath)).size;
  } catch (error) {
    await fs.promises.unlink(tmp).catch(() => {});
    console.error('[sanitizeSvgFile] failed to sanitize', filePath, error);
    return null;
  }
}

// Whether an SVG file has no active content, streaming - any size. A file that
// cannot be read is not clean.
export async function svgFileIsClean(filePath) {
  try {
    const { pipeline } = require('stream/promises');
    const { Writable } = require('stream');
    const sanitizer = createSvgSanitizeStream();
    await pipeline(fs.createReadStream(filePath), sanitizer, new Writable({ write(chunk, enc, cb) { cb(); } }));
    return !sanitizer.changed;
  } catch (error) {
    return false;
  }
}
