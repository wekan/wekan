#!/usr/bin/env node
// The Snap Store page text of wekan, wekan-ondra and wekan-gantt-gpl, with
// "What's new" first.
//
//   node releases/snap-listing.mjs <snap-name> <version> <CHANGELOG-big.md>
//
// prints the description to give that snap's store listing for release
// v<version>: "What's new in WeKan v<version>" with the release's **In short**
// paragraph from the changelog, then the listing text kept in
// releases/snap-listing/<snap-name>.md.
//
// WHY a file here and not the text the store has now. The Snap Store has no
// API for a REVISION's changelog (the dashboard's "Add changelog" is a web form
// only), so what is new goes on the listing instead, through `snapcraft
// upload-metadata` (releases/snap-listing-update.sh). A description is at most
// 4096 characters, and wekan's hand-written feature list is already 4047 of
// them: the What's new has to push the end of that list off the page. Read back
// from the store, every release would cut it again and the lines cut once
// would be lost for good; read from this file, each release starts from the
// whole text, and the page ends with a link to it.
//
// Pure functions exported for tests/snapListingWhatsNew.test.cjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releasesOf, inShortOf, anchorOf } from './changelog-short.mjs';

export const SNAP_NAMES = ['wekan', 'wekan-ondra', 'wekan-gantt-gpl'];
// The store's own limit for a snap description. Counted in UTF-8 BYTES, the
// stricter reading: the listings carry curly quotes, and which of the two the
// store counts is not documented.
export const DESCRIPTION_LIMIT = 4096;
const size = text => Buffer.byteLength(text, 'utf8');
const REPO = 'https://github.com/wekan/wekan';

// The link that ends a description whose listing text did not fit whole.
export function fullTextUrl(snapName) {
  return `${REPO}/blob/main/releases/snap-listing/${snapName}.md`;
}

// The release's heading and In short paragraph from CHANGELOG-big.md.
export function releaseSummary(big, version) {
  const release = releasesOf(big).find(r => r.version === `v${version}`);
  if (!release) throw new Error(`CHANGELOG-big.md has no "# v${version} ... WeKan ® release" section.`);
  const inShort = inShortOf(release.body);
  if (!inShort) throw new Error(`The v${version} section of CHANGELOG-big.md has no **In short:** paragraph.`);
  return { heading: release.heading, inShort };
}

// "What's new" with a link to the release's changes. The link is pinned to the
// TAG: CHANGELOG-big.md moves old releases into old-CHANGELOG/, and a link to
// main would stop finding the section.
export function whatsNew(version, heading, inShort) {
  const changes = `${REPO}/blob/v${version}/CHANGELOG-big.md#${anchorOf(heading)}`;
  return `**What's new in WeKan v${version}:** ${inShort.replace(/\s*\n\s*/g, ' ')} [All changes](${changes})`;
}

// What's new, then as much of the listing text as fits, in whole lines. When
// any line had to go, the text ends with a link to the whole of it. The What's
// new is never cut: a summary that alone is too long is an error, not a page.
export function composeDescription({ snapName, base, version, heading, inShort, limit = DESCRIPTION_LIMIT }) {
  const head = whatsNew(version, heading, inShort);
  const text = base.replace(/\s+$/, '');
  const whole = `${head}\n\n${text}`;
  if (size(whole) <= limit) return whole;
  const more = `More: ${fullTextUrl(snapName)}`;
  const lines = text.split('\n');
  while (lines.length) {
    lines.pop();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const cut = `${head}\n\n${lines.join('\n')}${lines.length ? '\n\n' : ''}${more}`;
    if (size(cut) <= limit) return cut;
  }
  throw new Error(`What's new for v${version} alone is ${size(head)} bytes, more than the Snap Store's ${limit}: shorten its **In short:** paragraph.`);
}

function main() {
  const [snapName, version, changelog] = process.argv.slice(2);
  if (!SNAP_NAMES.includes(snapName) || !/^\d+\.\d+$/.test(version || '') || !changelog) {
    console.error('Usage: node releases/snap-listing.mjs <wekan|wekan-ondra|wekan-gantt-gpl> <version, e.g. 13.30> <CHANGELOG-big.md>');
    process.exit(2);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const base = fs.readFileSync(path.join(here, 'snap-listing', `${snapName}.md`), 'utf8');
  const { heading, inShort } = releaseSummary(fs.readFileSync(changelog, 'utf8'), version);
  process.stdout.write(composeDescription({ snapName, base, version, heading, inShort }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(`::error::${e.message}`); process.exit(1); }
}
