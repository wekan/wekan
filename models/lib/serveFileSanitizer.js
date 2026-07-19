'use strict';

// Serve-time exploit sanitizer for EXISTING (already-uploaded) files.
//
// Files uploaded before the upload-time sanitizer existed may still contain
// exploits (e.g. an SVG with <script>, or an XML DOCTYPE/ENTITY "billion-laughs"
// loop). Before such a file is shown/streamed to a browser we sanitize it on the
// fly, directly from whatever storage backend it lives on (filesystem, GridFS,
// cloud), without loading whole files into RAM:
//
//   1. Sniff only the START of the stream (SNIFF_BYTES) to detect the file type
//      and whether it begins like a dangerous markup document — e.g. the start of
//      an XML-loop tag (<!DOCTYPE / <!ENTITY), an <?xml-stylesheet, an <svg with
//      active content, or a <script>.
//   2. If it does NOT look dangerous (the overwhelming common case — images, PDFs,
//      office documents, archives, ...), pass every byte through unchanged, so the
//      download stays a cheap streaming copy.
//   3. If it DOES look dangerous, buffer the (small) text document up to a cap and
//      run the shared SVG/XML sanitizer over it, emitting the cleaned bytes. Files
//      larger than the cap are streamed unchanged (an XML bomb is tiny; a huge file
//      whose head merely looked like markup is left alone rather than buffered).
//
// This module is dependency-light (only the shared sanitizeSvgContent + Node
// streams) so it can be wired into the single download choke point httpStream.js.

const { Transform } = require('stream');
const { sanitizeSvgContent } = require('./sanitizeSvg');
const { classifyExploitKinds } = require('/imports/lib/fileNameDisplay');

const SNIFF_BYTES = 8192;                    // enough to see the document start
const MAX_SANITIZE_BYTES = 8 * 1024 * 1024;  // only buffer/sanitize small text files

// True when the START of a file looks like an active/dangerous markup document that
// should be sanitized before it is served. Deliberately matches the same
// constructs the upload-time SVG/XML sanitizer removes.
function headLooksDangerous(text) {
  if (!text) return false;
  if (/<\s*(script|svg|iframe|object|embed|foreignobject|meta\b)/i.test(text)) return true;
  if (/<!doctype|<!entity|<\?xml-stylesheet/i.test(text)) return true; // XML loop / DTD
  if (/\son\w+\s*=/i.test(text)) return true;                          // inline handlers
  if (/javascript:|vbscript:/i.test(text)) return true;
  return false;
}

function safeSanitize(text) {
  try {
    const { content } = sanitizeSvgContent(text);
    return content;
  } catch (e) {
    return text; // never fail a download because sanitizing threw
  }
}

// Build a Transform stream that sanitizes a served file on the fly (see file docs).
// onSanitized(kinds) is called once, if provided, when the stream actually rewrote
// dangerous content — with the classified exploit kinds — so the caller can log it.
function createServeSanitizer(name, onSanitized) {
  let decided = false;
  let sanitizing = false;
  let overflow = false;
  let notified = false;
  let head = Buffer.alloc(0);
  let buffered = Buffer.alloc(0);

  const notify = text => {
    if (notified || typeof onSanitized !== 'function') return;
    notified = true;
    try { onSanitized(classifyExploitKinds(text)); } catch (e) { /* logging must not break the stream */ }
  };

  return new Transform({
    transform(chunk, enc, cb) {
      if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk);

      if (!decided) {
        head = Buffer.concat([head, chunk]);
        if (head.length < SNIFF_BYTES) { cb(); return; } // keep sniffing
        decided = true;
        sanitizing = headLooksDangerous(head.toString('utf8'));
        if (sanitizing) {
          buffered = head;
        } else {
          this.push(head); // release the withheld head, then stream the rest
          head = null;
        }
        cb();
        return;
      }

      if (sanitizing && !overflow) {
        buffered = Buffer.concat([buffered, chunk]);
        if (buffered.length > MAX_SANITIZE_BYTES) {
          // Too big to safely buffer — flush raw and pass the remainder through.
          overflow = true;
          this.push(buffered);
          buffered = null;
        }
        cb();
        return;
      }

      this.push(chunk);
      cb();
    },

    flush(cb) {
      if (!decided) {
        // The whole file was smaller than SNIFF_BYTES.
        const text = head ? head.toString('utf8') : '';
        if (headLooksDangerous(text)) {
          notify(text);
          this.push(Buffer.from(safeSanitize(text), 'utf8'));
        } else if (head) {
          this.push(head);
        }
        cb();
        return;
      }
      if (sanitizing && !overflow && buffered) {
        const text = buffered.toString('utf8');
        notify(text);
        this.push(Buffer.from(safeSanitize(text), 'utf8'));
      }
      cb();
    },
  });
}

module.exports = { SNIFF_BYTES, MAX_SANITIZE_BYTES, headLooksDangerous, createServeSanitizer };
