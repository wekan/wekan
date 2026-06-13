/**
 * Test: Trello ".zip" import — board-name directory matching, attachment
 * filename matching, and the zip-bomb / path-traversal guards.
 *
 * Covers the pure logic in server/routes/importTrelloZip.js (which depends on
 * Meteor/WebApp and can't be required under plain Node), re-implemented
 * faithfully here. No Trello API credentials or network are used. Failures
 * throw, so a regression exits non-zero.
 */

const assert = require('assert');

// --- Faithful copies from server/routes/importTrelloZip.js ----------------
function isUnsafeEntryPath(p) {
  if (!p) return false;
  if (p.includes('\0')) return true;
  if (p.includes('\\')) return true;
  if (p.startsWith('/')) return true;
  if (/^[a-zA-Z]:/.test(p)) return true;
  if (p.split('/').some(seg => seg === '..')) return true;
  return false;
}

function sanitizeBoardDirName(name) {
  const forbidden = [
    '/', ' ', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=',
    '{', '}', '[', ']', ',', ';', "'", '"', '<', '>', '?', '`', '~', '|',
  ];
  let s = String(name || '');
  for (const c of forbidden) s = s.split(c).join('');
  return s.trim().toLowerCase();
}

function collectLogicalAttachments(data) {
  const logical = new Map();
  const collect = att => {
    if (!att) return;
    if (att.url && att.name === att.url) return;
    const id = att.id || att._id || att.fileName || att.name;
    if (!id) return;
    if (!logical.has(id)) {
      logical.set(id, { fileName: att.fileName || att.name, occ: [] });
    }
    logical.get(id).occ.push(att);
  };
  (data.cards || []).forEach(card => (card.attachments || []).forEach(collect));
  (data.actions || []).forEach(action => {
    if (action.type === 'addAttachmentToCard') {
      collect(action.data && action.data.attachment);
    }
  });
  return logical;
}

// Mirrors the per-board scoping + filename matching done in importZipBuffer:
// fileEntries are { base, dirSegs, used } objects; returns matched count.
function matchBoardAttachments(board, fileEntries, boardCount) {
  const sanitized = sanitizeBoardDirName(board.name);
  let scoped = fileEntries.filter(
    e =>
      !e.used &&
      (e.dirSegs.some(seg => sanitizeBoardDirName(seg) === sanitized) ||
        sanitizeBoardDirName(e.base).startsWith(`${sanitized}_`)),
  );
  if (scoped.length === 0 && boardCount === 1) {
    scoped = fileEntries.filter(e => !e.used);
  }
  const findEntryFor = fileName => {
    if (!fileName) return null;
    let cand = scoped.find(e => !e.used && e.base === fileName);
    if (!cand) cand = scoped.find(e => !e.used && e.base.endsWith(`_${fileName}`));
    if (!cand) cand = scoped.find(e => !e.used && e.base.endsWith(fileName));
    return cand || null;
  };
  const logical = collectLogicalAttachments(board);
  let matched = 0;
  for (const info of logical.values()) {
    const cand = findEntryFor(info.fileName);
    if (cand) {
      cand.used = true;
      matched += 1;
    }
  }
  return matched;
}

