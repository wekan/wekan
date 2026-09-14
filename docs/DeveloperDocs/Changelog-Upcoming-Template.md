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
once real content exists, and follow with your `<details>` entries as
CLAUDE.md's/AGENTS.md's CHANGELOG section describes.

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
```

**Do not add a binaries provenance section or table to the changelog or
release notes.** Release notes list only updated languages for each Translations group.
Add `**Languages updated:** Esperanto, Galician` below that group label
with the actual affected full language names. Detailed entries stay here;
release notes include only In short, Security, translation languages,
the standard thanks line and a More details at ChangeLog release anchor link.
Keep checksum verification and `provenance.tsv` build artifacts separately;
never append `releases/provenance-table.sh` output to release notes.

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

## Read-only release preflight

Run `bash releases/check-upcoming-release.sh` to check release notes without
changing files or contacting a forge. Exactly one Upcoming section containing
a linked release entry is required. Missing, empty or duplicate sections fail
with an error. `release-all.sh` performs this check before installing tools or
changing files; explicit version arguments also require Upcoming notes. An
existing released heading is no longer reused when Upcoming notes are absent.
