'use strict';

// wekan/wekan#3069: autolink bare "#1234"-style issue/bug-tracker number tokens
// found in card descriptions/comments to an EXTERNAL tracker (Jira, GitHub,
// Bugzilla, ...), similar to the Mattermost autolink plugin. Admin-configurable
// via Admin Panel / Settings / Features (models/settings.js
// externalLinkPatternPrefix / externalLinkPatternUrl), applied by the pure
// function in models/lib/externalLinkAutolink.js.
//
// Run: node tests/externalLinkAutolink.test.cjs
//
// THE DESIGN DETAIL THIS TEST PINS: WeKan does NOT autolink bare "#NNNN" to its
// own cards anywhere (confirmed by reading client/, imports/ and models/ - see
// "no internal card-number autolink anywhere" below), so there is nothing this
// feature can collide with today. It stays safe anyway: off by default (no-op
// unless BOTH settings are configured), and it never rewrites a token that
// already sits inside an existing link.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  isConfigured,
  buildUrl,
  findMatches,
  isInsideExistingLink,
  autolinkExternalIssueReferences,
} = require('../models/lib/externalLinkAutolink.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('  ok -', name);
}

// ── isConfigured / no-op behaviour ──────────────────────────────────────────
test('no-op when prefix is missing', () => {
  assert.strictEqual(isConfigured(undefined, 'https://x/{number}'), false);
  assert.strictEqual(isConfigured('', 'https://x/{number}'), false);
});

test('no-op when the URL template has no {number} placeholder', () => {
  assert.strictEqual(isConfigured('#', 'https://x/browse/PROJ'), false);
});

test('configured when both a prefix and a {number} template are set', () => {
  assert.strictEqual(isConfigured('#', 'https://x/browse/PROJ-{number}'), true);
});

test('autolinkExternalIssueReferences is a true no-op when unconfigured', () => {
  const text = 'See #1234 for details';
  assert.strictEqual(autolinkExternalIssueReferences(text, '', ''), text);
  assert.strictEqual(autolinkExternalIssueReferences(text, '#', ''), text);
  assert.strictEqual(autolinkExternalIssueReferences(text, '', 'https://x/{number}'), text);
});

test('non-string or empty text is returned unchanged', () => {
  assert.strictEqual(autolinkExternalIssueReferences(null, '#', 'https://x/{number}'), null);
  assert.strictEqual(autolinkExternalIssueReferences('', '#', 'https://x/{number}'), '');
});

// ── matching / URL building ─────────────────────────────────────────────────
test('buildUrl substitutes {number}, even repeated', () => {
  assert.strictEqual(
    buildUrl('https://issues.example.com/browse/PROJ-{number}', '1234'),
    'https://issues.example.com/browse/PROJ-1234',
  );
  assert.strictEqual(
    buildUrl('https://x/{number}/{number}', '7'),
    'https://x/7/7',
  );
});

test('findMatches finds every "<prefix><digits>" token, left to right', () => {
  const matches = findMatches('fixes #12 and also #345, not #', '#');
  assert.strictEqual(matches.length, 2);
  assert.strictEqual(matches[0].number, '12');
  assert.strictEqual(matches[1].number, '345');
});

test('a configured prefix other than "#" only matches that prefix', () => {
  const matches = findMatches('see PROJ-42 and #99', 'PROJ-');
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].number, '42');
});

// ── the actual replacement ──────────────────────────────────────────────────
test('rewrites a bare token into a markdown link to the external tracker', () => {
  const out = autolinkExternalIssueReferences(
    'Fixes #1234 today',
    '#',
    'https://issues.example.com/browse/PROJ-{number}',
  );
  assert.strictEqual(
    out,
    'Fixes [#1234](https://issues.example.com/browse/PROJ-1234) today',
  );
});

test('rewrites every matching token in the text, and leaves the rest alone', () => {
  const out = autolinkExternalIssueReferences(
    'See #1 and #22, also check the #3rd item which is not numeric-only... #4!',
    '#',
    'https://x/{number}',
  );
  assert.strictEqual(
    out,
    'See [#1](https://x/1) and [#22](https://x/22), also check the [#3](https://x/3)rd item '
    + 'which is not numeric-only... [#4](https://x/4)!',
  );
});

test('does not touch text with no matching token', () => {
  const text = 'Nothing to see here, no hash tokens at all.';
  assert.strictEqual(autolinkExternalIssueReferences(text, '#', 'https://x/{number}'), text);
});