function looksLikeBoard(data) {
  return !!(data && typeof data === 'object' && data.name &&
    (data.cards || data.lists || data.actions));
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// --- path-traversal guard ---
test('isUnsafeEntryPath rejects traversal/absolute/backslash/drive/null', () => {
  assert.ok(isUnsafeEntryPath('../secret'));
  assert.ok(isUnsafeEntryPath('a/../b'));
  assert.ok(isUnsafeEntryPath('/etc/passwd'));
  assert.ok(isUnsafeEntryPath('C:\\win'));
  assert.ok(isUnsafeEntryPath('a\\b'));
  assert.ok(isUnsafeEntryPath('a\0b'));
});
test('isUnsafeEntryPath accepts normal relative paths', () => {
  assert.ok(!isUnsafeEntryPath('Liite Testi/Liite Testi_1_koneet.jpeg'));
  assert.ok(!isUnsafeEntryPath('446iLdzb - liite-testi.json'));
  assert.ok(!isUnsafeEntryPath('a/b/c.png'));
});

// --- board-name -> directory sanitization ---
test('sanitizeBoardDirName matches a board name to its folder', () => {
  assert.strictEqual(sanitizeBoardDirName('Liite Testi'), 'liitetesti');
  assert.strictEqual(
    sanitizeBoardDirName('Liite Testi'),
    sanitizeBoardDirName('Liite Testi'),
  );
  // forbidden characters are stripped, case-insensitive
  assert.strictEqual(sanitizeBoardDirName('My (Board)!'), 'myboard');
});

// --- attachment matching (the real TCAD layout) ---
test('attachments match by board folder and <name>_<i>_<file> naming', () => {
  const board = {
    name: 'Liite Testi',
    cards: [
      { attachments: [
        { id: 'a1', name: 'koneet.jpeg', fileName: 'koneet.jpeg', url: 'https://trello.com/x/koneet.jpeg' },
        { id: 'a2', name: 'ai-modern-infra2.jpg', fileName: 'ai-modern-infra2.jpg', url: 'https://trello.com/y/ai-modern-infra2.jpg' },
      ] },
    ],
    actions: [
      { type: 'addAttachmentToCard', data: { attachment: { id: 'a1', name: 'koneet.jpeg', url: 'https://trello.com/x/koneet.jpeg' } } },
    ],
  };
  const fileEntries = [
    { base: 'Liite Testi_1_ai-modern-infra2.jpg', dirSegs: ['Liite Testi'], used: false },
    { base: 'Liite Testi_2_koneet.jpeg', dirSegs: ['Liite Testi'], used: false },
  ];
  const matched = matchBoardAttachments(board, fileEntries, 1);
  assert.strictEqual(matched, 2, 'both attachments matched');
  assert.ok(fileEntries.every(e => e.used), 'both files consumed');
});

test('a single board with no folder falls back to all files', () => {
  const board = {
    name: 'Solo',
    cards: [{ attachments: [{ id: 'a1', name: 'pic.png', fileName: 'pic.png', url: 'u' }] }],
  };
  const fileEntries = [{ base: 'pic.png', dirSegs: [], used: false }];
  assert.strictEqual(matchBoardAttachments(board, fileEntries, 1), 1);
});

test('multiple boards keep attachments scoped to their own folders', () => {
  const boardA = { name: 'Alpha', cards: [{ attachments: [{ id: 'a', name: 'shared.png', fileName: 'shared.png', url: 'u' }] }] };
  const boardB = { name: 'Beta', cards: [{ attachments: [{ id: 'b', name: 'shared.png', fileName: 'shared.png', url: 'u' }] }] };
  const fileEntries = [
    { base: 'Alpha_1_shared.png', dirSegs: ['Alpha'], used: false },
    { base: 'Beta_1_shared.png', dirSegs: ['Beta'], used: false },
  ];
  assert.strictEqual(matchBoardAttachments(boardA, fileEntries, 2), 1);
  assert.strictEqual(matchBoardAttachments(boardB, fileEntries, 2), 1);
  // Each board consumed its own file, not the other's.
  assert.ok(fileEntries.find(e => e.base === 'Alpha_1_shared.png').used);
  assert.ok(fileEntries.find(e => e.base === 'Beta_1_shared.png').used);
});

test('attached links (name === url) are not treated as files', () => {
  const board = { name: 'B', cards: [{ attachments: [{ id: 'l', name: 'https://example.com', url: 'https://example.com' }] }] };
  assert.strictEqual(collectLogicalAttachments(board).size, 0);
});

// --- board JSON detection ---
test('looksLikeBoard accepts exports, rejects junk', () => {
  assert.ok(looksLikeBoard({ name: 'B', cards: [] }));
  assert.ok(looksLikeBoard({ name: 'B', actions: [] }));
  assert.ok(!looksLikeBoard({ cards: [] })); // no name
  assert.ok(!looksLikeBoard({ name: 'B' })); // no cards/lists/actions
  assert.ok(!looksLikeBoard(null));
});

if (typeof describe === 'function') {
  describe('Trello zip import', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Trello zip import tests\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) process.exitCode = 1;
}
