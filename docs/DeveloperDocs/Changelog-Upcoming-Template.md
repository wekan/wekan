# Adding a "# Upcoming WeKan ® release" section to CHANGELOG.md

`CHANGELOG.md` does **not** carry an empty `# Upcoming WeKan ® release`
placeholder between releases. `releases/release-all.sh` used to auto-create one
immediately after every release, with an `**In short:** nothing here yet.`
paragraph — so the file always had a section that said nothing, sitting there
until the first real entry replaced it. That is what moved here: the file stays
without an Upcoming section until there is something upcoming to say.

**Add the section yourself, by hand, the moment you have your first real entry
for the next release** — not before. Copy the skeleton below above the newest
`# v<N> <date> WeKan ® release` heading, replace the `**In short:**` paragraph
once real content exists, follow with your `<details>` entries as
CLAUDE.md's/AGENTS.md's CHANGELOG section describes, and end with the
`**Binaries in these bundles:**` table — **the order matters**: `**In short:**`
first, then every content subsection, and the binaries table LAST, right
before the closing `Thanks to above GitHub users …` line. Not right under the
summary: a reader opens a release to find out what changed, and the
platform/SHA256 table is reference material for whoever needs it, not the
second thing anyone reads.

```markdown
# Upcoming WeKan ® release

**In short:** <one compact paragraph, 2–4 sentences, ~120 words max, naming the
release's major outcomes or themes with notable names in **bold**. Not a commit
inventory — see the CHANGELOG rules for what this paragraph is and is not.>

This release adds/fixes the following <area>:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/<hash>">Short outcome of the commit</a>. Thanks to xet7.</summary>

The longer description: what was wrong, why, what it does now, what the test
pins.

</details>

**Binaries in these bundles:**

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/vX.Y.Z/node-vX.Y.Z-linux-x64.tar.xz) | vX.Y.Z | `<sha256>` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/vA.B.C/ferretdb-amd64) | vA.B.C | `<sha256>` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/vX.Y.Z/node-vX.Y.Z-linux-arm64.tar.xz) | vX.Y.Z | `<sha256>` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/vA.B.C/ferretdb-arm64) | vA.B.C | `<sha256>` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/vX.Y.Z/node-vX.Y.Z-darwin-arm64.tar.xz) | vX.Y.Z | `<sha256>` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/vA.B.C/ferretdb-mac-arm64) | vA.B.C | `<sha256>` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/vX.Y.Z/node-vX.Y.Z-darwin-x64.tar.xz) | vX.Y.Z | `<sha256>` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/vA.B.C/ferretdb-mac-x64) | vA.B.C | `<sha256>` |
```

The table starts as a **copy of the newest released section's own table** (same
platforms are normally still built), not the placeholder rows above — those are
only shown here because this file has no release to copy from. `release-all.yml`
refills it from each build job's `provenance.tsv` when the release is actually
made, so getting it approximately right by hand costs nothing.

## Why this exists instead of an auto-created empty section

`releases/release-all.sh` used to call `releases/changelog-open-next.mjs`
right after renaming `# Upcoming WeKan ® release` to `# v<NEW> …`, so the file
always had a fresh, empty Upcoming section to write into. The reasoning was
real: without *some* section to write into, an entry added after a release —
and releases here are frequent, several a day — has nowhere correct to go
except appended above the closing `Thanks to above GitHub users …` line, which
puts it **inside the release that was just published**. That happened twice
(v10.96 and v10.97), and the second time was worse than merely misplaced: an
entry already published was edited afterward to describe a smaller, tidier
change than the one that actually shipped.

The auto-created section fixed that at the cost of a CHANGELOG that always
carried a paragraph saying nothing, and a table nobody had reason to check was
still current between releases. What actually prevents entries landing in the
wrong section is `tests/changelogEntriesBelongToTheirRelease.test.cjs`: it asks
git which commits a release actually contains and fails if a released section
links one that is not an ancestor of that release — regardless of whether an
Upcoming section existed to catch the entry first. That test is the real guard
and needed no empty placeholder to work. So: write the section yourself when
there is something to put in it, using the skeleton above, and let the test
catch the mistake if an entry still ends up in the wrong place.
