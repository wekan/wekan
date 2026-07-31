'use strict';

// One icon set: Font Awesome. And no "Grey Icons" feature to grey the other one.
//
// WeKan used colourful Unicode emoji as its icon set in 8.00-8.24 only; before
// and after, the icons are Font Awesome 4.7. A handful of emoji survived that
// change - in the notification icons, the star, the vote, the spent-time badge,
// the date badges' CSS `content:`, the gantt day markers - and they render as a
// different picture on every platform, at a size and colour the stylesheet does
// not control.
//
// "Grey Icons" (Member Settings) existed to grey THOSE emoji: a MutationObserver
// walked every rendered subtree, wrapped any text node that was one of ~50 emoji
// in a span, and greyscaled it. With the emoji gone the observer had nothing left
// to find, so the whole feature - menu entry, method, schema field, publication,
// stylesheet - is removed.
//
// Run: node tests/fontAwesomeIcons.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, ext, out);
    else if (ext.some(e => entry.name.endsWith(e))) out.push(rel);
  }
  return out;
}

// Pictographic characters. Not arrows (→ in a breadcrumb is text, not an icon)
// and not box drawing (── in a comment banner).
const PICTOGRAPH = /[\u{1F300}-\u{1FAFF}\u{2B00}-\u{2BFF}☀-➿←-⇿⬅-⬇⏰-⏿✅☑✔❌⭐]/u;
const ARROW_TEXT = /[→←↔⇒↔]/u;   // → ← ↔ ⇒ in prose

console.log('fontAwesomeIcons:');

// A jade comment renders nothing at all, so a character in one is not an icon -
// the same exemption as the arrows and the box drawing above, and a stronger
// one. `//-` is dropped by the compiler and `//` becomes an HTML comment;
// neither reaches the page. A comment BLOCK is its opening line plus every line
// indented under it, so the indent is what ends it, which is why this tracks
// state rather than testing each line on its own.
function rendersNothing(lines) {
  const skip = new Array(lines.length).fill(false);
  let commentIndent = null;
  lines.forEach((line, i) => {
    if (!line.trim()) { skip[i] = commentIndent !== null; return; }
    const indent = line.length - line.trimStart().length;
    if (commentIndent !== null && indent > commentIndent) { skip[i] = true; return; }
    commentIndent = /^\/\//.test(line.trim()) ? indent : null;
    skip[i] = commentIndent !== null;
  });
  return skip;
}

test('no template renders an emoji as an icon', () => {
  const offenders = [];
  for (const file of walk('client', ['.jade'])) {
    const lines = read(file).split('\n');
    const inComment = rendersNothing(lines);
    lines.forEach((line, i) => {
      if (inComment[i]) return;
      const withoutArrows = line.replace(new RegExp(ARROW_TEXT, 'gu'), '');
      if (PICTOGRAPH.test(withoutArrows)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 60)}`);
    });
  }
  assert.deepStrictEqual(offenders, [],
    'these render a platform-dependent picture instead of a Font Awesome glyph');
});

test('but a rendered line is still caught (self-check)', () => {
  // The comment exemption must not become a hole: only lines that render
  // nothing are skipped.
  const lines = [
    '  //- a ⭐ in a comment',
    '    and a ⭐ in its continuation',
    '  span ⭐',
    '  //- back in a comment',
    '  span.ok',
  ];
  assert.deepStrictEqual(rendersNothing(lines), [true, true, false, true, false]);
});

test('no stylesheet draws one with content:', () => {
  const offenders = [];
  for (const file of walk('client', ['.css'])) {
    read(file).split('\n').forEach((line, i) => {
      if (!/content\s*:/.test(line)) return;
      if (PICTOGRAPH.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 60)}`);
    });
  }
  assert.deepStrictEqual(offenders, [], 'use the Font Awesome codepoint, e.g. content: "\\f00c"');
});

test('the date badges use Font Awesome codepoints, with the font named', () => {
  // `time::before` is not an `.fa` element, so the family has to be set or the
  // codepoint renders as a missing-glyph box.
  for (const file of ['client/components/cards/cardDate.css', 'client/components/cards/minicard.css']) {
    const css = read(file);
    assert.ok(/font-family: FontAwesome;/.test(css), `${file}: the font must be named`);
    for (const glyph of ['\\f11e', '\\f017', '\\f135', '\\f01c']) {
      assert.ok(css.includes(glyph), `${file}: missing ${glyph}`);
    }
  }
});

test('the helpers that produce icons return Font Awesome class names', () => {
  const gantt = read('client/components/gantt/gantt.js');
  for (const cls of ['fa-inbox', 'fa-rocket', 'fa-clock-o', 'fa-flag-checkered']) {
    assert.ok(gantt.includes(`'${cls}'`), `gantt.js must return ${cls}`);
  }
  assert.ok(/i\.fa\(class="\{\{cellContent/.test(read('client/components/gantt/gantt.jade')),
    'and the template must render them as an <i class="fa ...">');
  const header = read('client/components/boards/boardHeader.js');
  assert.ok(/return 'fa-sort';/.test(header)
    && /'fa-arrow-up' : 'fa-arrow-down'/.test(header),
    'the sort icon helper too');
});

test('the Grey Icons feature is gone, every part of it', () => {
  for (const gone of ['client/components/unicode-icons.js', 'client/components/unicode-icons.css',
    'client/features/unicodeIcons.js', 'server/publications/userGreyIcons.js']) {
    assert.ok(!fs.existsSync(path.join(ROOT, gone)), `${gone} must be deleted`);
  }
  const sources = [...walk('client', ['.js', '.jade', '.css']), ...walk('server', ['.js']),
    ...walk('models', ['.js'])];
  const left = [];
  for (const file of sources) {
    const src = read(file);
    for (const token of ['GreyIcons', 'grey-icons-enabled', 'js-toggle-grey-icons', 'unicode-icons']) {
      // The one allowed mention is the note in cardDate.css explaining WHY the
      // emoji went away.
      if (src.includes(token) && file !== 'client/components/cards/cardDate.css') {
        left.push(`${file}: ${token}`);
      }
    }
  }
  assert.deepStrictEqual(left, [], 'a removed feature must leave no wiring behind');
});

test('and nothing subscribes to, publishes or stores it any more', () => {
  assert.ok(!read('client/00-startup.js').includes('userGreyIcons'));
  assert.ok(!read('server/imports.js').includes('userGreyIcons'));
  assert.ok(!read('models/users.js').includes('GreyIcons'), 'no schema field, no helper');
  assert.ok(!read('server/models/users.js').includes('toggleGreyIcons'), 'no method');
  assert.ok(!read('public/api/wekan.yml').includes('GreyIcons'), 'and it is out of the API spec');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(!('grey-icons' in en), 'and out of the translations');
});

console.log(`\n${passed} tests passed`);
