'use strict';

// Guard: the per-year CHANGELOG archives, and the month table at the top of each.
// Run: node tests/changelogArchive.test.cjs
//
// CHANGELOG.md had reached 2.6 MB and 51,365 lines across 1,070 releases going
// back to 2015 (#6580), so the current year stays there and older years move to
// old-CHANGELOG/<year>.md whole and unchanged. Each archive opens with a count of
// releases per month, because "how busy was 2019" is the first thing a year file
// is asked and the last thing 159 collapsed sections answer.
//
// Two things can quietly go wrong and both are checked here: a release lost or
// duplicated by the move, and a table that stops matching the sections under it.
// The table is regenerated from the file's own headings on every run of
// releases/changelog-archive-years.mjs, so a mismatch means something edited one
// half and not the other.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARCHIVE = path.join(ROOT, 'old-CHANGELOG');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const files = fs.existsSync(ARCHIVE)
  ? fs.readdirSync(ARCHIVE).filter(f => /^\d{4}\.md$/.test(f)).sort().reverse()
  : [];
const read = f => fs.readFileSync(path.join(ARCHIVE, f), 'utf8');
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');

// A release heading, in any of the wordings eleven years have used: 539 say
// "Wekan release", 524 "WeKan ® release", and the rest are one-offs.
const HEADING = /^# v(\d+\.\d+) (\d{4})-(\d{2})-\d{2}\b/gm;

test('there are archives, and each names its own year', () => {
  assert.ok(files.length > 0, 'expected old-CHANGELOG/<year>.md files');
  for (const f of files) {
    const year = f.replace('.md', '');
    assert.ok(new RegExp(`^# WeKan ® ${year} releases$`, 'm').test(read(f)),
      `${f} must open with its own year heading`);
  }
});

test('the month table matches the releases under it, in every archive', () => {
  for (const f of files) {
    const body = read(f);
    const year = f.replace('.md', '');
    const table = [...body.matchAll(/^\| (\d{2}) \| (\d+) \|$/gm)]
      .reduce((acc, m) => acc.set(m[1], Number(m[2])), new Map());
    assert.ok(table.size > 0, `${f} has no month table`);

    const actual = new Map();
    for (const m of body.matchAll(HEADING)) {
      if (m[2] !== year) continue;
      actual.set(m[3], (actual.get(m[3]) || 0) + 1);
    }
    assert.deepStrictEqual([...table.entries()].sort(), [...actual.entries()].sort(),
      `${f}: the month table and the release sections disagree. It is regenerated `
      + 'from the headings by releases/changelog-archive-years.mjs, so run that rather '
      + 'than editing the table by hand.');
  }
});

test('the table header is the year and Releases, and months are two digits', () => {
  for (const f of files) {
    const year = f.replace('.md', '');
    const body = read(f);
    assert.ok(body.includes(`| ${year} | Releases |\n| --- | --- |\n`),
      `${f} must head its table with the year and "Releases"`);
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
    const firstRelease = body.search(/^# v\d+\.\d+ /m);
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

test('CHANGELOG.md holds one year, and links every archive', () => {
  const years = new Set([...changelog.matchAll(HEADING)].map(m => m[2]));
  assert.strictEqual(years.size, 1,
    `CHANGELOG.md should hold the current year only, found ${[...years].sort().join(', ')}`);
  for (const f of files) {
    const year = f.replace('.md', '');
    assert.ok(changelog.includes(`[${year}](old-CHANGELOG/${year}.md)`),
      `# Platforms must link the ${year} archive, or a reader cannot find it`);
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
