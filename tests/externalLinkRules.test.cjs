'use strict';
// #1463: "[Task:3384] => https://spirateam.com/SpiraTeam/Task/3384.aspx ...
// Even better if some custom abbreviations for the identifier could be used:
// TK => Task". Further autolink rules with {number} and {identifier}, and
// abbreviations, beside the single #3069 pattern (models/lib/externalLinkRules.js).
//
// Run: node tests/externalLinkRules.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseExternalLinkRules, applyExternalLinkRules, EXTERNAL_LINK_RULES_MAX } = require('../models/lib/externalLinkRules');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('externalLinkRules:');

const rules = parseExternalLinkRules([
  '[{identifier}:{number}] = https://spirateam.com/SpiraTeam/{identifier}/{number}.aspx',
  'PROJ-{number} = https://jira.example.com/browse/PROJ-{number}',
].join('\n'), 'TK=Task, IN=Incident');

test('the reporter\'s examples, with and without abbreviations', () => {
  assert.equal(applyExternalLinkRules('Fix [Task:3384] now', rules), 'Fix [Task:3384](https://spirateam.com/SpiraTeam/Task/3384.aspx) now');
  assert.equal(applyExternalLinkRules('[TK:1223] [IN:123]', rules),
    '[TK:1223](https://spirateam.com/SpiraTeam/Task/1223.aspx) [IN:123](https://spirateam.com/SpiraTeam/Incident/123.aspx)');
  assert.equal(applyExternalLinkRules('See PROJ-7.', rules), 'See [PROJ-7](https://jira.example.com/browse/PROJ-7).');
});

test('negative: existing links, hrefs and non-matches are left alone; nothing is linked twice', () => {
  for (const text of ['[TK:1](https://x.example)', '<a href="https://a/PROJ-9">x</a>', '[TK:abc]', 'PROJ-', '']) {
    assert.equal(applyExternalLinkRules(text, rules), text, text);
  }
  const once = applyExternalLinkRules('PROJ-7', rules);
  assert.equal(applyExternalLinkRules(once, rules), once, 'idempotent');
});

test('negative: only http(s) rules with exactly one {number} are kept', () => {
  assert.equal(parseExternalLinkRules('X{number} = javascript:alert(1)').length, 0);
  assert.equal(parseExternalLinkRules('X{number}{number} = https://a/{number}').length, 0);
  assert.equal(parseExternalLinkRules('X = https://a/').length, 0);
  assert.equal(parseExternalLinkRules('X{number} = https://a/{identifier}').length, 0, 'an identifier the token cannot give');
  assert.equal(parseExternalLinkRules('no separator here').length, 0);
  const many = Array.from({ length: 80 }, (_, i) => `R${i}-{number} = https://a/${i}/{number}`).join('\n');
  assert.equal(parseExternalLinkRules(many).length, EXTERNAL_LINK_RULES_MAX);
});

test('values are URL-encoded and cannot break out of the address', () => {
  const r = parseExternalLinkRules('[{identifier}:{number}] = https://a.example/{identifier}/{number}', 'X=a)b');
  assert.equal(applyExternalLinkRules('[X:1]', r), '[X:1](https://a.example/X/1)', 'an abbreviation that is not a word is ignored');
});

test('the markdown package carries an identical copy and applies it after the #3069 pattern', () => {
  const block = src => src.slice(src.indexOf('// BEGIN externalLinkRules'), src.indexOf('// END externalLinkRules'));
  const pkg = read('packages/markdown/src/template-integration.js');
  assert.equal(block(pkg), block(read('models/lib/externalLinkRules.js')));
  assert.match(pkg, /applyExternalLinkRules\(autolinkExternalIssueReferences\(/);
  assert.match(read('client/components/main/editor.js'), /Markdown\.externalLinkRules\.set\(\{ rules, aliases \}\)/);
  assert.match(read('server/publications/settings.js'), /externalLinkRules: 1,\s*externalLinkIdentifierAliases: 1,/);
});

console.log(`\nexternalLinkRules: ${passed} tests passed`);
