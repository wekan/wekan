#!/usr/bin/env node
'use strict';

// changelog-archive-years.mjs — keep the current year in CHANGELOG.md and move
// older years to old-CHANGELOG/<year>.md.
//
// Usage: node releases/changelog-archive-years.mjs [--keep <year>] [--dry-run]
//
// WHY. CHANGELOG.md reached 2.6 MB and 51,365 lines across 1,099 releases going
// back to 2015 (wekan/wekan#6580), which is slow to open and slower to read on
// the web. `git blame` on it stops being useful at that size too - but that is
// not what the file is FOR, and the history is still there for anyone who wants
// it through gitk, git-gui or `git log --follow`. Being small enough to open is
// worth more.
//
// So: the current year stays, older years move out whole. Nothing is deleted and
// no entry is rewritten - a release section is a record, and it reads the same in
// the archive as it did here.
//
// This is a JANUARY JOB. Run it once when a year turns over and the previous
// year's releases move out; it is idempotent, so running it again does nothing.
//
// WHAT STAYS in CHANGELOG.md, and why it is not just "the newest N releases":
// the file's shape is `# Platforms`, `# TODO Later`, then releases newest first
// (CLAUDE.md). The first two are current state, not history, so they stay
// whatever the year. Cutting by YEAR rather than by count also means a link into
// the archive never moves again once the year is over.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const keepArg = argv.indexOf('--keep');
// Not `new Date()` by default in a script that edits a tracked file: the year is
// taken from the newest release in the file, so two people running this in the
// same January get the same answer.
const file = 'CHANGELOG.md';
const ARCHIVE = 'old-CHANGELOG';

if (!existsSync(file)) {
  console.error(`changelog-archive-years: ${file} does not exist`);
  process.exit(2);
}
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

// Every release heading, with the year it was made.
//
// The wording has drifted over eleven years and all of it has to be recognised,
// or a section that is not matched gets absorbed into the one above it and moves
// with it. Of 1070 headings, 539 say "Wekan release", 524 "WeKan ® release", and
// the rest are one-offs: "Sandstorm-only Wekan release", "Wekan relase", and one
// that explains it was NOT released. So the version and the DATE are what is
// matched, and whatever follows is left alone.
const HEADING = /^# v(\d+\.\d+) (\d{4})-\d{2}-\d{2}\b/;
const starts = [];
for (const [i, line] of lines.entries()) {
  const m = HEADING.exec(line);
  if (m) starts.push({ line: i, version: m[1], year: Number(m[2]) });
}
if (!starts.length) {
  console.error('changelog-archive-years: no "# vNN.MM YYYY-MM-DD WeKan ® release" headings found');
  process.exit(1);
}

const keep = keepArg !== -1 && argv[keepArg + 1]
  ? Number(argv[keepArg + 1])
  : Math.max(...starts.map(s => s.year));

// Header = everything above the first release: # Platforms, # TODO Later, and
// the # Upcoming section when there is one. Current state, so it always stays.
const header = lines.slice(0, starts[0].line);

// Each release's own lines, from its heading to the next one.
const sections = starts.map((s, i) => ({
  ...s,
  text: lines.slice(s.line, i + 1 < starts.length ? starts[i + 1].line : lines.length).join('\n'),
}));

const staying = sections.filter(s => s.year >= keep);
const leaving = sections.filter(s => s.year < keep);

if (!leaving.length) {
  console.log(`changelog-archive-years: nothing older than ${keep} is left in ${file}.`);
  // Still worth a pass over the archives: a table added or changed later belongs
  // in every file, not only the ones a move happens to touch.
  refreshArchiveTables();
  process.exit(0);
}

// Group the departing sections by year, newest year first, and newest release
// first within each - the same order the file itself uses.
const byYear = new Map();
for (const s of leaving) {
  if (!byYear.has(s.year)) byYear.set(s.year, []);
  byYear.get(s.year).push(s);
}

