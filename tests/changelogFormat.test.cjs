'use strict';

// The CHANGELOG is read at a glance (#6524), and the long story is one click away.
//
// A reader wants to see, per version, WHAT changed - a short description per change,
// and no commit hash, which is a number they can do nothing with. The reasoning, the
// root cause and the test that pins it are still there: the short description is a
// <details>/<summary>, and clicking it reveals the long text below.
//
// These are the rules CLAUDE.md states, checked against the file:
//   * the file opens with Platforms and TODO Later, then the releases;
//   * an entry's summary is a SHORT description, never a paragraph;
//   * no commit hash is ever the visible text of a link;
//   * no long URL is ever shown as visible text;
//   * a <summary> holds no markdown link (it cannot nest inside the <a>);
//   * TODO Later says what is not done, and thanks nobody for it;
//   * lines are wrapped at 80 columns, except a line carrying a link.
//
// Run: node tests/changelogFormat.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const changelog = read('CHANGELOG.md');
const lines = changelog.split('\n');

// Every <details> block, with the summary line and the body below it.
function blocks() {
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] !== '<details>') continue;
    const end = lines.indexOf('</details>', i);
    const summary = lines[i + 1] || '';
    out.push({ line: i + 1, summary, body: lines.slice(i + 3, end).join('\n') });
  }
  return out;
}

// What a reader sees on a summary line: the link text, not the URL.
const summaryText = s => s.replace(/^<summary>/, '').replace(/<\/summary>$/, '')
  .replace(/<a href="[^"]*">([^<]*)<\/a>/g, '$1')
  .replace(/\s*Thanks to .*$/, '').trim();

const ALL = blocks();

console.log('changelogFormat:');

