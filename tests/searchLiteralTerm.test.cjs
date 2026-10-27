'use strict';

// #6822: board search (sidebar, link-card popup, list/swimlane/board pickers)
// and the import member search used the typed term AS a regular expression:
// "C++", "(2026)" or "[x" threw "Invalid regular expression" and showed
// nothing, and "." matched any character. Every server-side search already
// matched the text literally.
// Run: node tests/searchLiteralTerm.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

(async () => {
  const { literalSearchRegex, buildCardSearchOr, matchingCommentCardIds } = await import('../models/lib/cardSearch.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('terms with regex characters are searched as typed', () => {
    for (const term of ['C++', '(2026)', '[x', 'a|b', '\\', '*', '?', '$^', 'PL0900-2026(1)']) {
      assert.doesNotThrow(() => buildCardSearchOr(term), term);
      assert.ok(literalSearchRegex(term).test(`case ${term} open`), term);
    }
    assert.deepStrictEqual(
      matchingCommentCardIds([{ cardId: 'c1', text: 'see C++ notes' }, { cardId: 'c2', text: 'C' }], 'C++'),
      ['c1']);
  });

  test('negative: "." and "*" no longer match other characters; case is still ignored', () => {
    assert.strictEqual(literalSearchRegex('a.b').test('axb'), false);
    assert.strictEqual(literalSearchRegex('a*').test('b'), false);
    assert.strictEqual(literalSearchRegex('a|b').test('b'), false);
    assert.strictEqual(literalSearchRegex('Case').test('CASE 12'), true);
  });

  test('the board pickers and the import member search use the literal match', () => {
    const boards = read('models/boards.js');
    assert.strictEqual((boards.match(/const regex = literalSearchRegex\(term\);/g) || []).length, 3);
    assert.match(read('models/users.js'), /const searchRegex = literalSearchRegex\(query\);/);
  });

  test('negative: no model or client file compiles a search term or query as a raw RegExp', () => {
    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(rel);
        else if (/\.(js|cjs|mjs)$/.test(entry.name) && /new RegExp\((?:term|query|searchTerm)\s*,/.test(read(rel))) {
          offenders.push(rel);
        }
      }
    };
    ['models', 'client', 'imports'].forEach(walk);
    assert.deepStrictEqual(offenders, []);
  });

  console.log(`\n${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
