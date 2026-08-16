'use strict';

// Guard: the CHANGELOG archives, and the count table at the top of each.
// Run: node tests/changelogArchive.test.cjs
//
// CHANGELOG.md had reached 2.6 MB and 51,365 lines across 1,100 releases going
// back to 2015 (#6580). It now holds ONE MONTH; earlier months of this year are
// old-CHANGELOG/<year>/<MM>.md and finished years are old-CHANGELOG/<year>.md,
// moved whole and unchanged. Each archive opens with a release count - per month
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
    else if (/^(\d{4}|\d{2})\.md$/.test(name)) out.push(path.relative(ARCHIVE, full));
  }
  return out;
}
const files = archives();
const read = f => fs.readFileSync(path.join(ARCHIVE, f), 'utf8');
// The label an archive covers: "2019" for a year file, "2026-07" for a month.
const labelOf = f => (f.includes(path.sep)
  ? `${path.dirname(f)}-${path.basename(f, '.md')}`
  : path.basename(f, '.md'));
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

// A release heading, in any of the wordings eleven years have used: 539 say
// "Wekan release", 524 "WeKan ® release", and the rest are one-offs.
const HEADING = /^# v(\d+(?:\.\d+)+) (\d{4})-(\d{2})-(\d{2})\b/gm;

test('there are archives, and each names the period it covers', () => {
  assert.ok(files.length > 0, 'expected archives under old-CHANGELOG/');
  for (const f of files) {
    assert.ok(new RegExp(`^# WeKan ® ${labelOf(f)} releases$`, 'm').test(read(f)),
      `${f} must open with a heading naming ${labelOf(f)}`);
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

test('CHANGELOG.md holds ONE MONTH, and links every archive', () => {
  const months = new Set([...changelog.matchAll(HEADING)].map(m => `${m[2]}-${m[3]}`));
  assert.strictEqual(months.size, 1,
    `CHANGELOG.md should hold the current month only, found ${[...months].sort().join(', ')}`);
  for (const f of files) {
    const label = labelOf(f);
    const href = `old-CHANGELOG/${f.split(path.sep).join('/')}`;
    assert.ok(changelog.includes(`[${label}](${href})`),
      `# Platforms must link ${href}, or a reader cannot find it`);
  }
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
