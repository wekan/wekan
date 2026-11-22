'use strict';
// A fake attachment server for the slideshow's windowed viewers: 206 Partial
// Content for a Range request, as server/routes/universalFileServer.js
// answers (#6745), or - ignoreRange - the whole file as a stream, as it
// answers for a legacy CollectionFS attachment. log counts the requests and
// the bytes sent, so a test can show only the window was read.

function rangeServer(bytes, { ignoreRange = false, status = 200 } = {}) {
  const log = { requests: 0, sent: 0, ranges: [] };
  const fetchImpl = async (url, { headers = {} } = {}) => {
    log.requests += 1;
    if (status !== 200) return new Response('', { status });
    const m = /^bytes=(\d+)-(\d+)$/.exec(headers.Range || '');
    if (m && !ignoreRange) {
      const a = Number(m[1]);
      const b = Math.min(bytes.length - 1, Number(m[2]));
      log.ranges.push([a, b]);
      log.sent += b - a + 1;
      return new Response(bytes.slice(a, b + 1), { status: 206,
        headers: { 'Content-Range': `bytes ${a}-${b}/${bytes.length}` } });
    }
    let at = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (at >= bytes.length) { controller.close(); return; }
        const piece = bytes.slice(at, at + 65536);
        at += piece.length;
        log.sent += piece.length;
        controller.enqueue(piece);
      },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Length': String(bytes.length) } });
  };
  return { fetchImpl, log };
}

module.exports = { rangeServer };
