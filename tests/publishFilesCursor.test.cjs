'use strict';

// Attachments and Avatars are ostrio:files FilesCollections. Their find() - and
// ReactiveCache.getAttachments()/getAvatars() with getQuery = true - is a
// FilesCursor, and a publication that returns one fails every subscription:
//
//   Exception from sub notificationAttachments id ... Error: Publish function
//   can only return a Cursor or an array of Cursors
//
// The Mongo cursor a publication can return is the FilesCursor's `.cursor`.
// notificationAttachments returned the FilesCursor itself, so the notifications
// drawer never received the attachments its activities name.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '_build', '.build', '.tools', '.meteor', 'tests', '.git', 'client']);

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('_build')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// The argument text of a call starting at `open` (the index of its "(").
function callArgs(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')' && --depth === 0) return { text: source.slice(open + 1, i), end: i + 1 };
  }
  return null;
}

test('a FilesCollection query asked for as a cursor is published as its .cursor', () => {
  const offenders = [];
  let queries = 0;
  for (const file of sourceFiles(root)) {
    const source = fs.readFileSync(file, 'utf8');
    // Only what is published: a helper elsewhere may use the FilesCursor on
    // purpose (Cards.attachments() calls its .each()).
    if (!/Meteor\.publish\(|publishComposite\(/.test(source)) continue;
    const re = /ReactiveCache\.get(Attachments|Avatars)\(/g;
    let m;
    while ((m = re.exec(source))) {
      const call = callArgs(source, m.index + m[0].length - 1);
      if (!call || !/,\s*true\s*,?\s*$/.test(call.text)) continue; // fetched: an array
      queries++;
      // The FilesCursor is unwrapped either on the call itself,
      // `(await ReactiveCache.getAttachments(..., true)).cursor`, or through the
      // variable it was assigned to, `result.cursor`.
      const after = source.slice(call.end, call.end + 12);
      const before = source.slice(Math.max(0, m.index - 120), m.index);
      const assigned = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?$/.exec(before);
      const unwrapped = /^\)?\.cursor/.test(after)
        || (assigned && new RegExp(`\\b${assigned[1]}\\.cursor\\b`).test(source.slice(call.end, call.end + 1500)));
      if (!unwrapped) offenders.push(`${path.relative(root, file)}:${source.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.ok(queries >= 8, `found the cursor queries (${queries})`);
  assert.deepEqual(offenders, []);
});

test('notificationAttachments publishes the Mongo cursor, not the FilesCursor', async () => {
  const source = fs.readFileSync(path.join(root, 'server/publications/notifications.js'), 'utf8');
  const start = source.indexOf("Meteor.publish('notificationAttachments'");
  const end = source.indexOf('\n});', start) + '\n});'.length;
  assert.ok(start >= 0 && end > start);
  const mongoCursor = { kind: 'Mongo.Cursor' };
  let selector;
  let publication;
  vm.runInNewContext(source.slice(start, end), {
    Meteor: { publish(name, fn) { publication = fn; } },
    async activityDocs() { return [{ attachmentId: 'a1' }, { cardId: 'c1' }, { attachmentId: 'a2' }]; },
    ReactiveCache: {
      async getAttachments(sel, options, getQuery) {
        selector = sel;
        assert.equal(getQuery, true);
        // What ostrio:files answers: a FilesCursor wrapping the Mongo cursor.
        return { cursor: mongoCursor, each() {}, fetch() { return []; } };
      },
    },
  });
  assert.equal(await publication.call({ userId: 'u1' }), mongoCursor);
  assert.deepEqual(JSON.parse(JSON.stringify(selector)), { _id: { $in: ['a1', 'a2'] } },
    'only the attachments the readable activities name');
});