// A month-by-month count for the year, at the top of its archive file: a year of
// WeKan is 40-160 releases, and "how busy was 2019" is the first thing the file
// is asked and the last thing 159 collapsed sections answer.
//
// Only months that HAD releases get a row. A fixed twelve rows would put ten
// zeroes in 2015's table, which is noise standing in for a fact the reader can
// already see.
function monthTable(year, body) {
  const months = new Map();
  for (const m of body.matchAll(/^# v\d+\.\d+ (\d{4})-(\d{2})-\d{2}\b/gm)) {
    if (Number(m[1]) !== year) continue;
    months.set(m[2], (months.get(m[2]) || 0) + 1);
  }
  if (!months.size) return '';
  const rows = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return `| ${year} | Releases |\n| --- | --- |\n`
    + rows.map(([month, n]) => `| ${month} | ${n} |`).join('\n')
    + '\n';
}

// Put that table into an archive file, or refresh the one already there. Run
// over every file each time, so a table cannot drift from the releases under it.
function refreshTable(path) {
  const body = readFileSync(path, 'utf8');
  const year = Number(/^# WeKan ® (\d{4}) releases/m.exec(body)?.[1]);
  if (!year) return false;
  const table = monthTable(year, body);
  if (!table) return false;
  // Between the file's own intro paragraph and the first release section.
  const firstRelease = body.search(/^# v\d+\.\d+ /m);
  if (firstRelease === -1) return false;
  const head = body.slice(0, firstRelease);
  const withoutOld = head.replace(/^\| \d{4} \| Releases \|\n\| --- \| --- \|\n(?:\| \d{2} \| \d+ \|\n)*\n?/m, '');
  const rebuilt = `${withoutOld.trimEnd()}\n\n${table}\n${body.slice(firstRelease)}`;
  if (rebuilt === body) return false;
  writeFileSync(path, rebuilt);
  return true;
}

function refreshArchiveTables() {
  if (!existsSync(ARCHIVE)) return;
  const touched = [];
  for (const f of readdirSync(ARCHIVE).sort().reverse()) {
    if (!/^\d{4}\.md$/.test(f)) continue;
    if (!dryRun && refreshTable(join(ARCHIVE, f))) touched.push(f);
  }
  if (touched.length) {
    console.log(`changelog-archive-years: refreshed the month table in ${touched.join(', ')}.`);
  }
}

const kb = n => `${(n / 1024).toFixed(0)} KB`;
let movedBytes = 0;

if (!dryRun && !existsSync(ARCHIVE)) mkdirSync(ARCHIVE);

for (const [year, group] of [...byYear.entries()].sort((a, b) => b[0] - a[0])) {
  const out = join(ARCHIVE, `${year}.md`);
  // The archive file gets a heading of its own, and the SAME shape below it -
  // releases newest first, unchanged. `# WeKan ® <year> releases` is not a
  // release heading, so nothing that scans for `# vNN.MM` picks it up.
  const body = `# WeKan ® ${year} releases\n\n`
    + `Moved out of [CHANGELOG.md](../CHANGELOG.md) to keep that file small enough\n`
    + `to open (wekan/wekan#6580). Nothing here has been changed: a release section\n`
    + `is a record, and it reads the same as it did there.\n\n`
    + `${group.map(s => s.text.trimEnd()).join('\n\n')}\n`;
  movedBytes += Buffer.byteLength(body);
  if (!dryRun) writeFileSync(out, body);
  console.log(`  ${dryRun ? 'would write' : 'wrote'} ${out.padEnd(24)} `
    + `${String(group.length).padStart(4)} releases  ${kb(Buffer.byteLength(body))}`);
}

// A pointer to the archive, in # Platforms beside the other links, because
// CLAUDE.md allows no other `#` heading in this file and a reader looking for
// an old release should not have to guess where it went.
const years = [...byYear.keys()].sort((a, b) => b - a);
// Wrapped at 80 with two-space continuation, like every other bullet in this
// file: the links here are RELATIVE, so the 80-column guard's "unless it carries
// a URL" exception does not cover them, and one long line would trip it.
const pointer = [];
for (const y of years) {
  const link = `[${y}](old-CHANGELOG/${y}.md)`;
  const last = pointer.length - 1;
  if (!pointer.length) pointer.push(`- Older releases: ${link}`);
  else if (pointer[last].length + link.length + 2 <= 80) pointer[last] += `, ${link}`;
  else { pointer[last] += ','; pointer.push(`  ${link}`); }
}
const macAt = header.findIndex(l => l.startsWith('- [Mac ChangeLog]'));
const oldStart = header.findIndex(l => l.startsWith('- Older releases:'));
if (oldStart !== -1) {
  // Replace the whole previous pointer, continuation lines included.
  let end = oldStart + 1;
  while (end < header.length && /^ {2}\[\d{4}\]\(old-CHANGELOG\//.test(header[end])) end += 1;
  header.splice(oldStart, end - oldStart, ...pointer);
} else if (macAt !== -1) header.splice(macAt + 1, 0, ...pointer);
else header.splice(1, 0, '', ...pointer);

const rebuilt = `${header.join('\n').trimEnd()}\n\n`
  + `${staying.map(s => s.text.trimEnd()).join('\n\n')}\n`;

if (!dryRun) writeFileSync(file, rebuilt);
refreshArchiveTables();
console.log(`changelog-archive-years: ${dryRun ? 'would keep' : 'kept'} ${staying.length} release(s) `
  + `from ${keep} onwards in ${file} (${kb(Buffer.byteLength(text))} -> ${kb(Buffer.byteLength(rebuilt))}), `
  + `moved ${leaving.length} to ${ARCHIVE}/ (${kb(movedBytes)}).`);
