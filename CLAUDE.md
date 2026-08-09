# CLAUDE.md — instructions Claude reads first

Claude Code reads this file at the repo root before doing work here. Follow it.

## First: who maintains this, and who is committing?

**WeKan and every repository under `.tools/` are maintained by Lauri Ojansivu
(xet7) `<x@xet7.org>`** — [wekan/wekan](https://github.com/wekan/wekan),
[wekan/FerretDB](https://github.com/wekan/FerretDB),
[wekan/node-patches](https://github.com/wekan/node-patches) and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches). Work done
on the maintainer's behalf is committed as **`Lauri Ojansivu <x@xet7.org>`** — that
author, in every one of those repositories, every time. Two rules follow from it and
neither has an exception:

- **Never attribute a commit to an AI.** No `Co-Authored-By:` trailer, no "Generated
  with", no assistant or model name — not in the commit message, not in a pull-request
  body, not in the CHANGELOG. [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) is where this
  comes from: *"For pull requests, mention only those participants that are
  **human**."* A `Thanks to ... and xet7 !` line credits people — the issue reporter
  and xet7 — never a tool.
- **If the git identity is missing or wrong in one of these checkouts, set it; do not
  commit under something else.** The `.tools/` clones are made by `build.sh` inside
  this checkout and can come up with no `user.name`/`user.email` of their own, which
  would silently author a commit as whatever the machine's default is:

  ```
  git -C .tools/<repo> config user.name  'Lauri Ojansivu'
  git -C .tools/<repo> config user.email 'x@xet7.org'
  ```

Check the current git identity before committing or releasing:

```
git config user.name && git config user.email
```

- **Maintainer mode** — the identity is `Lauri Ojansivu <x@xet7.org>` (name
  `Lauri Ojansivu`, email `x@xet7.org`), or it is unset in a checkout of one of the
  repositories above, which means it is to be SET to that as above rather than worked
  around. Then: commit **directly to the current branch** as
  `Lauri Ojansivu <x@xet7.org>` with no AI trailer and no pull request, and the
  **publishing / release steps** below are available.
- **Contributor mode** — the identity is somebody ELSE, in a fork or a clone of your
  own. Then: do **not** commit directly to the branch and do **not** run any
  release/publishing step. Make changes on a branch and open a **pull request** for
  the maintainer to review, and keep that pull request free of AI attribution too.
  The "commit as Lauri Ojansivu", "commit directly", and all release instructions
  below are **maintainer-only and do not apply to you**.

Everything below marked as maintainer-specific (committing directly, the exact commit
author, and the entire "Making a release" / publishing flow) applies only in maintainer
mode. The rest (translation policy, CHANGELOG structure, tests, validating from code) is
good practice for everyone.

## Process: "Fix open issues"

When asked to fix an open issue (one issue at a time):

1. **Read the whole issue** — the description AND all comments (e.g.
   `gh issue view <n> --comments`, or the GitHub API `.../issues/<n>/comments`).
2. **If it is a bug, first check whether it is already fixed** in the current WeKan
   AND FerretDB source code (read the actual code, not just changelogs). It may have
   been fixed already.
3. **If it is NOT fixed yet, fix it**, using the newest documentation and issues of
   the dependencies involved, checking where the newest MAINTAINED dependency lives and
   reading its source and issues:
   - Meteor 3 docs — https://docs.meteor.com/
   - Meteor 3 source + issues — https://github.com/meteor/meteor/issues
   - other Meteor software docs/code (e.g. Rocket.Chat) for how they solved it
   - Meteor forums — https://forums.meteor.com
   - AtmosphereJS — https://atmospherejs.com/ ; Packosphere — https://packosphere.com/
   - Meteor Community Packages — https://github.com/meteor-community-packages
   - Meteor-Files — https://github.com/veliovgroup/Meteor-Files
   - npm — https://www.npmjs.com
4. **After fixing, add tests** — unit tests, negative tests, and UI tests where
   appropriate — and **run the new tests to verify they pass** (see Tests / the sandbox
   build+test instructions in `docs/Security/Sandboxes/vscode/README.md`).
5. **Commit** (maintainer only — when the current git user is `Lauri Ojansivu
   <x@xet7.org>`), with no "Co-Authored" / AI trailer, a message body ending:

   ```
   Thanks to (GitHub nickname of the issue creator) and xet7 !

   Fixes #1234,
   ```
6. **If the bug is already fixed**, still add a commit that CLOSES the issue (a commit
   whose message ends `Fixes #1234,`), noting where/when it was fixed.

Fix from source and test — do not guess. If the environment cannot run the relevant
test (e.g. Docker is unavailable in this sandbox), reproduce as closely as possible
from source and say clearly what was and was not verified.

## Translations (Transifex ↔ direct LLM fill, no external service)

WeKan translations live in `imports/i18n/data/<lang>.i18n.json` (flat
`key -> string`, 2-space indent, key order matches `en.i18n.json`). Transifex holds
the human translations. **The policy is: never overwrite a human translation with a
filled (or English) one, but always take the newest translations from Transifex.**

- Pull with `releases/translations/pull-translations.sh`. It runs `tx pull -a -f`
  (which fills every string that is UNtranslated on Transifex with the English source)
  and then a **per-key merge** (`releases/translations/merge-translations.mjs`) that,
  for every language file and every key:
  - Transifex has a real translation (pulled value differs from English) → **keep it**
    (the newest human translation always wins);
  - the pull reverted it to English but a human translation is committed in git →
    **restore the committed translation** (a pull never reverts a human translation,
    even in files that also received real new Transifex translations);
  - **no translation anywhere** (untranslated on Transifex AND never committed) → leave
    the English source as a placeholder. **This is the only case a non-human value is
    used.** A separate fill step may fill *only* these English placeholders, so a filled
    string can never overwrite a human translation.
- Restored languages are pushed back to Transifex so they stop reverting.

### Filling the remaining untranslated strings — directly, no translation service

The strings still equal to the English source after the merge are the ones untranslated
**everywhere** (Transifex + git). Translate these **directly** — the maintainer or the
assistant (an LLM) writes the translation itself, using that language's **existing
translations** and general **kanban terminology** for the language as the reference.
**Do NOT wire up any external translation service, API, endpoint, key or password** — an
earlier `machine-translate.mjs` that called LibreTranslate/DeepL is removed on purpose
(it did not work and needed a password). There is **no `WEKAN_MT*` env var** anymore.

- `node releases/translations/fill-translations.mjs --missing` — per-language count of
  strings still needing translation (English + `en-*` variants are skipped: English by
  design). Also printed at the end of `pull-translations.sh`.
- `node releases/translations/fill-translations.mjs --list <lang> [--limit N]` — dump the
  untranslated keys of a language as `{ key: englishSource }` for the translator to fill.
- `node releases/translations/fill-translations.mjs --apply <lang> <translated.json>` —
  merge the translations back. It writes **only** into placeholder keys, so it can
  **never** overwrite a human translation, and a value still equal to English/empty is
  ignored. Key order and 2-space indent are preserved.

**Both directions are safe, and it is verified:**
`node releases/translations/verify-human-preference.mjs` proves (pure-logic, no network)
that the pull-merge keeps/restores human translations and that a fill only touches
placeholders. Filled strings stay **local** — they are **NOT** pushed to Transifex (only
the merge-restored human languages are pushed), so a filled string can never masquerade
as human there. So: **only missing strings are ever filled, only when missing
everywhere, human strings are always preferred and merged**, and nothing you fill is
pushed to Transifex as if it were human.

## General practices (from ../log/v10/Claude.txt)

- **[maintainer only]** Commit as `Lauri Ojansivu <x@xet7.org>`, with **no**
  "Co-Authored-By" or any other AI trailer, directly to the `main` branch of WeKan and
  the `main-v1` branch of the FerretDB fork. **Do not make pull requests.** (Contributors
  do the opposite: work on a branch and open a pull request — see the top section.)
  This is the same rule as the top section, restated where the release work is: one
  author, `Lauri Ojansivu <x@xet7.org>`, and no AI attribution anywhere.
- Lauri Ojansivu (xet7) maintains WeKan (https://wekan.fi), the FerretDB v1 fork, and
  the two patch repositories under `.tools/` — node-patches and mongo-tools-patches.
- Directory structure:
  - `wekan` — this repo (https://github.com/wekan/wekan); see
    `docs/DeveloperDocs/Directory-Structure.md`; `CHANGELOG.md` at root.
  - `../w/wekan.fi` — the WeKan website.
  - `.tools/` — companion repos cloned INSIDE this checkout, in one directory
    that `.gitignore` and `.meteorignore` already exclude (they used to be one
    ignored subdirectory each at the repo root). `build.sh`'s `ensure_tool_repo`
    clones one on demand, so a fresh checkout needs no manual setup:
    `.tools/FerretDB`, `.tools/node-patches`, `.tools/mongo-tools-patches`.
  - `.tools/FerretDB` (cloned on demand) — https://github.com/wekan/FerretDB, its own
    `CHANGELOG.md`. FerretDB `.go` files must contain **no** application-specific names
    (say "the client" / "a Meteor 3 driver" / a bare `#NNNN`); its `CHANGELOG.md` may
    use `wekan/wekan#NNNN`.
  - `.tools/sandstorm` (when present) — https://github.com/sandstorm-io/sandstorm.

### CHANGELOG

- During development, add entries under a new `# Upcoming WeKan ® release` section above
  the newest release (FerretDB uses `## Upcoming FerretDB release`). Do **not** hand-edit
  `package.json` or any other version reference — the release workflow bumps those.
- **The file's shape, top to bottom** — keep it exactly as it is now:
  1. `# Platforms` — the line `Newest WeKan at these platforms:` and the Install /
     Upgrade / Docs / Mac ChangeLog bullets, then a `<details>` whose `<summary>` is
     `Version` holding "which WeKan version uses what". There is no `# Version`
     heading of its own.
  2. `# TODO Later` — a `<details>` whose `<summary>` is `Carried to a future
     release.` explaining the list, then one `<details>` per category (below).
  3. The releases, newest first, each `# v<MAJOR>.<MINOR> YYYY-MM-DD WeKan ® release`.

  Nothing else is an `#` heading. A `##`/`###` inside a release would break the
  version list, and a wrapped line that BEGINS with `#` (e.g. an issue number such
  as `#6514`) becomes a heading too — escape it `\#6514` or keep it off the line
  start.
- **A release's order of subsections** — CRITICAL SECURITY ISSUES first, then new
  features, then the Admin Panel / UI reorganisation if there is one, then dependency
  updates (`Thanks to dependabot.`), then bug fixes, then developer-facing changes,
  documentation and translations. The section ends with the line `Thanks to above
  GitHub users for their contributions and translators for their translations.`
- **Every entry is a `<details>` block, and they are what a release is made of.**
  The `<summary>` is the SHORT description of what was done and IS the link to the
  commit — the hash lives in the `href` and is never on the page — followed by the
  `Thanks to …` sentence. Clicking it reveals the long description:

  ```
  <details>
  <summary><a href="https://github.com/wekan/wekan/commit/<hash>">Short description of
  what was done</a>. Thanks to (issue creator's GitHub nickname) and xet7.</summary>

  The long description: what was wrong, why, what it does now, what the test pins.
  Word-wrapped at 80 characters, ordinary markdown - links, `code`, emphasis.

  </details>
  ```

  Exactly as above: `<details>` and `</details>` each on their own line, the whole
  `<summary>…</summary>` on ONE line, a blank line under it, the body, a blank line,
  the close — and a blank line between two blocks.
- **The summary is one line at a glance** — aim for ≤ 110 characters — and PLAIN text:
  no `[text](url)`, no `**bold**`, no backticks inside `<summary>`, because a link
  cannot nest inside the `<a>` and the rest renders literally. It ends with a full
  stop, then `Thanks to …`. Every summary in a release links its own commit.
- **A change with nothing more to say stays a plain bullet** —
  `- [Short description](https://github.com/wekan/wekan/commit/<hash>). Thanks to xet7.`
  — and a dependency batch keeps its `- **package 1.2.3 → 1.2.4** — one line on what
  it is` bullets, closing with `Thanks to dependabot.` A `<details>` whose body only
  repeats its summary is noise; use one when there IS a longer story to reveal, which
  is most fixes.
- **`# TODO Later` blocks are the same shape with two differences:** the `<summary>` is
  the short category text (no `<a>`, because nothing was committed), and there is **no
  `Thanks to`** — nothing is done yet, so there is nobody to thank. The body lists the
  issues as `[#NNNN](https://github.com/wekan/wekan/issues/NNNN) (one-line reason)`.
- **The hash is never the link text.** `[f1c89548e](…)` shows a hash to a reader who
  cannot do anything with it; the link text says what changed. Same for `[merge
  commit](…)` and for a bare URL — see the next rule.
- **Never show a long URL as visible text.** A link is always
  `[short text](url)` — an issue is `[#6524](…/issues/6524)`, an advisory is
  `[GHSA-xxxx](…)`, a security page is `[ZipBleed](https://wekan.fi/hall-of-fame/zipbleed/)`.
- **Subsection headers read as ONE flowing sentence.** The FIRST subsection of a release
  starts with `This release ` (e.g. `This release fixes the following bugs:`); every LATER
  subsection in the SAME release starts with a lowercase `and ` instead of repeating
  `This release ` — e.g.
  `This release fixes the following bugs:` … `and updates the following dependencies:` …
  `and has the following developer-tooling fix:` … `and improves the translation workflow:`
  … then the closing `Thanks to above GitHub users …` line. A release with only one
  subsection just keeps its single `This release …:` header. Use `and adds the following
  new features:`, `and fixes the following bugs:`, `and updates the following
  dependencies:`, etc., matching the verb to the subsection.
- **The Upcoming section opens with an `**In short:**` paragraph.** One paragraph,
  right under the `# Upcoming WeKan ® release` line and above the first
  `This release …:` header, saying what the whole release amounts to — the areas
  that changed and what changed about them, with the notable names in `**bold**`
  so it can be skimmed. It is a SUMMARY, not a list: it does not link commits, it
  does not repeat an entry's wording, and it ends by accounting for the rest in a
  clause (`Below that: dependency updates, nine bug fixes … and the usual
  documentation and translation work.`). Keep it current as entries are added —
  it is the first thing a reader sees, so a stale one misdescribes the release.
  A finished release keeps the paragraph it was written with.
- **Under the summary comes the BINARIES TABLE: what each platform ships.** So the
  top of a release section is, in order, (1) the `**In short:**` paragraph and
  (2) this table, and only then the `This release …:` subsections. A WeKan bundle
  is not only WeKan — it carries a Node.js, a FerretDB and the MongoDB Database
  Tools that other projects publish, and WHICH source has a given CPU changes
  from release to release: nodejs.org builds some architectures,
  unofficial-builds others, and [wekan/node-patches](https://github.com/wekan/node-patches)
  the ones neither of them does. "Which Node.js is in the arm64 bundle of 10.69,
  and was it checked" must be answerable from the CHANGELOG, not from a build log
  that expires.

  ```
  | Platform | Binary | From | Version | SHA256 |
  | --- | --- | --- | --- | --- |
  | amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `a1b2…` |
  | amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.24.0/ferretdb-amd64) | v1.24.0 | `c3d4…` |
  | arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `e5f6…` |
  ```

  **GROUPED BY PLATFORM**: rows are sorted by platform and then by binary, so one
  platform's binaries stay together and the table is read a platform at a time.
  The URL is the LINK ON THE "From" CELL — never a bare URL as visible text, the
  same rule as everywhere else — and it is the exact file that was downloaded, not
  the project's front page. The SHA256 is the checksum the source published and the
  build verified, in backticks; a source that publishes none says *no checksum
  published*, which is not a failed check but a source worth fixing. Table rows
  carry links, so the 80-character wrap does not apply to them.

  It is the same table `releases/provenance-table.sh` puts at the top of the GitHub
  release notes, from the `provenance.tsv` rows each build job records — so the two
  are filled from the same data and cannot disagree. **A platform that was NOT built
  has no rows**, which is how the table also answers "why is there no i386 bundle
  this time": no source published a Node.js for it (see
  `releases/resolve-node-source.sh`).
- **Inside a subsection, entries are GROUPED BY AREA.** A release touches a handful
  of areas and repeating the area's name in every summary is the noise this
  removes — twelve entries that each begin "All Boards:" say "All Boards" twelve
  times and the part that differs starts halfway through the line. Instead the area
  is named ONCE, as a bold line with a short description of what the group covers,
  and every entry under it drops the prefix:

  ```
  and fixes the following bugs:

  **The first header bar** - how it lays itself out, and what sits under it.

  <details>
  <summary><a href="…">It fills each row before starting the next one</a>. Thanks to xet7.</summary>
  …
  </details>

  <details>
  <summary><a href="…">It wraps to a second row instead of hiding the buttons that do not fit</a>. Thanks to xet7.</summary>
  …
  </details>

  **All Boards** - the overview and its search.

  <details>
  …
  ```

  The group line is `**Area** - short description.` on ONE line, wrapped at 80 like
  everything else, with a blank line under it. It is NOT a heading: a `##` inside a
  release breaks the version list (see above). Group labels are the areas of the
  app — `All Boards`, `The first header bar`, `The left menus`, `The Admin Panel`,
  `Board views`, `Public Boards`, `Member Settings`, `Board roles` — and the same
  label is reused across subsections when an area has both a feature and a fix.
  EVERY entry of a grouped subsection belongs to a group, including a group with
  one entry: a section that is half grouped and half loose reads as a mistake. A
  subsection with only one entry, and the dependency bullets, stay flat.
- **CRITICAL security header — match the previous releases' wording.** A security release
  leads with `This release fixes the following CRITICAL SECURITY ISSUE of
  [Name](https://wekan.fi/hall-of-fame/namebleed/):` for a single named *Bleed, or
  `This release fixes the following CRITICAL SECURITY ISSUES:` for several — NOT
  `CRITICAL VULNERABILITIES`. Each security bullet still links its own
  `https://wekan.fi/hall-of-fame/...bleed/`. CodeQL-only releases use the established
  `This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:`.
  Because CRITICAL comes first, it keeps the `This release ` prefix; a following non-security
  subsection becomes `and …` per the rule above.
- **`# TODO Later` section** — a triage backlog near the TOP of `CHANGELOG.md` (above the
  version sections), for open issues that were **investigated but not fixed here**, each
  recorded with a concrete REASON so whoever picks it up next knows why. Use it when working
  through open issues (the "Fix open issues" process): for each issue, either **fix it** (commit
  ending `Fixes #NNNN,`), **close it** if already fixed in current code (commit `Close #NNNN` /
  `Fixes #NNNN,`), or — when it can't be fixed/verified in this environment — **add it to `TODO
  Later` under the matching category with the reason**. Group issues by category bullet, e.g.:
  *Need specific infrastructure / a running server stack* (LDAP/WebHooks/Sandstorm/proxy —
  environment owners), *Need the running app to reproduce/verify* (runtime UI / publication /
  mergebox / router state, not unit-testable), *Already correct in the current code* (verified by
  reading; could not reproduce), *Feature requests / behaviour-by-design rather than bugs*, and
  *Needs a maintainer decision on the intended contract*. Each category is a `<details>`
  whose `<summary>` is the SHORT category text and whose body lists the issues with their
  reasons — and with **no `Thanks to` line**, because nothing is done yet, so there is
  nobody to thank. Each entry is a normal issue link
  `[#NNNN](https://github.com/wekan/wekan/issues/NNNN) (one-line reason)` — issue links here, NOT
  commit links (nothing was committed). **Keep it current:** when an issue in `TODO Later` gets
  fixed, REMOVE it from the list (its fix commit's `Fixes #NNNN` closes it); do not leave fixed
  issues in the backlog. This is the only CHANGELOG place that uses issue links and lives above
  the releases; everything else uses the per-release commit-link bullets above.
- FerretDB Upcoming structure — `### New Features 🎉`, `### Fixed 🐛`, `### Other Changes
  🤖`; entries end `... by @xet7. Thanks to xet7.`
- Word-wrap both CHANGELOGs at 80 chars, but never break a long link across lines (a
  `<summary>` line, or any other line carrying a link, may be longer). Continuation
  lines of a plain bullet are indented by two spaces.

### Commit message structure

```
Do something.

Thanks to (original creator of issue) and xet7 !

Fixes #1234,
Fixes #1235.
```

### Making a release — no version number needed  **[maintainer only]**

All publishing / release steps below are maintainer-only. Contributors never run them.

- WeKan: run `./releases/release-all.sh` (no arguments). It renames
  `# Upcoming WeKan ® release` to the next version (same increment as the last release;
  9.99 → 10.00) dated today, commits + pushes, and triggers
  `.github/workflows/release-all.yml` (its `bump` job bumps `package.json` and every
  version reference, then the release jobs tag `v<new>` and publish the GitHub Release).
  An explicit `oldversion newversion` pair still overrides. Adding entries under Upcoming
  is the only hand step.
- FerretDB: run `./build.sh release-ferretdb` from `.tools/FerretDB` (no
  version). It renames `## Upcoming FerretDB release` to the next version with the
  correct git-tag link, commits + tags + pushes, then triggers `release-all.yml` (which
  in turn triggers `docker.yml` for the multi-arch image). It refuses to re-release an
  already-tagged version.

### Security issues

- Fix the vulnerability, add a CRITICAL section to the WeKan CHANGELOG like previous
  entries, and update `../w/wekan.fi/hall-of-fame/index.html` and the vuln-name
  subdirectory `index.html` like previous security issues.
- **A Hall of Fame row has EIGHT cells**, in this order: CVE, Icon, Vulnerability
  name, Date, Responsible Security Disclosure by, Stars, Process, Vulnerabilities.
  One thing per cell — the name without its icons, the Font Awesome icons alone in
  Icon (still wrapped in `<h2>`), the reporter alone in "by", the `GoldStar.png`
  images alone in Stars, and the sentence about how the report arrived (coordinated
  disclosure, GitHub advisory, code scanning, found while reviewing …) in Process.
  In "by", the reporter's NICKNAME is the link —
  `<b><a href="https://github.com/nick">nick</a></b>`, never the name followed by a
  separate "(GitHub)" link. **Check the account exists before linking it** (a 404 or,
  worse, somebody else's profile is the failure here); a real name, a company or a
  tool such as GitHub CodeQL is not a GitHub user and stays plain text. Do not write
  a role note after a name — no `(fix)`, `(found)` or `(found and fix)`: this column
  is the credit, and the Process cell beside it already says how the report arrived.
  Stars is a column so it can be compared down the page; do not put a star, an icon
  or the process sentence back into another cell. A page-local `<style>` in
  `index.html` keeps a row's stars on ONE line from 900px up (they are a count) and
  sizes them at 24px, and keeps the icon and its red drop on one line at every width
  (they are one icon) — the table itself stays percentage-sized with no fixed or
  minimum width, so it fills the page at every browser width.
- **On the Hall of Fame index page, the Process and Vulnerabilities cells are
  collapsed.** Those two columns carry the prose — how the report arrived, and the
  whole story of the vulnerability — so the page would be one wall of text and the
  columns that identify a row (CVE, name, date, reporter, stars) would be far apart.
  In `hall-of-fame/index.html`, and ONLY in those two `<td>`s, the cell's content
  sits inside a `<details>` whose summary is the column's own name — `Process` for
  the Process cell, `Details` for the Vulnerabilities cell:

  ```
  <td valign="top">
    <details>
    <summary>Details</summary>

    <ul>
      <li>… the same list as before …</li>
    </ul>
    </details>
  </td>
  ```

  The summary is that plain word, there is a blank line under it, and the cell's
  contents are otherwise unchanged. The other six cells of the row stay as they are
  — they are what a reader scans — and so does the header row.
- **The vuln-name subdirectory page is NOT collapsed.** `hall-of-fame/<name>bleed/index.html`
  is the page a reader opened on purpose, for one vulnerability: its table cell stays
  open and its `<h2 class="hof">Details</h2>` prose section below the table stays as
  it is. Only the index, which lists them all, hides them behind the summary.

### Tests

- `build.sh` / `build.bat` have a menu to install dependencies, build
  WeKan and run tests.
- Add tests, negative tests and UI tests for all new features and fixes that do not yet
  have tests. When adding a test, run or validate it and fix it until it works.
- **"Check newest test logs":** test logs go into a `log/<datetime>/` directory,
  one per run (e.g. `2026-07-21_20-58-09/`). That is **`../log/`**, one level up
  from the repo, so a run does not show up in `git status` - **unless the parent
  is not writable**, as in a Flatpak sandbox that shares only the repository;
  there it is **`./log/`** inside the repo (gitignored). `build.sh` prints which
  one when a run starts. The
  newest datetime directory is the latest run. Each holds the Playwright per-browser
  logs (`wekan-alltests-chromium.log`, `-firefox.log`, `-webkit.log`), the mocha/unit
  log (`wekan-alltests-mocha.log`), the e2e/import logs, and `wekan-test-server.log`
  (the WeKan test server + database output). A whole-run directory also holds the
  database-conformance logs (`db-conformance-*.log`, `-report.md`, `-summary.txt`)
  and FerretDB's own (`ferretdb-unit.log`, `-vet.log`, `-integration.log`). "Check
  the newest test logs" means: open the most recent `log/<datetime>/` - look in
  `../log/` first, then `./log/` - and read those.
- **Check and fix WHILE the tests are still running.** A full run takes a long time
  (three browsers, then every database with an image for this CPU, then FerretDB's
  own suites), and its stages finish one at a time. Do not wait for the end: read
  the logs that are already written, fix what they show, and then look again for the
  stages that have finished since — repeat until every stage has run and everything
  found is fixed. Two things make this work:
  - A stage's log file is complete when its `===== ... finished` line is there; a
    file whose mtime is still moving is a stage in progress, and its failures so far
    are already real and worth fixing.
  - The node suites are run by `tests/run-node-suites.cjs`, which runs ALL of them
    and lists every failure at the end (`===== node suites: N run, M failed`). They
    are the fastest signal - about 15 seconds for 260 suites - so they are usually
    what to fix first while the browsers are still going.
- **A failing guard is not automatically a broken app.** Most of these suites read
  the source and pin a behaviour. When one fails, decide which side is wrong: fix
  the CODE when the guard still describes what WeKan should do, and fix the GUARD
  when the behaviour deliberately changed - and then say in the test WHY, so the
  next reader knows it was a decision and not a slip. Every fixed test keeps the
  assertion that made it valuable; do not delete a test to make a run green.

## Environment

- The editor (VSCode) runs inside a **Flatpak sandbox**, launched by
  `docs/Security/Sandboxes/vscode/vscode-sandbox.sh`. What the sandbox allows/blocks and
  how it is set up is documented in `docs/Security/Sandboxes/vscode/README.md` in that
  same directory — read it when something behaves differently than a normal host (file
  access, network, running services).

### Always validate from the actual code

- When doing anything, check how it actually works in the code first.
