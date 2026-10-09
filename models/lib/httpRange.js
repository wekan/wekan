'use strict';

// #6745: HTTP Range requests (RFC 9110 §14) for attachment downloads. Pure, so
// tests/attachmentRangeStreaming.test.cjs runs it without a server.
//
// Without Range support a browser that plays a video, or resumes a download,
// had to receive the whole file from the start each time: seeking in a 1 GB
// video re-read 1 GB from storage. With it, the server streams just the bytes
// asked for, straight from the storage backend (fs, GridFS and the cloud
// adapters all read a byte range).
//
// Only a SINGLE range is served. A multi-range request ("bytes=0-1,5-9") is
// answered with the whole file (null), which RFC 9110 allows and which avoids
// building a multipart body.

// -> { start, end } (inclusive), 'unsatisfiable', or null (serve the whole file).
function parseRange(header, size) {
  if (typeof header !== 'string' || !Number.isSafeInteger(size) || size < 0) return null;
  const match = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(header);
  if (!match) return null; // not bytes, several ranges, or malformed
  const [, first, last] = match;
  if (first === '' && last === '') return null;

  let start;
  let end;
  if (first === '') {
    // Suffix range: the last N bytes.
    const suffix = Number(last);
    if (!Number.isSafeInteger(suffix)) return null;
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(first);
    end = last === '' ? size - 1 : Number(last);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
    if (last !== '' && end < start) return null; // invalid: ignored, whole file
    if (start >= size) return 'unsatisfiable';
    end = Math.min(end, size - 1);
  }
  if (size === 0 || start >= size) return 'unsatisfiable';
  return { start, end };
}

// The headers of a 206 Partial Content answer for `range` of a `size`-byte file.
function partialContentHeaders(range, size) {
  return {
    'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
    'Content-Length': String(range.end - range.start + 1),
    'Accept-Ranges': 'bytes',
  };
}

// An If-Range precondition holds when it names the current ETag; a date (or a
// different tag) means "send the whole file". No If-Range: the range applies.
function ifRangeAllows(ifRange, etag) {
  if (ifRange === undefined || ifRange === null || ifRange === '') return true;
  return String(ifRange).trim() === etag;
}

module.exports = { parseRange, partialContentHeaders, ifRangeAllows };
