#!/usr/bin/env node
'use strict';

// changelog-archive.mjs - keep CHANGELOG.md small enough for GitHub to show it,
// and move older releases into old-CHANGELOG/.
//
// Usage: node releases/changelog-archive.mjs [--dry-run]
//
// WHY. CHANGELOG.md reached 2.6 MB and 51,365 lines across 1,070 releases going
// back to 2015 (wekan/wekan#6580). Moving whole years out took it to 1.9 MB, and
// keeping only the current month was still not enough: releases here are
// FREQUENT and large, and October 2026's first ten days alone were 2.1 MB - more
// than GitHub shows at all ("we can't show files that are this big right now").
//
// GitHub's limits, measured on this repository and documented at
// docs.github.com (About READMEs; Repository limits):
//   up to 500 KiB (512,000 bytes)  rendered as Markdown;
//   above that, to about 2 MB      shown only as plain source text;
//   above about 2 MB               not shown at all.
// So the cut is by SIZE, at BUDGET below - under 500 KiB with room for the
// Status section and the archive links to grow between runs:
//
//   CHANGELOG.md                     # Status, # Upcoming and the newest
//                                    releases that fit in BUDGET
//   old-CHANGELOG/<year>/<MM>.md     a month's releases, newest first; a month
//   old-CHANGELOG/<year>/<MM>-partN.md  over BUDGET continues in part 2, 3, ...
//   old-CHANGELOG/<year>.md          years 2015-2025, already small, kept whole
//
// A release section larger than BUDGET on its own gets a part to itself: it
// can then not render as Markdown, but it is still shown as text.
//
// Nothing is deleted and no entry is rewritten. An archived section reads exactly
// as it did in CHANGELOG.md, for the same reason a released section is never
// edited in place: it is a record. That `git blame` is less useful on the split
// file is accepted - the history is still in git through gitk, git-gui or
// `git log --follow`, and being small enough to open is worth more.
//
// Run it whenever; it is idempotent, so a run with nothing to move only refreshes
// the tables and the parts. The release flow can run it after every release.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync,
} from 'fs';
import { join } from 'path';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const file = 'CHANGELOG.md';
const ARCHIVE = 'old-CHANGELOG';

if (!existsSync(file)) {
  console.error(`changelog-archive: ${file} does not exist`);
  process.exit(2);
}

// A release heading, in any of the wordings eleven years have used: of 1,070,
// 539 say "Wekan release", 524 "WeKan ® release", and the rest are one-offs -
// "Sandstorm-only Wekan release", "Wekan relase", and one explaining it was NOT
// released. Match the version and the DATE; leave whatever follows alone. A
// stricter pattern finds half of them and silently absorbs the rest into the
// section above, which is how a 27-release year first measured 404 KB.
// The version is MAJOR.MINOR most of the time and MAJOR.MINOR.PATCH sometimes -
// v1.49.1, v6.99.5 - so it is "one or more dotted numbers", not two. Requiring
// exactly two silently skipped 28 sections, which then got absorbed into the
// section above them and archived under the wrong month.
const HEADING = /^# v(\d+(?:\.\d+)+) (\d{4})-(\d{2})-(\d{2})\b/;

const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

const starts = [];
for (const [i, line] of lines.entries()) {
  const m = HEADING.exec(line);
  if (m) starts.push({ line: i, version: m[1], year: m[2], month: m[3], day: m[4] });
}
if (!starts.length) {
  console.error('changelog-archive: no release headings found');
  process.exit(1);
}

// Header = everything above the first release: # Platforms, # TODO Later and the
// # Upcoming section. Current state rather than history, so it always stays.
const header = lines.slice(0, starts[0].line);

const sections = starts.map((s, i) => ({
  ...s,
  text: lines.slice(s.line, i + 1 < starts.length ? starts[i + 1].line : lines.length).join('\n'),
}));

// GitHub renders Markdown up to 500 KiB (512,000 bytes). Stay well under it.
export const BUDGET = 450000;
const bytes = t => Buffer.byteLength(t);

