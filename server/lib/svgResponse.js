'use strict';

// SVG served as an image (card attachments, covers, the slideshow, board
// backgrounds, avatars).
//
// SVG uploads were refused, and every SVG served as a download, after
// JVN#74210258 (stored XSS). Uploaded SVG is sanitized now
// (models/lib/sanitizeUploadedFile.js) - no script, no event handler, no
// javascript: URI, no foreignObject, no DOCTYPE/ENTITY XML loop - so it is
// allowed again, and shown as an image. What makes that safe is here, on every
// route that serves one:
//
//   1. the WHOLE file is sanitized again on its way out, whatever is stored -
//      an SVG uploaded before the upload-time sanitizer, or one in storage some
//      other way, is cleaned as it is sent. It is streamed through the
//      tokenizer of models/lib/svgSanitizer.js, so an SVG of any size is shown
//      sanitized, with bounded memory: there is no size above which it falls
//      back to an unsanitized download, as there was when it was read whole;
//   2. it is sent with a Content-Security-Policy that allows no script, no
//      plugin, no network fetch and no framing, and `sandbox`, so even opened
//      directly as a page it cannot run anything - an <img> or a CSS background
//      never runs script in an SVG in the first place;
//   3. a range request gets the whole file: the sanitized body is not the stored
//      one, and a byte range of the stored file would cut the image wrongly.

const SVG_INLINE_HEADERS = Object.freeze({
  'Content-Type': 'image/svg+xml',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; sandbox",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

function isSvg(type, name) {
  const t = String(type || '').split(';', 1)[0].trim().toLowerCase();
  const n = String(name || '').split(/[?#]/, 1)[0].toLowerCase();
  return t === 'image/svg+xml' || n.endsWith('.svg');
}

// The sanitized SVG of a whole buffer and whether sanitizing changed it - for
// a caller that already holds the bytes.
function sanitizedSvg(buffer) {
  const { sanitizeSvgString } = require('/models/lib/svgSanitizer');
  const { content, changed, removed } = sanitizeSvgString(buffer.toString('latin1'));
  return { body: Buffer.from(content, 'latin1'), changed: Boolean(changed), removed };
}

// Sends the SVG in readStream, sanitized, streaming. `res` is a Node response.
// Inline, unless `download` - a download is sanitized too, so a saved file
// opened from the disk runs nothing either. `onSanitized(removedText)` is told,
// once the whole file has passed, when the stored file had active content; it
// gets a sample of what was removed. Resolves true when sent.
//
// There is no Content-Length: the length is known only at the end. A stream
// error after the headers were sent ends the response, cut short - which a
// browser shows as a broken image, never as the unsanitized remainder.
// No SVG is too large to sanitize, so none falls back to a download.
async function sendInlineSvg(res, readStream, { download = false, fileName = '', onSanitized } = {}) {
  const { createSvgSanitizeStream } = require('/models/lib/svgSanitizer');
  const { pipeline } = require('stream/promises');
  const sanitizer = createSvgSanitizeStream();

  for (const header of ['Content-Range', 'Accept-Ranges', 'Content-Disposition', 'Content-Length']) res.removeHeader(header);
  for (const [name, value] of Object.entries(SVG_INLINE_HEADERS)) res.setHeader(name, value);
  if (download) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(fileName).replace(/[^\x20-\x7E]|["\\]/g, '_') || 'image.svg'}"`);
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }
  res.statusCode = 200;

  try {
    await pipeline(readStream, sanitizer, res);
  } catch (error) {
    if (!res.headersSent) { res.statusCode = 500; res.end('Error reading file'); } else if (!res.writableEnded) res.end();
    return false;
  }
  if (sanitizer.changed && typeof onSanitized === 'function') {
    try { onSanitized(sanitizer.removed); } catch (e) { /* logging must never break serving */ }
  }
  return true;
}

module.exports = { SVG_INLINE_HEADERS, isSvg, sanitizedSvg, sendInlineSvg };
