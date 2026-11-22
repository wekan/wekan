'use strict';
// #1463: "[Task:3384] => https://spirateam.com/SpiraTeam/Task/3384.aspx ...
// Even better if some custom abbreviations for the identifier could be used:
// TK => Task". Further autolink rules with {number} and {identifier}, and
// abbreviations, beside the single #3069 pattern (npm-packages/autolink/externalLinkRules.js).
//
// Run: node tests/externalLinkRules.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseExternalLinkRules, applyExternalLinkRules, EXTERNAL_LINK_RULES_MAX } = require('@wekanteam/autolink');

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

// CodeQL js/polynomial-redos (#611): the protected spans were found with
// /\[[^\]\n]*\]\([^)\n]*\)/g and /href\s*=\s*("[^"]*"|'[^']*')/gi, which
// restart at every "[" (or href=") and read to the end each time. Card text
// is uncontrolled, so a description of many "[" took quadratic time.
const elapsed = fn => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const BIG = 200000;

test('protected spans are unchanged: the scan finds what the old expressions found', () => {
  const OLD = [/\[[^\]\n]*\]\([^)\n]*\)/g, /href\s*=\s*("[^"]*"|'[^']*')/gi];
  const r = parseExternalLinkRules('X-{number} = https://a.example/{number}');
  const alphabet = ['[', ']', '(', ')', '\n', '"', "'", 'href', 'HREF', '=', ' ', 'X-1', 'a', 'İ'];
  let seed = 7;
  const rand = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let round = 0; round < 3000; round += 1) {
    let text = '';
    for (let i = rand(30); i > 0; i -= 1) text += alphabet[rand(alphabet.length)];
    // The reference: link X-<n> wherever the OLD spans do not cover it.
    const spans = [];
    for (const re of OLD) { re.lastIndex = 0; let m; while ((m = re.exec(text))) spans.push([m.index, m.index + m[0].length]); }
    const expected = text.replace(/X-(\d+)/g, (all, num, at) =>
      (spans.some(([a, b]) => at < b && at + all.length > a) ? all : `[${all}](https://a.example/${num})`));
    assert.equal(applyExternalLinkRules(text, r), expected, JSON.stringify(text));
  }
});

test('negative: text built to make the old expressions quadratic is linear now', () => {
  const r = parseExternalLinkRules('PROJ-{number} = https://a.example/{number}');
  for (const text of ['['.repeat(BIG), '[]('.repeat(BIG / 3), 'href="'.repeat(BIG / 6), "href='".repeat(BIG / 6),
    'href '.repeat(BIG / 5), `${'['.repeat(BIG)}PROJ-1`]) {
    const ms = elapsed(() => applyExternalLinkRules(text, r));
    assert.ok(ms < 1500, `${JSON.stringify(text.slice(0, 12))} x${text.length} took ${ms.toFixed(0)} ms`);
  }
});

test('negative: a rule whose token starts with {number} does not retry every digit', () => {
  const r = parseExternalLinkRules('{number}-TASK = https://a.example/{number}');
  assert.equal(applyExternalLinkRules('see 12-TASK and x34-TASK', r),
    'see [12-TASK](https://a.example/12) and x[34-TASK](https://a.example/34)');
  assert.equal(applyExternalLinkRules('a123-TASK', r), 'a[123-TASK](https://a.example/123)', 'the whole number, never its tail');
  const ms = elapsed(() => applyExternalLinkRules('1'.repeat(BIG), r));
  assert.ok(ms < 1500, `a long digit run took ${ms.toFixed(0)} ms`);
});

test('negative: no other autolink module scans card text with a quadratic span pattern', () => {
  const dir = path.join(__dirname, '..', 'npm-packages', 'autolink');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\\\[\[\^\\\][^\]]*\]\*\\\]\\\(/, `${file}: "[...](...)" found by an unbounded regular expression`);
    assert.doesNotMatch(code, /"\[\^"\]\*"/, `${file}: a quoted value found by an unbounded regular expression`);
  }
  const { autolinkExternalIssueReferences, autolinkWekanCardUrls: autolinkCardUrls } = require('@wekanteam/autolink');
  for (const [name, fn] of [['autolinkExternalIssueReferences', t => autolinkExternalIssueReferences(t, 'PROJ-', 'https://a/')],
    ['autolinkCardUrls', t => autolinkCardUrls(t, () => null)]]) {
    for (const text of ['['.repeat(BIG), 'https://'.repeat(BIG / 8), '/b/'.repeat(BIG / 3), '1'.repeat(BIG), 'PROJ-1 '.repeat(BIG / 7), '](PROJ-1 '.repeat(BIG / 9), 'href="PROJ-1 '.repeat(BIG / 13)]) {
      const ms = elapsed(() => fn(text));
      assert.ok(ms < 1500, `${name} on ${JSON.stringify(text.slice(0, 10))} took ${ms.toFixed(0)} ms`);
    }
  }
});

test('the markdown package imports the one copy and applies it after the #3069 pattern', () => {
  const pkg = read('packages/markdown/src/template-integration.js');
  // It used to carry a copy between BEGIN/END markers that this test compared
  // with models/lib/externalLinkRules.js; both now load @wekanteam/autolink.
  assert.match(pkg, /import \{[^}]*\bparseExternalLinkRules\b[^}]*\bapplyExternalLinkRules\b[^}]*\} from '@wekanteam\/autolink';/);
  assert.doesNotMatch(pkg, /BEGIN externalLinkRules|function (parseExternalLinkRules|applyExternalLinkRules)\b/);
  assert.match(pkg, /applyExternalLinkRules\(autolinkExternalIssueReferences\(/);
  assert.match(read('client/components/main/editor.js'), /Markdown\.externalLinkRules\.set\(\{ rules, aliases \}\)/);
  assert.match(read('server/publications/settings.js'), /externalLinkRules: 1,\s*externalLinkIdentifierAliases: 1,/);
});

console.log(`\nexternalLinkRules: ${passed} tests passed`);
