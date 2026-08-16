#!/usr/bin/env node
'use strict';

// changelog-archive.mjs — keep the current MONTH in CHANGELOG.md, and move
// everything older into old-CHANGELOG/.
//
// Usage: node releases/changelog-archive.mjs [--dry-run]
//
// WHY. CHANGELOG.md reached 2.6 MB and 51,365 lines across 1,070 releases going
// back to 2015 (wekan/wekan#6580) - slow to open and slower to read on the web.
// Moving whole years out took it to 1.9 MB, and that was still too large,
// because releases here are FREQUENT: 2026 alone is 272 releases over eight
// months, and July was 80 on its own. A year is not a small enough unit when a
// year is that busy.
//
// So the cut is by month:
//
//   CHANGELOG.md                    the current month, plus # Platforms,
//                                   # TODO Later and # Upcoming
//   old-CHANGELOG/<year>/<MM>.md    every earlier month of the current year
//   old-CHANGELOG/<year>.md         years that are over, whole
//
// Past years stay as one file each because they are already small - 32 to 107 KB
// - and splitting them further would trade a size problem nobody has for a
// hundred more files to navigate.
//
// Nothing is deleted and no entry is rewritten. An archived section reads exactly
// as it did in CHANGELOG.md, for the same reason a released section is never
// edited in place: it is a record. That `git blame` is less useful on the split
// file is accepted - the history is still in git through gitk, git-gui or
// `git log --follow`, and being small enough to open is worth more.
//
// Run it whenever; it is idempotent, so a run with nothing to move only refreshes
// the tables. The natural moment is the start of a month, and the start of a year
// for the year roll-up.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync,
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

// The newest month present is the one that stays. Taken from the file rather
// than from the clock, so two people running this on the same day agree, and so
// a quiet month does not archive itself out from under the next release.
const newest = sections
  .map(s => `${s.year}-${s.month}`)
  .sort()
  .at(-1);
const [keepYear, keepMonth] = newest.split('-');

const staying = sections.filter(s => `${s.year}-${s.month}` === newest);
const leaving = sections.filter(s => `${s.year}-${s.month}` !== newest);

// Where each departing section goes: an earlier month of the current year to a
// month file, an earlier year to that year's file.
const target = s => (s.year === keepYear
  ? join(ARCHIVE, s.year, `${s.month}.md`)
  : join(ARCHIVE, `${s.year}.md`));

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
function archiveHead(kind, label, table) {
  const what = kind === 'year' ? 'per month' : 'per day';
  return `# WeKan ® ${label} releases\n\n`
    + `Moved out of [CHANGELOG.md](${kind === 'year' ? '..' : '../..'}/CHANGELOG.md) to keep that\n`
    + `file small enough to open (wekan/wekan#6580). Nothing here has been changed:\n`
    + `a release section is a record, and it reads the same as it did there.\n\n`
    + `Releases ${what}:\n\n`
    + `${table}\n`;
}

function archiveBody(kind, label, texts) {
  const joined = texts.map(t => t.trimEnd()).join('\n\n');
  return `${archiveHead(kind, label, tableOf(kind, label, joined))}${joined}\n`;
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
  const isMonth = /\d{4}\/\d{2}\.md$/.test(path);
  const label = isMonth
    ? `${group[0].year}-${group[0].month}`
    : group[0].year;
  // Appending to an archive that already exists: read what is there, keep its
  // sections, and rebuild so the table counts all of them.
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const previous = existing
    ? existing.slice(existing.search(/^# v\d+(?:\.\d+)+ /m)).trimEnd()
    : '';
  const texts = group.map(s => s.text);
  if (previous) texts.push(previous);
  const body = archiveBody(isMonth ? 'month' : 'year', label, texts);
  movedBytes += Buffer.byteLength(body);
  if (!dryRun) {
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, body);
  }
  console.log(`  ${dryRun ? 'would write' : 'wrote'} ${path.padEnd(28)}`
    + `${String(group.length).padStart(4)} releases  ${kb(Buffer.byteLength(body))}`);
}

// ── Keep every existing archive's table current ─────────────────────────────
// Over all of them, every run - so a change to how the table is built reaches
// files that no move happened to touch.
function refreshTables() {
  if (!existsSync(ARCHIVE)) return;
  const touched = [];
  const visit = dir => {
    for (const name of readdirSync(dir).sort().reverse()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { visit(path); continue; }
      if (!/^(\d{4}|\d{2})\.md$/.test(name)) continue;
      const body = readFileSync(path, 'utf8');
      const label = /^# WeKan ® ([\d-]+) releases/m.exec(body)?.[1];
      const first = body.search(/^# v\d+(?:\.\d+)+ /m);
      if (!label || first === -1) continue;
      const kind = label.includes('-') ? 'month' : 'year';
      const table = tableOf(kind, label, body);
      if (!table) continue;
      // The whole head, not only the table: an archive written by an earlier
      // version of this script then comes into step rather than staying the odd
      // one out. The sections below are never touched.
      const rebuilt = archiveHead(kind, label, table) + body.slice(first);
      if (rebuilt !== body && !dryRun) { writeFileSync(path, rebuilt); touched.push(path); }
    }
  };
  visit(ARCHIVE);
  if (touched.length) console.log(`changelog-archive: refreshed ${touched.length} table(s).`);
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
      const months = readdirSync(dir).filter(f => /^\d{2}\.md$/.test(f))
        .map(f => f.replace('.md', '')).sort().reverse();
      // The busy year is listed month by month, because that is how it is stored.
      links.push(...months.map(mm => [`${y}-${mm}`, `${ARCHIVE}/${y}/${mm}.md`]));
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
    while (end < header.length && /^ {2}\[[\d-]+\]\(old-CHANGELOG\//.test(header[end])) end += 1;
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
  + `from ${newest} in ${file} (${kb(Buffer.byteLength(text))} -> ${kb(Buffer.byteLength(rebuilt))})`
  + (leaving.length ? `, moved ${leaving.length} to ${ARCHIVE}/ (${kb(movedBytes)}).` : '.'));