// The newest releases that fit stay; the first that does not, and everything
// older, moves. Decided from the file, not the clock, so two people running
// this agree. The header (Status, Upcoming) always stays: it is current state.
let used = bytes(`${header.join('\n').trimEnd()}\n\n`) + 2048; // + the archive links
let keepCount = 0;
for (const s of sections) {
  if (used + bytes(s.text) + 2 > BUDGET) break;
  used += bytes(s.text) + 2;
  keepCount += 1;
}
// The newest release always stays, even over the budget: release-notes.sh reads
// the section of the release being published from CHANGELOG.md.
if (!keepCount) {
  keepCount = 1;
  console.warn('changelog-archive: the newest release does not fit the budget; it stays anyway.');
}
const staying = sections.slice(0, keepCount);
const leaving = sections.slice(keepCount);

// Where each departing section goes: a year that already has its own whole-year
// file (2015-2025) to that file, every other release to its month.
const yearFile = y => join(ARCHIVE, `${y}.md`);
const target = s => (existsSync(yearFile(s.year)) ? yearFile(s.year) : join(ARCHIVE, s.year, `${s.month}.md`));

// ── Tables ──────────────────────────────────────────────────────────────────
// A count at the top of every archive, because "how busy was 2019" - or July -
// is the first thing an archive is asked and the last thing 159 collapsed
// sections answer. A year file counts by month, a month file by day; both are
// the same shape, one level apart.
//
// Only periods that HAD releases get a row. A fixed twelve rows would put ten
// zeroes in 2015's table, which is noise standing in for a fact the rows already
// show.
function tableFor(body, label, group) {
  const counts = new Map();
  for (const line of body.split('\n')) {
    const m = HEADING.exec(line);
    if (!m) continue;
    const key = group(m);
    if (key === null) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if (!counts.size) return '';
  return `| ${label} | Releases |\n| --- | --- |\n`
    + [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, n]) => `| ${k} | ${n} |`).join('\n')
    + '\n';
}

// The table for a body, whichever kind of archive it is.
const tableOf = (kind, label, body) => (kind === 'year'
  ? tableFor(body, label, m => (m[2] === label ? m[3] : null))
  : tableFor(body, label, m => (`${m[2]}-${m[3]}` === label ? m[4] : null)));

// Everything above the first release section. GENERATED, all of it - which is
// what lets the refresh pass below rebuild it and bring older archives into step
// with a later change to the wording or the table.
function archiveHead(kind, label, table, part = 1, parts = 1) {
  const what = kind === 'year' ? 'per month' : 'per day';
  const partNav = parts > 1
    ? `This is part ${part} of ${parts}, newest first: `
      + Array.from({ length: parts }, (_, i) => (i + 1 === part ? `${i + 1}`
        : `[${i + 1}](${partFile(label.slice(5), i + 1)})`)).join(', ') + '.\n\n'
    : '';
  return `# WeKan ® ${label} releases${parts > 1 ? `, part ${part}` : ''}\n\n`
    + `Moved out of [CHANGELOG.md](${kind === 'year' ? '..' : '../..'}/CHANGELOG.md) to keep that\n`
    + `file small enough to open (wekan/wekan#6580). Nothing here has been changed:\n`
    + `a release section is a record, and it reads the same as it did there.\n\n`
    + partNav
    + `Releases ${what}:\n\n`
    + `${table}\n`;
}

function archiveBody(kind, label, texts, part = 1, parts = 1) {
  const joined = texts.map(t => t.trimEnd()).join('\n\n');
  return `${archiveHead(kind, label, tableOf(kind, label, joined), part, parts)}${joined}\n`;
}

// A month's part N: 10.md, 10-part2.md, 10-part3.md ...
const partFile = (mm, n) => (n === 1 ? `${mm}.md` : `${mm}-part${n}.md`);
const PART = /^(\d{2})(?:-part(\d+))?\.md$/;

