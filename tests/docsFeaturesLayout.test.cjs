'use strict';

// docs/Features is filed by topic, one folder per topic at the docs/Features
// level, and every folder's main page is README.md:
//
//   - there is no docs/Features/General/ level any more: its topic folders
//     moved up into the same-named folders beside the menus;
//   - every folder under docs/Features has a README.md, so a folder link opens
//     its main page on GitHub, and no page is named after its folder;
//   - no page is a "# Moved" forwarding stub: links point at the page itself;
//   - every relative Markdown link in docs/ and README.md resolves;
//   - and nothing outside the changelogs' released records still names
//     docs/Features/General/.
//
// Run: node --test tests/docsFeaturesLayout.test.cjs

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const FEATURES = path.join(ROOT, 'docs', 'Features');

// Generated output, downloads and the changelog records are not sources.
// CHANGELOG-big.md, CHANGELOG.md and old-CHANGELOG/ keep the paths their
// released entries were written with; TODO.md describes this restructuring.
const EXCLUDED = /^(node_modules|\.tools|_build|\.meteor|\.build|old-CHANGELOG)(\/|$)|^(CHANGELOG-big\.md|CHANGELOG\.md|TODO\.md)$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(full);
      walk(full, out);
    }
  }
  return out;
}

function mdFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Markdown links outside fenced code blocks and inline code: inline links and
// images, and reference definitions.
function markdownLinks(text) {
  const links = [];
  let inFence = false;
  for (const raw of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const line = raw.replace(/`[^`]*`/g, '');
    const inline = /\]\(\s*(<[^>]*>|[^()\s]*(?:\([^()\s]*\)[^()\s]*)*)(?:\s+"[^"]*")?\s*\)/g;
    let m;
    while ((m = inline.exec(line))) links.push(m[1]);
    const ref = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/.exec(line);
    if (ref) links.push(ref[1]);
  }
  return links.map(l => l.replace(/^<|>$/g, ''));
}

function isRelative(url) {
  return url !== '' && !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('#') && !url.startsWith('/');
}

test('docs/Features/General does not exist', () => {
  assert.strictEqual(fs.existsSync(path.join(FEATURES, 'General')), false,
    'the General/ level was removed: its topics are folders at the docs/Features level');
});

test('every folder under docs/Features has a README.md as its main page', () => {
  const missing = walk(FEATURES)
    .filter(dir => !fs.existsSync(path.join(dir, 'README.md')))
    .map(dir => path.relative(ROOT, dir));
  assert.deepStrictEqual(missing, []);
});

test('no folder under docs/Features keeps a main page named after itself', () => {
  const named = walk(FEATURES)
    .map(dir => path.join(dir, `${path.basename(dir)}.md`))
    .filter(file => fs.existsSync(file))
    .map(file => path.relative(ROOT, file));
  assert.deepStrictEqual(named, []);
});

test('no page under docs/ is a "# Moved" forwarding stub', () => {
  const stubs = mdFiles(path.join(ROOT, 'docs'))
    .filter(file => /^# Moved\b/.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(ROOT, file));
  assert.deepStrictEqual(stubs, []);
});

test('every relative Markdown link in docs/ and README.md resolves', () => {
  const files = [...mdFiles(path.join(ROOT, 'docs')), path.join(ROOT, 'README.md')];
  const broken = [];
  for (const file of files) {
    for (const url of markdownLinks(fs.readFileSync(file, 'utf8'))) {
      if (!isRelative(url)) continue;
      let target = url.replace(/#.*$/, '').replace(/\?.*$/, '');
      if (target === '') continue;
      try { target = decodeURIComponent(target); } catch (e) { /* keep as written */ }
      if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
        broken.push(`${path.relative(ROOT, file)}: ${url}`);
      }
    }
  }
  assert.deepStrictEqual(broken, []);
});

test('negative: nothing outside the changelog records names docs/Features/General/', () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 1 << 28 })
    .toString('utf8').split('\0').filter(Boolean);
  const self = path.relative(ROOT, __filename);
  const needle = ['docs', 'Features', 'General', ''].join('/');
  const offenders = tracked.filter(rel => {
    if (EXCLUDED.test(rel) || rel === self) return false;
    const full = path.join(ROOT, rel);
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch (e) { return false; }
    return text.includes(needle);
  });
  assert.deepStrictEqual(offenders, []);
});

test('negative: the link checker sees a broken link and ignores external ones', () => {
  const links = markdownLinks([
    '[a](missing/page.md#x) [b](https://example.com) [c](#anchor)',
    '```', '[d](inside-a-fence.md)', '```',
    '`[e](inline-code.md)`',
    '[f]: ../ref.md',
  ].join('\n'));
  assert.deepStrictEqual(links, ['missing/page.md#x', 'https://example.com', '#anchor', '../ref.md']);
  assert.deepStrictEqual(links.filter(isRelative), ['missing/page.md#x', '../ref.md']);
});