test('a prefix that never appears leaves the text untouched, same reference', () => {
  const text = 'Ticket JIRA-99 mentioned';
  const out = autolinkExternalIssueReferences(text, '#', 'https://x/{number}');
  assert.strictEqual(out, text);
});

// ── the collision-avoidance design detail ───────────────────────────────────
test('a token already inside a markdown link target is left alone', () => {
  const text = 'See [already linked](https://elsewhere.example/#1234) here';
  const out = autolinkExternalIssueReferences(text, '#', 'https://x/{number}');
  assert.strictEqual(out, text, 'the token inside the existing link URL must not be rewritten');
});

test('a token already inside an href="..." attribute is left alone', () => {
  const text = 'Look here: <a href="https://elsewhere.example/#1234">link</a>';
  const out = autolinkExternalIssueReferences(text, '#', 'https://x/{number}');
  assert.strictEqual(out, text);
});

test('isInsideExistingLink direct behaviour', () => {
  const text = '[label](url#5) plain #6';
  const insideIdx = text.indexOf('#5');
  const outsideIdx = text.indexOf('#6');
  assert.strictEqual(isInsideExistingLink(text, insideIdx), true);
  assert.strictEqual(isInsideExistingLink(text, outsideIdx), false);
});

// ── settings schema wiring ──────────────────────────────────────────────────
test('the two settings fields exist in the schema, both optional strings', () => {
  const settings = read('models/settings.js');
  assert.ok(/externalLinkPatternPrefix:\s*\{\s*type:\s*String,\s*optional:\s*true,\s*\}/s.test(settings),
    'externalLinkPatternPrefix must be an optional String field');
  assert.ok(/externalLinkPatternUrl:\s*\{\s*type:\s*String,\s*optional:\s*true,\s*\}/s.test(settings),
    'externalLinkPatternUrl must be an optional String field');
});

// ── the markdown package applies it, and mirrors the pure algorithm ────────
test('the markdown package renders through a reactive externalLinkPattern bridge', () => {
  const pkg = read('packages/markdown/src/template-integration.js');
  assert.ok(/Markdown\.externalLinkPattern = new ReactiveVar/.test(pkg),
    'the package exposes the bridge, mirroring alwaysShowCodeAsText');
  assert.ok(/autolinkExternalIssueReferences\(\s*text/.test(pkg),
    'the markdown helper actually calls the autolink step before Markdown.render');
});

// CodeQL js/incomplete-sanitization (#533): the markdown package duplicates
// autolinkWekanCardUrls' title-escaping from models/lib/cardUrlAutolink.js
// (kept in sync per the comment there) because it cannot import app code.
// The duplicate must escape the backslash BEFORE the ']', or a title ending
// in a raw backslash escapes the literal ']' the function inserts and the
// markdown link label is never terminated. Source-checked (not runtime,
// since this package imports `meteor/...` modules unavailable to plain
// node) so the two copies cannot silently diverge back to the incomplete
// (]-only) escape.
test('the markdown package escapes both "\\\\" and "]" in a card title, in that order, not just "]"', () => {
  const pkg = read('packages/markdown/src/template-integration.js');
  const expected = "title.replace(/\\\\/g, '\\\\\\\\').replace(/]/g, '\\\\]')";
  assert.ok(
    pkg.includes(expected),
    'safeTitle must escape backslashes before escaping "]", matching models/lib/cardUrlAutolink.js',
  );
  const oldIncomplete = "title.replace(/]/g, '\\\\]');";
  assert.ok(
    !pkg.includes(oldIncomplete),
    'the old ]-only escape (no backslash handling) must not be present anymore',
  );
});

test('editor.js keeps the bridge in sync with the setting, like alwaysShowCodeAsText', () => {
  const editor = read('client/components/main/editor.js');
  const occurrences = editor.match(/Markdown\.externalLinkPattern\.set\(/g) || [];
  assert.ok(occurrences.length >= 2,
    'both the same-render-pass helper and the startup autorun must push the setting in');
  assert.ok(/setting && setting\.externalLinkPatternPrefix/.test(editor));
  assert.ok(/setting && setting\.externalLinkPatternUrl/.test(editor));
});

// ── no internal card-number autolink anywhere (the design precondition) ────
test('WeKan does not already autolink bare #NNNN to its own cards anywhere', () => {
  // The whole reason this feature is safe to ship without a "disambiguate from
  // internal card links" mode: there is no internal #NNNN-to-card autolinker to
  // collide with. Guard it by source inspection, not just this comment, so a
  // future addition of one is caught here rather than silently double-linking.
  const dirs = ['client/components', 'models', 'imports/lib'];
  const suspicious = [];
  const walk = dir => {
    const abs = path.join(repoRoot, dir);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jade)$/.test(entry.name)) continue;
      if (rel.includes('externalLinkAutolink')) continue;
      const content = read(rel);
      // A hypothetical internal autolinker would match "#" + digits and build a
      // card URL from it. Nothing in the tree does that today.
      if (/#\(\\\\d\+\)\).*card/i.test(content) || /autolinkCard\b/.test(content)) {
        suspicious.push(rel);
      }
    }
  };
  dirs.forEach(walk);
  assert.deepStrictEqual(suspicious, [],
    'no file may autolink bare #NNNN to internal cards - if one now does, this '
    + 'feature needs the disambiguation this test currently proves is unneeded');
});