// The release sections of an archive body, in order.
function sectionsOf(body) {
  const out = [];
  const ls = body.split('\n');
  let cur = null;
  for (const line of ls) {
    if (HEADING.test(line)) { if (cur) out.push(cur.join('\n')); cur = [line]; } else if (cur) cur.push(line);
  }
  if (cur) out.push(cur.join('\n'));
  return out.map(t => t.trimEnd());
}

// Write a month as parts of at most BUDGET each, newest first. `texts` is every
// release of the month, newest first. Returns the files written.
function writeMonth(year, mm, texts) {
  const dir = join(ARCHIVE, year);
  const label = `${year}-${mm}`;
  const chunks = [];
  for (const t of texts) {
    const last = chunks.at(-1);
    // 1024: the head of the part, its table and its links to the other parts.
    if (last && 1024 + bytes(last.join('\n\n')) + bytes(t) + 2 <= BUDGET) last.push(t);
    else chunks.push([t]);
  }
  const written = [];
  if (!dryRun) mkdirSync(dir, { recursive: true });
  chunks.forEach((chunk, i) => {
    const path = join(dir, partFile(mm, i + 1));
    const body = archiveBody('month', label, chunk, i + 1, chunks.length);
    const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (before !== body) {
      if (!dryRun) writeFileSync(path, body);
      written.push(path);
    }
  });
  // Parts left over from a longer split are now empty: their releases are in
  // the parts above.
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      const m = PART.exec(name);
      if (m && m[1] === mm && Number(m[2] || 1) > chunks.length) {
        if (!dryRun) unlinkSync(join(dir, name));
        written.push(join(dir, name));
      }
    }
  }
  return { written, parts: chunks.length };
}

// Every release a month's archive already holds, newest first, part by part.
function monthTexts(year, mm) {
  const dir = join(ARCHIVE, year);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map(name => [name, PART.exec(name)])
    .filter(([, m]) => m && m[1] === mm)
    .sort((a, b) => Number(a[1][2] || 1) - Number(b[1][2] || 1))
    .flatMap(([name]) => sectionsOf(readFileSync(join(dir, name), 'utf8')));
}

// ── Move ────────────────────────────────────────────────────────────────────
const groups = new Map();
for (const s of leaving) {
  const path = target(s);
  if (!groups.has(path)) groups.set(path, []);
  groups.get(path).push(s);
}

const kb = n => `${(n / 1024).toFixed(0)} KB`;
let movedBytes = 0;

