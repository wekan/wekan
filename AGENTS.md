# AGENTS.md — instructions Codex reads first

Codex reads this file at the repo root before doing work here. Follow it.

## First: who maintains this, and who is committing?

**WeKan, the `wekan/` repositories cloned under `.tools/`, and
[Secretchronicles/TSC](https://github.com/Secretchronicles/TSC) are all maintained by
Lauri Ojansivu (xet7) `<x@xet7.org>`** — [wekan/wekan](https://github.com/wekan/wekan),
[wekan/FerretDB](https://github.com/wekan/FerretDB),
[wekan/node-patches](https://github.com/wekan/node-patches),
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches) and TSC,
which is under the **Secretchronicles** organisation rather than **wekan** and is his
all the same — his GitHub profile, [xet7](https://github.com/xet7), says exactly that:
*"WeKan and TSC maintainer"*. Work done on the maintainer's behalf is committed as
**`Lauri Ojansivu <x@xet7.org>`** — that author, in every one of those repositories,
every time. Two rules follow from it and neither has an exception:

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

Maintainer mode covers TSC as well: commit directly to its `devel` branch, no pull
request, same author and no AI attribution. What it does NOT bring along is WeKan's
house style — TSC keeps its own **GNU ChangeLog** `CHANGELOG` and its own release
process, because a project is read on its own terms (see the CHANGELOG section below).
The one repository under `.tools/` that is somebody else's is `sandstorm-io/sandstorm`,
cloned for reference only.

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
   build+test instructions in `docs/Security/Sandboxes/vscodium/README.md`).
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
the human translations. **The policy is: never overwrite a human translation in the
correct language with a filled (or English) one, but always take the newest correct-
language translations from Transifex. Text in another language is not protected: the
locale tag is authoritative, and wrong-language or mixed-language values must be
replaced with the language named by that tag.**

- Pull with `releases/translations/pull-translations.sh`. It runs `tx pull -a -f`
  (which fills every string that is UNtranslated on Transifex with the English source)
  and then a **per-key merge** (`releases/translations/merge-translations.mjs`) that,
  for every language file and every key:
  - Transifex has a real translation in the locale's declared language (pulled value
    differs from English) → **keep it** (the newest correct-language human translation
    always wins);
  - the pull returned English but the pre-pull local file has a translation →
    **restore the local translation as the fallback**. It may be human or a direct
    machine/LLM fill; either way it remains local, while a real correct-language
    Transifex translation takes precedence;
  - **no translation anywhere** (untranslated on Transifex AND never committed) → leave
    the English source as a placeholder. **This is the only case a non-human value is
    used.** A separate fill step may fill *only* these English placeholders, so a filled
    string can never overwrite a human translation.
- After the merge, audit for mixed or wrong-language values. A value that differs from
  English can still be wrong for its locale; replace it directly as described below.
- **The pull workflow never pushes translations to Transifex.** It cannot distinguish a
  restored human translation from a committed direct fill, so automatic push-back would
  misrepresent machine/LLM translations as human. Push only separately reviewed,
  provenance-known human translations with an explicit push command.

### Filling the remaining untranslated strings — directly, no translation service

The strings still equal to the English source after the merge are the ones untranslated
**everywhere** (Transifex + git). Translate these **directly** — the maintainer or the
assistant (an LLM) writes the translation itself, using that language's **existing
translations** and general **kanban terminology** for the language as the reference.
**Do NOT wire up any external translation service, API, endpoint, key or password** — an
earlier `machine-translate.mjs` that called LibreTranslate/DeepL is removed on purpose
(it did not work and needed a password). There is **no `WEKAN_MT*` env var** anymore.

- **EVERY language gets translated — including the ones nobody has volunteered for.**
  Klingon, Volapük, Wolof, Venda, Tamazight, Acehnese and the rest are not exceptions:
  WeKan cannot find a speaker for every language, and a file left in English stays in
  English for years. **Look the words up.** Any dictionary, word list, grammar or
  Wiktionary page on the Internet is a legitimate source — read it, take the terms it
  gives, and write the translation from them.
- **A locale file must contain its declared language, not whichever language happened
  to seed it.** If a Mongolian file contains Russian, replace the Russian with
  Mongolian; likewise replace French, German, Malay, Zulu or any other wrong-language
  text with the language named by the file's locale tag. This rule applies to isolated
  mixed-language values and to an entire wrongly seeded file. Wrong-language text is
  not a human translation for that locale and does not receive human-preference
  protection. Because `fill-translations.mjs --apply` deliberately writes only English
  placeholders, make these corrections directly in the locale JSON (preserving key
  order and formatting), add regression coverage for the correct language/script, and
  note low-confidence replacements in the commit. Script checks alone are insufficient
  when both languages share a script, such as Russian and Mongolian; inspect vocabulary
  as well.
- **Placeholders are code, not language. Never translate them.** Any source token that
  begins and ends with underscores (for example `__board__`, `__card__` or
  `__username__`) and any format token whose token begins with `%` (for example `%s`,
  `%d` or `%1$s`) must be copied from the corresponding value in `en.i18n.json`
  exactly, character for character. Preserve every placeholder, its spelling, case,
  count and format; translate only the prose around it. If a locale has translated,
  renamed, removed or malformed one of these tokens, restore the original token from
  the same key in `en.i18n.json`, even when the surrounding translation is human.
  Regression coverage for a translation batch must compare its underscore-delimited
  and percent-prefixed token inventory with English so a translated placeholder cannot
  pass as ordinary prose.
- **Add the languages WeKan does not have yet.** The 154 files under
  `imports/i18n/data/` are not the list of languages worth supporting - they are the
  list somebody happened to start. When a language has a dictionary, a word list or a
  Wiktionary anywhere on the Internet, it can have a WeKan. Adding one is three edits,
  and all three are needed or the language is invisible:
  1. `imports/i18n/data/<tag>.i18n.json` — the strings, in `en.i18n.json`'s key ORDER
     (`tests/boardItemLinks.test.cjs` checks that), 2-space indent.
  2. `imports/i18n/languages.js` — `{ code, tag, name, load, rtl }`. The **name is
     written in that language itself** ("Suomi", "tlhIngan Hol"), the way every entry
     there already is, because it is read by somebody who does not read English. `rtl:
     true` for Arabic, Hebrew, Persian, Uyghur and the rest that are written
     right-to-left.
  3. `client/components/users/userHeader.js` — the `flagMap` in `languageFlag()`, so the
     picker shows a **flag** beside the name. A language without a country of its own
     takes the flag of where it is spoken, and a constructed one (Esperanto, Klingon,
     Volapük) keeps the `🌐` fallback rather than being given somebody's country.
- **A bad translation beats no translation.** An imperfect string is readable, it is
  obviously improvable, and it is an *invitation*: somebody who speaks the language sees
  it is wrong and fixes it, which an English placeholder never provokes. So: do not skip
  a language because the result would be imperfect. Translate it, say in the commit which
  ones were done with low confidence, and let a human correct it — the merge rules below
  guarantee that when that human translation arrives on Transifex, it REPLACES the filled
  one and is never overwritten by it.

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
that a real Transifex translation wins, the pre-pull local translation fills only an
English result, a fill only touches placeholders, and the pull script contains no push.
Thus **correct-language Transifex human strings are preferred and merged**, remaining
keys retain their local human or machine/LLM translations, and nothing restored or
filled is pushed to Transifex as if it were human. Wrong-language values are corrected
directly after the merge.

## General practices (from .tools/log/v10/Claude.txt)

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
  - `.tools/wekan.fi` — the WeKan website companion repository.
  - `.tools/` — everything that is NOT part of this repository but is needed to
    build, test and release it, in ONE directory that `.gitignore` and
    `.meteorignore` already exclude (each used to need its own ignore entry at
    the repo root), so nothing in it can reach a commit or a Meteor rebuild. Two
    different kinds of thing live there, and the difference matters:

    **Companion git repositories.** Separate repositories with their own history,
    branches, changelog and release flow — a commit here is never a commit there.
    `build.sh`'s `ensure_tool_repo` clones one on demand (SSH first, HTTPS
    second), so a fresh checkout needs no manual setup:

    | Path | Repository | Branch | What it is |
    | --- | --- | --- | --- |
    | `.tools/FerretDB` | wekan/FerretDB | `main-v1` | the FerretDB v1 fork WeKan ships as its default database |
    | `.tools/node-patches` | wekan/node-patches | `main` | patches to upstream Node.js; builds the `node-<platform>` binaries the bundles, the Docker image and the snap embed |
    | `.tools/mongo-tools-patches` | wekan/mongo-tools-patches | `main` | patches to the MongoDB Database Tools; builds `<tool>-<arch>` |
    | `.tools/TSC` | Secretchronicles/TSC | `devel` | the game xet7 also maintains — same author and maintainer mode, its own GNU ChangeLog and release process |
    | `.tools/sandstorm` | sandstorm-io/sandstorm | — | upstream Sandstorm, when present — somebody else's project, cloned for reference |

    **Unpacked toolchains and caches.** Downloads, not repositories — put there by
    the sandbox instructions in `docs/Security/Sandboxes/vscodium/README.md`, deleted
    and re-fetched freely, never committed anywhere:
    `node-v<version>-linux-<arch>/` (the Node.js the test suites are run with),
    `go/` with `gopath/`, `gomodcache/` and `gocache/` (FerretDB's Go builds),
    `.meteor/` when `HOME` is pointed at `.tools`, and the `TSC*` AppImage.
  - **Do NOT add a `CLAUDE.md` or an `AGENTS.md` to any repository under
    `.tools/`.** node-patches and mongo-tools-patches each had a pair and they were
    REMOVED on purpose: the rules are the same for every one of these repositories,
    and a second copy of a rule drifts from the first. THIS file, and its `AGENTS.md`
    twin beside it, are where they live for all of them. Something true of only one
    of those repositories goes in that repository's own `README.md` or `docs/`,
    never in a new instruction file — and if you find one there, remove it rather
    than updating it.
  - `.tools/FerretDB` specifics — FerretDB `.go` files must contain **no**
    application-specific names (say "the client" / "a Meteor 3 driver" / a bare
    `#NNNN`); its `CHANGELOG.md` may use `wekan/wekan#NNNN`.

### CHANGELOG

- **Every repository writes its changelog in the format that repository's own file
  already uses.** Open its changelog, read the entries above the place you are
  adding one, and match them — never import another project's shape into it. The
  five that come up here:

  | Repository | File | Format |
  | --- | --- | --- |
  | `wekan/wekan` | `CHANGELOG.md` | the WeKan format this section describes: `# Platforms`, `# TODO Later`, then `# v<MAJOR>.<MINOR> YYYY-MM-DD WeKan ® release` sections of `<details>` entries whose `<summary>` links the commit |
  | `wekan/node-patches` | `CHANGELOG.md` | the same WeKan format, with `# Upcoming node-patches release` |
  | `wekan/mongo-tools-patches` | `CHANGELOG.md` | the same WeKan format, with `# Upcoming mongo-tools-patches release` |
  | `wekan/FerretDB` | `CHANGELOG.md` | **upstream FerretDB's** format, not WeKan's: `## [v1.48.0](tag URL) (YYYY-MM-DD)` and `### New Features 🎉` / `### Fixed 🐛` / `### Other Changes 🤖` bullets ending `by @xet7. Thanks to xet7.` |
  | `Secretchronicles/TSC` | `CHANGELOG` (no extension) | **GNU ChangeLog** format: a `YYYY-MM-DD  Name  <email>` header line, then TAB-indented `* Version …` / `* Fix: …` / `* Misc: …` entries, wrapped and continued with further tabs, each ending `(by Name)` |

  The reason is the reader, not consistency for its own sake: a FerretDB release is
  read beside upstream FerretDB's releases, and a TSC entry beside a decade of GNU
  ChangeLog entries. A WeKan-shaped `<details>` block in either would be the odd one
  out and would break the tooling that parses them. When this file and the file being
  edited disagree, **the file being edited wins** — and everything below in this
  section is about the WeKan format specifically.
- During development, add entries under a new `# Upcoming WeKan ® release` section above
  the newest release (FerretDB uses `## Upcoming FerretDB release`; the patch repos use
  `# Upcoming <repo> release`). Do **not** hand-edit
  `package.json` or any other version reference — the release workflow bumps those.
- **Whenever `# Upcoming WeKan ® release` is updated, audit every feature, bug fix
  and security fix in that section for regression coverage.** If coverage does not
  exist yet, add a positive test, a negative test and a UI test wherever that kind
  of test is possible and relevant. Run the tests that can run in the current
  environment; when a UI stack or another required service is unavailable, still
  add and syntax-check/register the test and state clearly what could not be run.
  Do not duplicate an existing test merely to satisfy the audit — extend it when
  that keeps one behavior in one suite.
- **CHANGELOG.md holds the CURRENT MONTH only.** It reached 2.6 MB and 51,365
  lines over 1,100 releases back to 2015 (#6580), which is slow to open and
  slower to read. Moving whole years out left 1.9 MB, still too large, because
  releases here are frequent: 2026 alone is 272 releases over eight months and
  July was 80 on its own. So:

  | | |
  | --- | --- |
  | `CHANGELOG.md` | the current month, plus `# Platforms`, `# TODO Later`, `# Upcoming` |
  | `old-CHANGELOG/<year>/<MM>.md` | earlier months of the current year |
  | `old-CHANGELOG/<year>.md` | years that are over, whole |

  Past years stay one file each because they are already small (30–107 KB);
  splitting them further would trade a size problem nobody has for a hundred
  more files. Each archive opens with a **release count** — per month in a year
  file, per day in a month file — and a bullet in `# Platforms` links every one.
  That `git blame` is less useful on the split file is accepted: the history is
  still in git (`gitk`, `git-gui`, `git log --follow`), and being small enough
  to open is worth more.

  Run `node releases/changelog-archive.mjs` at the start of a month. It is
  idempotent — a run with nothing to move only refreshes the tables — and it
  takes the month to keep from the FILE rather than the clock, so two people
  running it on the same day agree. An archived section is never edited, for the
  same reason a released one is not.
- **The file's shape, top to bottom** — keep it exactly as it is now:
  1. `# Platforms` — the line `Newest WeKan at these platforms:` and the Install /
     Upgrade / Docs / Mac ChangeLog bullets, the `Older releases:` bullet linking
     the per-year archives, then a `<details>` whose `<summary>` is `Version`
     holding "which WeKan version uses what". There is no `# Version` heading of
     its own.
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
- **The Upcoming section opens with an `**In short:**` paragraph.** It must be
  short: put one compact, high-level paragraph directly under the
  `# Upcoming WeKan ® release` line. Aim for 2–4 sentences and no more than about
  120 words, however many commits the release contains. Name only the release's
  major outcomes or themes, with notable names in `**bold**` so it can be skimmed.
  It is not a commit inventory, progress log or miniature changelog: do not list
  batches, per-language counts, individual test fixes or every touched component,
  do not link commits, and do not repeat entry wording. The topic groups and their
  `<details>` blocks below carry that information. Keep the paragraph current as
  topics change, and shorten it when added commits make it grow. A finished release
  keeps the paragraph it was written with.
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
- **Inside a subsection, entries are GROUPED BY TOPIC/AREA.** A release touches a handful
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

  The group line is `**Topic** - short summary.` on ONE line where practical,
  wrapped at 80 like everything else, with a blank line under it. This line is the
  high-level summary of ALL commits in that topic: say what changed and why it
  matters without copying a commit summary or enumerating implementation details.
  The `<summary>` under it gives each commit's short outcome, and the expanded
  `<details>` body carries the implementation, rationale and test evidence. In
  other words, the release reads from release summary → topic summary → commit
  detail, with each level adding information instead of repeating the level above.
  The group line is NOT a heading: a `##` inside a release breaks the version list
  (see above). Group labels are the areas of the
  app — `All Boards`, `The first header bar`, `The left menus`, `The Admin Panel`,
  `Board views`, `Public Boards`, `Member Settings`, `Board roles` — and the same
  label is reused across subsections when an area has both a feature and a fix.
  EVERY entry of a grouped subsection belongs to a group, including a group with
  one entry: a section that is half grouped and half loose reads as a mistake. Put
  each commit under the topic it actually changes; do not create a chronological
  catch-all group. A subsection with only one entry, and the dependency bullets,
  stay flat.
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

- **A commit that fixes a GitHub issue ENDS with `Fixes #NNNN`** — last lines of
  the message, one per issue, comma after each and a full stop on the last. That
  trailer is what closes the issue when the commit is pushed; a fix that only
  *mentions* the number in prose leaves the issue open, and somebody has to close
  it by hand later or it stays open forever. Several issues in one commit get
  several lines. The same applies to an issue that turns out to be **already
  fixed**: commit the test or the note that proves it and end with `Fixes #NNNN,`
  so the issue closes with a reference to where it was fixed.
- **Only when the commit really fixes it.** A commit that improves the
  diagnostics, narrows the cause, or fixes one of several reported problems
  references the issue in the body (`#6585 comment 5276581923`) and does NOT
  carry the trailer — closing an issue whose reporter is still stuck is worse
  than leaving it open. If an issue was closed and then REOPENED for follow-up
  items (as #6586 was), it is fixed again only when those items are done.
- **A commit with no issue behind it has no trailer** — the email reports, the
  release-tooling fixes found in build logs, refactors. `Thanks to ... and xet7 !`
  still names whoever reported it.

### Making a release — no version number needed  **[maintainer only]**

All publishing / release steps below are maintainer-only. Contributors never run them.

**Releases are FREQUENT, and that is the normal state of this repository — not an
interruption to it.** The maintenance loop is:

1. `./build.sh` (or `build.bat` on Windows) → **option 1, "git pull and git
   push"**. Both directions do the whole job: a pull rebases and then repairs the
   CHANGELOG commit links the rebase made stale, and a push repairs them again
   BEFORE publishing, because a stale link that reaches GitHub 404s for everyone
   who reads the release notes.
2. `./releases/release-all.sh`, **with no arguments**, whenever there is something
   worth shipping — which is often, several times a day when a fault is being
   chased. It takes the version from the CHANGELOG and needs nothing typed.

So a release happening "in the middle" of a piece of work is not a special case
to reason about; it is what always happens, and anything that only works when
releases are rare is broken here. Two consequences worth stating, because both
have cost a released section its accuracy:

- **Work continues immediately after a release**, so `release-all.sh` renames
  `# Upcoming WeKan ® release` to `# v<NEW> …` and then OPENS A NEW EMPTY
  `# Upcoming` (`releases/changelog-open-next.mjs`), so the next entry has
  somewhere correct to go. Without it an entry appended above the closing
  `Thanks to above GitHub users …` line lands INSIDE the release just published.
  The new section carries an `**In short:** nothing here yet.` placeholder and
  the binaries table, so the file stays valid; replace the placeholder as entries
  are added. `tests/changelogEntriesBelongToTheirRelease.test.cjs` checks the
  newest few releases against git and fails when a section links a commit that
  release does not contain.
- **A released section is a RECORD, not a draft.** When a release turns out to be
  broken, its section keeps saying what it shipped — including the part that was
  wrong — and the fix goes in a new `# Upcoming` above it. Do NOT edit a
  published entry to describe the smaller, tidier change you wish had shipped;
  add to it that it was wrong and where the fix is. Somebody reading v10.97's
  notes is most likely somebody whose v10.97 just died.

- WeKan: run `./releases/release-all.sh` (no arguments). It renames
  `# Upcoming WeKan ® release` to the next version (same increment as the last release;
  9.99 → 10.00) dated today, commits + pushes, and triggers
  `.github/workflows/release-all.yml` — whose `bump` job bumps `package.json` and every
  version reference and rebuilds the API docs, whose `prepare` job then pushes the tag
  `v<new>` and checks the notes exist, and whose `release` job publishes the GitHub
  Release the bundle jobs attach to. An explicit `oldversion newversion` pair still
  overrides. Adding entries under Upcoming is the only hand step.
- **A release that FAILED and one that shipped BROKEN are handled differently, and
  the difference is whether anything was PUBLISHED.** Both happened with v10.92, so
  neither is hypothetical:
  - **Nothing published** (the workflow died before the GitHub Release existed): there
    is no release for that number, so `# v<new> …` must not claim there is one. Rename
    the heading back to `# Upcoming WeKan ® release`, add the fix under it, and run
    `release-all.sh` again — it will take the same number, since the newest release is
    still the previous one.
  - **It published, and something in it is broken**: the release exists and people can
    download it, so its section STAYS as it is — a released section is a record, not a
    draft. Add a NEW `# Upcoming WeKan ® release` above it with the fix, exactly as
    during ordinary development, and the next run takes the next number.
  What decides it is the GitHub Release, not the tag: `prepare` pushes the tag early,
  so a tag can exist for a release that never published.
- FerretDB: run `./build.sh release-ferretdb` from `.tools/FerretDB` (no
  version). It renames `## Upcoming FerretDB release` to the next version with the
  correct git-tag link, commits + tags + pushes, then triggers `release-all.yml` (which
  in turn triggers `docker.yml` for the multi-arch image). It refuses to re-release an
  already-tagged version.

### Security issues

- Fix the vulnerability, add a CRITICAL section to the WeKan CHANGELOG like previous
  entries, and update `.tools/wekan.fi/hall-of-fame/index.html` and the vuln-name
  subdirectory `index.html` like previous security issues.
- **Every security fix gets a TEST and a NEGATIVE TEST, and they are written so the
  fault cannot exist ANYWHERE in the codebase — not just at the place it was
  reported.** A test that pins one call site leaves the same mistake free to live in
  the other five, and that is how most of these arrive: SignupBleed's guard read an
  option nothing sets, and the same shape sat in a second endpoint; the source-map
  trim was safe on the client and fatal on the server. So:
  - the **test** proves the fix does what it claims, driving the decision itself
    where that is possible. A pure module — `loginFailureDecision.js`,
    `lockoutDecision.js` — can be tested as arithmetic, without a server or a
    database, and reproduces the reporter's attack exactly rather than approximately;
  - the **negative test** proves the fault is gone rather than moved. Search the
    whole tree for the SHAPE of it and assert nothing matches: no other endpoint
    reads the dead option, no other counter is global, no other caller skips the
    check. When the shape is a pattern, pin the pattern.
  - and a test that reads the source is a real test here. `tests/*.test.cjs` may
    parse a file and fail on a construct — that is what makes "and nowhere else"
    checkable at all.
- **If somebody ATTEMPTS the attack, and the secure default DENIES it, that denial
  has to be visible in Admin Panel → Problems** — in every case where the denial can
  be attributed. This applies to every security fix added to Upcoming. That is the
  difference between a hole that is closed and a hole that is closed and watched:
  an administrator should be able to see that somebody tried.
  - Add a key to the catalog in `models/lib/securityCategories.js` (category, the
    hall-of-fame `bleed` name, severity, CWE), and call
    `require('/server/lib/securityLog').record({ key, action: 'blocked', source, detail })`
    on the refusal path. `action` is `'blocked'` when the fix stopped it and
    `'detected'` when it was only noticed.
  - **Wrap the call so logging can never break the guard**:
    `try { ... } catch (e) { /* logging must never break the guard */ }`. The refusal
    matters more than the record of it.
  - **Only log an ATTEMPT, never ordinary use.** The test to apply is whether a
    legitimate user can reach that line. Registration refused while registration is
    off has no legitimate caller, so it is logged; an admin endpoint whose fault was
    in what its answer CARRIED fires on every normal call, so it is NOT — that is why
    HashBleed (GHSA-6qpx-x7vr-p9w6) deliberately has no key. A log that fills with
    normal traffic hides the one line that mattered.
  - Where the denial cannot be attributed to an attempt — a fix that changes what a
    response contains, or one that only takes effect at build time — there is nothing
    to record, and that is a decision to state in the entry rather than an omission.
- **Admin Panel → Problems is a SUMMARY, never a row per event.** A guard on a path
  an attacker controls fires as fast as they can send, so a document per occurrence
  grows the database with the attack, turns the page into a scroll of near-identical
  lines, and buries the one event that mattered under ten thousand that did not. The
  admin's question is never *list every attempt* — it is *what is happening, how
  much, since when, and who*. So each problem is ONE row that accumulates
  (`models/lib/eventLogSummary.js`, written through `server/lib/eventLogFold.js`,
  shared by the security, speed and test loggers):

  | field | what it holds |
  | --- | --- |
  | `count` | how many times this problem has happened |
  | `firstAt` … `at` | the window it happened in |
  | `actors` | who, each with their own count — `username1 25, 100.100.100.100 30` |
  | `username` / `ip` / `detail` | the MOST RECENT occurrence |

  - **Identity is the KIND of thing that happened** — stream, `bleed`, category,
    action, source, severity, CWE (and `type`/`db`/`kind` for the database stream).
    The actor is NOT part of it: putting a username or an address in the key gives a
    row per attacker per attempt, which is the cost being removed.
  - **A username and an address are tallied SEPARATELY**, not as a pair. They answer
    different questions — which account, and where from — and an unauthenticated
    attempt has an address and no name.
  - **The tally is CAPPED** (`MAX_ACTORS`), with the remainder counted in
    `actorsOverflow`. Otherwise an attacker rotating addresses grows the row with the
    attack and reintroduces the same bug one level down — and *"and 9,412 others"* is
    itself the signal that the source is spread rather than single.
  - **A logger that writes per event is a bug to fix, not a style.** If one is added
    or found, route it through the shared fold and migrate what it already wrote
    (`server/lib/eventLogSummaryMigration.js` folds legacy rows in place, in batches,
    idempotently).
- **Every hall-of-fame vulnerability that CAN be detected at runtime should have a
  catalog key**, so Admin Panel → Problems groups attempts under the same name the
  Hall of Fame uses and an admin can go from one to the other.
  `tests/hallOfFameProblemsCoverage.test.cjs` lists the names that have no key and
  requires each to be accounted for — a *Bleed with nothing to detect (a fix that
  changed what a response carried, or one that only applies at build time) is
  recorded there as a deliberate omission with its reason, not left silent.
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
  one per run (e.g. `2026-07-21_20-58-09/`). That is **`.tools/log/`** inside the
  repository's ignored tool area, so a run does not show up in `git status` and
  does not depend on the parent directory being writable. The
  newest datetime directory is the latest run. Each holds the Playwright per-browser
  logs (`wekan-alltests-chromium.log`, `-firefox.log`, `-webkit.log`), the mocha/unit
  log (`wekan-alltests-mocha.log`), the e2e/import logs, and `wekan-test-server.log`
  (the WeKan test server + database output). A whole-run directory also holds the
  database-conformance logs (`db-conformance-*.log`, `-report.md`, `-summary.txt`)
  and FerretDB's own (`ferretdb-unit.log`, `-vet.log`, `-integration.log`). "Check
  the newest test logs" means: open the most recent
  `.tools/log/<datetime>/` and read those.
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

- The editor (VSCodium) runs inside a **Flatpak sandbox**, launched by
  `docs/Security/Sandboxes/vscodium/vscodium-sandbox.sh`. What the sandbox allows/blocks and
  how it is set up is documented in `docs/Security/Sandboxes/vscodium/README.md` in that
  same directory — read it when something behaves differently than a normal host (file
  access, network, running services).

### Flatpak sandbox: install task tools under `.tools/`

- In the Flatpak sandbox launched by
  `docs/Security/Sandboxes/vscodium/vscodium-sandbox.sh`,
  the repository may be the only writable/shared host directory. When a command
  needs a tool that is missing, install its binary, virtual environment, models
  and caches under the repository-local `.tools/` directory. Do not install it
  into the read-only Flatpak image or scatter generated tool files through the
  source tree. `.tools/` is excluded by both `.gitignore` and `.meteorignore`, so
  local toolchains neither enter commits nor consume Meteor file-watcher slots.
- Use the version selected by the repository, resolved from the current files at
  install time; never copy a version number from an old log or hard-code the
  example currently shown in the sandbox README. In particular: Node.js and npm
  come from `NODE_VERSION` and `NPM_VERSION` in `Dockerfile`; Meteor comes from
  `.meteor/release`; companion repositories use the versions in their own build
  scripts or module files. Use the architecture reported by `uname -m`. Reuse an
  existing matching `.tools` installation before downloading another copy.
- Follow the complete, tested bootstrap commands and environment variables in
  `docs/Security/Sandboxes/vscodium/README.md`, especially its "Reuse same
  in-sandbox toolchain" and test-runtime sections. Prefer repository setup
  helpers such as
  `build.sh` and `releases/ensure-tools.sh` when they already install the needed
  pinned tool. Keep `HOME`, `PATH`, `GOROOT`, `GOPATH`, `GOCACHE`, `GOMODCACHE`
  and similar overrides scoped to the command or sandbox terminal; do not change
  the real host home or a system installation.
- For screenshot or image text that cannot be read by the normal image viewer
  because Flatpak/bubblewrap cannot create a user namespace, install RapidOCR
  locally instead of guessing from filenames or logs:

  ```bash
  python3 -m venv .tools/ocr-venv
  .tools/ocr-venv/bin/pip install rapidocr_onnxruntime pillow
  .tools/ocr-venv/bin/python -c 'from rapidocr_onnxruntime import RapidOCR; import sys; result, _ = RapidOCR()(sys.argv[1]); print("\n".join(row[1] for row in (result or [])))' path/to/screenshot.png
  ```

  Process a timestamped screenshot series in chronological order and correlate
  OCR output with the matching `.tools/log/<datetime>/` files. OCR is evidence
  with recognition errors: retain timestamps and coordinates when needed, verify
  suspicious numbers against adjacent frames, and do not claim visual details
  that neither OCR nor another available viewer confirmed.

### Always validate from the actual code

- When doing anything, check how it actually works in the code first.
