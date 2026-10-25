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
//   1. the WHOLE file is sanitized again before it is sent, whatever is stored -
//      an SVG uploaded before the upload-time sanitizer, or one in storage some
//      other way, is cleaned on the way out. The stream sanitizer of
//      serveFileSanitizer.js decides from the first bytes and lets a large file
//      through untouched; that is not enough for a file served inline, so an SVG
//      is read whole, up to SVG_INLINE_MAX_BYTES, and a larger one stays a
//      download, as before;
//   2. it is sent with a Content-Security-Policy that allows no script, no
//      plugin, no network fetch and no framing, and `sandbox`, so even opened
//      directly as a page it cannot run anything - an <img> or a CSS background
//      never runs script in an SVG in the first place;
//   3. a range request gets the whole file: the sanitized body is not the stored
//      one, and a byte range of the stored file would cut the image wrongly.

const SVG_INLINE_MAX_BYTES = 8 * 1024 * 1024;

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

// Reads the stream up to `max` bytes. Returns { buffer } when it ended within
// it, or { buffer, overflow: true } with what was read so far, the stream
// paused at the point where it stopped.
function readCapped(stream, max = SVG_INLINE_MAX_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = chunk => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buf);
      size += buf.length;
      if (size > max) {
        stream.pause();
        cleanup();
        resolve({ buffer: Buffer.concat(chunks), overflow: true });
      }
    };
    const onEnd = () => { cleanup(); resolve({ buffer: Buffer.concat(chunks), overflow: false }); };
    const onError = error => { cleanup(); reject(error); };
    function cleanup() {
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('error', onError);
    }
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
  });
}

// The sanitized SVG and whether sanitizing changed it.
function sanitizedSvg(buffer) {
  const { sanitizeSvgContent } = require('/models/lib/sanitizeSvg');
  const original = buffer.toString('utf8');
  const { content, changed } = sanitizeSvgContent(original);
  return { body: Buffer.from(content, 'utf8'), changed: Boolean(changed) };
}

// Sends the SVG in readStream, sanitized. `res` is a Node response. Inline,
// unless `download` - a download is sanitized too, so a saved file opened from
// the disk runs nothing either. `downloadHeaders(res)` sets the forced-download
// headers a file too large to sanitize keeps; `onSanitized(originalText)` is told
// when the stored file had active content. Resolves true when sent sanitized.
async function sendInlineSvg(res, readStream, { download = false, fileName = '', downloadHeaders, onSanitized } = {}) {
  let read;
  try {
    read = await readCapped(readStream);
  } catch (error) {
    if (!res.headersSent) { res.statusCode = 500; res.end('Error reading file'); }
    return false;
  }

  if (read.overflow) {
    // Too large to sanitize whole: a download, under a sandbox, as before.
    res.removeHeader('Content-Length');
    if (typeof downloadHeaders === 'function') downloadHeaders(res);
    res.statusCode = 200;
    res.write(read.buffer);
    readStream.on('error', () => res.end());
    readStream.pipe(res);
    readStream.resume();
    return false;
  }

  const { body, changed } = sanitizedSvg(read.buffer);
  if (changed && typeof onSanitized === 'function') {
    try { onSanitized(read.buffer.toString('utf8')); } catch (e) { /* logging must never break serving */ }
  }

  for (const header of ['Content-Range', 'Accept-Ranges', 'Content-Disposition']) res.removeHeader(header);
  for (const [name, value] of Object.entries(SVG_INLINE_HEADERS)) res.setHeader(name, value);
  if (download) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(fileName).replace(/[^\x20-\x7E]|["\\]/g, '_') || 'image.svg'}"`);
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }
  res.setHeader('Content-Length', String(body.length));
  res.statusCode = 200;
  res.end(body);
  return true;
}

module.exports = { SVG_INLINE_MAX_BYTES, SVG_INLINE_HEADERS, isSvg, readCapped, sanitizedSvg, sendInlineSvg };