for (const [path, group] of [...groups.entries()].sort().reverse()) {
  const texts = group.map(s => s.text.trimEnd());
  movedBytes += texts.reduce((n, t) => n + bytes(t), 0);
  if (path === yearFile(group[0].year)) {
    // A whole-year file: rebuild it so the table counts all of it.
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
    const previous = existing ? existing.slice(existing.search(/^# v\d+(?:\.\d+)+ /m)).trimEnd() : '';
    if (previous) texts.push(previous);
    if (!dryRun) writeFileSync(path, archiveBody('year', group[0].year, texts));
    console.log(`  ${dryRun ? 'would write' : 'wrote'} ${path}  ${group.length} releases`);
    continue;
  }
  // A month: the moved releases are newer than what the month already holds.
  const { parts } = writeMonth(group[0].year, group[0].month, [...texts, ...monthTexts(group[0].year, group[0].month)]);
  console.log(`  ${dryRun ? 'would move' : 'moved'} ${String(group.length).padStart(3)} releases to `
    + `${join(ARCHIVE, group[0].year, `${group[0].month}.md`)} (${parts} part${parts > 1 ? 's' : ''})`);
}

// ── Keep every existing archive's table current ─────────────────────────────
// Over all of them, every run - so a change to how the table is built reaches
// files that no move happened to touch.
function refreshTables() {
  if (!existsSync(ARCHIVE)) return;
  const touched = [];
  for (const name of readdirSync(ARCHIVE).sort().reverse()) {
    const path = join(ARCHIVE, name);
    if (statSync(path).isDirectory()) {
      // Every month, every run: a month written before parts existed, or under
      // an older budget, is split now; one already right is left as it is.
      const months = [...new Set(readdirSync(path).map(n => PART.exec(n)?.[1]).filter(Boolean))];
      for (const mm of months) touched.push(...writeMonth(name, mm, monthTexts(name, mm)).written);
      continue;
    }
    if (!/^\d{4}\.md$/.test(name)) continue;
    const body = readFileSync(path, 'utf8');
    const label = /^# WeKan ® ([\d-]+) releases/m.exec(body)?.[1];
    const first = body.search(/^# v\d+(?:\.\d+)+ /m);
    if (!label || first === -1) continue;
    const table = tableOf('year', label, body);
    if (!table) continue;
    // The whole head, not only the table: an archive written by an earlier
    // version of this script then comes into step. The sections are untouched.
    const rebuilt = archiveHead('year', label, table) + body.slice(first);
    if (rebuilt !== body && !dryRun) { writeFileSync(path, rebuilt); touched.push(path); }
  }
  if (touched.length) console.log(`changelog-archive: refreshed ${touched.length} archive file(s).`);
}

// ── The pointer in # Platforms ──────────────────────────────────────────────
// CLAUDE.md allows no other `#` heading in CHANGELOG.md, and a reader looking
// for an old release should not have to guess where it went.
function pointerLines() {
  if (!existsSync(ARCHIVE)) return [];
  const years = readdirSync(ARCHIVE)
    .map(n => n.replace(/\.md$/, ''))
    .filter(n => /^\d{4}$/.test(n));
  const links = [];
  for (const y of [...new Set(years)].sort().reverse()) {
    const dir = join(ARCHIVE, y);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      // Month by month, each part of a split month linked on its own.
      const files = readdirSync(dir).map(f => [f, PART.exec(f)]).filter(([, m]) => m)
        .sort((a, b) => b[1][1].localeCompare(a[1][1]) || Number(a[1][2] || 1) - Number(b[1][2] || 1));
      links.push(...files.map(([f, m]) => [m[2] ? `${y}-${m[1]} part ${m[2]}` : `${y}-${m[1]}`, `${ARCHIVE}/${y}/${f}`]));
    }
    if (existsSync(`${dir}.md`)) links.push([y, `${ARCHIVE}/${y}.md`]);
  }
  if (!links.length) return [];
  const out = [];
  for (const [label, path] of links) {
    const link = `[${label}](${path})`;
    if (!out.length) out.push(`- Older releases: ${link}`);
    else if (out.at(-1).length + link.length + 2 <= 80) out[out.length - 1] += `, ${link}`;
    else { out[out.length - 1] += ','; out.push(`  ${link}`); }
  }
  return out;
}

if (!dryRun) refreshTables();

const pointer = pointerLines();
if (pointer.length) {
  const oldStart = header.findIndex(l => l.startsWith('- Older releases:'));
  if (oldStart !== -1) {
    let end = oldStart + 1;
    while (end < header.length && /^ {2}\[[\w -]+\]\(old-CHANGELOG\//.test(header[end])) end += 1;
    header.splice(oldStart, end - oldStart, ...pointer);
  } else {
    const macAt = header.findIndex(l => l.startsWith('- [Mac ChangeLog]'));
    header.splice(macAt !== -1 ? macAt + 1 : 1, 0, ...pointer);
  }
}

const rebuilt = `${header.join('\n').trimEnd()}\n\n`
  + `${staying.map(s => s.text.trimEnd()).join('\n\n')}\n`;
if (!dryRun) writeFileSync(file, rebuilt);

console.log(`changelog-archive: ${dryRun ? 'would keep' : 'kept'} ${staying.length} release(s) `
  + `in ${file} (${kb(Buffer.byteLength(text))} -> ${kb(Buffer.byteLength(rebuilt))}, budget ${kb(BUDGET)})`
  + (leaving.length ? `, moved ${leaving.length} to ${ARCHIVE}/ (${kb(movedBytes)}).` : '.'));