test('the file opens with Platforms and TODO Later, then the releases', () => {
  const headings = lines.filter(l => l.startsWith('# '));
  assert.deepStrictEqual(headings.slice(0, 2), ['# Platforms', '# TODO Later']);
  // Between TODO Later and the newest release there may be ONE section for the
  // work that is not released yet - "# Upcoming WeKan ® release", which the
  // release script renames to the next version number. Everything else is a
  // release heading; a stray one would break the version list.
  let rest = headings.slice(2);
  if (rest[0] === '# Upcoming WeKan ® release') rest = rest.slice(1);
  assert.ok(rest.every(h => /^# v\d/.test(h)),
    `nothing else is a heading: ${rest.filter(h => !/^# v\d/.test(h)).join(', ')}`);
  assert.ok(!rest.includes('# Upcoming WeKan ® release'),
    'there is only ONE Upcoming section, and it is above the newest release');
  // "which WeKan version uses what" is a block inside Platforms, not a heading.
  const platforms = lines.slice(0, lines.indexOf('# TODO Later'));
  assert.ok(platforms.includes('<summary>Version</summary>'));
  assert.ok(platforms.some(l => /^- \[Install\]/.test(l)), 'and the platform links');
});

test('TODO Later opens by saying what the list is', () => {
  const start = lines.indexOf('# TODO Later');
  assert.strictEqual(lines[start + 2], '<details>');
  assert.strictEqual(lines[start + 3], '<summary>Carried to a future release.</summary>');
});

test('a change is a short description, with the long one behind it', () => {
  assert.ok(ALL.length > 500, `expected hundreds of entries, found ${ALL.length}`);
  const long = ALL.filter(b => summaryText(b.summary).length > 130);
  assert.deepStrictEqual(long.map(b => `line ${b.line}: ${summaryText(b.summary).slice(0, 50)}…`),
    [], 'a summary is a title - the story goes in the body below it');
  const empty = ALL.filter(b => !b.body.trim());
  assert.deepStrictEqual(empty.map(b => `line ${b.line}`), [],
    'a <details> with nothing to reveal should have stayed a plain bullet');
});

test('every block is closed, and its summary is on its own line', () => {
  // Counted on the MARKUP, not on the prose: an entry that explains the format
  // writes `<details>` and `<summary>` in backticks, one each and closed by
  // neither, and counting those made the file look unbalanced by one.
  const markup = changelog.replace(/`[^`\n]*`/g, '');
  assert.strictEqual((markup.match(/<details>/g) || []).length,
    (markup.match(/<\/details>/g) || []).length);
  assert.strictEqual((markup.match(/<summary>/g) || []).length,
    (markup.match(/<\/summary>/g) || []).length);
  for (const b of ALL) {
    assert.ok(/^<summary>/.test(b.summary) && /<\/summary>$/.test(b.summary),
      `line ${b.line}: the summary must be one line, opened and closed`);
  }
});

test('a summary carries no markdown link - it could not nest', () => {
  // The link is the <a> around the description; a [text](url) inside it would
  // render as literal brackets on GitHub.
  const bad = ALL.filter(b => /\[[^\]]*\]\([^)]*\)/.test(b.summary));
  assert.deepStrictEqual(bad.map(b => `line ${b.line}`), []);
});

test('no commit hash is ever shown as the text of a link', () => {
  // Neither as markdown link text nor as the text of the summary's own <a>.
  const md = [...changelog.matchAll(/\[([0-9a-f]{7,40})\]\(/g)].map(m => m[1]);
  assert.deepStrictEqual(md.slice(0, 5), [], `${md.length} links show a hash`);
  const html = [...changelog.matchAll(/<a href="[^"]*">([0-9a-f]{7,40})<\/a>/g)];
  assert.strictEqual(html.length, 0, 'and none in a summary either');
});

test('no long URL is shown as visible text', () => {
  const bare = [];
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) { inCode = !inCode; return; }
    if (inCode || line.startsWith('    ')) return;   // code, not prose
    // A link may be wrapped across two lines, so strip by the `](url)` half
    // rather than by the whole `[text](url)`.
    const withoutLinks = line.replace(/\]\(https?:\/\/[^)]*\)/g, ']')
      .replace(/<a href="[^"]*">/g, '');
    const m = /https?:\/\/\S{45,}/.exec(withoutLinks);
    if (m) bare.push(`line ${i + 1}: ${m[0].slice(0, 50)}…`);
  });
  // A handful survive in the oldest entries - commit-comment anchors, a couple of
  // URLs that were mistyped when they were written, an API example - so this pins
  // the count rather than zero: it may fall, never rise.
  assert.ok(bare.length <= 25,
    `${bare.length} long bare URLs: ${bare.slice(0, 3).join(' | ')}`);
});

test('TODO Later says what is NOT done, and thanks nobody for it', () => {
  const start = lines.indexOf('# TODO Later');
  // The backlog ends at whatever comes next: the not-yet-released section when
  // there is one, otherwise the newest release. Ending it at `# v` alone counted
  // every Upcoming entry as a backlog entry - and those DO thank people.
  const end = lines.findIndex((l, i) => i > start &&
    (/^# v\d/.test(l) || l === '# Upcoming WeKan ® release'));
  const section = lines.slice(start, end);
  const inSection = ALL.filter(b => b.line > start && b.line < end);
  assert.ok(inSection.length >= 5, 'the backlog is grouped by category');
  for (const b of inSection) {
    assert.ok(!/Thanks to /.test(b.summary),
      `line ${b.line}: nothing is done yet, so there is nobody to thank`);
    assert.ok(!/<a href=/.test(b.summary),
      `line ${b.line}: a category is not a commit - the issues are linked in the body`);
  }
  const withIssues = inSection.filter(b => /\/issues\//.test(b.body)).length;
  assert.ok(withIssues >= inSection.length / 2,
    'most categories list the issues they are about');
  assert.ok(!section.some(l => /wekan\/commit\//.test(l)),
    'nothing here was committed, so nothing here links a commit');
});

test('a markdown heading never appears inside an entry', () => {
  // A wrapped line starting with `#` (an issue reference such as #6514) would be
  // rendered as a heading and split the page.
  const stray = lines.map((l, i) => ({ l, i })).filter(x => /^#\S/.test(x.l));
  assert.deepStrictEqual(stray.map(x => `line ${x.i + 1}: ${x.l.slice(0, 40)}`), []);
});

test('lines are wrapped at 80 columns, links excepted', () => {
  const over = lines
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter(l => l.text.length > 80 && !/https?:\/\//.test(l.text)
      && !l.text.startsWith('<summary>'));
  // The remainder are deep-indented technical notes in old entries.
  assert.ok(over.length <= 250,
    `${over.length} over-long lines without a link, e.g. line ${over[0] && over[0].line}`);
});

test('the newest release follows the rules to the letter', () => {
  const todo = lines.indexOf('# TODO Later');
  const start = lines.findIndex((l, i) => i > todo && /^# (Upcoming WeKan|v\d)/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^# v\d/.test(l));
  const inSection = ALL.filter(b => b.line > start && b.line < end);
  assert.ok(inSection.length > 5, 'and it must have entries');
  for (const b of inSection) {
    assert.ok(summaryText(b.summary).length <= 120,
      `line ${b.line}: a summary must be a title (${summaryText(b.summary).length} chars)`);
    assert.ok(/<a href="https:\/\/github\.com\/wekan\/wekan\/commit\//.test(b.summary),
      `line ${b.line}: the summary links the commit it describes`);
  }
});

test('CLAUDE.md states these rules, so they are not folklore', () => {
  const claude = read('CLAUDE.md');
  assert.ok(/Every entry is a `<details>` block/.test(claude));
  assert.ok(/The file's shape, top to bottom/.test(claude));
  assert.ok(/The summary is one line at a glance/.test(claude));
  assert.ok(/The hash is never the link text/.test(claude));
  assert.ok(/Never show a long URL as visible text/.test(claude));
  assert.ok(/Word-wrap both CHANGELOGs at 80 chars/.test(claude));
  assert.ok(/no `Thanks to` line/.test(claude), 'including the TODO Later exception');
});

console.log(`\n${passed} tests passed`);
