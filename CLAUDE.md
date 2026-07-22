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

## Translations (Transifex ↔ machine translations)

WeKan translations live in `imports/i18n/data/<lang>.i18n.json` (flat
`key -> string`, 2-space indent, key order matches `en.i18n.json`). Transifex holds
the human translations. **The policy is: never overwrite a human translation with a
machine (or English) one, but always take the newest translations from Transifex.**

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
    used.** A separate machine-translation step may fill *only* these English
    placeholders, so machine translation can never overwrite a human translation.
- Restored languages are pushed back to Transifex so they stop reverting.
- So: **only missing strings are machine-translated, and only when missing everywhere.**
  Do not add machine translations over existing human/Transifex strings, and do not let
  a pull drop existing translations.

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
- WeKan Upcoming structure — CRITICAL VULNERABILITIES first (link to
  `https://wekan.fi/hall-of-fame/...bleed/`), then new features, then updates
  (`Thanks to dependabot.`), then bug fixes; each bullet is
  `- [desc](https://github.com/wekan/wekan/commit/...).` followed by
  `Thanks to (issue creator's GitHub nickname) and xet7.`, and the section ends with
  `Thanks to above GitHub users for their contributions and translators for their
  translations.`
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
