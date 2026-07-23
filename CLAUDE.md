# CLAUDE.md — instructions Claude reads first

Claude Code reads this file at the repo root before doing work here. Follow it.

## First: are you the maintainer or a contributor?

Check the current git identity before committing or releasing:

```
git config user.name && git config user.email
```

- **Maintainer mode** — ONLY when the identity is exactly
  `Lauri Ojansivu <x@xet7.org>` (name `Lauri Ojansivu`, email `x@xet7.org`). Then, and
  only then: commit **directly to the current branch** as `Lauri Ojansivu <x@xet7.org>`
  with no AI trailer and no pull request, and the **publishing / release steps** below
  are available. (Per the standing rule you still **commit only; do not push** unless
  explicitly asked.)
- **Contributor mode** — any other git identity. Then: do **not** commit directly to
  the branch and do **not** run any release/publishing step. Make changes on a branch
  and open a **pull request** for the maintainer to review. The "commit as Lauri
  Ojansivu", "commit directly", and all release instructions below are **maintainer-only
  and do not apply to you**.

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
- **[maintainer only]** **Commit only. Do not push** (unless explicitly asked).
- Lauri Ojansivu (xet7) maintains WeKan (https://wekan.fi) and the FerretDB v1 fork.
- Directory structure:
  - `wekan` — this repo (https://github.com/wekan/wekan); see
    `docs/DeveloperDocs/Directory-Structure.md`; `CHANGELOG.md` at root.
  - `../w/wekan.fi` — the WeKan website.
  - `FerretDB` subdirectory (when present) — https://github.com/wekan/FerretDB, its own
    `CHANGELOG.md`. FerretDB `.go` files must contain **no** application-specific names
    (say "the client" / "a Meteor 3 driver" / a bare `#NNNN`); its `CHANGELOG.md` may
    use `wekan/wekan#NNNN`.
  - `sandstorm` subdirectory (when present) — https://github.com/sandstorm-io/sandstorm.

### CHANGELOG

- During development, add entries under a new `# Upcoming WeKan ® release` section above
  the newest release (FerretDB uses `## Upcoming FerretDB release`). Do **not** hand-edit
  `package.json` or any other version reference — the release workflow bumps those.
- WeKan Upcoming structure — CRITICAL SECURITY ISSUES first, then new features, then
  updates (`Thanks to dependabot.`), then bug fixes; each bullet is
  `- [desc](https://github.com/wekan/wekan/commit/...).` followed by
  `Thanks to (issue creator's GitHub nickname) and xet7.`, and the section ends with
  `Thanks to above GitHub users for their contributions and translators for their
  translations.`
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
  *Needs a maintainer decision on the intended contract*. Each entry is a normal issue link
  `[#NNNN](https://github.com/wekan/wekan/issues/NNNN) (one-line reason)` — issue links here, NOT
  commit links (nothing was committed). **Keep it current:** when an issue in `TODO Later` gets
  fixed, REMOVE it from the list (its fix commit's `Fixes #NNNN` closes it); do not leave fixed
  issues in the backlog. This is the only CHANGELOG place that uses issue links and lives above
  the releases; everything else uses the per-release commit-link bullets above.
- FerretDB Upcoming structure — `### New Features 🎉`, `### Fixed 🐛`, `### Other Changes
  🤖`; entries end `... by @xet7. Thanks to xet7.`
- Word-wrap both CHANGELOGs at ~80 chars, but never break a long link across lines (a
  link line may be longer).

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
- FerretDB: run `./build.sh release-ferretdb` from the `FerretDB` subdirectory (no
  version). It renames `## Upcoming FerretDB release` to the next version with the
  correct git-tag link, commits + tags + pushes, then triggers `release-all.yml` (which
  in turn triggers `docker.yml` for the multi-arch image). It refuses to re-release an
  already-tagged version.

### Security issues

- Fix the vulnerability, add a CRITICAL section to the WeKan CHANGELOG like previous
  entries, and update `../w/wekan.fi/hall-of-fame/index.html` and the vuln-name
  subdirectory `index.html` like previous security issues.

### Tests

- `rebuild-wekan.sh` / `rebuild-wekan.bat` have a menu to install dependencies, build
  WeKan and run tests.
- Add tests, negative tests and UI tests for all new features and fixes that do not yet
  have tests. When adding a test, run or validate it and fix it until it works.
- **"Check newest test logs":** test logs are written outside this repo, in
  `../log/<datetime>/` (one directory per run, e.g. `../log/2026-07-21_20-58-09/`). The
  newest datetime directory is the latest run. Each holds the Playwright per-browser
  logs (`wekan-alltests-chromium.log`, `-firefox.log`, `-webkit.log`), the mocha/unit
  log (`wekan-alltests-mocha.log`), the e2e/import logs, and `wekan-test-server.log`
  (the WeKan test server + database output). "Check the newest test logs" means: open
  the most recent `../log/<datetime>/` and read those.

## Environment

- The editor (VSCode) runs inside a **Flatpak sandbox**, launched by
  `docs/Security/Sandboxes/vscode/vscode-sandbox.sh`. What the sandbox allows/blocks and
  how it is set up is documented in `docs/Security/Sandboxes/vscode/README.md` in that
  same directory — read it when something behaves differently than a normal host (file
  access, network, running services).

### Always validate from the actual code

- When doing anything, check how it actually works in the code first.
