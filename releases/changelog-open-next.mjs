#!/usr/bin/env node
'use strict';

// changelog-open-next.mjs — after a release is named, open the section the NEXT
// one's entries belong in.
//
// Usage: node releases/changelog-open-next.mjs <version> [CHANGELOG.md]
//
// WHY. Releases here are frequent - the normal maintenance loop is build.sh
// option 1 (git pull + git push) and releases/release-all.sh, several times a
// day - so work continues immediately after a release. release-all.sh renames
// `# Upcoming WeKan ® release` to `# v<NEW> <date> WeKan ® release`, and until
// now left no Upcoming behind. The next entry then had nowhere correct to go.
//
// That has twice cost a released section its accuracy: with no `# Upcoming`
// heading, an entry appended above the first "Thanks to above GitHub users" line
// lands INSIDE the release just published, describing work that is not in it.
// A released section is a record, and repairing one afterwards means deciding
// from memory what it did and did not contain - v10.96 and v10.97 both needed
// that, and the second one had an entry EDITED after release, which is worse
// than an entry misplaced.
//
// So the next section is created while it is still unambiguous. The skeleton
// carries what tests/changelogFormat.test.cjs requires of an Upcoming section -
// an `**In short:**` paragraph and the binaries table - so the file is valid the
// moment release-all.sh finishes, and the placeholder says plainly that it is
// one. The table is carried forward from the release just named: the same
// platforms are built, and release-all.yml refills it from each build job's
// provenance.tsv when the next release is made.

import { readFileSync, writeFileSync, existsSync } from 'fs';

const version = process.argv[2];
const file = process.argv[3] || 'CHANGELOG.md';

if (!version) {
  console.error('usage: node releases/changelog-open-next.mjs <version> [CHANGELOG.md]');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`changelog-open-next: ${file} does not exist`);
  process.exit(2);
}

const text = readFileSync(file, 'utf8');

// Already open: nothing to do, and doing it twice would give the file two.
if (/^# Upcoming WeKan ® release\s*$/m.test(text)) {
  console.log('changelog-open-next: an Upcoming section is already there; nothing to do.');
  process.exit(0);
}

// NO REGEX BUILT FROM THE VERSION. It used to be
//
//   new RegExp(`^# v${version.replace(/\./g, '\\.')} .*$`, 'm')
//
// which GitHub CodeQL flagged TWICE on one line - js/incomplete-sanitization
// (#433) and js/regex-injection (#432) - and it was right on both counts:
//
//   * escaping `.` and not `\` is the classic half-escape. A version containing
//     a backslash would have escaped the backslash and left the next character
//     bare;
//   * the version is an argv value, so it reaches `new RegExp` as a pattern.
//
// A version number is not attacker-controlled here - release-all.sh computes it
// from the CHANGELOG - so neither is exploitable in this script. But the fix
// worth making is the one that removes the question rather than answering it,
// which is CodeQL's own first recommendation: design so that sanitization is not
// needed. There is no regex now, so there is nothing to escape and nothing to
// inject. A line either starts with this exact text or it does not.
const needle = `# v${version} `;
const lines = text.split('\n');
const lineNo = lines.findIndex(line => line.startsWith(needle));
if (lineNo === -1) {
  console.error(`changelog-open-next: no "# v${version} ..." heading in ${file}, so there is `
    + 'nothing to open a section above. Was the release renamed?');
  process.exit(1);
}
// Where that line begins, in characters: every earlier line plus its newline.
const at = lines.slice(0, lineNo).reduce((n, line) => n + line.length + 1, 0);

// The binaries table of the release just named, carried up as the starting point.
const tableMatch = /^\| Platform \| Binary \| From \| Version \| SHA256 \|[\s\S]*?(?=\n\n)/m
  .exec(text.slice(at));
const table = tableMatch ? tableMatch[0]
  : '| Platform | Binary | From | Version | SHA256 |\n| --- | --- | --- | --- | --- |';

const skeleton = `# Upcoming WeKan ® release

**In short:** nothing here yet. This paragraph is the first thing a reader sees,
so replace it as entries are added: say what the release amounts to, which areas
changed and what changed about them, with the notable names in **bold**, and
account for the rest in a closing clause. The table below is carried over from
the release under this one, and is refilled from each build's provenance.tsv
when this release is made.

${table}

`;

writeFileSync(file, text.slice(0, at) + skeleton + text.slice(at));
console.log(`changelog-open-next: opened "# Upcoming WeKan ® release" above v${version}.`);
