#!/usr/bin/env node
// changelog-short.mjs - write CHANGELOG.md, the short changelog, from
// CHANGELOG-big.md.
//
// CHANGELOG-big.md is the changelog that is written: # Status, # Upcoming and
// every release in full, with its <details> entries (CLAUDE.md, "CHANGELOG").
// CHANGELOG.md is only read: the "In short" paragraph of the unreleased
// # Upcoming WeKan ® release, when there is one, and then of each of the five
// newest releases, in plain Markdown - no <details>, <summary> or HTML links -
// so it reads the same on GitHub, in the Sandstorm App Market (which shows it,
// sandstorm-pkgdef.capnp) and in a terminal. It is never edited by hand: run
// this after every change to CHANGELOG-big.md's Upcoming section ("update
// wekan changelog", CLAUDE.md), releases/release-all.sh runs it after naming
// the new release, and tests/changelogShort.test.cjs fails when it is not what
// this writes.
//
//   node releases/changelog-short.mjs            # write CHANGELOG.md
//   node releases/changelog-short.mjs --check    # exit 1 if it is out of date
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BIG = 'CHANGELOG-big.md';
export const SHORT = 'CHANGELOG.md';
export const RELEASES = 5;

const RELEASE_HEADING = /^# (v\d+\.\d+(?:\.\d+)? \d{4}-\d{2}-\d{2} WeKan ® release)\s*$/;
export const UPCOMING_HEADING = 'Upcoming WeKan ® release';

// The anchor GitHub gives a heading, as releases/release-notes.sh builds it:
// lower case, without anything but letters, digits, spaces and hyphens, and
// spaces as hyphens - "v12.72 2026-10-30 WeKan ® release" ->
// "v1272-2026-10-30-wekan--release".
export function anchorOf(heading) {
  return heading.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-');
}

// Plain Markdown: <details>, <summary> and their closing tags go, keeping the
// text inside them; an HTML link becomes a Markdown link.
export function toMarkdown(text) {
  return text
    .replace(/<a\s+[^>]*?href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => `[${label.trim()}](${href})`)
    .replace(/<a\s+[^>]*?href\s*=\s*'([^']*)'[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => `[${label.trim()}](${href})`)
    .replace(/<\/?(?:details|summary)\b[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// The releases of the big changelog, newest first: { heading, version, body }.
export function releasesOf(big) {
  const lines = big.split('\n');
  const releases = [];
  let current = null;
  for (const line of lines) {
    const m = RELEASE_HEADING.exec(line);
    if (m) {
      current = { heading: m[1], version: m[1].split(' ')[0], body: [] };
      releases.push(current);
    } else if (/^# /.test(line)) {
      current = null;
    } else if (current) {
      current.body.push(line);
    }
  }
  return releases.map(r => ({ ...r, body: r.body.join('\n') }));
}

// The unreleased section's body, or null when there is none (right after a
// release, until somebody adds the first entry).
export function upcomingOf(big) {
  const lines = big.split('\n');
  const start = lines.indexOf(`# ${UPCOMING_HEADING}`);
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !/^# /.test(lines[end])) end += 1;
  return lines.slice(start + 1, end).join('\n');
}

// A release's "In short" paragraph, without its label; '' when it has none.
export function inShortOf(body) {
  // To the first blank line. Not `$` with the m flag: that is the end of the
  // first LINE, and kept only the paragraph's first line.
  const m = /^\*\*In short:\*\*[ \t]*([\s\S]*?)(?=\n[ \t]*\n|(?![\s\S]))/m.exec(body);
  return m ? toMarkdown(m[1]) : '';
}

export function shortChangelog(big) {
  const parts = [
    `The upcoming WeKan release and the ${RELEASES} newest, in short. Everything`,
    `each one changed and the project status are in`,
    `[${BIG}](${BIG}), and older releases in [old-CHANGELOG](old-CHANGELOG/).`,
    '',
    `Written by \`node releases/changelog-short.mjs\` from ${BIG}:`,
    'make changes there.',
  ];
  const upcoming = upcomingOf(big);
  if (upcoming !== null) {
    const summary = inShortOf(upcoming);
    parts.push('', `# ${UPCOMING_HEADING}`, '');
    if (summary) parts.push(summary, '');
    parts.push(`[All changes so far](${BIG}#${anchorOf(UPCOMING_HEADING)})`);
  }
  for (const release of releasesOf(big).slice(0, RELEASES)) {
    const summary = inShortOf(release.body);
    parts.push('', `# ${release.heading}`, '');
    if (summary) parts.push(summary, '');
    parts.push(`[All changes in ${release.version}](${BIG}#${anchorOf(release.heading)})`);
  }
  return parts.join('\n') + '\n';
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const big = fs.readFileSync(path.join(root, BIG), 'utf8');
  const want = shortChangelog(big);
  const file = path.join(root, SHORT);
  const have = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (have !== want) {
      console.error(`${SHORT} is not what ${BIG} gives: run node releases/changelog-short.mjs`);
      process.exit(1);
    }
    return;
  }
  if (have !== want) fs.writeFileSync(file, want);
  console.log(`${SHORT}: the upcoming release and the ${RELEASES} newest from ${BIG}, in short.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
