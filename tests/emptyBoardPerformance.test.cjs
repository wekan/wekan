const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const boardModel = fs.readFileSync(path.join(root, 'server/models/boards.js'), 'utf8');
const publication = fs.readFileSync(path.join(root, 'server/publications/boards.js'), 'utf8');

const beforeInsert = boardModel.match(/Boards\.before\.insert\([\s\S]*?\n\}\);/);
assert.ok(beforeInsert, 'board before-insert hook exists');
assert.match(beforeInsert[0], /doc\.sort = Date\.now\(\)/);
assert.doesNotMatch(beforeInsert[0], /getBoard|Boards\.find|sort:\s*\{\s*sort:\s*-1/);

assert.match(publication, /boardIds\.length === 1[\s\S]*?'meta\.boardId': boardIds\[0\]/);
assert.match(publication, /if \(memberIds\.length === 0\) return null/);
assert.doesNotMatch(
  publication,
  /_id:\s*\{\s*\$in:\s*memberIds\.filter\(x => x !== thisUserId\)\s*\}/,
);

console.log('emptyBoardPerformance: global and empty-set scans are bounded');
