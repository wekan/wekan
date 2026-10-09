'use strict';

// The live Trello import streams each attachment from Trello into storage as
// the creator reaches it, instead of downloading every file of the board
// first and keeping it as base64 (#6745). Run: node tests/trelloLiveStreaming.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const guard = read('server/lib/ssrfGuard.js');
// fetchSafe's stream mode keeps the byte limit, counted as the bytes flow.
assert.match(guard, /if \(options\.stream\) \{[\s\S]*?if \(streamed > maxBytes\) return done\(new Error\(`outbound response exceeds \$\{maxBytes\} bytes`\)\);/);
assert.match(guard, /resolve\(\{ status: res\.statusCode, ok: res\.statusCode >= 200 && res\.statusCode < 300, headers, body \}\);/);

const live = read('server/trelloApiImport.js');
assert.match(live, /trelloFetch\(url, \{ headers: trelloAuthHeaders\(url, key, token\), stream: true \}, \{ untrusted: true \}\)/);
assert.match(live, /creator\.attachmentStream = trelloAttachmentStreamer\(creds\.key, creds\.token\);/);
assert.match(live, /if \(res\.body && typeof res\.body\.destroy === 'function'\) res\.body\.destroy\(\);/, 'a retried stream is let go');
// Negative: no attachment is downloaded whole and kept as base64 any more.
assert.doesNotMatch(live, /inlineAttachments|downloadAttachmentBase64|att\.file = base64/);

const zip = read('server/routes/importTrelloZip.js');
assert.match(zip, /trelloAttachmentStreamer\(creds\.key, creds\.token\)/, 'the single-board .json import streams them too');
assert.match(zip, /if \(attachmentStream\) creator\.attachmentStream = attachmentStream;/);
console.log('trelloLiveStreaming: 8 checks passed');
