'use strict';

// Guard: the CHANGELOG archives, and the count table at the top of each.
// Run: node tests/changelogArchive.test.cjs
//
// CHANGELOG.md had reached 2.6 MB and 51,365 lines across 1,100 releases going
// back to 2015 (#6580), and one busy month later reached 2.1 MB - past what
// GitHub shows at all. It now holds what fits in GitHub's Markdown rendering
// limit (500 KiB; releases/changelog-archive.mjs BUDGET), and older releases are
// old-CHANGELOG/<year>/<MM>.md - split into <MM>-partN.md when a month is over
// the same budget - or old-CHANGELOG/<year>.md for 2015-2025, moved unchanged. Each archive opens with a release count - per month
// in a year file, per day in a month file - because "how busy was 2019", or
// July, is the first thing an archive is asked and the last thing 159 collapsed
// sections answer.
//
// Two things can quietly go wrong and both are checked here: a release lost or
// duplicated by the move, and a table that stops matching the sections under it.
// The table is regenerated from each file's own headings on every run of
// releases/changelog-archive.mjs, so a mismatch means something edited one half
// and not the other.
//
// The version in a heading is one or more dotted numbers - v1.49.1 and v6.99.5
// exist. Requiring exactly MAJOR.MINOR skipped 28 sections when the archive was
// first built, and they were then filed under whatever month preceded them.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARCHIVE = path.join(ROOT, 'old-CHANGELOG');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every archive, at both levels: old-CHANGELOG/<year>.md for a year that is
// over, old-CHANGELOG/<year>/<MM>.md for an earlier month of the current year.
function archives(dir = ARCHIVE, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort().reverse()) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) archives(full, out);
    else if (/^(\d{4}|\d{2}(-part\d+)?)\.md$/.test(name)) out.push(path.relative(ARCHIVE, full));
  }
  return out;
}
const files = archives();
const read = f => fs.readFileSync(path.join(ARCHIVE, f), 'utf8');
// The label an archive covers: "2019" for a year file, "2026-07" for a month.
const labelOf = f => (f.includes(path.sep)
  ? `${path.dirname(f)}-${path.basename(f, '.md').slice(0, 2)}`
  : path.basename(f, '.md'));
// Part N of a split month (1 for a whole month or a year).
const partOf = f => Number((/-part(\d+)\.md$/.exec(f) || [0, 1])[1]);
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

// A release heading, in any of the wordings eleven years have used: 539 say
// "Wekan release", 524 "WeKan ® release", and the rest are one-offs.
const HEADING = /^# v(\d+(?:\.\d+)+) (\d{4})-(\d{2})-(\d{2})\b/gm;

test('there are archives, and each names the period it covers', () => {
  assert.ok(files.length > 0, 'expected archives under old-CHANGELOG/');
  for (const f of files) {
    const part = partOf(f) > 1 || /^This is part 1 of/m.test(read(f)) ? `, part ${partOf(f)}` : '';
    assert.ok(new RegExp(`^# WeKan ® ${labelOf(f)} releases${part}$`, 'm').test(read(f)),
      `${f} must open with a heading naming ${labelOf(f)}${part}`);
  }
});

test('the count table matches the releases under it, in every archive', () => {
  // A year file counts per month, a month file per day. Both are the same shape,
  // one level apart, so one check covers them by asking the label which it is.
  for (const f of files) {
    const body = read(f);
    const label = labelOf(f);
    const isMonth = label.includes('-');
    const table = [...body.matchAll(/^\| (\d{2}) \| (\d+) \|$/gm)]
      .reduce((acc, m) => acc.set(m[1], Number(m[2])), new Map());
    assert.ok(table.size > 0, `${f} has no count table`);

    const actual = new Map();
    for (const m of body.matchAll(HEADING)) {
      const key = isMonth
        ? (`${m[2]}-${m[3]}` === label ? m[4] : null)
        : (m[2] === label ? m[3] : null);
      if (key === null) continue;
      actual.set(key, (actual.get(key) || 0) + 1);
    }
    assert.deepStrictEqual([...table.entries()].sort(), [...actual.entries()].sort(),
      `${f}: the count table and the release sections disagree. It is regenerated `
      + 'from the headings by releases/changelog-archive.mjs, so run that rather than '
      + 'editing the table by hand.');
  }
});

test('the table header names the period, and rows are two digits', () => {
  for (const f of files) {
    const label = labelOf(f);
    const body = read(f);
    assert.ok(body.includes(`| ${label} | Releases |\n| --- | --- |\n`),
      `${f} must head its table with ${label} and "Releases"`);
    // 01..12, never 1..9 - so the rows sort as text and line up as a column.
    for (const m of body.matchAll(/^\| (\d+) \| \d+ \|$/gm)) {
      assert.strictEqual(m[1].length, 2, `${f} has a month written as "${m[1]}"`);
    }
  }
});