// ── i18n ─────────────────────────────────────────────────────────────────
test('en.i18n.json has all four new keys, right after automatic-linked-url-schemes', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = Object.keys(en);
  const anchor = keys.indexOf('automatic-linked-url-schemes');
  assert.notStrictEqual(anchor, -1);
  assert.strictEqual(keys[anchor + 1], 'external-link-pattern');
  assert.strictEqual(keys[anchor + 2], 'external-link-pattern-description');
  assert.strictEqual(keys[anchor + 3], 'external-link-pattern-prefix');
  assert.strictEqual(keys[anchor + 4], 'external-link-pattern-url');
  assert.strictEqual(typeof en['external-link-pattern'], 'string');
  assert.strictEqual(typeof en['external-link-pattern-description'], 'string');
});

test('every locale file has all four keys, immediately after automatic-linked-url-schemes', () => {
  // Checked relative to the neighbouring anchor key rather than by absolute
  // index: this repository is worked on by several concurrent agents, and an
  // unrelated key inserted earlier in en.i18n.json by another one shifts every
  // absolute index without moving these four keys out of place. What actually
  // matters - and what a diff-readability regression would break - is that the
  // four keys stay contiguous, in order, right after their anchor, in every file.
  const dir = path.join(repoRoot, 'imports/i18n/data');
  const missing = [];
  const wrongPosition = [];
  const expected = [
    'automatic-linked-url-schemes',
    'external-link-pattern',
    'external-link-pattern-description',
    'external-link-pattern-prefix',
    'external-link-pattern-url',
  ];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const keys = Object.keys(doc);
    if (!('external-link-pattern' in doc) || !('external-link-pattern-description' in doc)
      || !('external-link-pattern-prefix' in doc) || !('external-link-pattern-url' in doc)) {
      missing.push(f);
      continue;
    }
    const anchor = keys.indexOf('automatic-linked-url-schemes');
    const actual = keys.slice(anchor, anchor + 5);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) wrongPosition.push(f);
  }
  assert.deepStrictEqual(missing, [], 'every language file must have all four keys');
  assert.deepStrictEqual(wrongPosition, [], 'the four keys must sit right after their anchor key, in order, in every file');
});

test('non-English locale files are not just an English copy (mostly real translations)', () => {
  const dir = path.join(repoRoot, 'imports/i18n/data');
  let translated = 0;
  let total = 0;
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'))['external-link-pattern'];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json'))) {
    const lang = f.replace('.i18n.json', '');
    if (lang === 'en' || lang.startsWith('en-') || lang.startsWith('en_')) continue;
    total++;
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (doc['external-link-pattern'] !== en) translated++;
  }
  assert.ok(translated / total > 0.9,
    `expected the overwhelming majority of locales to carry a real translation, got ${translated}/${total}`);
});

test('placeholder tokens are preserved - {number} appears in every url-template translation', () => {
  const dir = path.join(repoRoot, 'imports/i18n/data');
  const missing = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.i18n.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const val = doc['external-link-pattern-url'];
    if (typeof val === 'string' && !val.includes('{number}')) missing.push(f);
  }
  assert.deepStrictEqual(missing, [], '{number} placeholder must survive translation, untouched, everywhere');
});

console.log(`\nexternalLinkAutolink: ${passed} tests passed`);
