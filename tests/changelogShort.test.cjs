'use strict';
// CHANGELOG.md is the short changelog: the In short paragraph of the
// unreleased Upcoming section, then of each of the five newest releases, in
// plain Markdown, written from CHANGELOG-big.md by releases/changelog-short.mjs.
// CHANGELOG-big.md is the one that is written.
// Run: node tests/changelogShort.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

(async () => {
  const short = await import(path.join(ROOT, 'releases/changelog-short.mjs'));
  const big = read('CHANGELOG-big.md');
  const small = read('CHANGELOG.md');

  test('CHANGELOG.md is exactly what changelog-short.mjs writes from CHANGELOG-big.md', () => {
    assert.equal(small, short.shortChangelog(big), 'run node releases/changelog-short.mjs');
  });

  test('it has the five newest releases, newest first, each with its In short', () => {
    const headings = [...small.matchAll(/^# (v\S+ \d{4}-\d{2}-\d{2} WeKan ® release)$/gm)].map(m => m[1]);
    const newest = short.releasesOf(big).slice(0, 5);
    assert.equal(short.RELEASES, 5);
    assert.deepEqual(headings, newest.map(r => r.heading));
    for (const release of newest) {
      const summary = short.inShortOf(release.body);
      assert.ok(summary.length > 40, `${release.version} has an In short`);
      assert.ok(small.includes(summary), `${release.version}'s In short is there whole`);
      // Whole: the paragraph's last line too, not only its first.
      const last = summary.split('\n').pop();
      assert.ok(small.includes(last), `${release.version}: ${last}`);
    }
  });

  test('the unreleased Upcoming comes first, with its In short, and links its section', () => {
    const upcoming = short.upcomingOf(big);
    assert.ok(upcoming !== null, 'CHANGELOG-big.md has an Upcoming section now');
    const first = small.match(/^# .+$/m)[0];
    assert.equal(first, '# Upcoming WeKan ® release', 'Upcoming is the first section');
    const summary = short.inShortOf(upcoming);
    assert.ok(summary.length > 40 && small.includes(summary), 'its In short, whole');
    assert.ok(small.indexOf(summary) < small.indexOf('\n# v'), 'above the releases');
    assert.match(small, /\[All changes so far\]\(CHANGELOG-big\.md#upcoming-wekan--release\)/);
    assert.ok([...big.matchAll(/^# (.+)$/gm)].some(m => short.anchorOf(m[1]) === 'upcoming-wekan--release'));
    // Right after a release there is no Upcoming yet, and none is invented.
    const released = big.replace(/^# Upcoming WeKan ® release$/m, '# v99.99 2099-01-01 WeKan ® release');
    assert.doesNotMatch(short.shortChangelog(released), /^# Upcoming/m);
    assert.match(short.shortChangelog(released), /^# v99\.99 2099-01-01 WeKan ® release$/m, 'it becomes the newest release');
  });

  test('each release links its full section in CHANGELOG-big.md, and the anchor exists', () => {
    const bigAnchors = new Set([...big.matchAll(/^# (.+)$/gm)].map(m => short.anchorOf(m[1])));
    const links = [...small.matchAll(/\[All changes in (v\S+)\]\(CHANGELOG-big\.md#([^)]+)\)/g)];
    assert.equal(short.anchorOf('Upcoming WeKan ® release'), 'upcoming-wekan--release');
    assert.equal(links.length, 5);
    for (const [, version, anchor] of links) assert.ok(bigAnchors.has(anchor), `${version}: #${anchor}`);
    // The anchor GitHub gives, as releases/release-notes.sh builds it.
    assert.equal(short.anchorOf('v12.72 2026-10-30 WeKan ® release'), 'v1272-2026-10-30-wekan--release');
  });

  test('negative: no Status or TODO Later, no details or summary tags, no HTML links', () => {
    assert.doesNotMatch(small, /^# (?:Status|TODO Later)\b/m);
    assert.equal((small.match(/^# Upcoming/gm) || []).length, 1, 'one Upcoming, never two');
    assert.doesNotMatch(small, /More status info|Newest WeKan at these platforms|Carried to a future release/);
    for (const tag of ['<details>', '</details>', '<summary>', '</summary>']) assert.ok(!small.includes(tag), tag);
    assert.doesNotMatch(small, /<a\s|<\/a>|<details|<summary/i);
    assert.match(small, /\[CHANGELOG-big\.md\]\(CHANGELOG-big\.md\)/, 'it says where everything else is');
  });

  test('HTML becomes plain Markdown, and plain text is left as it is', () => {
    assert.equal(short.toMarkdown('<details>\n<summary><a href="https://e/c/1">Fixed it</a>. Thanks.</summary>\n\nLong.\n\n</details>'),
      '[Fixed it](https://e/c/1). Thanks.\n\nLong.');
    assert.equal(short.toMarkdown("See <a class='x' href='https://e/2'> two </a> now"), 'See [two](https://e/2) now');
    assert.equal(short.toMarkdown('**Bold** and [md](https://e) and `<code>`'), '**Bold** and [md](https://e) and `<code>`');
    assert.equal(short.inShortOf('**In short:** one\ntwo\n\nnot this'), 'one\ntwo');
    assert.equal(short.inShortOf('no summary here'), '');
  });

  test('a release is written into CHANGELOG-big.md, and CHANGELOG.md follows it', () => {
    const release = read('releases/release-all.sh');
    const rename = release.indexOf('CHANGELOG-big.md > "$_tmp" && mv "$_tmp" CHANGELOG-big.md');
    const archive = release.indexOf('node "$REPO_DIR/releases/changelog-archive.mjs"');
    const generate = release.indexOf('node "$REPO_DIR/releases/changelog-short.mjs"');
    assert.ok(rename > 0 && archive > rename && generate > archive, 'rename, archive, then the short changelog');
    assert.ok(generate < release.indexOf('git add --all'), 'committed in the same release commit');
    assert.match(read('releases/check-upcoming-release.sh'), /CHANGELOG-big\.md/);
    assert.equal(JSON.parse(read('releases/remote-release.json')).changelog, 'CHANGELOG-big.md');
    assert.match(read('releases/remote-release.py'), /subprocess\.run\(\['node', 'releases\/changelog-short\.mjs'\]/);
    assert.match(read('releases/release-notes.sh'), /blob\/main\/CHANGELOG-big\.md#\{anchor\}/);
    assert.match(read('releases/changelog.sh'), /changelog-short\.mjs/);
    // The Sandstorm App Market shows the short one.
    assert.match(read('sandstorm-pkgdef.capnp'), /changeLog = \(defaultText = embed "CHANGELOG\.md"\)/);
    // Negative: no release tool writes the short file as if it were the big one.
    for (const tool of ['releases/release-all.sh', 'releases/fix-changelog-hashes.sh', 'releases/changelog-archive.mjs',
      'releases/changelog-wrap.mjs', 'releases/latest-release-version.sh', 'releases/version.sh']) {
      assert.doesNotMatch(read(tool).replace(/^#.*$/gm, '').replace(/^\s*\/\/.*$/gm, ''), /(?<!-)CHANGELOG\.md(?![\w-])(?!.*short)/,
        `${tool} still names CHANGELOG.md`);
    }
  });

  for (const [name, fn] of tests) { fn(); passed += 1; console.log('  ok -', name); }
  console.log(`changelogShort: ${passed} tests passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
