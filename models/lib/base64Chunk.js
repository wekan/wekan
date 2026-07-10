'use strict';

// Pure, Meteor-free helper for streaming an attachment's bytes into the JSON
// board export as base64 WITHOUT buffering the whole file. Used by
// Exporter.buildStream (models/exporter.js) and unit-tested in
// tests/base64Chunk.test.cjs.
//
// base64 encodes 3 bytes -> 4 chars, so a stream can only be emitted in
// 3-byte-aligned pieces; the trailing 0-2 bytes are carried over to the next
// chunk (or flushed at the end, where they produce the '=' padding). Emitting
// aligned pieces and concatenating them yields exactly the same string as
// base64-encoding the whole buffer at once.
//
// Node Buffers only — the caller feeds fs.read chunks and holds `leftover`.

// Encode the largest 3-byte-aligned prefix of (leftover + chunk); return the
// base64 `piece` and the new `leftover` (0-2 bytes) to carry to the next call.
function encodeAligned(leftover, chunk) {
  const buf = leftover && leftover.length ? Buffer.concat([leftover, chunk]) : chunk;
  const usable = buf.length - (buf.length % 3);
  return {
    piece: usable ? buf.subarray(0, usable).toString('base64') : '',
    leftover: buf.subarray(usable),
  };
}

// Encode the final carried-over bytes (0-2), producing the padded tail.
function encodeFinal(leftover) {
  return leftover && leftover.length ? leftover.toString('base64') : '';
}

module.exports = { encodeAligned, encodeFinal };
