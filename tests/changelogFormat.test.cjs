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
  // Not "hundreds" any more: CHANGELOG.md holds ONE MONTH since #6580, and the
  // rest is under old-CHANGELOG/. A month of WeKan is 7 to 80 releases, so the
  // floor here is only asking that the file was parsed at all.
  assert.ok(ALL.length > 20, `expected the month's entries, found ${ALL.length}`);
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
  // The sentence that closes a release is prescribed word for word by CLAUDE.md
  // ("Thanks to above GitHub users ..."), so it is 92 characters in every
  // release and cannot be wrapped without changing the established form. Count
  // the lines that COULD be wrapped; otherwise this guard fails once per release
  // for writing the line it requires.
  const CLOSING = 'Thanks to above GitHub users for their contributions and translators for their translations.';
  const over = lines
    .map((line, i) => ({ line: i + 1, text: line }))
    .filter(l => l.text.length > 80 && !/https?:\/\//.test(l.text)
      && !l.text.startsWith('<summary>') && l.text !== CLOSING);
  // The remainder are deep-indented technical notes in old entries.
  assert.ok(over.length <= 250,
    `${over.length} over-long lines without a link, e.g. line ${over[0] && over[0].line}`);
});

test('the newest release follows the rules to the letter', () => {
  // The newest RELEASE: an Upcoming section may sit above it, and it holds
  // whatever has been done since - one entry some days, a dozen on others - so
  // measuring "the release" against it fails on the size of the current day's
  // work. The Upcoming section's own entries are checked by the test below.
  const todo = lines.indexOf('# TODO Later');
  const start = lines.findIndex((l, i) => i > todo && /^# v\d/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^# v\d/.test(l));
  const inSection = ALL.filter(b => b.line > start && b.line < end);
  // At least one CHANGE. A release is as big as the work in it - v10.46 carried
  // two fixes - and "more than five" measured the day rather than the format.
  //
  // An entry OR a bullet: v10.55 is four dependabot updates and nothing else,
  // and CLAUDE.md keeps a dependency batch as plain bullets. Requiring a
  // `<details>` would mean padding one bump into a block whose body repeats its
  // summary, which is the noise that rule exists to prevent.
  const bullets = lines.slice(start, end).filter(l => /^- \*\*/.test(l));
  assert.ok(inSection.length + bullets.length >= 1,
    'and it must have entries or bullets');
  for (const b of inSection) {
    assert.ok(summaryText(b.summary).length <= 120,
      `line ${b.line}: a summary must be a title (${summaryText(b.summary).length} chars)`);
    // The commit it describes - in THIS repository, or in wekan/FerretDB when the
    // change is in the fork WeKan's default database is built from. A WeKan hash
    // for work that is not in this repository points at the wrong change, so the
    // link follows the code rather than the changelog.
    assert.ok(/<a href="https:\/\/github\.com\/wekan\/(wekan|FerretDB)\/commit\//.test(b.summary),
      `line ${b.line}: the summary links the commit it describes`);
  }
});

test('the Upcoming section, when there is one, follows the same rules', () => {
  const start = lines.indexOf('# Upcoming WeKan ® release');
  if (start === -1) {
    console.log('    (no Upcoming section right now - nothing to check)');
    return;
  }

  const end = lines.findIndex((l, i) => i > start && /^# v\d/.test(l));
  assert.ok(end > start, 'it sits above the newest release');
  const inSection = ALL.filter(b => b.line > start && b.line < end);
  // At least one CHANGE - an entry or a plain bullet. Not "at least one
  // <details>": a release whose whole content is a dependency batch is bullets
  // all the way down, which is what CLAUDE.md prescribes for one, and padding a
  // bump into a <details> whose body repeats its summary would be noise added
  // to satisfy a guard.
  const bullets = lines.slice(start, end).filter(l => /^- \*\*/.test(l));
  // EMPTY IS ALLOWED, but only when it says so. releases/release-all.sh opens the
  // next Upcoming as soon as it names a release, because releases here are
  // frequent and the work that follows one needs somewhere to go the moment it
  // starts - without that, entries land in the section just published and a
  // released record has to be repaired from memory (v10.96 and v10.97 both did).
  // So a section carrying the placeholder paragraph is a section nobody has
  // written in yet; a section with real prose and no entries is one somebody
  // meant to write in and did not.
  const placeholder = lines.slice(start, end)
    .some(l => l.startsWith('**In short:** nothing here yet.'));
  if (placeholder) {
    assert.strictEqual(inSection.length + bullets.length, 0,
      'this Upcoming still carries the "nothing here yet" placeholder, but it HAS '
      + 'entries - replace the placeholder with a summary of what they amount to');
  } else {
    assert.ok(inSection.length + bullets.length >= 1,
      'and it has at least one entry or bullet');
  }

  for (const b of inSection) {
    assert.ok(summaryText(b.summary).length <= 120,
      `line ${b.line}: a summary must be a title (${summaryText(b.summary).length} chars)`);
    assert.ok(/<a href="https:\/\/github\.com\/wekan\/(wekan|FerretDB)\/commit\//.test(b.summary),
      `line ${b.line}: the summary links the commit it describes`);
  }
});

test('Upcoming opens with a short summary of the whole release', () => {
  const start = lines.indexOf('# Upcoming WeKan ® release');
  if (start === -1) {
    console.log('    (no Upcoming section right now - nothing to check)');
    return;
  }
  // Between the heading and the first `This release …:` header. It is the first
  // thing a reader sees, and a release this size is otherwise forty collapsed
  // blocks with no way to tell what it amounts to.
  //
  // TWO things live there now, in this order: the **In short:** paragraph, and
  // then the binaries table - what each platform's bundle ships, where it came
  // from and what it hashes to. The table is FULL of links by design, so the
  // "links nothing" rule below applies to the PARAGRAPH, which is what it was
  // ever about: a summary that quietly turns into a second list of entries.
  const firstHeader = lines.findIndex((l, i) => i > start && /^This release .*:$/.test(l));
  assert.ok(firstHeader > start, 'the first subsection header follows it');
  const head = lines.slice(start + 1, firstHeader);
  const tableAt = head.findIndex(l => /^\| Platform \| Binary \|/.test(l));
  const intro = (tableAt === -1 ? head : head.slice(0, tableAt)).join('\n').trim();
  assert.ok(intro.startsWith('**In short:**'),
    'the Upcoming section opens with an **In short:** paragraph');
  // A compact release-level summary, not a second list or progress ledger.
  assert.ok(!/<details>|<summary>/.test(intro), 'prose, not entries');
  assert.ok(!/https?:\/\//.test(intro), 'and it links nothing - the entries do that');
  assert.ok(intro.length > 200, 'and it actually summarises the release');
  const introWords = intro.replace(/^\*\*In short:\*\*\s*/, '').trim().split(/\s+/);
  assert.ok(introWords.length <= 120,
    `and stays high-level rather than becoming a ${introWords.length}-word ledger`);
});

test('Upcoming then says which binaries each platform ships', () => {
  // A WeKan bundle is not only WeKan: it carries a Node.js and a FerretDB that
  // other projects publish, and WHICH source has a given CPU changes from
  // release to release. "Which Node.js is in the arm64 bundle of 10.69, and was
  // it checked" must be answerable from the CHANGELOG rather than from a build
  // log that expires - so the same table the release notes carry is here too,
  // right under the summary. See CLAUDE.md.
  const start = lines.indexOf('# Upcoming WeKan ® release');
  if (start === -1) {
    console.log('    (no Upcoming section right now - nothing to check)');
    return;
  }
  const firstHeader = lines.findIndex((l, i) => i > start && /^This release .*:$/.test(l));
  const head = lines.slice(start + 1, firstHeader);
  const at = head.findIndex(l => /^\| Platform \| Binary \| From \| Version \| SHA256 \|$/.test(l));
  assert.ok(at !== -1,
    'the binaries table follows the summary: | Platform | Binary | From | Version | SHA256 |');
  assert.ok(/^\|( ---+ \|)+$/.test(head[at + 1]), 'with its separator row');

  const rows = [];
  for (let i = at + 2; i < head.length && head[i].startsWith('|'); i++) rows.push(head[i]);
  assert.ok(rows.length >= 2, 'and at least one platform in it');
  const seen = [];
  for (const r of rows) {
    const cells = r.split('|').map(c => c.trim()).filter(Boolean);
    assert.strictEqual(cells.length, 5, `a row has five cells: ${r.slice(0, 60)}`);
    // The URL is the link on the From cell - never a bare URL as visible text.
    assert.ok(/^\[[^\]]+\]\(https:\/\/[^)]+\)$/.test(cells[2]),
      `the From cell links the exact file it came from: ${cells[2]}`);
    // A checksum, or an honest statement that the source publishes none.
    assert.ok(/^`[0-9a-f]{64}`$/.test(cells[4]) || cells[4] === '*no checksum published*',
      `the SHA256 cell is a checksum or says none is published: ${cells[4]}`);
    seen.push(cells[0]);
  }
  // Grouped by platform: one platform's rows stay together, so the table is read
  // a platform at a time rather than hunted through.
  const firstSeen = new Map();
  seen.forEach((p, i) => { if (!firstSeen.has(p)) firstSeen.set(p, i); });
  for (const [p, i] of firstSeen) {
    const last = seen.lastIndexOf(p);
    for (let k = i; k <= last; k++) {
      assert.strictEqual(seen[k], p,
        `${p}'s rows must stay together - ${seen[k]} interrupts them`);
    }
  }
});

test('entries are grouped by area, and no summary repeats its group', () => {
  const start = lines.indexOf('# Upcoming WeKan ® release');
  if (start === -1) return;
  const end = lines.findIndex((l, i) => i > start && /^# v\d/.test(l));

  // A group line is `**Area** - short description.` on one line. NOT a heading:
  // a `##` inside a release breaks the version list.
  const GROUP = /^\*\*([^*]+)\*\* - .+\.$/;
  let group = null;
  let grouped = 0;
  let inEntry = false;
  const loose = [];
  for (let i = start; i < end; i++) {
    const line = lines[i];
    // Only OUTSIDE an entry. An entry's own body uses `**bold**` for emphasis,
    // and a body paragraph that happened to open with one and end in a full
    // stop would otherwise be read as a group heading - silently reassigning
    // every entry after it to a group that does not exist.
    if (line === '<details>') { inEntry = true; }
    if (line === '</details>') { inEntry = false; continue; }
    if (inEntry && !line.startsWith('<summary>')) continue;
    // `(This release|and )` with a space INSIDE the alternative and another one
    // after it needs "and  updates" - two spaces - so every `and ...:` header
    // silently failed to match and never reset the group. Entries under a later
    // subsection were then still attributed to the last group line above them,
    // which is exactly the mistake this loop exists to catch.
    if (/^(This release|and) .*:$/.test(line)) { group = null; continue; }
    if (!inEntry) {
      const m = GROUP.exec(line);
      if (m) { group = m[1]; continue; }
    }
    if (!line.startsWith('<summary>')) continue;
    const text = summaryText(line);
    if (!group) { loose.push(text.slice(0, 60)); continue; }
    grouped++;
    // The point of the grouping: the area is named ONCE, on the group line, and
    // the entry under it says what changed rather than saying the area again.
    // Twelve entries beginning "All Boards:" say it twelve times, and the part
    // that differs starts halfway through the line.
    assert.ok(!text.toLowerCase().startsWith(group.toLowerCase()),
      `line ${i + 1}: "${text.slice(0, 50)}" repeats its group "${group}"`);
    const bare = group.replace(/^The /, '');
    assert.ok(!text.toLowerCase().startsWith(bare.toLowerCase()),
      `line ${i + 1}: "${text.slice(0, 50)}" repeats its group "${bare}"`);
  }
  // MOST of what is there is grouped - not a fixed count. `>= 10` was written
  // against a release with forty entries, and it fails a small release for
  // being small: a dependencies-only one has no entries at all, because
  // CLAUDE.md keeps a dependency batch as plain bullets. What matters is the
  // ratio, and the loose count below is the other half of it.
  const entries = grouped + loose.length;
  assert.ok(entries === 0 || grouped >= entries - 4,
    `the Upcoming entries are grouped (${grouped} of ${entries} are)`);
  // Half grouped and half loose reads as a mistake. The subsections that hold a
  // single entry - developer tooling, documentation, translations - stay flat,
  // so a few loose ones are expected; a pile of them is not.
  assert.ok(loose.length <= 4,
    `${loose.length} entries sit outside any group, e.g. ${loose[0]}`);
});

test('a RELEASED section never claims its binaries were not rebuilt', () => {
  // An Upcoming section that changes no build may say so - "The binaries below
  // are v10.82's: nothing here rebuilds them" - and copy the previous release's
  // table rather than inventing one. Releasing invalidates both halves of that:
  // release-all.sh renames the heading and every bundle IS rebuilt, so the
  // sentence becomes false and the copied table describes the wrong build.
  //
  // v10.83 shipped exactly that way. Its table was v10.82's, so it named
  // FerretDB v1.48.0 when v1.49.0 was built, listed loong64 (skipped this time -
  // debian:trixie publishes no linux/loong64 image) and omitted armhf, armv6,
  // armv7, i386 and win-arm64, which were built. The generated table at the top
  // of the GitHub release notes was right, and the CHANGELOG's contradicted it.
  //
  // The whole point of this table is that "which Node.js is in the arm64 bundle
  // of 10.69, and was it checked" is answerable from the CHANGELOG after the
  // build log has expired. A table carried forward unchanged answers it wrongly,
  // which is worse than not answering.
  // Checked on the NEWEST release only - the one release-all.sh just renamed,
  // where the mistake is fresh and the build log is still there to correct it
  // from. v10.73 through v10.81 carry the same sentence; whether each of those
  // releases really rebuilt its bundles cannot be established now that their
  // logs have expired, and rewriting eight historical tables on a guess would
  // put invented provenance where merely doubtful provenance is. They are left
  // as they shipped.
  const newest = changelog.split(/^# (?=v\d)/m)[1] || '';
  const version = (newest.match(/^v[\d.]+/) || ['?'])[0];
  assert.ok(!/nothing here rebuilds them/.test(newest),
    `${version} carries the Upcoming section's "nothing here rebuilds them" - ` +
    `a release rebuilds every bundle, so its table has to be that build's own ` +
    `provenance (releases/provenance-table.sh prints it from provenance.tsv, ` +
    `and the same table heads the GitHub release notes)`);
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
  assert.ok(/The Upcoming section opens with an `\*\*In short:\*\*` paragraph/.test(claude));
  assert.ok(/Inside a subsection, entries are GROUPED BY TOPIC\/AREA/.test(claude));
  assert.ok(/release summary → topic summary → commit\s+detail/.test(claude));
});

console.log(`\n${passed} tests passed`);