test('the table sits above the first release, not among them', () => {
  for (const f of files) {
    const body = read(f);
    const tableAt = body.indexOf('| Releases |');
    const firstRelease = body.search(/^# v\d+(?:\.\d+)+ /m);
    assert.ok(tableAt !== -1 && firstRelease !== -1, `${f} needs both a table and releases`);
    assert.ok(tableAt < firstRelease,
      `${f}: the table has to be at the TOP, or it is not what the file opens with`);
  }
});

test('no release is in both CHANGELOG.md and an archive (negative)', () => {
  // The move must be a move. A section left in both places is two records of one
  // release that can then disagree.
  const current = new Set([...changelog.matchAll(HEADING)].map(m => m[0]));
  for (const f of files) {
    for (const m of read(f).matchAll(HEADING)) {
      assert.ok(!current.has(m[0]),
        `${m[0].trim()} is in both CHANGELOG.md and ${f}`);
    }
  }
});

// GitHub renders Markdown up to 500 KiB; above it the file is plain text, and
// above about 2 MB it is not shown at all ("we can't show files that are this
// big right now" - what CHANGELOG.md at 2.1 MB showed).
const { BUDGET } = { BUDGET: Number(/export const BUDGET = (\d+);/.exec(
  fs.readFileSync(path.join(ROOT, 'releases/changelog-archive.mjs'), 'utf8'))[1]) };
const GITHUB_RENDER_LIMIT = 500 * 1024;

test('CHANGELOG.md fits GitHub\'s Markdown limit, and links every archive', () => {
  assert.ok(BUDGET < GITHUB_RENDER_LIMIT, 'the budget is under GitHub\'s 500 KiB render limit');
  const size = Buffer.byteLength(changelog);
  assert.ok(size <= BUDGET,
    `CHANGELOG.md is ${size} bytes, over the ${BUDGET} budget - run node releases/changelog-archive.mjs`);
  for (const f of files) {
    const label = labelOf(f) + (partOf(f) > 1 ? ` part ${partOf(f)}` : '');
    const href = `old-CHANGELOG/${f.split(path.sep).join('/')}`;
    assert.ok(changelog.includes(`[${label}](${href})`),
      `# Status must link ${href}, or a reader cannot find it`);
  }
});

test('every archive part fits the budget, unless it is one release too large on its own', () => {
  for (const f of files) {
    const body = read(f);
    const releases = [...body.matchAll(HEADING)].length;
    assert.ok(Buffer.byteLength(body) <= BUDGET || releases === 1,
      `${f} is ${Buffer.byteLength(body)} bytes with ${releases} releases; run node releases/changelog-archive.mjs`);
  }
});

test('the parts of a month are numbered without gaps, newest first (negative: no stray part)', () => {
  const months = new Map();
  for (const f of files.filter(x => x.includes(path.sep))) {
    const key = labelOf(f);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(f);
  }
  for (const [label, parts] of months) {
    const numbers = parts.map(partOf).sort((a, b) => a - b);
    assert.deepStrictEqual(numbers, numbers.map((_, i) => i + 1), `${label}: parts ${numbers}`);
    // Newest first: the first release of part N is older than the last of part N-1.
    const firsts = numbers.map(n => {
      const f = parts.find(x => partOf(x) === n);
      return [...read(f).matchAll(HEADING)].map(m => m[1]);
    });
    for (let i = 1; i < firsts.length; i += 1) {
      const newer = firsts[i - 1].at(-1).split('.').map(Number);
      const older = firsts[i][0].split('.').map(Number);
      assert.ok(newer[0] > older[0] || (newer[0] === older[0] && newer[1] > older[1]),
        `${label}: part ${i + 1} must be older than part ${i}`);
    }
  }
});

test('every release keeps CHANGELOG.md in budget: release-all.sh archives after the rename', () => {
  const sh = fs.readFileSync(path.join(ROOT, 'releases/release-all.sh'), 'utf8');
  const rename = sh.indexOf('s|^# Upcoming WeKan ® release.*|');
  const archive = sh.indexOf('node "$REPO_DIR/releases/changelog-archive.mjs"');
  const commit = sh.indexOf('git commit -m "Prepare v$NEW release"');
  assert.ok(rename > 0 && archive > rename && commit > archive,
    'the archive runs after the Upcoming rename and before the release commit');
  // Negative: the newest release is never archived - release-notes.sh reads it.
  const script = fs.readFileSync(path.join(ROOT, 'releases/changelog-archive.mjs'), 'utf8');
  assert.match(script, /if \(!keepCount\) \{\s*keepCount = 1;/);
});

test('an archived section is never edited to say something new', () => {
  // The same rule as a released section: it is a record. Checked as a shape -
  // an archive must not carry an Upcoming heading or a TODO Later, which is what
  // "somebody started writing in here" looks like.
  for (const f of files) {
    const body = read(f);
    assert.ok(!/^# Upcoming/m.test(body), `${f} has an Upcoming section`);
    assert.ok(!/^# TODO Later/m.test(body), `${f} has a TODO Later section`);
  }
});

console.log(`\nchangelogArchive: ${passed} tests passed`);
