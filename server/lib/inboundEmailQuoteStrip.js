'use strict';

// Strip the quoted reply text from an inbound plain-text email reply, keeping
// only what the person actually typed above it - used by
// server/routes/inboundEmail.js (#2414). Pure string function, no I/O, so it
// is unit-testable on its own (tests/inboundEmailQuoteStrip.test.cjs).
//
// Heuristic, same shape most reply-by-email systems (GitHub, Trello, mailing
// list tools) use: cut the text at the FIRST line that looks like the start
// of a quoted reply, then trim trailing whitespace. Recognized cut markers:
//   - "On ... wrote:"                      (most mail clients' quote header)
//   - a line starting with ">"              (quoted/plain-text quoting)
//   - "-----Original Message-----"          (Outlook-style)
//   - "From: ...")                          (Outlook-style header block), but
//     only when it looks like a header line (short, no other prose before it)
// A body with none of these markers is returned trimmed and otherwise intact.

const ON_WROTE_RE = /^On .{0,120} wrote:\s*$/i;
const ORIGINAL_MESSAGE_RE = /^-{2,}\s*Original Message\s*-{2,}\s*$/i;
const QUOTE_LINE_RE = /^\s*>/;
const FROM_HEADER_RE = /^From:\s*.+/i;

function stripQuotedReply(body) {
  if (typeof body !== 'string') return '';
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (
      ON_WROTE_RE.test(line) ||
      ORIGINAL_MESSAGE_RE.test(line) ||
      QUOTE_LINE_RE.test(line) ||
      FROM_HEADER_RE.test(line)
    ) {
      break;
    }
    kept.push(line);
  }
  return kept.join('\n').trim();
}

module.exports = { stripQuotedReply };
