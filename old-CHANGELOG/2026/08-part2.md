# WeKan ® 2026-08 releases, part 2

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 2 of 4, newest first: [1](08.md), 2, [3](08-part3.md), [4](08-part4.md).

Releases per day:

| 2026-08 | Releases |
| --- | --- |
| 15 | 1 |
| 16 | 5 |
| 17 | 2 |
| 18 | 2 |
| 19 | 3 |
| 21 | 1 |
| 22 | 1 |
| 23 | 3 |
| 25 | 1 |

# v11.11 2026-08-25 WeKan ® release

**In short:** this release closes five **security and privacy gaps**, improves
board creation and filtering, and makes denied attacks visible to
administrators. It also completes substantial **translation and locale-integrity
work**, strengthens cross-browser testing, updates dependencies, and documents
Haxe, Go and Free Pascal alternatives for WeKan's future architecture.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following HIGH AND MODERATE SECURITY ISSUES:

**User search** - login, identity fields and literal query boundaries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ce5cf6e1">User lookup requires a login and exposes only public identity fields</a>. Thanks to Char0n1507, Reload3d and xet7.</summary>

[UserSearchBleed](https://wekan.fi/hall-of-fame/usersearchbleed/) and
[MiniProfileBleed](https://wekan.fi/hall-of-fame/miniprofilebleed/) allowed
logged-out profile enumeration and let any authenticated user retrieve
instance-wide email, administrator, account-state and organization metadata.
Both publications now require authentication; the general search returns only
public identity fields. User-controlled search text is escaped before becoming
a regular expression, and both DDP search paths are rate-limited. Regression
coverage pins the positive identity projection and the negative sensitive-field
and raw-pattern cases. The logged-out mini-profile denial is summarized as
MiniProfileBleed in Admin Panel → Problems with its source address. UserSearchBleed
has no runtime event because its fixes change what legitimate search responses
carry and how ordinary punctuation is interpreted; logging those calls would
record normal use.

</details>

**Position history** - authorization for recorded moves and undo.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ce5cf6e1">Undo cannot move a card into a board outside the caller's membership</a>. Thanks to Char0n1507 and xet7.</summary>

[PositionHistoryBleed](https://wekan.fi/hall-of-fame/positionhistorybleed/)
trusted a client-created history entry's previous board. Inserts now require
membership on both named boards, the undo method rechecks the history board,
the model rechecks destination membership immediately before moving a card, and
clients cannot rewrite trusted history after insertion. The test covers allowed
same-board history and rejected cross-board data. Denied inserts, rewrites and
undo moves are summarized as PositionHistoryBleed in Admin Panel → Problems with
the account and source address.

</details>

**Board exports** - keeping subtask data inside the exported board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ce5cf6e1">Every export format scopes subtask queries to its board</a>. Thanks to Char0n1507 and xet7.</summary>

[SubtaskExportBleed](https://wekan.fi/hall-of-fame/subtaskexportbleed/)
allowed a card from a private board to appear in another board's JSON, ZIP,
Excel or PDF export when its parent identifier named a card there. All six
subtask query paths now include the exporting board identifier. Regression
coverage checks every board and card export implementation and rejects the old
parent-only selectors. There is no runtime event because the fix changes the
contents of a legitimate export instead of denying an attributable attack.

</details>

**CAS login** - explicit ownership of matching local accounts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ce5cf6e1">CAS cannot silently take over a matching non-CAS account</a>. Thanks to Char0n1507, crypto-nidh and xet7.</summary>

[CasBleed](https://wekan.fi/hall-of-fame/casbleed/) allowed a validated CAS
username to receive the session of an existing password or other non-CAS
account with the same name. New CAS users are marked with their authentication
method; a conflicting account is rejected unless the administrator explicitly
sets `CAS_MERGE_EXISTING_USERS=true`. Positive CAS reuse and negative implicit
linking are pinned by regression coverage. Refused implicit links are summarized
as CasBleed in Admin Panel → Problems.

</details>

**Security reporting** - denied attributable attacks reach Admin Panel Problems
without turning ordinary use into noise.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1dfa88b4">Blocked security attacks produce bounded administrator events</a>. Thanks to xet7.</summary>

Denied MiniProfileBleed, PositionHistoryBleed and CasBleed attempts now create
attributed, rate-bounded entries in Admin Panel → Problems. UserSearchBleed and
SubtaskExportBleed remain silent because their safe paths are indistinguishable
from normal searches and exports. Clients are also prevented from rewriting
validated position-history records after insertion. Canary, advisory and
negative authorization tests cover the reporting boundary.

</details>

and updates the following dependencies:

**Dependencies** - storage, authentication, build and lint packages stay current.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/343340444">The dependency lockfile is refreshed</a>. Thanks to dependency developers and xet7.</summary>

The first refresh advances the resolved AWS, Azure authentication, MongoDB,
Rspack diagnostics, SWC, TypeScript ESLint, browser-compatibility and supporting
packages without changing WeKan's declared dependency ranges.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7783497a6">The latest compatible transitive dependency fixes are included</a>. Thanks to dependency developers and xet7.</summary>

A follow-up lockfile refresh takes the compatible patch releases published
after the first batch, including the final AWS SDK, Smithy, parser, lint and
browser-data resolutions used by this release.

</details>

and fixes the following bugs:

**All Boards** - the overview's Lists and Table layouts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aae4e8183">Table view offers the same board creation action as Lists view</a>. Thanks to rmb82 and xet7.</summary>

The All Boards Table layout displayed existing boards but offered no way to
create one. It now shows the same create action and uses the same handler as the
Lists tile, including the Template Container wording and workspace context.
Archive and the special Home section continue to exclude creation. Source,
negative and browser tests cover the available and excluded sections.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a495d7d89">Existing All Boards layouts remain covered after adding board creation</a>. Thanks to xet7.</summary>

The source-level Lists and phone-layout tests now recognize the shared Add Board
action introduced in Table view while continuing to pin scrolling, tile and
layout behaviour. This keeps the feature's new control from being mistaken for
an unexpected duplicate by the older regression assertions.

</details>

**Board views** - alternate ways to display one board's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdec1744f">Table view applies the active board Filter to its card rows</a>. Thanks to rmb82 and xet7.</summary>

The Table layout queried every active card directly and ignored label, member,
assignee, date and other criteria from the board Filter. Its reactive query now
ANDs the Filter selector with immutable board and archive boundaries before the
view's own text search and pagination. Unit, wiring and browser tests cover both
unfiltered and filtered rows.

</details>

and improves the following developer tooling:

**Complete tests** - suites use repository tools and available CPU browsers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af1924567">Complete-test regressions are repaired after recent feature and translation work</a>. Thanks to xet7.</summary>

Translation subprocesses now use the suite's own Node executable, invariant and
backlog expectations follow the current translation helpers, and the Table-view
browser test reapplies its filter after the view-change reload. The complete
runner therefore checks current behaviour instead of failing on stale harness
assumptions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c31e64059">Node E2E uses the Playwright container when no compatible Chromium is installed</a>. Thanks to xet7.</summary>

The Puppeteer-based Node regression harness now routes through the existing
Playwright container when its browser must come from Docker. Linux arm64 no
longer falls back to a missing `/usr/bin/chromium`, and selection tests pin both
the local and container paths.

</details>

**Browser isolation** - one test's teardown cannot revoke another test's login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b72e0e99f">Every Red Strings browser test receives its own session</a>. Thanks to xet7.</summary>

Each Red Strings case now creates a separate resume token. Closing an earlier
Chromium or WebKit connection can no longer revoke the session a later Firefox
case is about to use, eliminating the cross-browser ordering failure while
retaining normal session teardown.

</details>

**Release notes** - readers get a brief overview before topic and commit detail.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/403a0ad7a">The release-summary hierarchy and topic grouping are explicit and tested</a>. Thanks to xet7.</summary>

`AGENTS.md` and `CLAUDE.md` now define three levels: a release-wide In short
paragraph of at most about 120 words, one high-level summary for each topic, and
commit-specific expandable details. The format regression caps the introductory
word count and checks that the documented grouping vocabulary remains present.

</details>


and improves the following documentation:

**Multiverse** - alternative implementation languages and dependency mappings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b649189f4">Haxe rewrite options and dependency equivalents are documented</a>. Thanks to xet7.</summary>

The Multiverse design compares incremental Haxe/JavaScript modules, a Haxe
browser client, a Haxe/Node server and native HashLink, C++ and JVM servers. It
maps Meteor platform facilities and WeKan dependencies to Haxe libraries or
explicitly custom replacements, and recommends a tested vertical slice before
any complete rewrite.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/037eb3144">Go rewrite options and dependency equivalents are documented</a>. Thanks to xet7.</summary>

The Go design maps the server, browser, data, authentication, storage, export,
operations, testing and distribution stack to standard-library facilities,
maintained packages or custom compatibility work. It separates Pug as Jade's
JavaScript successor from Go-native `html/template` and templ rewrites.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d33681e5">Free Pascal rewrite options and dependency equivalents are documented</a>. Thanks to xet7.</summary>

The Free Pascal design derives its stack from the local server-rendered
prototypes: FCL `fphttpapp`,
`httproute`, `fpjson`, linked SQLite, server-rendered HTML, optional
`interact.js`, Caddy at the TLS edge and mORMot 2 or Brook only when measured
scale requires them.

</details>

**Development sandbox** - the documented editor sandbox uses its maintained,
open-source distribution consistently.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bf68e8c3">The VS Code sandbox is renamed and updated for VSCodium</a>. Thanks to xet7.</summary>

The sandbox directory, launcher and documentation now consistently name
VSCodium. Obsolete VS Code-specific setup is removed so paths and commands match
the editor distribution the sandbox actually installs.

</details>

and improves the translation workflow:

**Translation policy** - correct-language and placeholder integrity.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/775c56df9">Every locale file must use the language declared by its tag</a>. Thanks to xet7.</summary>

Human-preference protection now applies only to translations written in the
locale tag’s language. Mixed or wrongly seeded values must be replaced directly,
including same-script cases such as Russian text in Mongolian, with vocabulary
review and regression coverage where script detection cannot distinguish them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65d86b442">Translation placeholders must match the English source exactly</a>. Thanks to xet7.</summary>

Underscore-delimited tokens such as `__board__` and percent-prefixed format
tokens such as `%s` are code, not translatable prose. They must retain their
English spelling, case, count and format. A translated, renamed, missing or
malformed token is restored from the same key in `en.i18n.json`, even inside an
otherwise human translation, and regression coverage compares token inventories
with English.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d0dd9ffc">Completed locales remain included in translation-fill regression coverage</a>. Thanks to xet7.</summary>

The invariant-source regression now follows the completed-locale list and the
current fill helper instead of retaining obsolete exclusions. It continues to
prove that already completed locales stay at zero fillable English placeholders
as translation work advances.

</details>

**Placeholder repairs** - exact named and printf token inventories.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aa3b9784">Eleven locale files restore their last mismatched placeholder</a>. Thanks to xet7.</summary>

Spanish (Argentina), Galician, Gujarati, Hungarian, Polish and Portuguese
variants now preserve the same named and printf tokens as their English keys.
The repair keeps exact spelling and case, updates obsolete Hungarian prose and
replaces copied Portuguese wording with Galician. Whole-file regression
coverage proves all eleven locale files are clean and rejects the malformed,
missing and wrong-language forms. The direct Galician and Hungarian wording
welcomes human review. Another 1,331 mismatched keys across 108 locale files
remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3f4007e0">Seventeen locale files restore their remaining placeholder tokens</a>. Thanks to xet7.</summary>

Welsh, Greek, Spanish, Basque, Finnish, Croatian and Slovenian variants now
preserve exact named, printf and HTML placeholders. The repair covers 34 counted
token mismatches plus four Welsh machine-placeholder remnants, removes a
duplicated English sentence from Greek and replaces Catalan prose in Basque.
Whole-file regression coverage proves all seventeen locale files are clean and
rejects the corrupt or wrong-language forms. The direct Welsh, Basque, Finnish,
Croatian and Slovenian wording welcomes human review. Another 1,297 mismatched
keys across 91 locale files remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce93ac388">Eighteen locale files restore exact tokens and their declared languages</a>. Thanks to xet7.</summary>

Asturian, Bulgarian, Czech, Danish, Persian, Hebrew, Japanese, Georgian,
Macedonian, Slovak, Serbian, Tamil, Venda and Xhosa now preserve their exact
named and printf placeholders. The repair covers 54 counted mismatches plus a
hidden Xhosa machine remnant, and replaces same-script wrong-language carryovers
according to each locale tag. Whole-file regression coverage proves all eighteen
files are clean and rejects the corrupt tokens and copied neighbouring-language
forms. These direct translations have mixed confidence and welcome
native-speaker review. Another 1,243 mismatched keys across 73 locale files
remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c844eeb81">Fourteen locale files restore exact placeholders and script variants</a>. Thanks to xet7.</summary>

Esperanto, Japanese hiragana, Korean, Malay, Swedish, Telugu, Uzbek and
Vietnamese variants now preserve the exact spelling, case and multiplicity of
their English placeholders. The repair covers 56 mismatches, replaces copied
Spanish in Esperanto, and writes the hiragana and Arabic-script variants in
their declared scripts. Whole-file regression coverage proves all fourteen
files are clean and rejects translated token names, duplicate prompt values and
wrong-language forms. These direct translations have mixed confidence and
welcome native-speaker review. Another 1,187 mismatched keys across 59 locale
files remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0edb3db90">Eleven French, German and Hindi variants restore exact placeholders</a>. Thanks to xet7.</summary>

The coherent part of the five-mismatch tier now preserves exact activity,
email, count and search tokens across eleven locale variants. Search examples
such as `user:<name>` and `has:-due` remain literals instead of becoming extra
runtime placeholders. Whole-file regression coverage proves all eleven files
are clean and rejects embedded spaces, incomplete named tokens and invented
operator tokens. Another 1,132 mismatched keys across 48 locale files remain;
the four wrongly seeded files from this tier are handled separately in the next
entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63bbf2460">Four wrongly seeded locales restore exact tokens in their own languages</a>. Thanks to xet7.</summary>

Breton, Walloon and Wolof no longer use copied French in the five affected
activity and search strings, and Klingon no longer uses copied German. Their
twenty mismatches now preserve the exact English token inventory while search
examples remain literals. Whole-file regression coverage proves all four files
are clean and rejects the French and German seed wording. These direct
translations have low confidence and welcome native-speaker review. Another
1,112 mismatched keys across 44 locale files remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ce409f05">Ten Azerbaijani, Catalan and Russian tags restore exact placeholders</a>. Thanks to xet7.</summary>

The coherent part of the six-mismatch tier restores 60 logical locale values
across nine tracked data files and the `ru-RU` symlink alias. Azerbaijani
activities retain every board location, Catalan search help restores its full
predicate inventory, and Russian email subjects and errors use exact named and
printf tokens. Whole-file regression coverage proves all ten tags are clean and
rejects corrupted predicates, `%1` fragments and substituted URL tokens. The
direct Azerbaijani wording welcomes human review. Another 1,052 mismatched keys
across 34 locale files remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09444981d">Italian, Venda and Volapük complete the six-mismatch tier</a>. Thanks to xet7.</summary>

Italian restores its six activity placeholders, while Venda and Volapük replace
wrong-language seed prose as they restore the same exact token inventories.
Whole-file regression coverage proves all three files are clean, checks every
due-time value and rejects the Italian, Esperanto and French seed wording. The
direct Venda and Volapük translations have low confidence and welcome
native-speaker review. Another 1,034 mismatched keys across 31 locale files
remain for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bacbfa3d5">Numbered Transifex machine placeholders are restored repository-wide</a>. Thanks to xet7.</summary>

A deterministic, transactional utility maps `PH0`, `PH1` and later markers to
the protected backtick, HTML, angle, named and printf spans in each matching
English source key. It repaired 1,208 markers in 539 translated values across
Igbo, Odia, Turkmen, Uyghur and Yoruba without replacing their surrounding
prose. Repository-wide negative coverage rejects every marker spelling variant.
Igbo and Yoruba are now placeholder-clean; another 546 mismatched keys across
29 locale files remained for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2de6cb556">Odia, Turkmen and Uyghur complete their marker-repair cleanup</a>. Thanks to xet7.</summary>

The remaining 32 malformed activity, member, range and search-help values restore
every named and printf placeholder while retaining prose in each declared
language. Whole-file coverage proves all three locale inventories are clean, and
focused negative tests reject the final Odia marker fragment and missing Turkmen
and Uyghur values. The direct translations welcome native-speaker review. Another
514 mismatched keys across 26 locale files remained for audited batches.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdacd27a1">Four languages complete the seven-mismatch placeholder tier</a>. Thanks to xet7.</summary>

Acehnese, Indonesian, Turkish and Traditional Chinese restore 28 named and
printf inventories. Acehnese replaces Indonesian seed wording with its existing
`kad`, `senarai` and `papan` terminology; focused negative tests also reject
case-damaged Turkish tokens and translated Chinese token names. All four files
are clean. The direct Acehnese prose has low confidence and welcomes
native-speaker review. Another 486 mismatches across 22 locale files remained.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3b17b34e">Four compact locale tiers restore every placeholder</a>. Thanks to xet7.</summary>

Latvian, Norwegian Bokmål, Occitan and Hong Kong Traditional Chinese restore 37
named and printf inventories. Occitan also replaces French-seeded prose in its
affected values. Whole-file coverage and focused negative tests reject mistyped,
translated and wrong-language identifiers. All four files are clean; the direct
Occitan prose welcomes native-speaker review. Another 449 mismatches across 18
locale files remained.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4659eea3">Afrikaans, Romanian and Chinese families restore every placeholder</a>. Thanks to xet7.</summary>

Ten locale files restore 145 named and printf inventories. Romanian replaces
Italian-seeded activity prose, while Simplified and Traditional Chinese variants
reuse only asserted placeholder-clean sibling translations. Family-wide and
focused negative coverage proves every file clean and rejects translated or
wrong-language identifiers. Another 304 mismatches across eight locale files
remain; direct translations welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/baafa9872">Both Ukrainian variants restore their search placeholders</a>. Thanks to xet7.</summary>

Sixty-eight values restore exact activity arities plus every operator and
predicate in Ukrainian search help. Whole-file and focused coverage proves both
variants clean. Direct wording welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e15e3d88">Estonian restores every translated identifier</a>. Thanks to xet7.</summary>

Thirty-five activity, email, due-date, range and search values restore their
named and printf inventories. Whole-file negative coverage rejects translated
identifiers. Direct wording welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f800c6b73">Four Arabic-family files restore every placeholder</a>. Thanks to xet7.</summary>

Arabic, Algerian Arabic, Egyptian Arabic and Moroccan Arabic restore 160
activity and email inventories. Script and identifier regressions cover every
file. Moroccan Arabic wording has low dialect confidence and welcomes review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70bac688e">Tamazight completes the placeholder repair backlog</a>. Thanks to xet7.</summary>

The final 41 mismatches now use Latin-script Tamazight prose instead of mixed
Arabic and French seed text. Whole-file coverage proves the repository-wide
placeholder mismatch count is zero. These translations have low confidence and
welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/269404954">Fill reports exclude values that intentionally stay invariant</a>. Thanks to xet7.</summary>

Numbers, symbols, empty values, placeholder-only formats, product names and
storage backends no longer appear as impossible translation work. Real sentences
containing placeholders remain listed. The corrected direct-fill backlog is
202,628 values across 210 locales, with CLI regression coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e6b0e73f">Five single-value locales complete their direct fills</a>. Thanks to xet7.</summary>

Finnish, two Hindi variants and two Ukrainian variants translate their final
genuine English values with exact-value and target-script coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e6942e6f">Vietnamese and Hebrew complete their direct-fill tails</a>. Thanks to xet7.</summary>

Both Vietnamese variants translate checklist, font-preview and storage terms.
Date-format masks are now classified as invariant, completing both Hebrew tags.
CLI and language regressions cover both outcomes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa7f62ffe">Both Greek variants complete their storage terminology</a>. Thanks to xet7.</summary>

Connection-string, container, backup and project-ID values now use Greek, with
Greek-script and zero-backlog coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eca9301e9">Four Indic locales complete board-selection messages</a>. Thanks to xet7.</summary>

Gujarati, Odia, Punjabi and Telugu translate 28 board-selection and
permanent-delete values. Target-script and English-remnant coverage verifies all
four completed files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78daa9961">Six eight-value locale tails are complete</a>. Thanks to xet7.</summary>

Belarusian, Armenian, Georgian, Mongolian, Serbian and Tamil translate their
remaining board controls and technical labels. Zero-backlog and script coverage
verifies all six files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e61400e2">Four nine-value locale tails are complete</a>. Thanks to xet7.</summary>

Bulgarian, both Persian variants and Macedonian translate their remaining board
controls and technical labels while preserving product and JSON identifiers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41af211f8">Khmer completes its direct translation fill</a>. Thanks to xet7.</summary>

Thirteen board-selection, permanent-delete and wait-spinner values now use Khmer
across all tags, with Khmer-script and English-remnant coverage.

</details>

- [The tracked Khmer underscore tag carries the same verified translations](https://github.com/wekan/wekan/commit/68aa99f44). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a1d4587f">All Portuguese tags complete their direct fills</a>. Thanks to xet7.</summary>

Three tags translate 57 color, menu, location, Office and API report values,
using explicit Portuguese alternatives for valid cognates. Zero-backlog and
report coverage verifies every tag.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3bf82281">Thai completes its direct translation fill</a>. Thanks to xet7.</summary>

Nineteen board-selection, permanent-delete, Office and API report values now use
Thai, with target-script, English-remnant and API-literal coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3bd4ea9f3">Venda and Zulu complete separate direct fills</a>. Thanks to xet7.</summary>

Three Tshivenda and two isiZulu tags translate 95 values with distinct language
mappings. Zero-backlog and language-distinction coverage verifies every file.
The direct translations have low confidence and welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b9f6874a">Esperanto completes its direct translation fill</a>. Thanks to xet7.</summary>

Twenty board, clipboard, Office and API report values now use Esperanto, with
zero-backlog, vocabulary and English-remnant coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64bda540f">Nine Spanish tags complete their direct fills</a>. Thanks to xet7.</summary>

The shared 20-value tail completes 180 UI, Office, API report and ticket values.
Explicit Spanish alternatives replace valid cognates, and report coverage
verifies every tag.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/442065048">Turkish completes its direct translation fill</a>. Thanks to xet7.</summary>

Twenty checklist, typography, Office, API report and storage values now use
Turkish, with zero-backlog, terminology and English-remnant coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e6924f68">Hungarian completes its direct translation fill</a>. Thanks to xet7.</summary>

Twenty-one board, archive, Office and API report values now use Hungarian, with
zero-backlog, terminology and protected-literal coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7874d769b">Latvian completes its direct translation fill</a>. Thanks to xet7.</summary>

Twenty-one board, archive, Office and API report values now use Latvian, with
zero-backlog, terminology and protected-literal coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac1ce0295">Basque and Uyghur complete their direct translation fills</a>. Thanks to xet7.</summary>

Forty-two board, admin, Office, API report and search-help values now use Basque
and Uyghur. Zero-backlog and target-language coverage preserves `%s`,
`__operator_number__`, `IPv4`, `IPv6`, `REST API` and `WITH_API=true` exactly.
The Uyghur translations have low confidence and welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdefe268d">Breton, Lithuanian and Yiddish complete their direct fills</a>. Thanks to xet7.</summary>

Sixty-six board, admin, Office, API, storage and search-help values now use their
target languages. Zero-backlog, terminology and script coverage preserves every
protected API and search placeholder. Breton and Yiddish have low confidence
and welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6d3662b3">Galician and Xhosa complete their direct fills</a>. Thanks to xet7.</summary>

Both Galician tags and Xhosa translate 69 board, admin, Office, API, storage and
typography values. Xhosa has low confidence and welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7af96193">Swahili completes its direct translation fill</a>. Thanks to xet7.</summary>

Twenty-four board, colour, admin, Office, API and CPU values now use Swahili,
with zero-backlog, terminology and protected-literal coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46351547a">Asturian, Welsh and Uzbek complete their direct fills</a>. Thanks to xet7.</summary>

Seven tags translate 175 values without replacing existing human Uzbek text.
Zero-backlog coverage preserves network and configuration literals. Asturian
and Uzbek have mixed confidence and welcome native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b3563555">Seven files complete the 26-value translation tier</a>. Thanks to xet7.</summary>

Azerbaijani, Croatian, Polish and Slovak translate 182 values with zero-backlog,
sibling-consistency and protected-token coverage. Azerbaijani has mixed
confidence and welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a518c6990">Four files complete the 27-value translation tier</a>. Thanks to xet7.</summary>

Estonian, Romanian and Walloon translate 108 values with zero-backlog,
sibling-consistency and protected-token coverage. Walloon has low confidence
and welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/762a778aa">Five files complete the 28-value translation tier</a>. Thanks to xet7.</summary>

Indonesian, Occitan, Brazilian Portuguese, Turkmen and Tamazight translate 140
values with embedded-JSON, zero-backlog and placeholder coverage. Occitan,
Turkmen and Tamazight have low confidence and welcome review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c34ec39a">Three files complete the 29-value translation tier</a>. Thanks to xet7.</summary>

Acehnese and both Czech tags translate 87 values with embedded-JSON,
sibling-consistency and protected-token coverage. Acehnese has low confidence
and welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e1cbc1c5">Three files complete the 30-value translation tier</a>. Thanks to xet7.</summary>

Both Slovenian tags and Volapük translate 90 values with mixed-language,
sibling-consistency and protected-token coverage. Volapük has low confidence
and welcomes native-speaker review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9faa361b">Valencian completes its direct translation fill</a>. Thanks to xet7.</summary>

Thirty-one board, admin, Office, API and storage values now use Valencian, with
zero-backlog, terminology and protected-token coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8be40c24">Walloon and Yoruba complete the 32-value translation tier</a>. Thanks to xet7.</summary>

Sixty-four values now use their target languages with zero-backlog,
mixed-language and protected-placeholder coverage. Both have low confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf9a4ce5f">Italian completes its direct translation fill</a>. Thanks to xet7.</summary>

Thirty-three interface, Office, API and storage values now use explicit Italian
alternatives for valid cognates, with zero-backlog coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3debaa3a">Catalan completes its direct translation fill</a>. Thanks to xet7.</summary>

Thirty-five values now use standard Catalan terminology distinct from
Valencian, with zero-backlog and protected-token coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6eeffd572">Catalan-Spain and Klingon complete their 35-value tails</a>. Thanks to xet7.</summary>

Seventy values now use their target languages with zero-backlog, foreign-script
and protected-placeholder coverage. Klingon has very low confidence; its older
mixed-language seed text remains for the whole-file audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f84ba9d2b">Igbo and Swedish complete the 36-value translation tier</a>. Thanks to xet7.</summary>

Seventy-two values now use their target languages with zero-backlog, storage-ID
and protected-token coverage. Igbo has low confidence and welcomes review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d55ef1df">Both Afrikaans tags complete their direct fills</a>. Thanks to xet7.</summary>

Seventy-four values now use explicit Afrikaans alternatives for valid cognates,
with zero-backlog and sibling-consistency coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbae558f2">Both Malay tags complete their direct fills</a>. Thanks to xet7.</summary>

Seventy-six values now use Malay with executable-JSON, zero-backlog and
sibling-consistency coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/819f24fdc">Danish completes its direct translation fill</a>. Thanks to xet7.</summary>

Forty interface, Office, API and storage values now use explicit Danish
alternatives for valid cognates, with zero-backlog coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d50690692">Norwegian Bokmål completes its direct translation fill</a>. Thanks to xet7.</summary>

Forty-two interface, Office, API and storage values now use explicit Norwegian
alternatives for valid cognates, with zero-backlog coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a28e1df7e">Wolof completes its direct translation fill</a>. Thanks to xet7.</summary>

Forty-four values now use Wolof with zero-backlog, terminology and
English-remnant coverage. The translations have low confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87b49dc12">All five French tags complete their direct fills</a>. Thanks to xet7.</summary>

Two hundred seventy values now use explicit French phrases for valid cognates,
with zero-backlog and sibling-consistency coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e36d074b">Both West Frisian tags complete their direct fills</a>. Thanks to xet7.</summary>

One hundred ten values now use West Frisian with zero-backlog, storage-ID and
sibling-consistency coverage. The translations have mixed confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a9b669d0">All four German tags complete their direct fills</a>. Thanks to xet7.</summary>

Two hundred thirty-two values now use established German UI terms instead of
English loanword placeholders, with zero-backlog and sibling coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f14d95b8">Both Dutch tags complete their direct fills</a>. Thanks to xet7.</summary>

One hundred thirty-two values now use established Dutch UI terms instead of
English loanword placeholders, with zero-backlog and sibling coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cff765a79">Flemish completes its direct translation fill</a>. Thanks to xet7.</summary>

Seventy-three values now use verified Dutch terminology plus regional Flemish
board and admin wording, with zero-backlog coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c37a15bac">Amharic begins its whole-file direct translation</a>. Thanks to xet7.</summary>

The first 50 activity and board-history values now use Amharic. Progress,
Ethiopic-script and whole-locale placeholder coverage verifies the batch; 2,116
values remain. The translations have mixed confidence and welcome review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4af04a4e4">Amharic activity and workspace history gains 50 values</a>. Thanks to xet7.</summary>

The second direct batch completes the remaining activity-history and initial
workspace strings. Whole-locale placeholder coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a3465e29">Amharic board interface gains another 50 values</a>. Thanks to xet7.</summary>

Workspace, board-selection, list-sizing and checklist controls now use Amharic.
Progress, Ethiopic-script and placeholder coverage leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09a05b33f">Amharic admin and board information gains 50 values</a>. Thanks to xet7.</summary>

Admin, archive, attachment and board-information values now use Amharic.
Whole-locale coverage now also preserves HTML tags; 1,966 values remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5ba00104">Amharic board views and card editing gain 50 values</a>. Thanks to xet7.</summary>

Visibility, display-mode, archive and card-editing values now use Amharic.
Placeholder, markup and Ethiopic-script coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b70b264d9">Amharic voting and import controls gain 50 values</a>. Thanks to xet7.</summary>

Membership, voting, Planning Poker, dependency and import values now use
Amharic. Whole-locale invariant coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a7965ef9">Amharic member and typography controls gain 50 values</a>. Thanks to xet7.</summary>

Popups, imported-member mapping, themes and typography now use Amharic.
Placeholder, markup and Ethiopic-script coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74b4cf093">Amharic navigation and color controls gain 50 values</a>. Thanks to xet7.</summary>

Settings, subtasks, starring, card aging, movement dialogs and most color names
now use Amharic. Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e9aced92">Amharic roles and custom-field controls gain 50 values</a>. Thanks to xet7.</summary>

Colors, board roles, deletion confirmations, copying and custom fields now use
Amharic. Percent-token coverage now protects every letter-style placeholder;
1,716 values remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17f7dc538">Amharic email templates and errors gain 50 values</a>. Thanks to xet7.</summary>

Profile, email-template, WIP and error values now use Amharic while retaining
every message placeholder. Whole-locale invariant coverage leaves 1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68b20172f">Amharic card exports and filters gain 50 values</a>. Thanks to xet7.</summary>

User errors, card exports, sorting and initial filters now use Amharic.
Whole-locale invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e052624b">Amharic advanced filters and imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced filters, activities and board-import instructions now use Amharic
while preserving grammar, JSON terms, paths and placeholders. Focused syntax
coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27cfa82d0">Amharic Trello imports and member mapping gain 50 values</a>. Thanks to xet7.</summary>

Trello API imports, member mapping, validation and labels now use Amharic while
retaining the API URL, year example and percent placeholder. Whole-locale
invariant coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/337592476">Amharic board actions and roles gain 50 values</a>. Thanks to xet7.</summary>

Board departure, list and archive actions, selection tools, notifications and
roles now use Amharic while retaining the board-title placeholder. Whole-locale
invariant coverage leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ba438326">Amharic privacy and shortcuts gain 50 values</a>. Thanks to xet7.</summary>

Notifications, privacy, removal, search, WIP and shortcuts now use Amharic while
retaining login markup and member placeholders. Whole-locale invariant coverage
leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14344e047">Amharic tracking and branding gain 50 values</a>. Thanks to xet7.</summary>

Time tracking, uploads, custom branding, welcome templates and WIP warnings now
use Amharic while retaining URL, API, WIP and numeric terms. Whole-locale
invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f4380a52">Amharic limits and webhooks gain 50 values</a>. Thanks to xet7.</summary>

Attachment limits, registration, SMTP, invitations, webhooks and runtime
versions now use Amharic while retaining invitation placeholders and technical
terms. Whole-locale invariant coverage leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d96fcf16">Amharic diagnostics and tenancy gain 50 values</a>. Thanks to xet7.</summary>

Diagnostics, custom-field display, visibility, organizations and teams now use
Amharic while retaining environment variables, protocols, hostnames and
multitenancy syntax. Whole-locale invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef061a85d">Amharic card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Card dates, colors, deletion, subtasks, minicard display and activity labels now
use Amharic while retaining board and percent placeholders. Whole-locale
invariant coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e4508f23">Amharic activity and automation gain 50 values</a>. Thanks to xet7.</summary>

Activity messages and automation workflow/import controls now use Amharic while
retaining repeated percent argument order, named tokens and format terms.
Focused positional coverage leaves 1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2e8a2747">Amharic scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

Visual workflows, schedules, due-date triggers, buttons, sorting and relative
dates now use Amharic while retaining workflow product names and structural
values. Whole-locale invariant coverage leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/039266234">Amharic automation phrases gain 50 values</a>. Thanks to xet7.</summary>

List, label, member, checklist, card and email automation fragments now use
consistent Amharic rule-builder terminology. Whole-locale invariant coverage
leaves 1,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/115e6151b">Amharic automation and custom head gain 50 values</a>. Thanks to xet7.</summary>

Automation actions, authentication, custom-head settings and layout controls
now use Amharic while retaining comma-separated examples, format names and
assetlinks.json. Whole-locale invariant coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/129a95c11">Amharic authentication and reminders gain 50 values</a>. Thanks to xet7.</summary>

Custom body HTML, authentication, duplication, deletion, positioning, due
reminders, drag and editor controls now use Amharic while retaining HTML tags,
newlines and activity placeholders. Whole-locale coverage leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de8263812">Amharic roles and editor behavior gain 50 values</a>. Thanks to xet7.</summary>

Multi-card and editor behavior, organizations, notifications, role permissions,
weekdays and linked-card warnings now use Amharic while retaining keyboard
chords. Whole-locale invariant coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cf649e74">Amharic domains and card views gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, domains, shared templates, My Cards, Due Cards, global
search and lookup errors now use Amharic while retaining domain examples,
Markdown and percent placeholders. Whole-locale coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88f4e76f4">Amharic global-search vocabulary gains 50 values</a>. Thanks to xet7.</summary>

Result counts, search operators and predicates now use Amharic while retaining
percent tokens and range-placeholder order. Focused order coverage leaves 816
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ede9a641">Amharic search help gains 50 values</a>. Thanks to xet7.</summary>

Search predicates, validation messages and full operator help now use Amharic
while retaining backticked expressions, metavariables, Markdown, newlines and
placeholders. Whole-locale invariant coverage leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40da7ceed">Amharic dependencies and locations gain 50 values</a>. Thanks to xet7.</summary>

Sorting, stickers, dependencies, board backgrounds and locations now use
Amharic while retaining JSON/SVG, named tokens and double-brace templates.
Expanded token coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f9176edc">Amharic maps and reports gain 50 values</a>. Thanks to xet7.</summary>

Maps, server troubleshooting, string templates, reports and office locations
now use Amharic while retaining shell commands, HTML entities, IP terms and
percent-brace tokens. Expanded token coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/508125bf8">Amharic reports and tickets gain 50 values</a>. Thanks to xet7.</summary>

Office, API and recovery reports, loading indicators, organization warnings
and ticket workflow terms now use Amharic while retaining REST API,
WITH_API=true and Cc. Whole-locale invariant coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44be0dc7e">Amharic administration and attachments gain 50 values</a>. Thanks to xet7.</summary>

Team and organization controls, Node memory diagnostics, legal notices,
checklists and attachment-storage moves now use Amharic while retaining Node,
URL, GridFS and S3. Whole-locale invariant coverage leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/093975714">Amharic storage and repair controls gain 50 values</a>. Thanks to xet7.</summary>

Attachment migration and repair, storage statistics, MongoDB compaction and
board metadata now use Amharic while retaining GridFS, S3, MongoDB, Meteor and
ID. Whole-locale invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/635af5a0c">Amharic support and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board timing and upload status, file constraints, custom translations,
checklists, support and accessibility now use Amharic while retaining the
workspace placeholder, ISO 8601, PDF, JSON and ZIP terms. Whole-locale
invariant coverage leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91a82565b">Amharic lockout and scheduling controls gain 50 values</a>. Thanks to xet7.</summary>

Accessibility, brute-force lockouts, user-state filters, scheduled jobs,
attachment paths and board maintenance scheduling now use Amharic.
Whole-locale invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/822f4ba28">Amharic database migration gains 50 values</a>. Thanks to xet7.</summary>

Scheduled-job results, filesystem and cloud storage, MongoDB/FerretDB migration
and Sandstorm status now use Amharic while retaining the database placeholder,
URLs, environment variables and product names. Whole-locale invariant coverage
leaves 366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/925fd424b">Amharic security and backups gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, card loading, security switches, anonymized import/export
and backups now use Amharic while retaining markup, environment variables,
service names and backup paths. Whole-locale invariant coverage leaves 316
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88daa17da">Amharic cloud storage gains 50 values</a>. Thanks to xet7.</summary>

Backup scheduling and restoration plus AWS, Azure and Google Cloud setup
guidance now use Amharic while retaining JSON, IDs, filenames, field labels and
HH:MM. Whole-locale invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3378401c">Amharic attachment migration and S3 gain 50 values</a>. Thanks to xet7.</summary>

GridFS and attachment migrations, S3 settings, scheduled board operations and
storage navigation now use Amharic while retaining storage products,
SSL/TLS and the region example. Whole-locale invariant coverage leaves 216
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d08603ac">Amharic board migration gains 50 values</a>. Thanks to xet7.</summary>

Lost-card recovery, duplicate-list cleanup, archive restoration, URL repairs
and migration steps now use Amharic while retaining field identifiers, IDs and
URLs. Whole-locale invariant coverage leaves 166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc5bcc88e">Amharic migration monitoring gains 50 values</a>. Thanks to xet7.</summary>

Remaining migration steps plus job, CPU/memory, filesystem/GridFS and
monitoring labels now use Amharic while retaining technical identifiers.
Whole-locale invariant coverage leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a42efd7b">Amharic migration controls gain 50 values</a>. Thanks to xet7.</summary>

Bulk attachment migration, throttling, monitoring, pagination, schedules and
progress counters now use Amharic while retaining numeric ranges, percent, ms,
CPU, GridFS and S3. Whole-locale invariant coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb8d8724f">Amharic repositories and repairs gain 50 values</a>. Thanks to xet7.</summary>

Repository login/upload, authentication errors, problem monitoring,
broken-card repair, CPU status and event columns now use Amharic while
retaining repair placeholders in source order. Whole-locale invariant coverage
leaves 16 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8ef7ad8a">Amharic completes its whole-file translation</a>. Thanks to xet7.</summary>

The final 16 integrity, export, import and number-search values now use Amharic
while retaining IP versions, file extensions, product names and exact search
metavariables. The fill tool and focused regression now require zero English
placeholders across the whole locale.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ee1df2ca">Assamese begins its whole-file translation</a>. Thanks to xet7.</summary>

The first 50 activity and board-history values now use Assamese while retaining
every named and percent placeholder. New whole-locale regression coverage
checks the exact remaining count, token and HTML inventories, Assamese script
and representative activity placeholders, leaving 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/648d42691">Assamese activity and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement, activity phrases and All Boards workspace controls now use
Assamese while retaining named placeholders, percent multiplicity and Markdown
terminology. Whole-locale invariant coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bdc49228">Assamese board layout gains 50 values</a>. Thanks to xet7.</summary>

Workspace selection and home-board controls, due dates, list widths, swimlane
heights, keyboard shortcuts and card/checklist actions now use Assamese while
retaining percent placeholders. Whole-locale invariant coverage leaves 2,016
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c81798a34">Assamese administration and archives gain 50 values</a>. Thanks to xet7.</summary>

Administration, archives, templates, attachments, board appearance, members
and privacy now use Assamese while retaining named and percent placeholders,
URL terminology and the exact strong-tag pair. Whole-locale invariant coverage
leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5444c182a">Assamese board views and archives gain 50 values</a>. Thanks to xet7.</summary>

Public-board markup, board navigation and view modes, zoom, calendar,
archive/delete guidance and card editing now use Assamese while retaining
markup, the workspace placeholder, percent values and comments. Whole-locale
invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d46008c9c">Assamese voting and dialogs gain 50 values</a>. Thanks to xet7.</summary>

Card membership, voting, Planning Poker, dependencies and administration,
domain, import and export dialogs now use Assamese. Whole-locale invariant
coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/265675c1c">Assamese members and typography gain 50 values</a>. Thanks to xet7.</summary>

Member and dialog titles, imported-member mapping, themes, fonts, colors,
avatars, language and permissions now use Assamese while retaining CAS and
numeric preview content. Whole-locale invariant coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b9a7b6a8">Assamese navigation and colors gain 50 values</a>. Thanks to xet7.</summary>

Starring, automatic list widths, clipboard and card-aging controls, movement,
navigation dialogs and the first color vocabulary set now use Assamese.
Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4511ccce">Assamese roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Board roles and comment permissions, deletion confirmations, clipboard and
link copying, multi-card templates and custom-field types now use Assamese.
The translated multi-card example remains valid JSON. Whole-locale invariant
coverage leaves 1,716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e963dab3">Assamese email and errors gain 50 values</a>. Thanks to xet7.</summary>

Custom fields, permanent deletion, WIP and profile dialogs, email templates,
validation and import errors now use Assamese while retaining placeholders,
paragraph breaks and JSON/CSV/TSV terminology. Focused email-template coverage
leaves 1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/104f3f12e">Assamese exports and filters gain 50 values</a>. Thanks to xet7.</summary>

Account-name errors, card export fields, disk-space messages, list sorting and
date, label and member filters now use Assamese while retaining PDF, Excel and
file-format names. Whole-locale invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b95aa961b">Assamese advanced filters and imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced filters and board-import instructions for multiple services and
formats now use Assamese while retaining operators, regex, escapes, JSON field
names, API paths, extensions and placeholders. Focused syntax coverage leaves
1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5179eb764">Assamese Trello imports and member mapping gain 50 values</a>. Thanks to xet7.</summary>

Safe Trello ZIP/API imports, job controls and results, member mapping,
validation, keyboard shortcuts and labels now use Assamese while retaining the
Trello URL, API terminology, year example and percent placeholder.
Whole-locale invariant coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95e763454">Assamese list actions and roles gain 50 values</a>. Thanks to xet7.</summary>

Board departure, list archive/move/delete actions, settings dialogs,
multi-selection, notification modes and normal/assigned roles now use Assamese
while retaining the board-title placeholder. Whole-locale invariant coverage
leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1febef555">Assamese navigation and members gain 50 values</a>. Thanks to xet7.</summary>

Watched updates, private-page login links, board visibility, member removal,
rescue/search/WIP controls, shortcuts, sidebars and starred/home boards now use
Assamese while retaining exact HTML and member placeholders. Whole-locale
invariant coverage leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/454fe1e71">Assamese tracking and branding gain 50 values</a>. Thanks to xet7.</summary>

Subscriptions, tracking, time and shortcut labels, uploads, branding URLs,
welcome/template boards, WIP errors and attachment/API limits now use Assamese
while retaining numeric ranges and technical terms. Whole-locale invariant
coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65eabb5b2">Assamese limits and webhooks gain 50 values</a>. Thanks to xet7.</summary>

Attachment/API transfer limits, registration and invitations, SMTP settings,
test mail, webhooks and runtime versions now use Assamese while retaining
technical terms and the invitation template's placeholders and paragraph
structure. Focused coverage leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a0c79ca2">Assamese diagnostics and tenancy gain 50 values</a>. Thanks to xet7.</summary>

Database/FerretDB/reactivity diagnostics, OS metrics, custom-field display,
account visibility, organization tenancy/domains/admins and team propagation
now use Assamese while retaining modes, hostnames and environment variables.
Whole-locale invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/504950321">Assamese card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Received/end dates, colors, destructive cleanup, subtask/card settings,
minicard display, parent paths and label activity now use Assamese while
retaining the board and quoted percent placeholders. Whole-locale invariant
coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa5e543a8">Assamese activity and automation gain 50 values</a>. Thanks to xet7.</summary>

Activity phrases, rule management, workflow/list views, triggers, actions,
scheduled time and JSON/CSV/Trello Butler import/export now use Assamese while
retaining all placeholders and formats. Focused repeated-percent coverage
leaves 1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcdc4775e">Assamese scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

n8n/Node-RED workflows, schedules, due-date triggers, buttons, sorting,
relative dates, units and movement conditions now use Assamese while retaining
the count placeholder, N, product names and schedule semantics. Whole-locale
invariant coverage leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94f492fcb">Assamese automation phrases gain 50 values</a>. Thanks to xet7.</summary>

Rule-builder vocabulary for lists, labels, members, attachments,
checklists/items, card movement, colors and email actions now uses consistent
Assamese automation terminology. Whole-locale invariant coverage leaves 1,066
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b44314ae">Assamese automation settings gain 50 values</a>. Thanks to xet7.</summary>

Automation actions, authentication, custom-head, manifest and asset-link
settings plus layout controls now use Assamese while retaining HTML, JSON,
assetlinks.json and product names. Whole-locale invariant coverage leaves 1,016
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3928c5675">Assamese activity settings gain 50 values</a>. Thanks to xet7.</summary>

Custom HTML placement, authentication errors, board duplication, activity
dates and reminders, account cleanup and drag controls now use Assamese while
retaining HTML tags, named activity tokens and percent arguments. Whole-locale
invariant coverage leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4c1ef2e2">Assamese roles and weekdays gain 50 values</a>. Thanks to xet7.</summary>

Card-window and editor preferences, organizations, users, notification states,
board-role permissions, weekdays and linked-card deletion warnings now use
Assamese. Whole-locale invariant coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b00d2effa">Assamese shared views gain 50 values</a>. Thanks to xet7.</summary>

Domains, shared templates, My Cards, Due Cards and global search now use
Assamese while retaining example.com, emphasis markers and positional percent
arguments. Whole-locale invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b53c5fdc">Assamese search syntax gains 50 values</a>. Thanks to xet7.</summary>

Search result counts, operators and predicates now use Assamese while
retaining positional and range placeholders. Whole-locale invariant coverage
leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b010bf75c">Assamese search help gains 50 values</a>. Thanks to xet7.</summary>

Advanced-search validation, paging, operator instructions and combination
notes now use Assamese while retaining every code fragment, markup marker,
named operator token and positional argument. Whole-locale invariant coverage
leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2c749c43">Assamese dependencies gain 50 values</a>. Thanks to xet7.</summary>

Sorting, completion, stickers, card dependencies, board backgrounds and
locations now use Assamese while retaining JSON, SVG and named size/import
tokens. Whole-locale invariant coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db4002442">Assamese diagnostics gain 50 values</a>. Thanks to xet7.</summary>

Map detection, server troubleshooting, custom-field formatting, problem
reports and Office login metadata now use Assamese while retaining shell
commands, HTML entities, the value placeholder and IP protocol names.
Whole-locale invariant coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eac3fc68b">Assamese recovery and tickets gain 50 values</a>. Thanks to xet7.</summary>

Office/API reports, automatic data recovery, swimlane copying, wait spinners,
organization safeguards and support tickets now use Assamese while retaining
REST API, WITH_API, MongoDB and mail-header terms. Whole-locale invariant
coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2aa069c88">Assamese administration gains 50 values</a>. Thanks to xet7.</summary>

Team and organization administration, Node memory metrics, legal notices,
checklist actions and attachment-storage movement now use Assamese while
retaining Node, GridFS, S3 and URL terms. Whole-locale invariant coverage
leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc472e4eb">Assamese attachment storage gains 50 values</a>. Thanks to xet7.</summary>

Attachment storage movement and repair, file statistics and MongoDB compaction
now use Assamese while retaining filesystem, GridFS, S3, MongoDB, Meteor,
oplog and identifier terminology. Whole-locale invariant coverage leaves 516
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/448f7d840">Assamese support settings gain 50 values</a>. Thanks to xet7.</summary>

Board timing, upload restrictions, custom translations, checklist display,
support and accessibility settings now use Assamese while retaining the
workspace token, PDF, ISO 8601, JSON and archive formats. Whole-locale
invariant coverage leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4abde2c3e">Assamese account protection gains 50 values</a>. Thanks to xet7.</summary>

Accessibility content, brute-force lockouts, user-state filters, scheduled
jobs, attachment paths and board maintenance now use Assamese. Whole-locale
invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7869792ee">Assamese database migration gains 50 values</a>. Thanks to xet7.</summary>

Scheduled migration controls, filesystem, S3 and Azure storage, MongoDB to
FerretDB migration and Sandstorm migration status now use Assamese while
retaining the database token, URLs, environment variables, paths and product
names. Whole-locale invariant coverage leaves 366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05f6b9f54">Assamese security controls gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, card-loading modes, safe rich-text rendering, import/export
controls, user anonymization, activity/watch controls and backup scopes now use
Assamese while retaining HTML/markdown examples, environment variables, paths
and product names. Whole-locale invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a24986db5">Assamese cloud backup gains 50 values</a>. Thanks to xet7.</summary>

Backup schedules and restore modes plus Google Cloud, AWS S3 and Azure
credential guidance now use Assamese while retaining console paths, JSON
field names, time syntax and storage product names. Whole-locale invariant
coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55793c200">Assamese storage migration gains 50 values</a>. Thanks to xet7.</summary>

GridFS and S3 configuration, attachment and board migration controls,
scheduled board operations and writable storage paths now use Assamese while
retaining storage product and protocol names. Whole-locale invariant coverage
leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f193c3089">Assamese board migration gains 50 values</a>. Thanks to xet7.</summary>

Board-integrity checks, lost-card recovery, duplicate-list cleanup and
avatar/attachment URL repair now use Assamese while retaining ID field names,
URLs and storage terminology. Whole-locale invariant coverage leaves 166
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48785ba59">Assamese monitoring gains 50 values</a>. Thanks to xet7.</summary>

Board-conversion steps, database cleanup, CPU/memory metrics, recurring
schedules, export monitoring and job queues now use Assamese while retaining
ID, URL, GridFS and CPU terms. Whole-locale invariant coverage leaves 116
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6db145bbd">Assamese migration monitoring gains 50 values</a>. Thanks to xet7.</summary>

Attachment migration destinations, batch/CPU/delay tuning, logs, progress,
monitoring controls and storage statistics now use Assamese while retaining
GridFS, S3, CPU, percent and millisecond syntax. Whole-locale invariant
coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07061ad92">Assamese problem reporting gains 50 values</a>. Thanks to xet7.</summary>

OTP/account access, repository management, problem summaries, broken-card
repair, CPU load and diagnostic events now use Assamese while retaining named
repair tokens, API, OTP and IP terminology. Whole-locale invariant coverage
leaves 16 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e14b77043">Assamese completes its whole-file translation</a>. Thanks to xet7.</summary>

The final sixteen event-address, filesystem-integrity, scoped import/export
and card-number search values now use Assamese. Zero-backlog coverage retains
the operator token, markup and file-format names across all 2,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b78cf2d98">Bashkir begins its whole-file translation</a>. Thanks to xet7.</summary>

Fifty activity values for boards, cards, attachments, labels, checklists,
comments, custom fields and imports now use Bashkir while retaining every
named activity token. Focused Cyrillic and whole-locale invariant coverage
leaves 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/727fd0308">Bashkir activity and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement, positional activity phrases, checklist states and workspace
management now use Bashkir while retaining repeated percent order and named
location tokens. Whole-locale invariant coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52c6d1731">Bashkir workspace controls gain 50 values</a>. Thanks to xet7.</summary>

Workspace deletion, multi-board selection, Home boards, card insertion,
personal/shared list widths, swimlane heights and checklist actions now use
Bashkir while retaining positional activity arguments. Whole-locale invariant
coverage leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad6520f22">Bashkir board settings gain 50 values</a>. Thanks to xet7.</summary>

Administrator announcements, archives, templates, attachments, board
backgrounds and member/assignee summaries now use Bashkir while retaining
count, size and HTML emphasis tokens. Whole-locale invariant coverage leaves
1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f098a105">Bashkir board views gain 50 values</a>. Thanks to xet7.</summary>

Board visibility, icon ordering, backgrounds, desktop/mobile modes, zoom,
calendar navigation, archive guidance and card-edit labels now use Bashkir
while retaining workspace, comment, percent and HTML emphasis tokens.
Whole-locale invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c00ec4492">Bashkir card dialogs gain 50 values</a>. Thanks to xet7.</summary>

Card membership, voting, Planning Poker, dependencies, organization/team/domain
membership and component import/export dialogs now use Bashkir. Whole-locale
invariant coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/229e4d17c">Bashkir appearance gains 50 values</a>. Thanks to xet7.</summary>

Member mapping, theme categories, fonts and sizes, text colors, avatar actions,
language and permission dialogs now use Bashkir. Whole-locale invariant
coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c2436823">Bashkir navigation and colors gain 50 values</a>. Thanks to xet7.</summary>

Starred boards/pages, automatic list width, clipboard input, card aging,
movement/dialog accessibility and twenty-two color names now use Bashkir.
Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de74b644d">Bashkir roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Board role restrictions, deletion confirmations, clipboard links, JSON card
templates and custom-field types/options now use Bashkir while retaining JSON
structure. Whole-locale invariant coverage leaves 1,716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4dfa3b32">Bashkir account email and errors gain 50 values</a>. Thanks to xet7.</summary>

Custom-field dialogs, permanent deletion, profiles, dates, account emails,
WIP limits and board/import errors now use Bashkir while retaining email
paragraph structure, named tokens and JSON/CSV/TSV terms. Whole-locale
invariant coverage leaves 1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bd69df66">Bashkir exports and filters gain 50 values</a>. Thanks to xet7.</summary>

Account validation, card PDF/Excel exports, attachment metadata, list sorting
and date/label/member filters now use Bashkir while retaining export format
names. Whole-locale invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a70fcc603">Bashkir advanced filters and imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced filters and Kanboard, Deck, OpenProject, issue, Asana, ZenKit, Trello,
CSV/TSV, Jira, Excel and WeKan import guidance now use Bashkir while retaining
operators, regex, endpoint tokens, API paths and data-format examples.
Whole-locale invariant coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c34816ed">Bashkir Trello imports gain 50 values</a>. Thanks to xet7.</summary>

Trello ZIP safety, workspace placement, API credentials, multi-board job
progress/cancellation and member mapping now use Bashkir while retaining the
API URL, file formats and percent label argument. Whole-locale invariant
coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8bda89b9">Bashkir board roles gain 50 values</a>. Thanks to xet7.</summary>

Last-admin safeguards, board departure, list/archive actions, settings dialogs,
multi-selection, archive states and assigned-only notification roles now use
Bashkir while retaining the board-title token. Whole-locale invariant coverage
leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cfd6593b">Bashkir privacy and shortcuts gain 50 values</a>. Thanks to xet7.</summary>

Watched updates, private and public pages, member removal, unsaved-description
recovery, card search, WIP controls and keyboard shortcuts now use Bashkir while
retaining the HTML login link and member/board tokens. Whole-locale invariant
coverage leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98e649f40">Bashkir tracking and branding gain 50 values</a>. Thanks to xet7.</summary>

Tracking, time and overtime, uploads, custom branding and URL schemes,
welcome/template boards, WIP warnings and attachment/API limits now use
Bashkir. Whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9323a2c9d">Bashkir administration settings gain 50 values</a>. Thanks to xet7.</summary>

Attachment transfer limits, avatar blocking, registration, invitations, SMTP
and outgoing/two-way webhooks now use Bashkir while retaining four invitation
placeholders and its paragraph structure. Whole-locale invariant coverage
leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af1db66d1">Bashkir diagnostics and tenancy gain 50 values</a>. Thanks to xet7.</summary>

Database and operating-system diagnostics, time units, custom-field display,
account changes, visibility, shared templates and organization/team tenancy
now use Bashkir while retaining configuration names, domain examples and
MULTITENANCY=true. Whole-locale invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/768226375">Bashkir card settings gain 50 values</a>. Thanks to xet7.</summary>

Received/end dates, colors, destructive board/notification/list actions,
subtask routing, minicard badges and parent-card paths now use Bashkir while
retaining the board token and positional label-activity arguments. Whole-locale
invariant coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3377c35cc">Bashkir visual rules gain 50 values</a>. Thanks to xet7.</summary>

Attachment/custom-field activity, rule management, the visual workflow
builder, event triggers and JSON/CSV/Trello Butler imports now use Bashkir while
retaining time/count and positional activity arguments. Whole-locale invariant
coverage leaves 1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe28d09c5">Bashkir scheduled rules gain 50 values</a>. Thanks to xet7.</summary>

n8n/Node-RED workflow imports, scheduled triggers, due-date and list-duration
conditions, card/board buttons, sorting and relative dates now use Bashkir
while retaining the unmapped-count token and integration names. Whole-locale
invariant coverage leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8eeced26">Bashkir rule actions gain 50 values</a>. Thanks to xet7.</summary>

Movement, archive, label/member/attachment/checklist conditions and actions,
card positioning and rule-email subjects now use Bashkir. Whole-locale
invariant coverage leaves 1,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a869ab850">Bashkir customization and rules gain 50 values</a>. Thanks to xet7.</summary>

Rule email/checklist/swimlane/date actions, authentication, product naming,
custom HTML/manifest/assetlinks metadata and layout controls now use Bashkir
while retaining HTML/JSON and assetlinks.json literals. Whole-locale invariant
coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e74d4c12">Bashkir reminders and layout gain 50 values</a>. Thanks to xet7.</summary>

Custom body HTML, authentication display, board/swimlane duplication and
deletion, date activity, due reminders, mentions, account deletion and resize
controls now use Bashkir while retaining body tags, positional arguments,
named tokens and multiline structure. Whole-locale invariant coverage leaves
966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/341305be8">Bashkir board roles and weekdays gain 50 values</a>. Thanks to xet7.</summary>

Multi-card/editor behavior, organization/team/user dialogs, notification
management, renaming, board-role permissions/status, weekdays and linked-card
deletion safeguards now use Bashkir while retaining keyboard shortcut names.
Whole-locale invariant coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f832359b4">Bashkir shared templates and views gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, domains, shared templates, My Cards sorting, due-card
views, global search and missing-object errors now use Bashkir while retaining
domain examples, Markdown emphasis and percent arguments. Whole-locale
invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9fee1dc6">Bashkir search operators gain 50 values</a>. Thanks to xet7.</summary>

Search result counts and board/swimlane/list/label/user/member/assignee,
status/date/comment/content operators and predicates now use Bashkir while
retaining positional and pagination tokens. Whole-locale invariant coverage
leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9823596f">Bashkir search guidance gains 50 values</a>. Thanks to xet7.</summary>

Operator validation, pagination and the complete advanced-search operator,
status, field, sorting, limit and combination guidance now use Bashkir while
retaining code spans, Markdown emphasis, angle-bracket parameters, examples,
newlines and every search token. Whole-locale invariant coverage leaves 766
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11921ffbf">Bashkir dependencies and backgrounds gain 50 values</a>. Thanks to xet7.</summary>

Labels, board/card sorting, completion, stickers, dependency relationships and
JSON/SVG imports, board backgrounds and location fields now use Bashkir while
retaining imported/unmatched and maximum-size tokens. Whole-locale invariant
coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c31b0ecce">Bashkir locations and reports gain 50 values</a>. Thanks to xet7.</summary>

Map detection, server troubleshooting, sorting, activity visibility, string
templates and administrative file/security/performance/database/rules/board/
card/impersonation/recovery/office reports now use Bashkir while retaining
commands, the value placeholder, HTML entities and IPv4/IPv6 names.
Whole-locale invariant coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b32595edb">Bashkir recovery and tickets gain 50 values</a>. Thanks to xet7.</summary>

Office/API usage, automatic recovery, swimlane copying, wait indicators,
organization/team deletion safeguards and support tickets now use Bashkir
while retaining REST API, WITH_API=true, MongoDB and spinner-style names.
Whole-locale invariant coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7539f6a11">Bashkir diagnostics and storage gain 50 values</a>. Thanks to xet7.</summary>

Team/organization administration, invitations, Node heap/memory diagnostics,
legal notices, checklist/subtask actions and filesystem/GridFS/S3 attachment
moves now use Bashkir while retaining runtime and storage names. Whole-locale
invariant coverage leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fa620a28">Bashkir attachment repair gains 50 values</a>. Thanks to xet7.</summary>

Attachment storage moves, location repair, storage statistics/defaults and
MongoDB GridFS compaction now use Bashkir while retaining filesystem, GridFS,
S3, MongoDB, Compact, oplog, Meteor and identifier names. Whole-locale invariant
coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b36b7f633">Bashkir support and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board timing/upload status, upload limits, card details, workspace assignment,
custom translations, checklist visibility, board ZIP imports and support/
accessibility pages now use Bashkir while retaining the workspace token and
ISO/PDF/JSON/Markdown/.zip names. Whole-locale invariant coverage leaves 466
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf5b97b9e">Bashkir account protection gains 50 values</a>. Thanks to xet7.</summary>

Accessibility metadata, brute-force protection/lockouts, administrator user
filters, scheduled jobs, attachment/avatar paths and scheduled board archive,
backup and cleanup operations now use Bashkir. Whole-locale invariant coverage
leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59702f662">Bashkir storage and migration gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job and migration recovery, filesystem/S3/Azure storage, MongoDB ↔
FerretDB text-data migration and Sandstorm grain migration now use Bashkir
while retaining URLs, environment variables, commands, database/version names,
paths and the database token. Whole-locale invariant coverage leaves 366
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d50461797">Bashkir security controls and backups gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, card-loading modes, plain-text security rendering,
import/export/avatar/activity/watch controls, user anonymization and instance/
organization backups now use Bashkir while retaining markup examples,
environment variables, integration names, usernames and backup paths.
Whole-locale invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9225018cc">Bashkir cloud backup setup gains 50 values</a>. Thanks to xet7.</summary>

Backup scheduling/restoration and GCS, AWS S3, MinIO, Azure, Cloudflare R2,
Backblaze B2, Wasabi and DigitalOcean Spaces setup guidance now use Bashkir
while retaining console menu labels, JSON fields, key names, HH:MM and .csv.
Whole-locale invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a3aaed21">Bashkir migration controls gain 50 values</a>. Thanks to xet7.</summary>

GridFS and S3 storage, migration start/pause/stop controls, scheduled board
operations, writable paths and attachment/board migration settings now use
Bashkir while retaining MongoDB, GridFS, CollectionFS, AWS, MinIO, SSL/TLS and
region names. Whole-locale invariant coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b310f52e8">Bashkir board repair gains 50 values</a>. Thanks to xet7.</summary>

Comprehensive board-integrity migration, duplicate-list deletion, lost/archive
restoration, list/avatar/file repair, confirmations, progress and migration
steps now use Bashkir while retaining swimlaneId, listId, URL and ID names.
Whole-locale invariant coverage leaves 166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4173a30cc">Bashkir conversion monitoring gains 50 values</a>. Thanks to xet7.</summary>

Board-repair steps, conversion status, CPU/memory/filesystem/GridFS monitoring,
scheduled frequencies, job queues and export monitoring now use Bashkir while
retaining CPU, GridFS, URL and ID names. Whole-locale invariant coverage leaves
116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97db47bb1">Bashkir migration monitoring gains 50 values</a>. Thanks to xet7.</summary>

Bulk storage migration, batch/CPU/delay tuning, background migration guidance,
monitoring refresh/export, schedules, operation progress and system-resource
totals now use Bashkir while retaining GridFS, S3, CPU, percentages and units.
Whole-locale invariant coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a37d3d5f">Bashkir repositories and problems gain 50 values</a>. Thanks to xet7.</summary>

OTP/account/repository access, API endpoints, problem summaries, repair status,
CPU load and diagnostic event fields now use Bashkir while retaining fixed/
unfixable tokens and IP/CPU names. Whole-locale invariant coverage leaves 16
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cb7c0ec2">Bashkir completes its final 16 values</a>. Thanks to xet7.</summary>

IP address diagnostics, filesystem integrity, scoped card export/import and
number-search guidance now use Bashkir while retaining IPv4/IPv6, WeKan,
archive/data-format names, the search token and angle-bracket parameter. The
authoritative missing-value list is empty, and whole-locale token, markup and
key-order coverage verifies all 2,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85d354077">Bhojpuri activity history gains 50 values</a>. Thanks to xet7.</summary>

Board membership restrictions and board/card/list/swimlane creation, deletion,
archive, import, attachment, subtask, label, checklist and comment activity now
use Bhojpuri while retaining percent and named location/content tokens. New
whole-locale regression coverage checks every translated token inventory and
HTML tag, representative Bhojpuri terminology and activity placeholders,
leaving 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3e0feb9f">Bhojpuri movement and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement/restoration, member removal, positional activity phrases,
checklist states, dates and workspace creation/editing now use Bhojpuri while
retaining every positional and named argument. Whole-locale invariant coverage
leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32ea617a9">Bhojpuri board layout gains 50 values</a>. Thanks to xet7.</summary>

Workspace deletion, multi-board selection, Home boards, card insertion,
personal/shared/fixed list widths, keyboard shortcuts, swimlane heights and
checklist actions now use Bhojpuri while retaining positional date arguments.
Whole-locale invariant coverage leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19625f136">Bhojpuri board settings gain 50 values</a>. Thanks to xet7.</summary>

Administration announcements, archives, templates, attachments, automatic
watching, board backgrounds, All Boards display and member/assignee summaries
now use Bhojpuri while retaining count/size/percent tokens and HTML emphasis.
Whole-locale invariant coverage leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/458d8bc3b">Bhojpuri board views gain 50 values</a>. Thanks to xet7.</summary>

Board visibility, icon ordering, backgrounds, desktop/mobile modes, zoom,
calendar/table/statistics views and card/list/swimlane archive/deletion
guidance now use Bhojpuri while retaining the workspace token, percent argument
and HTML emphasis. Whole-locale invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2445e186">Bhojpuri card dialogs gain 50 values</a>. Thanks to xet7.</summary>

Card membership, voting, Planning Poker, dependencies, organization/team/
domain management and checklist/swimlane/list/card/board import/export dialogs
now use Bhojpuri while retaining the Planning Poker name. Whole-locale
invariant coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51a89024e">Bhojpuri member mapping and appearance gain 50 values</a>. Thanks to xet7.</summary>

Member/sticker/invite/sorting dialogs, archive restoration, imported-member
mapping, themes, fonts, text colors and avatar/language/permission dialogs now
use Bhojpuri while retaining CAS, Markdown and preview digits. Whole-locale
invariant coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e394b294">Bhojpuri navigation and colors gain 50 values</a>. Thanks to xet7.</summary>

Starred boards/pages, automatic list width, clipboard input, card aging,
movement/dialog accessibility and twenty-two color names now use Bhojpuri.
Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4aac0b48a">Bhojpuri permissions and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Comment/read/worker permissions, deletion confirmations, clipboard actions,
copy/import dialogs and custom-field basics now use Bhojpuri while retaining
the copied-card JSON structure. Whole-locale invariant coverage leaves 1,716
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7b8b1acf">Bhojpuri account emails and errors gain 50 values</a>. Thanks to xet7.</summary>

Custom fields, profile/date dialogs, account emails, WIP settings and import/
authorization errors now use Bhojpuri while retaining every account, site,
board, inviter and URL placeholder. Whole-locale invariant coverage leaves
1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b81f241e7">Bhojpuri card exports and filters gain 50 values</a>. Thanks to xet7.</summary>

User/account errors, attachment-free and card exports, Excel fields, sorting,
and date/label/member filters now use Bhojpuri while retaining Excel and PDF
names. Whole-locale invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0fefe979">Bhojpuri board imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced filters and board imports from Kanboard, Deck, OpenProject, issue
trackers, Asana, ZenKit, Trello, CSV, Jira, Excel and WeKan now use Bhojpuri.
Operators, examples, API paths, JSON fields, extensions and source/endpoint
placeholders remain exact. Whole-locale invariant coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d1f0a938">Bhojpuri Trello jobs and member mapping gain 50 values</a>. Thanks to xet7.</summary>

Trello ZIP/API imports, job controls, imported-member mapping, validation
messages and labels now use Bhojpuri while retaining the API-key URL and `%s`
label placeholder. Whole-locale invariant coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f08d8c479">Bhojpuri board and list actions gain 50 values</a>. Thanks to xet7.</summary>

Board departure, archive/list actions, settings, multi-selection, notification
states and normal-role permissions now use Bhojpuri while retaining the board
title placeholder. Whole-locale invariant coverage leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4e81b0de">Bhojpuri privacy and shortcuts gain 50 values</a>. Thanks to xet7.</summary>

Watching/privacy, member removal, search/WIP controls, keyboard shortcuts,
sidebars, signup and starred/default boards now use Bhojpuri while retaining
the login anchor and its `%s` placeholder. Whole-locale invariant coverage
leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/562e2e7ae">Bhojpuri tracking and uploads gain 50 values</a>. Thanks to xet7.</summary>

Subscriptions, time tracking, assignee/label shortcuts, uploads, custom
branding URLs, welcome/template labels, WIP errors and attachment/API limits
now use Bhojpuri. Whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6381700a">Bhojpuri server settings gain 50 values</a>. Thanks to xet7.</summary>

Attachment/API limits, registration invitations, SMTP, webhooks and system
version labels now use Bhojpuri while retaining all invitation placeholders and
the SMTP, TLS, API, Node and Meteor identifiers. Whole-locale invariant coverage
leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86a4d9897">Bhojpuri diagnostics and tenancy gain 50 values</a>. Thanks to xet7.</summary>

Diagnostics, custom-field display, account and board visibility, organization
tenancy/admin controls, teams and timestamps now use Bhojpuri while retaining
environment variables, modes, sample domains and technical identifiers.
Whole-locale invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60d228c7e">Bhojpuri card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Card dates/colors, destructive board and notification actions, duplicate-list
cleanup, subtask/card/minicard settings, parent paths and label activity now use
Bhojpuri while retaining the board and positional activity placeholders.
Whole-locale invariant coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eba96421c">Bhojpuri automation rules gain 50 values</a>. Thanks to xet7.</summary>

Activity messages, rule management, workflow builder triggers/actions and JSON,
CSV and Trello Butler imports now use Bhojpuri. Positional custom-field values,
time and imported-count placeholders retain their source order and spelling.
Whole-locale invariant coverage leaves 1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7dbac7b00">Bhojpuri scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

Workflow formats, scheduled/button triggers, due-date timing, list sorting,
card completion, bulk moves and relative dates now use Bhojpuri while retaining
the imported-count placeholder and n8n, Node-RED and WeKan names. Whole-locale
invariant coverage leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4dd2ee13">Bhojpuri automation actions gain 50 values</a>. Thanks to xet7.</summary>

List/archive movements, label/member/attachment/checklist triggers, card and
checklist actions and email actions now use consistent, compact Bhojpuri
sentence-building fragments. Whole-locale invariant coverage leaves 1,066
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/922fc392f">Bhojpuri automation configuration gains 50 values</a>. Thanks to xet7.</summary>

Archive/member/checklist/date automation actions, authentication, custom HTML/
JSON head configuration and layout controls now use Bhojpuri while retaining
manifest and assetlinks filenames/formats. The checklist example is translated
rather than left as English. Whole-locale invariant coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b82b2f74c">Bhojpuri activity and interface settings gain 50 values</a>. Thanks to xet7.</summary>

Custom body HTML placement, authentication, duplication/counts, swimlane
deletion, date/reminder activities, mentions, destructive account/team/
organization actions and UI behavior now use Bhojpuri. Body tags, placeholders,
percent arguments and line breaks remain exact. Invariant coverage leaves 966
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c32b8e69">Bhojpuri board roles gain 50 values</a>. Thanks to xet7.</summary>

Multi-window cards, editor key behavior, organization/team/user dialogs,
notifications, board-role permissions/status, weekdays, voting and linked-card
deletion guards now use Bhojpuri while retaining keyboard combinations and the
Admin Panel name. Whole-locale invariant coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c8a2acae">Bhojpuri shared templates and searches gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, domain/template sharing, My Cards and Due Cards views,
global search and lookup errors now use Bhojpuri while retaining the domain
example, Markdown emphasis and positional lookup arguments. Whole-locale
invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c68b10de">Bhojpuri global-search labels gain 50 values</a>. Thanks to xet7.</summary>

Search result counts and global-search operator/predicate labels now use
Bhojpuri while retaining percent and start/end/total pagination placeholders.
Whole-locale invariant coverage leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab65b72ec">Bhojpuri global-search help gains 50 values</a>. Thanks to xet7.</summary>

Search validation, pagination and full operator/status/note documentation now
use Bhojpuri while retaining every named placeholder, Markdown code/emphasis,
angle-bracket metavariable, operator example and deliberate line break.
Whole-locale invariant coverage leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80b9efc62">Bhojpuri dependencies and locations gain 50 values</a>. Thanks to xet7.</summary>

Sorting/completion, stickers, dependency relationships/imports, board
backgrounds and card locations now use Bhojpuri while retaining import counters,
the background-size placeholder and JSON/SVG terminology. Whole-locale invariant
coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2f0cc4ca">Bhojpuri maps and reports gain 50 values</a>. Thanks to xet7.</summary>

Map detection, server-error troubleshooting, sorting, swimlane movement,
string-template fields and admin reports now use Bhojpuri while retaining shell
commands, the value placeholder, space entities, IPv4 and IPv6. Whole-locale
invariant coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ca480f5e">Bhojpuri recovery and tickets gain 50 values</a>. Thanks to xet7.</summary>

Office/API/recovery reports, recovery maintenance, swimlane copying, wait
spinners, card sizing, organization/team deletion guards and tickets now use
Bhojpuri while retaining REST API and WITH_API=true. Whole-locale invariant
coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3834d7804">Bhojpuri diagnostics and storage gain 50 values</a>. Thanks to xet7.</summary>

Team/organization invitations, Node heap diagnostics, legal notices, checklist,
subtask and attachment actions and storage moves now use Bhojpuri while
retaining Node, GridFS, S3, filesystem and URL terminology. Whole-locale
invariant coverage leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b72cec826">Bhojpuri storage repair and compaction gain 50 values</a>. Thanks to xet7.</summary>

Attachment/avatar storage moves and repair, default storage, file statistics
and MongoDB GridFS compaction now use Bhojpuri while retaining filesystem,
GridFS, S3, MongoDB, replica-set, oplog and ID terminology. Whole-locale
invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45553b91c">Bhojpuri upload and support settings gain 50 values</a>. Thanks to xet7.</summary>

Board status, upload progress, password/login prompts, file restrictions, PDF
fallback, workspace assignment, custom translations, checklist collapsing,
support and accessibility now use Bhojpuri while retaining the workspace
placeholder, ISO 8601, PDF, JSON and .zip. Invariant coverage leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b60492f9">Bhojpuri account security and scheduling gain 50 values</a>. Thanks to xet7.</summary>

Accessibility content, brute-force login lockouts, admin user filters,
scheduled jobs, attachment/avatar paths and scheduled board operations now use
Bhojpuri. Whole-locale invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91260e7d1">Bhojpuri storage and database migration gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job/migration control, filesystem/S3/Azure storage, MongoDB/FerretDB
text-data migration and Sandstorm migration status now use Bhojpuri while
retaining URLs, ports, environment variables, configuration literals, versions,
paths and the database placeholder. Invariant coverage leaves 366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f5d8d8f3">Bhojpuri security controls and backups gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, card-loading modes, secure rendering, import/export/avatar/
anonymization policies, activity/watch controls and backups now use Bhojpuri.
Anchor/comment syntax, environment variables, formats, providers and backup
paths remain literal. Whole-locale invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3f7a810d">Bhojpuri cloud storage setup gains 50 values</a>. Thanks to xet7.</summary>

Scheduled backup restore plus GCS, AWS/S3, Azure, MinIO and compatible cloud
storage setup now use Bhojpuri while retaining console paths, credential field
names, JSON/CSV formats, time syntax, identifiers and product names.
Whole-locale invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f1a3869">Bhojpuri migration controls gain 50 values</a>. Thanks to xet7.</summary>

GridFS/S3 storage, migration controls and monitoring, scheduled board operations
and attachment settings now use Bhojpuri while retaining MongoDB, GridFS,
CollectionFS, AWS S3, MinIO, SSL/TLS, region examples and paths. Whole-locale
invariant coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1525d0182">Bhojpuri board-integrity migrations gain 50 values</a>. Thanks to xet7.</summary>

Duplicate/absent lists, lost cards, archive restoration, avatar/file URLs,
confirmations, progress and validation steps now use Bhojpuri while retaining
swimlaneId, listId, IDs and URLs. Whole-locale invariant coverage leaves 166
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62398f85e">Bhojpuri conversion monitoring gains 50 values</a>. Thanks to xet7.</summary>

Board-migration steps, conversion status, cleanup, CPU/memory diagnostics,
schedules, export monitoring and filesystem/GridFS statistics now use Bhojpuri
while retaining IDs, CPU, GridFS and numeric intervals. Whole-locale invariant
coverage leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/813969eaf">Bhojpuri migration monitoring gains 50 values</a>. Thanks to xet7.</summary>

Migration tuning, background progress/logs, monitoring refresh/export,
schedules, storage distribution and system resources now use Bhojpuri while
retaining CPU percentages, millisecond units, numeric ranges, GridFS and S3.
Whole-locale invariant coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/faf451531">Bhojpuri problem monitoring gains 50 values</a>. Thanks to xet7.</summary>

OTP/account access, repository management, API endpoints, problem monitoring,
broken-card repair, CPU status and event fields now use Bhojpuri while retaining
OTP/API/CPU names and fixed/unfixable counters. Whole-locale invariant coverage
leaves 16 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16fe17bb4">Bhojpuri completes its final 16 values</a>. Thanks to xet7.</summary>

IP/IPv4/IPv6 event labels, filesystem integrity, card/scoped export, WeKan file
import and the card-number search operator now use Bhojpuri while retaining the
named operator placeholder, number metavariable, formats and product names.
Whole-locale invariant coverage proves zero English placeholders across all
2,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/063ea0160">Bambara activity and checklists gain 50 values</a>. Thanks to xet7.</summary>

Board/card/list/swimlane activity, attachments, subtasks, labels, checklists,
comments, custom fields and archive/import actions now use Bambara. New
whole-locale regression coverage checks all token/tag inventories and leaves
2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37faf9fea">Bambara movement and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement, membership, compact activity/checklist messages and All Boards
workspace controls now use Bambara while retaining every positional and named
placeholder in source order. Whole-locale invariant coverage leaves 2,066
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4111b6f7d">Bambara board and list controls gain 50 values</a>. Thanks to xet7.</summary>

Workspace settings, board selection and Home-board controls now use Bambara,
along with list and swimlane sizing, keyboard shortcuts and common card,
checklist and member actions. Positional placeholders remain exact, and
whole-locale invariant coverage leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e43499da">Bambara archives and board visibility gain 50 values</a>. Thanks to xet7.</summary>

Archive operations, attachments, templates, board backgrounds, All Boards
settings, member and assignee labels and private-board messaging now use
Bambara. Named and positional placeholders and the strong-emphasis tags remain
exact, and whole-locale invariant coverage leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be89ad924">Bambara board views and archive guidance gain 50 values</a>. Thanks to xet7.</summary>

Board appearance and view modes, zoom and calendar controls, card and list
archive guidance and common card editing labels now use Bambara. Named and
positional placeholders, percentages and emphasis tags remain exact, and
whole-locale invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5de4e783">Bambara voting and import dialogs gain 50 values</a>. Thanks to xet7.</summary>

Voting, Planning Poker, card dependencies, organizations, teams, account and
background administration and import/export popup titles now use Bambara.
Whole-locale invariant coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a0c101c8">Bambara member mapping and appearance gain 50 values</a>. Thanks to xet7.</summary>

Popup labels, archived-item restoration, imported-member mapping, themes,
fonts, avatars, language selection and permission controls now use Bambara.
Whole-locale invariant coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b0d1b728">Bambara navigation and color names gain 50 values</a>. Thanks to xet7.</summary>

Automatic list width, card aging, keyboard navigation, accessible close labels,
board restoration guidance and the first color-name set now use Bambara.
Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9b50b13b">Bambara roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Board roles and permissions, destructive confirmations, clipboard and linking
actions, bulk-template copying and custom-field controls now use Bambara. The
embedded JSON example retains valid syntax, and invariant coverage leaves 1,716
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cc76f885">Bambara email templates and errors gain 50 values</a>. Thanks to xet7.</summary>

Account enrollment, invitation, password-reset and verification emails now use
Bambara, along with WIP controls and board, JSON, CSV, import and linked-card
errors. Every email placeholder remains exact, and invariant coverage leaves
1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aff357749">Bambara card exports and filters gain 50 values</a>. Thanks to xet7.</summary>

Account-name conflicts, PDF and Excel card exports, attachment metadata, list
sorting and date, label and member filters now use Bambara. Whole-locale
invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e2632fc1">Bambara advanced filters and board imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced-filter help and Kanboard, Deck, OpenProject, issue, Asana, ZenKit,
Trello, CSV, Jira, Excel and WeKan imports now use Bambara. Operators, regex,
escapes, JSON fields, API paths and named placeholders remain exact, and
invariant coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4cbf2c57">Bambara Trello imports and member mapping gain 50 values</a>. Thanks to xet7.</summary>

Trello API credentials, workspace and board selection, import-job lifecycle,
member mapping, date and user validation, shortcuts and label controls now use
Bambara. The API URL and positional placeholder remain exact, and invariant
coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9a575561">Bambara archives and multi-selection gain 50 values</a>. Thanks to xet7.</summary>

Board departure, list and card archive actions, user, team and organization
settings, multi-selection, muted notifications and normal-role permissions now
use Bambara. The board-title placeholder remains exact, and invariant coverage
leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c6be34a6">Bambara shortcuts and board visibility gain 50 values</a>. Thanks to xet7.</summary>

Watch notifications, public and private pages, member removal, rescue dialogs,
search and WIP controls, keyboard shortcuts, sidebars, signup and starred and
default boards now use Bambara. Markup and all placeholders remain exact, and
invariant coverage leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a17c8ac9">Bambara tracking and custom branding gain 50 values</a>. Thanks to xet7.</summary>

Time tracking, assignee and label shortcuts, uploads, custom branding URLs,
welcome and template boards, WIP errors and attachment limits now use Bambara.
Whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0035fcd0c">Bambara attachment limits and webhooks gain 50 values</a>. Thanks to xet7.</summary>

Attachment and API size limits, registration, invitations, SMTP configuration,
invitation emails, authorization, webhooks and diagnostic version labels now
use Bambara. Every email token remains exact, and invariant coverage leaves
1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/889f15ee5">Bambara diagnostics and organization settings gain 50 values</a>. Thanks to xet7.</summary>

Runtime, OS and memory diagnostics, time units, custom-field display controls,
account and board visibility settings and organization tenancy, domains and
administration now use Bambara. Environment names, modes and example hostnames
remain literal, and invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98aec264b">Bambara card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Received and end dates, assignment metadata, board and notification deletion,
subtask and card settings, minicard fields, parent and source relationships and
label activity now use Bambara. Named and positional placeholders remain exact,
and invariant coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e649e940">Bambara automation workflows gain 50 values</a>. Thanks to xet7.</summary>

Attachment and custom-field activity, automation rule controls and the visual
workflow and JSON, CSV and Trello Butler import/export paths now use Bambara.
Every positional and named token remains exact, and invariant coverage leaves
1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f16b1dac0">Bambara scheduled automation triggers gain 50 values</a>. Thanks to xet7.</summary>

Visual-workflow formats, scheduled, due, list and button triggers, relative
dates, sorting, completion and card movement now use Bambara. The named count,
day marker, product names and weekday range remain exact, and invariant coverage
leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19ca9756b">Bambara automation actions gain 50 values</a>. Thanks to xet7.</summary>

List, label, member, attachment and checklist triggers and card movement,
membership, color, checklist-item and email actions now use Bambara.
Whole-locale invariant coverage leaves 1,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5d40e758">Bambara rule and custom-head settings gain 50 values</a>. Thanks to xet7.</summary>

Archive, label, card, member, checklist, swimlane and date-field rule actions now
use Bambara, along with authentication, custom product, head, manifest,
assetlinks, layout and board-list settings. JSON and HTML formats remain literal,
and invariant coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16fb66179">Bambara activity reminders and layout controls gain 50 values</a>. Thanks to xet7.</summary>

Custom body HTML, authentication, board duplication, destructive actions,
received, start, due and end activities, reminders, mentions, drag resizing,
editor submission and multi-card behavior now use Bambara. Markup, multiline
structure and every token remain exact, and invariant coverage leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84e821ac2">Bambara role status and weekdays gain 50 values</a>. Thanks to xet7.</summary>

Multi-window and editor behavior, organization, team and user dialogs,
notification controls, board-role permissions and status, weekdays, ownership,
voting and linked-card deletion guards now use Bambara. Whole-locale invariant
coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/411663d0d">Bambara shared templates and search views gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, domains, shared templates, My Cards, Due Cards, global
search and lookup errors now use Bambara. Every positional placeholder and
emphasis marker remains exact, and invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cfd6b435">Bambara search operators and predicates gain 50 values</a>. Thanks to xet7.</summary>

Global-search lookup and result-count messages and board, list, user, status,
date, organization, content and existence operators and predicates now use
Bambara. Every positional and range placeholder remains exact, and invariant
coverage leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93a39f417">Bambara global-search help gains 50 values</a>. Thanks to xet7.</summary>

Operator validation and the complete global-search operator, status, field,
sorting, limit and composition documentation now use Bambara. Code examples,
metavariables, formatting, semantic literals and every named and positional
token remain exact, and invariant coverage leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/185221c6c">Bambara dependencies and locations gain 50 values</a>. Thanks to xet7.</summary>

Label and board sorting, card completion, stickers, dependency relationships and
JSON/SVG imports, board backgrounds and location fields now use Bambara. Import
counts and the background-size placeholder remain exact, and invariant coverage
leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eaa812a7f">Bambara maps and administrative reports gain 50 values</a>. Thanks to xet7.</summary>

Map detection, server troubleshooting, card and swimlane sorting, string
templates, file, security, speed, test, CPU, database, rule, board, card,
impersonation, recovery and Office reports now use Bambara. Commands, entities,
format placeholders and IP names remain exact, and invariant coverage leaves
666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff6eefc3e">Bambara recovery and ticketing gain 50 values</a>. Thanks to xet7.</summary>

Office, REST API and recovery reports, recovery maintenance, swimlane copying,
wait indicators, card sizing, organization and team deletion guards, tickets,
requests, sorting and card details now use Bambara. Technical flags and service
names remain literal, and invariant coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df05278e7">Bambara diagnostics and attachment storage gain 50 values</a>. Thanks to xet7.</summary>

Team and organization assignment, invitations, Node heap and memory diagnostics,
legal notices, checklist and subtask actions and filesystem, GridFS and S3
attachment movement now use Bambara. Technical storage and runtime names remain
recognizable, and invariant coverage leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f5f4c78b">Bambara storage repair and compaction gain 50 values</a>. Thanks to xet7.</summary>

Attachment and avatar storage migration and location repair, storage defaults,
progress and statistics, identifiers and MongoDB GridFS compaction now use
Bambara. Storage, replica, oplog and identifier terminology remains recognizable,
and invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74faf789d">Bambara uploads, support and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board status and time summaries, upload progress and restrictions, login fields,
PDF preview, workspace dragging, custom translations, checklist collapsing,
support and accessibility now use Bambara. The workspace token and technical
format names remain exact, and invariant coverage leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/115860bbb">Bambara account protection and scheduled jobs gain 50 values</a>. Thanks to xet7.</summary>

Accessibility content, brute-force account lockout settings and user controls,
Admin Panel people filters, scheduled jobs, attachment and avatar paths and
board archive, backup and cleanup scheduling now use Bambara. Whole-locale
invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2552328f4">Bambara storage and database migration gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job and migration controls, filesystem, S3 and Azure storage,
MongoDB-to-FerretDB text-data migration and Sandstorm migration status now use
Bambara. URLs, ports, environment names, commands, product names, paths and the
database placeholder remain exact, and invariant coverage leaves 366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd50d1e8">Bambara security controls and backups gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, card-loading performance, safe rich-text rendering, global
import, export, avatar, activity, notification and watch controls, user
anonymization and instance or organization backups now use Bambara. Environment
variables, markup examples, paths and counter examples remain exact, and
invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/869778143">Bambara backup schedules and cloud storage gain 50 values</a>. Thanks to xet7.</summary>

Backup schedules and restores and GCS, S3 and Azure storage configuration now
use Bambara, including the provider-console guidance for MinIO, R2, B2, Wasabi
and Spaces. Time formats, ranges, JSON and CSV names, console paths, roles, keys
and product names remain exact, and invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6352abab1">Bambara migration controls and S3 settings gain 50 values</a>. Thanks to xet7.</summary>

GridFS enablement, CollectionFS movement, S3 settings, archive, backup and
cleanup schedules, attachment monitoring and board migration controls now use
Bambara. Paths and technical storage names remain recognizable, and invariant
coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db205e56b">Bambara board-repair migrations gain 50 values</a>. Thanks to xet7.</summary>

Comprehensive board migration, duplicate-list cleanup, lost-card and archive
restoration, missing-list repair, avatar and attachment URL repair and migration
progress now use Bambara. The `swimlaneId` and `listId` identifiers remain exact,
and invariant coverage leaves 166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7a8bad2f">Bambara migration diagnostics gain 50 values</a>. Thanks to xet7.</summary>

Board conversion and repair steps, cleanup, CPU and memory diagnostics,
filesystem and GridFS monitoring, schedules and job details now use Bambara.
Technical storage and runtime names remain recognizable, and invariant coverage
leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb5eab7b5">Bambara migration monitoring gains 50 values</a>. Thanks to xet7.</summary>

Attachment-storage migration targets, resource thresholds, batch tuning,
monitoring exports, schedules, progress controls and storage totals now use
Bambara. Numeric ranges and technical storage names remain exact, and invariant
coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb7d42fca">Bambara accounts and event monitoring gain 50 values</a>. Thanks to xet7.</summary>

OTP and account access, repository management, problem summaries, broken-card
repair, CPU status and event metadata now use Bambara. Named repair counters
remain exact, and invariant coverage leaves 16 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/926ff59d2">Bambara whole-file translation is complete</a>. Thanks to xet7.</summary>

IP labels, filesystem integrity, scoped board import and export guidance and
the number-search operator now use Bambara. The named operator, markup, file
formats and product names remain exact. The final 16-value batch completes all
2,166 source values, with whole-locale token and tag regression coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b4168928">Bengali activity and checklists gain 50 values</a>. Thanks to xet7.</summary>

Board, card, list and swimlane activity, attachments, subtasks, labels,
checklists, comments, custom fields and archive/import actions now use Bengali.
New whole-locale regression coverage checks all token and tag inventories and
leaves 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88cf43f3a">Bengali movement and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement, membership, compact activity and checklist messages and All
Boards workspace controls now use Bengali. Named and positional placeholders
remain exact, and whole-locale invariant coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3792cc922">Bengali board and list controls gain 50 values</a>. Thanks to xet7.</summary>

Workspace settings, board selection and Home-board controls now use Bengali,
along with list and swimlane sizing, keyboard shortcuts and common card,
checklist and member actions. Positional placeholders remain exact, and
whole-locale invariant coverage leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7f7d95ff">Bengali archives and board visibility gain 50 values</a>. Thanks to xet7.</summary>

Archive operations, attachments, templates, board backgrounds, All Boards
settings, member and assignee labels and private-board messaging now use
Bengali. Named and positional placeholders and the strong-emphasis tags remain
exact, and whole-locale invariant coverage leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7d67ee34">Bengali board views and archive guidance gain 50 values</a>. Thanks to xet7.</summary>

Board appearance and view modes, zoom and calendar controls, card and list
archive guidance and common card editing labels now use Bengali. Named and
positional placeholders, percentages and emphasis tags remain exact, and
whole-locale invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e57724fe">Bengali voting and import dialogs gain 50 values</a>. Thanks to xet7.</summary>

Voting, Planning Poker, card dependencies, organizations, teams, account and
background administration and import/export popup titles now use Bengali.
Whole-locale invariant coverage leaves 1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4645d6a12">Bengali member mapping and appearance gain 50 values</a>. Thanks to xet7.</summary>

Popup labels, archived-item restoration, imported-member mapping, themes,
fonts, avatars, language selection and permission controls now use Bengali.
Whole-locale invariant coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33a240462">Bengali navigation and color names gain 50 values</a>. Thanks to xet7.</summary>

Automatic list width, card aging, keyboard navigation, accessible close labels,
board restoration guidance and the first color-name set now use Bengali.
Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5d30b791">Bengali roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Board roles and permissions, destructive confirmations, clipboard and linking
actions, bulk-template copying and custom-field controls now use Bengali. The
embedded JSON example retains valid syntax, and invariant coverage leaves 1,716
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6014df2be">Bengali email templates and errors gain 50 values</a>. Thanks to xet7.</summary>

Account enrollment, invitation, password-reset and verification emails now use
Bengali, along with WIP controls and board, JSON, CSV, import and linked-card
errors. Every email placeholder remains exact, and invariant coverage leaves
1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89eb712c5">Bengali card exports and filters gain 50 values</a>. Thanks to xet7.</summary>

Account-name conflicts, PDF and Excel card exports, attachment metadata, list
sorting and date, label and member filters now use Bengali. Whole-locale
invariant coverage leaves 1,616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30a566ec6">Bengali advanced filters and board imports gain 50 values</a>. Thanks to xet7.</summary>

Advanced-filter help and Kanboard, Deck, OpenProject, issue, Asana, ZenKit,
Trello, CSV, Jira, Excel and WeKan imports now use Bengali. Operators, regex,
escapes, JSON fields, API paths and named placeholders remain exact, and
invariant coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52bad0ab2">Bengali Trello imports and member mapping gain 50 values</a>. Thanks to xet7.</summary>

Trello API credentials, workspace and board selection, import-job lifecycle,
member mapping, date and user validation, shortcuts and label controls now use
Bengali. The API URL and positional placeholder remain exact, and invariant
coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b60072a2f">Bengali archives and multi-selection gain 50 values</a>. Thanks to xet7.</summary>

Board departure, list and card archive actions, user, team and organization
settings, multi-selection, muted notifications and normal-role permissions now
use Bengali. The board-title placeholder remains exact, and invariant coverage
leaves 1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4cfc2cf1">Bengali shortcuts and board visibility gain 50 values</a>. Thanks to xet7.</summary>

Watch notifications, public and private pages, member removal, rescue dialogs,
search and WIP controls, keyboard shortcuts, sidebars, signup and starred and
default boards now use Bengali. Markup and all placeholders remain exact, and
invariant coverage leaves 1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d1b061c2">Bengali tracking and custom branding gain 50 values</a>. Thanks to xet7.</summary>

Time tracking, assignee and label shortcuts, uploads, custom branding URLs,
welcome and template boards, WIP errors and attachment limits now use Bengali.
Whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e5c9fb22">Bengali attachment limits and webhooks gain 50 values</a>. Thanks to xet7.</summary>

Attachment and API size limits, registration, invitations, SMTP configuration,
invitation emails, authorization, webhooks and diagnostic version labels now
use Bengali. Every email token remains exact, and invariant coverage leaves
1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb33a9c63">Bengali diagnostics and organization settings gain 50 values</a>. Thanks to xet7.</summary>

Runtime, OS and memory diagnostics, time units, custom-field display controls,
account and board visibility settings and organization tenancy, domains and
administration now use Bengali. Environment names, modes and example hostnames
remain literal, and invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7be653a05">Bengali card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Received and end dates, assignment metadata, board and notification deletion,
subtask and card settings, minicard fields, parent and source relationships and
label activity now use Bengali. Named and positional placeholders remain exact,
and invariant coverage leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5bcdc722">Bengali automation workflows gain 50 values</a>. Thanks to xet7.</summary>

Attachment and custom-field activity, automation rule controls and the visual
workflow and JSON, CSV and Trello Butler import/export paths now use Bengali.
Every positional and named token remains exact, and invariant coverage leaves
1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e0b0361c">Bengali scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

Workflow formats, scheduled, due, list and button triggers, relative dates,
sorting and card-completion actions now use Bengali. The unmapped-count and time
tokens remain exact, and invariant coverage leaves 1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bafe6ee33">Bengali automation actions gain 50 values</a>. Thanks to xet7.</summary>

Card movement, archive, label, member, attachment, checklist and email
conditions and actions now use Bengali. Whole-locale invariant coverage leaves
1,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59b153d0d">Bengali automation and custom-head settings gain 50 values</a>. Thanks to xet7.</summary>

Further automation actions, authentication, custom HTML/JSON configuration,
assetlinks, layout and board-list settings now use Bengali. JSON and HTML names
remain literal, and invariant coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a44514ff7">Bengali reminders and layout controls gain 50 values</a>. Thanks to xet7.</summary>

Board duplication, swimlane and account deletion, date activities, reminders,
mentions, card positioning, drag controls and editor behavior now use Bengali.
HTML tags and every activity placeholder remain exact, and invariant coverage
leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aac0cc636">Bengali roles and editor behavior gain 50 values</a>. Thanks to xet7.</summary>

Multi-window and editor behavior, organization, team and user dialogs,
notification controls, board-role permissions, weekdays and linked-card
deletion guards now use Bengali. Invariant coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94be3426f">Bengali templates and global search gain 50 values</a>. Thanks to xet7.</summary>

Checklist display, domains, shared templates, My Cards, Due Cards and global
search now use Bengali. Markdown emphasis and positional lookup placeholders
remain exact, and invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f3c7ffc7">Bengali global-search vocabulary gains 50 values</a>. Thanks to xet7.</summary>

Search result counts and board, swimlane, list, label, user, status, date,
sorting, organization, team, custom-field and existence operators and predicates
now use Bengali. Named and positional count tokens remain exact, and invariant
coverage leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/633c3115d">Bengali global-search help gains 50 values</a>. Thanks to xet7.</summary>

Operator validation, pagination and the complete global-search syntax and notes
now use Bengali. Named tokens, angle-bracket fields, Markdown emphasis, code
examples and line breaks remain exact, and invariant coverage leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/868db2640">Bengali dependencies and locations gain 50 values</a>. Thanks to xet7.</summary>

Card and board sorting, completion, stickers, dependency types and imports,
board backgrounds and card locations now use Bengali. Named import counters and
the background-size placeholder remain exact, and invariant coverage leaves 716
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9330bf65d">Bengali maps and admin reports gain 50 values</a>. Thanks to xet7.</summary>

Map detection, server troubleshooting, sorting, board activity, string-template
fields and file, security, speed, test, CPU, database, rule, board, card,
impersonation, recovery and Office reports now use Bengali. Commands, HTML
entities and the value placeholder remain exact, and invariant coverage leaves
666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7400196ca">Bengali recovery and ticketing gain 50 values</a>. Thanks to xet7.</summary>

Office, REST API and recovery reports, recovery maintenance, swimlane copying,
wait indicators, card sizing, organization and team deletion guards, tickets,
requests, sorting and card details now use Bengali. Technical flags and service
names remain literal, and invariant coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2d839b63">Bengali diagnostics and attachment storage gain 50 values</a>. Thanks to xet7.</summary>

Team and organization assignment, invitations, Node heap and memory diagnostics,
legal notices, checklist and subtask actions and filesystem, GridFS and S3
attachment movement now use Bengali. Technical storage and runtime names remain
recognizable, and invariant coverage leaves 566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df7ab3c63">Bengali storage repair and compaction gain 50 values</a>. Thanks to xet7.</summary>

Attachment and avatar storage migration and location repair, storage defaults,
progress and statistics, identifiers and MongoDB GridFS compaction now use
Bengali. Storage, replica, oplog and identifier terminology remains
recognizable, and invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8657b0f22">Bengali uploads, support and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board status and time summaries, upload progress and restrictions, login fields,
PDF preview, workspace dragging, custom translations, checklist collapsing,
support and accessibility now use Bengali. The workspace token and technical
format names remain exact, and invariant coverage leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75ca2fd57">Bengali account protection and scheduled jobs gain 50 values</a>. Thanks to xet7.</summary>

Accessibility labels, brute-force login protection and locked-user controls,
scheduled jobs, attachment and avatar paths and scheduled board operations now
use Bengali. Storage and cron terminology remains recognizable, and invariant
coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66456dd38">Bengali storage and database migration gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job and migration controls, filesystem, S3 and Azure storage and
MongoDB, FerretDB and Sandstorm migration guidance now use Bengali. URLs,
environment-variable names and the database placeholder remain exact, and
invariant coverage leaves 366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8af5acc9d">Bengali security controls and backups gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, adaptive card loading, safe rich-text rendering, disabled
imports, exports, activities, notifications and watches, anonymized users and
backup scope now use Bengali. HTML and technical configuration names remain
exact, and invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73a108ed4">Bengali cloud backup setup gains 50 values</a>. Thanks to xet7.</summary>

Backup schedules and restore modes plus Google Cloud, S3 and Azure credential,
permission and console guidance now use Bengali. JSON, product names and menu
paths remain recognizable, and invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/621729fd4">Bengali storage migrations gain 50 values</a>. Thanks to xet7.</summary>

GridFS and S3 settings, migration lifecycle controls, scheduled board
operations, writable storage paths and attachment and board migration settings
now use Bengali. Product and protocol names remain exact, and invariant
coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bf2bc791">Bengali board integrity repair gains 50 values</a>. Thanks to xet7.</summary>

Board structure checks, duplicate-list cleanup, lost-card and archive recovery,
missing-list repair, avatar and attachment URL repair and migration progress now
use Bengali. Data identifiers remain exact, and invariant coverage leaves 166
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/392246c63">Bengali conversion and job monitoring gain 50 values</a>. Thanks to xet7.</summary>

Board conversion and repair steps, cleanup, CPU and memory diagnostics,
scheduled-job frequencies, export monitoring and filesystem and GridFS
statistics now use Bengali. Technical identifiers remain exact, and invariant
coverage leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8b62e6e6">Bengali migration tuning and monitoring gain 50 values</a>. Thanks to xet7.</summary>

Bulk attachment migration, batch, CPU and delay tuning, migration logs and
warnings, monitoring controls, schedules, progress and system-resource totals
now use Bengali. Storage names and numeric ranges remain exact, and invariant
coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/685eab566">Bengali accounts and event monitoring gain 50 values</a>. Thanks to xet7.</summary>

OTP login, accounts, repository access, problem summaries, broken-card repair,
CPU diagnostics and event details now use Bengali. Card-repair placeholders and
technical names remain exact, and invariant coverage leaves 16 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f75e20562">Bengali translation completes its final 16 values</a>. Thanks to xet7.</summary>

IP-address labels, filesystem integrity, scoped card export and WeKan file and
board import guidance now use Bengali. The global-search operator placeholder,
format names and angle-bracket value remain exact. All 2,166 values are now
translated and whole-locale invariant coverage reports zero placeholders.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb16fe49d">Tibetan activity and checklists gain 50 values</a>. Thanks to xet7.</summary>

Board, card, list and swimlane activity, attachments, labels, checklists,
comments, custom fields, archives and imports now use Tibetan. Named and
positional placeholders remain exact, and whole-locale invariant coverage
leaves 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efd5a918c">Tibetan movement and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card movement, membership, concise activity messages, checklist activity and
workspace controls now use Tibetan. Named and positional placeholders remain
exact, and whole-locale invariant coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c977c7b0">Tibetan board layout controls gain 50 values</a>. Thanks to xet7.</summary>

Workspace deletion, multi-board selection, Home boards, templates, list widths,
keyboard shortcuts, swimlane heights and common card controls now use Tibetan.
Positional placeholders remain exact, and whole-locale invariant coverage
leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9de5c5fd">Tibetan archives and board visibility gain 50 values</a>. Thanks to xet7.</summary>

Administration announcements, public boards, archives, attachments, board
appearance, member and assignee summaries and private-board guidance now use
Tibetan. Named and positional placeholders and strong-emphasis tags remain
exact, and whole-locale invariant coverage leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b58d68794">Tibetan board views and archive guidance gain 50 values</a>. Thanks to xet7.</summary>

Public-board guidance, appearance, desktop and mobile views, zoom, calendar and
table views, archive guidance and common card editing labels now use Tibetan.
The workspace token, positional placeholder and strong-emphasis tags remain
exact, and whole-locale invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82254ec7f">Tibetan voting and import dialogs gain 50 values</a>. Thanks to xet7.</summary>

Card membership and custom fields, voting, Planning Poker, dependencies,
organization and team controls, account and background deletion and import and
export dialogs now use Tibetan. Whole-locale invariant coverage leaves 1,866
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f46492df">Tibetan member mapping and appearance gain 50 values</a>. Thanks to xet7.</summary>

Member dialogs, archive restoration, CAS login, linked cards and boards,
imported-member mapping, themes, fonts, avatars, language and permission
controls now use Tibetan. Numeric preview text remains exact, and whole-locale
invariant coverage leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69eccdbde">Tibetan navigation and color names gain 50 values</a>. Thanks to xet7.</summary>

Star controls, automatic list widths, clipboard actions, card aging, movement,
dialog navigation, board restoration guidance and the first color-name set now
use Tibetan. Whole-locale invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2868da302">Tibetan roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

Board roles, destructive confirmations, list movement, clipboard actions,
multi-card JSON examples, labels and custom-field types now use Tibetan. JSON
structure remains valid, and whole-locale invariant coverage leaves 1,716
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/337ebfdac">Tibetan account email and errors gain 50 values</a>. Thanks to xet7.</summary>

Custom-field controls, permanent deletion, profile and WIP settings, account
enrolment, invitation, password-reset and verification emails and board, import
and linked-card errors now use Tibetan. Named placeholders and technical format
names remain exact, and whole-locale invariant coverage leaves 1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f3542b17">Tibetan card export and filtering gain 50 values</a>. Thanks to xet7.</summary>

User and account errors, card PDF and Excel export fields and storage errors,
list sorting and date, label and member filters now use Tibetan. Technical
format names remain exact, and whole-locale invariant coverage leaves 1,616
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d70168bcd">Tibetan advanced filters and imports gain 50 values</a>. Thanks to xet7.</summary>

Assignee and custom-field filters, the complete advanced-filter syntax and
Kanboard, Deck, OpenProject, issue, Asana, ZenKit, Trello, CSV, Jira, Excel and
WeKan import guidance now use Tibetan. Operators, endpoints, JSON keys, paths
and format names remain exact, and whole-locale invariant coverage leaves 1,566
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cba98533">Tibetan Trello API imports gain 50 values</a>. Thanks to xet7.</summary>

Trello archive safety, workspace placement, API credentials, board selection,
import-job controls and results, member mapping, validation, invitations and
labels now use Tibetan. The API URL, technical names and positional placeholder
remain exact, and whole-locale invariant coverage leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebf852267">Tibetan archives and multi-selection gain 50 values</a>. Thanks to xet7.</summary>

Board departure, card and list links, list archives, user, team and organization
settings, swimlane actions, imports, selection movement and copying, muted and
normal notification roles and archived-item states now use Tibetan. The board
title token remains exact, and whole-locale invariant coverage leaves 1,466
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ed929eb9">Tibetan search and shortcuts gain 50 values</a>. Thanks to xet7.</summary>

Watch notifications, private and public guidance, previews, member removal,
card-description rescue, search, WIP settings, keyboard shortcuts, sidebars and
Home-board controls now use Tibetan. The login link, positional placeholder and
member tokens remain exact, and whole-locale invariant coverage leaves 1,416
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4d4607ab">Tibetan uploads and templates gain 50 values</a>. Thanks to xet7.</summary>

Time tracking, assignee and label shortcuts, uploads, custom branding URLs,
watching, welcome content, card, list and board templates, WIP errors and
attachment/API limits now use Tibetan. Technical names and numeric ranges
remain exact, and whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/906580d92">Tibetan transfer limits and webhooks gain 50 values</a>. Thanks to xet7.</summary>

Attachment and API transfer limits, avatar upload blocking, registration,
invitations, SMTP configuration and test mail, webhooks and basic runtime
version fields now use Tibetan. Email tokens and product and protocol names
remain exact, and whole-locale invariant coverage leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fade33b4">Tibetan diagnostics and organization tenancy gain 50 values</a>. Thanks to xet7.</summary>

Database, FerretDB, reactivity, DDP and operating-system diagnostics, time
units, custom-field display settings, account changes, visibility and
organization and team tenancy administration now use Tibetan. Environment
variables, hostnames and technical runtime names remain exact, and whole-locale
invariant coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d88ef0509">Tibetan card and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Received and end dates, colors, assignment provenance, destructive board and
notification actions, duplicate-list cleanup, subtask and card settings,
minicard fields, parent relationships and label activity now use Tibetan. Named
and positional placeholders remain exact, and whole-locale invariant coverage
leaves 1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2f29fe27">Tibetan automation workflows gain 50 values</a>. Thanks to xet7.</summary>

Attachment, label and custom-field activity, rule management, workflow and list
views, trigger and action construction, card, label, member, checklist,
attachment and daily triggers and JSON, CSV and Trello Butler import/export now
use Tibetan. Tokens and technical format names remain exact, and whole-locale
invariant coverage leaves 1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b2849798">Tibetan scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

n8n and Node-RED workflow imports, scheduled, due-date, list-duration and card
and board button triggers, list sorting, card completion, bulk movement and
relative-date actions now use Tibetan. The count token, technical names and
numeric marker remain exact, and whole-locale invariant coverage leaves 1,116
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c32da738">Tibetan automation rule actions gain 50 values</a>. Thanks to xet7.</summary>

List, card, label, member, attachment, checklist and checklist-item trigger
phrases plus card movement, archive restoration, color, member, checklist and
email actions now use Tibetan. Whole-locale invariant coverage leaves 1,066
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eef4af62c">Tibetan configuration and authentication gain 50 values</a>. Thanks to xet7.</summary>

Remaining automation actions, authentication, custom-head metadata, manifest
and asset-link settings, board duplication and layout, card counters and member
lists now use Tibetan. Technical metadata names remain exact, and whole-locale
invariant coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/729433cdf">Tibetan due-date activity and interaction settings gain 50 values</a>. Thanks to xet7.</summary>

Custom HTML placement, login errors, authentication display, duplication and
deletion confirmations, date activity, due reminders, mentions, card
positioning and drag, editor and multi-card settings now use Tibetan. HTML,
named and positional placeholders remain exact, and whole-locale invariant
coverage leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/099eb4c1b">Tibetan notifications and board roles gain 50 values</a>. Thanks to xet7.</summary>

Multi-card and inline-editor behavior, organization, team and user dialogs,
notification management, board-role permissions and status, weekdays, activity
metadata and linked-card deletion guards now use Tibetan. Keyboard and
technical names remain exact, and whole-locale invariant coverage leaves 916
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6126599fa">Tibetan shared templates and card views gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, tasks, domains, shared templates, My Cards, Due Cards,
global search and missing-item errors now use Tibetan. Domain examples,
emphasis markers and positional placeholders remain exact, and whole-locale
invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b4836376">Tibetan global-search vocabulary gains 50 values</a>. Thanks to xet7.</summary>

Missing-result messages, paginated result counts and the complete set of
global-search operator and predicate labels now use Tibetan. Positional and
named range placeholders remain exact, and whole-locale invariant coverage
leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49c7d6827">Tibetan global-search help gains 50 values</a>. Thanks to xet7.</summary>

Operator validation, pagination, search syntax, every operator explanation,
status and field predicates, sorting and limit guidance and query-composition
notes now use Tibetan. Backticked examples, emphasis, angle-bracket
metavariables and named and positional placeholders remain exact, and
whole-locale invariant coverage leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0e5a4054">Tibetan dependencies and board backgrounds gain 50 values</a>. Thanks to xet7.</summary>

Board and card sorting, completion, stickers, dependency relationships and
imports, board backgrounds and the first location controls now use Tibetan.
JSON and SVG names and named size and import placeholders remain exact, and
whole-locale invariant coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/068e47ff4">Tibetan maps and administrative reports gain 50 values</a>. Thanks to xet7.</summary>

Location detection, maps, server troubleshooting, activity controls, string
templates, invisible-filename diagnostics and security, performance, database,
impersonation, recovery and office reports now use Tibetan. Shell commands,
template placeholders, HTML entities and IP protocol names remain exact, and
whole-locale invariant coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9c4d24b2">Tibetan recovery and ticket controls gain 50 values</a>. Thanks to xet7.</summary>

Office and API reports, automatic recovery reporting and maintenance, swimlane
copying, wait indicators, card sizing, organization and team deletion guards,
tickets and card details now use Tibetan. REST API, MongoDB, environment
configuration and mail-header notation remain recognizable, and whole-locale
invariant coverage leaves 616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eafdb9926">Tibetan administration and attachment storage gain 50 values</a>. Thanks to xet7.</summary>

Team and organization administration, invitations, Node heap and memory
diagnostics, legal notices, checklist and subtask actions and filesystem,
GridFS and S3 attachment moves now use Tibetan. Runtime, allocator, URL and
storage names remain exact, and whole-locale invariant coverage leaves 566
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85415ec40">Tibetan attachment repair and compaction gain 50 values</a>. Thanks to xet7.</summary>

Attachment and avatar storage migration, location repair, default storage,
progress and file statistics plus MongoDB GridFS compaction now use Tibetan.
Storage names, IDs, replica-set, oplog and Meteor terminology remain
recognizable, and whole-locale invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d521f2918">Tibetan uploads, support and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board timing, upload progress and limits, account prompts, PDF previews,
workspace assignment, custom translations, Markdown and ZIP imports, checklist
collapsing, support and accessibility now use Tibetan. Named placeholders,
format names and standards remain exact, and whole-locale invariant coverage
leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8745d70a">Tibetan account lockouts and scheduled jobs gain 50 values</a>. Thanks to xet7.</summary>

Accessibility metadata, brute-force login protection and locked-user
administration, people status filters, scheduled jobs, attachment and avatar
paths and board archive, backup and cleanup scheduling now use Tibetan.
Whole-locale invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b413847a">Tibetan migration diagnostics and storage settings gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job results, migration errors and warnings, filesystem, S3 and Azure
storage settings, MongoDB/FerretDB database migration and Sandstorm migration
status now use Tibetan. MongoDB, FerretDB, SQLite, MinIO, AWS, URLs, environment
variables and `__db__` remain exact, and whole-locale invariant coverage leaves
366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4df8f5a05">Tibetan security controls and backup settings gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, adaptive card loading, plain-text rendering, import/export
and activity/notification controls, identity anonymization and backup settings
now use Tibetan. Markdown and HTML examples, environment variables, storage
paths, product names and counter examples remain exact, and whole-locale
invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/939a7f0b9">Tibetan backup schedules and cloud-storage guidance gain 50 values</a>. Thanks to xet7.</summary>

Backup frequency, restore modes, Google Cloud Storage credentials and
permissions, AWS S3, Azure and GCS console paths, connection tests and cloud
attachment moves now use Tibetan. Time formats, JSON field names, console menu
names, storage products and secret-key terminology remain exact, and
whole-locale invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a8fb4a23">Tibetan GridFS and storage-migration controls gain 50 values</a>. Thanks to xet7.</summary>

GridFS selection, migration lifecycle and progress, CollectionFS moves, S3
credentials and connection tests, scheduled board operations, writable paths
and attachment/board migration settings now use Tibetan. MongoDB, GridFS,
CollectionFS, AWS, MinIO, SSL/TLS and the example region remain exact, and
whole-locale invariant coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acc9a3e96">Tibetan board-integrity migration controls gain 50 values</a>. Thanks to xet7.</summary>

Comprehensive board checks, duplicate-list cleanup, lost-card restoration,
archive recovery, missing-list repair, avatar/file URL repair and migration
progress now use Tibetan. `swimlaneId`, `listId`, IDs and URLs remain exact, and
whole-locale invariant coverage leaves 166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/045565cc4">Tibetan migration steps and resource monitoring gain 50 values</a>. Thanks to xet7.</summary>

The remaining board-conversion steps, cleanup, database migrations, run
intervals, export and attachment monitoring, filesystem/GridFS statistics, job
queues, CPU and memory use now use Tibetan. ID, URL, CPU and GridFS remain
exact, and whole-locale invariant coverage leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05ea0c742">Tibetan migration tuning and monitoring controls gain 50 values</a>. Thanks to xet7.</summary>

Attachment storage targets, batch size, CPU thresholds and delays, migration
logs and lifecycle, monitoring refresh/export, schedules, progress, resource
totals and minicard list/checklist settings now use Tibetan. GridFS, S3, CPU,
percent and millisecond ranges remain exact, and whole-locale invariant
coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c2b4312b">Tibetan whole-file translation is complete</a>. Thanks to xet7.</summary>

The final 66 values cover repository login, problem reporting, broken-card
repair, CPU and event diagnostics, scoped import/export and search guidance.
OTP, API, CPU, IP versions, file formats, `__fixed__`, `__unfixable__`,
`__operator_number__` and `<number>` remain exact. Zero-backlog and whole-file
invariant coverage now protect all 2,166 Tibetan translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fc05e481">Buryat activity and board controls gain 50 values</a>. Thanks to xet7.</summary>

Board, card, list and swimlane deletion and creation, comments, due dates,
attachments, subtasks, labels, checklists, custom fields, archiving and imports
now use Buryat. Named and percent placeholders remain exact, and whole-locale
invariant coverage leaves 2,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be39bd01e">Buryat activity history and workspaces gain 50 values</a>. Thanks to xet7.</summary>

Card moves, activity history, checklist changes, board membership, dates,
subtasks, custom fields and workspace creation and settings now use Buryat.
Named and percent placeholders remain exact, and whole-locale invariant
coverage leaves 2,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b46ffce0">Buryat workspace and layout controls gain 50 values</a>. Thanks to xet7.</summary>

Workspace deletion, board selection and home boards, list widths, swimlane
heights, keyboard shortcuts, dates, templates and checklist actions now use
Buryat. Percent placeholders remain exact, and whole-locale invariant coverage
leaves 2,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b542de4e0">Buryat board administration and archives gain 50 values</a>. Thanks to xet7.</summary>

Administrator notices and permissions, board archives and restoration,
attachments, templates, board backgrounds, member views and assignments now
use Buryat. Named, percent and HTML placeholders remain exact, and whole-locale
invariant coverage leaves 1,966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84950690a">Buryat board views and card archives gain 50 values</a>. Thanks to xet7.</summary>

Board visibility, backgrounds and views, desktop and mobile display, zoom,
calendar navigation, card, list and swimlane archives and card editing now use
Buryat. Named, percent and HTML placeholders remain exact, and whole-locale
invariant coverage leaves 1,916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ece9b210">Buryat voting and import controls gain 50 values</a>. Thanks to xet7.</summary>

Card membership and dates, voting and planning poker, dependencies,
organizations, teams, backgrounds, accounts and board-element imports and
exports now use Buryat. Whole-locale token and tag invariant coverage leaves
1,866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d64a6cc65">Buryat member and theme controls gain 50 values</a>. Thanks to xet7.</summary>

Members, invitations, archived-item restoration, rule transfer, linked cards
and boards, imported-member mapping, themes, fonts, text colors, avatars,
languages and permissions now use Buryat. Whole-locale invariant coverage
leaves 1,816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f2dc4f1">Buryat layout and color controls gain 50 values</a>. Thanks to xet7.</summary>

Subtasks, starred boards and pages, automatic list widths, card aging, card and
list movement, dialogs, board closure and 23 interface colors now use Buryat.
Whole-locale token and tag invariant coverage leaves 1,766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bb6d9222">Buryat roles and custom fields gain 50 values</a>. Thanks to xet7.</summary>

The remaining colors, restricted board roles, deletion confirmations,
clipboard actions, card and list copying, template containers, labels and
custom-field types and options now use Buryat. The translated JSON example
remains valid, and whole-locale invariant coverage leaves 1,716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4378d2c83">Buryat email and validation messages gain 50 values</a>. Thanks to xet7.</summary>

Custom-field text, permanent deletion, profile and WIP controls, card dates,
notifications, account enrollment, invitation, password and verification
emails and board, user, JSON and CSV errors now use Buryat. All email tokens
remain exact, and whole-locale invariant coverage leaves 1,666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60295a7b9">Buryat exports and filters gain 50 values</a>. Thanks to xet7.</summary>

Account and name conflicts, attachment-free board exports, PDF and Excel card
exports, attachment metadata, list sorting and date, label and member filters
now use Buryat. Whole-locale token and tag invariant coverage leaves 1,616
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88498383b">Buryat filters and board imports gain 50 values</a>. Thanks to xet7.</summary>

Assignee and custom-field filters, activities, imported members, advanced
filter syntax and board imports from Kanboard, Deck, OpenProject, issue
trackers, Asana, ZenKit, Trello, CSV, Jira, Excel and WeKan now use Buryat.
Named tokens and filter operators remain exact, and whole-locale invariant
coverage leaves 1,566 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af8cef75c">Buryat Trello import controls gain 50 values</a>. Thanks to xet7.</summary>

ZIP validation, Trello workspaces and API credentials, board selection,
progress, cancellation and results, imported-member mapping, date validation,
keyboard shortcuts and label creation now use Buryat. The API URL, year example
and percent placeholder remain exact, and whole-locale invariant coverage
leaves 1,516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32993b317">Buryat membership and selection controls gain 50 values</a>. Thanks to xet7.</summary>

Administrator safeguards, leaving and linking boards, list archiving and
deletion, user, team and organization settings, element movement, multi-select,
archive states, board roles and participation notifications now use Buryat.
The board-title token remains exact, and whole-locale invariant coverage leaves
1,466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/815439608">Buryat visibility and shortcut controls gain 50 values</a>. Thanks to xet7.</summary>

Watch notifications, private and public pages, previews, board membership,
unsaved-description recovery, search, WIP limits, keyboard shortcuts, sidebars,
signup and default and starred boards now use Buryat. Named and percent tokens
and the login link remain exact, and whole-locale invariant coverage leaves
1,416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb8a33114">Buryat tracking and branding controls gain 50 values</a>. Thanks to xet7.</summary>

Starred boards, time tracking, assignee and label shortcuts, uploads, custom
logos and links, URL schemes, watching, welcome and template boards and WIP and
attachment limits now use Buryat. Numeric examples remain exact, and
whole-locale invariant coverage leaves 1,366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdacd37cc">Buryat attachment and webhook settings gain 50 values</a>. Thanks to xet7.</summary>

Attachment and API transfer limits, avatar blocking, registration and
invitations, SMTP configuration and testing, authorization errors, outgoing
and global webhooks and runtime version labels now use Buryat. Invitation email
tokens remain exact, and whole-locale invariant coverage leaves 1,316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d8afbc41">Buryat diagnostics and organization controls gain 50 values</a>. Thanks to xet7.</summary>

Database, FerretDB, reactivity, DDP and operating-system diagnostics, time
units, custom-field display, account and board visibility settings and team and
organization tenancy, domains, administrators and member synchronization now
use Buryat. Environment-variable names remain exact, and whole-locale invariant
coverage leaves 1,266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1615d1543">Buryat card dates and subtask settings gain 50 values</a>. Thanks to xet7.</summary>

Received and end dates, card and selection colors, board and notification
deletion, duplicate-list cleanup, subtask destinations, minicard fields,
parent-card display and label activity now use Buryat. Named and percent tokens
and count examples remain exact, and whole-locale invariant coverage leaves
1,216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd835b65c">Buryat activity and automation rules gain 50 values</a>. Thanks to xet7.</summary>

Attachment, label and custom-field activity, rule creation and editing,
workflow and list views, card, label, member, checklist, attachment and daily
triggers and JSON, CSV and Trello Butler rule transfer now use Buryat. Named
and percent tokens remain exact, and whole-locale invariant coverage leaves
1,166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31e730efa">Buryat scheduled automation gains 50 values</a>. Thanks to xet7.</summary>

Visual workflow formats, n8n and Node-RED imports, scheduled and button
triggers, daily through monthly schedules, due-date and time-in-list triggers,
list sorting, completion actions, relative dates and time units now use Buryat.
The import count remains exact, and whole-locale invariant coverage leaves
1,116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8206e0ce">Buryat automation actions gain 50 values</a>. Thanks to xet7.</summary>

Card, label, member, attachment, checklist and checklist-item conditions,
archive transitions, card movement, membership and color actions, checklist
updates, email actions and their generated descriptions now use Buryat.
Whole-locale token and tag invariant coverage leaves 1,066 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c06f1d46a">Buryat rule details and branding gain 50 values</a>. Thanks to xet7.</summary>

Generated email, archive, label, member and checklist actions, card creation,
swimlanes, date-field actions, card links, authentication, product names,
custom HTML, manifests, asset links and layout settings now use Buryat. Format
names and comma-separated examples remain exact, and whole-locale invariant
coverage leaves 1,016 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a79586b1">Buryat customization and reminders gain 50 values</a>. Thanks to xet7.</summary>

Custom body HTML, authentication display, board duplication, swimlane deletion,
card placement, due-time reminders and mentions, account, team and organization
deletion, minicard labels, drag handles and editor behavior now use Buryat.
HTML and named and percent tokens remain exact, and whole-locale invariant
coverage leaves 966 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/589e4aea6">Buryat roles and calendar settings gain 50 values</a>. Thanks to xet7.</summary>

Multi-card windows, Enter-key editor behavior, organization, team and user
editing, notification state, rename and invitation permissions, board-role
status, weekdays, ownership and linked-card deletion safeguards now use
Buryat. Keyboard combinations remain exact, and whole-locale invariant
coverage leaves 916 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/941ab8b1d">Buryat shared templates and card views gain 50 values</a>. Thanks to xet7.</summary>

Checklist visibility, tasks, domains, shared templates, people and time scopes,
My Cards sorting, Due Cards and global-search views and missing board-element
errors now use Buryat. Domain examples, Markdown emphasis and percent tokens
remain exact, and whole-locale invariant coverage leaves 866 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7808b8873">Buryat search operators gain 50 values</a>. Thanks to xet7.</summary>

Missing comment, organization and team results, card-result counts and search
operators for board structure, people, state, dates, text, attachments and
checklists and their archived, open, overdue and time predicates now use
Buryat. Result-boundary tokens remain exact, and whole-locale invariant
coverage leaves 816 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c66e107db">Buryat global-search guidance gains 50 values</a>. Thanks to xet7.</summary>

Public and private predicates, operator validation, pagination and the full
global-search guide for board structure, people, dates, state, field presence,
sorting, limits and operator composition now use Buryat. Search examples,
named tokens and pseudo-tags remain exact, and whole-locale invariant coverage
leaves 766 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e41b0e463">Buryat dependencies and backgrounds gain 50 values</a>. Thanks to xet7.</summary>

Label metadata, board and card sorting, completion state, stickers, dependency
types, filtering and JSON/SVG import, board backgrounds and location names,
addresses and latitude now use Buryat. Import counts and the image-size token
remain exact, and whole-locale invariant coverage leaves 716 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74f535f09">Buryat maps and reports gain 50 values</a>. Thanks to xet7.</summary>

Longitude, map-link detection and providers, server-error troubleshooting,
sorting, activity visibility, swimlane movement, string templates and file,
security, speed, test, CPU, database, rule, board, card, impersonation, recovery
and office reports now use Buryat. Shell commands and the template placeholder
remain exact, and whole-locale invariant coverage leaves 666 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60d0ef5e6">Buryat recovery and support reports gain 50 values</a>. Thanks to xet7.</summary>

Office sharing, REST API usage, data recovery status and maintenance, swimlane
copying, wait-spinner styles, organization and team deletion safeguards,
support tickets and card sorting and details now use Buryat. API and database
configuration names remain exact, and whole-locale invariant coverage leaves
616 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc477e3e0">Buryat teams and attachment storage gain 50 values</a>. Thanks to xet7.</summary>

Team and organization assignment, invitations, Node heap and memory
diagnostics, legal notices, checklist and subtask actions and filesystem,
GridFS and S3 attachment moves now use Buryat. Runtime, allocator, URL and
storage names remain exact, and whole-locale invariant coverage leaves 566
values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4fb16622">Buryat attachment repair and compaction gain 50 values</a>. Thanks to xet7.</summary>

Attachment and avatar storage migration, location repair, default storage,
progress and file statistics plus MongoDB GridFS compaction now use Buryat.
Storage names, IDs, replica-set, oplog and Meteor terminology remain
recognizable, and whole-locale invariant coverage leaves 516 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edd68f23e">Buryat uploads and accessibility gain 50 values</a>. Thanks to xet7.</summary>

Board timing, upload progress and limits, account prompts, PDF previews,
workspace assignment, custom translations, Markdown and ZIP imports, checklist
collapsing, support and accessibility now use Buryat. Named placeholders,
format names and standards remain exact, and whole-locale invariant coverage
leaves 466 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/337c8f6b9">Buryat lockout and scheduled jobs gain 50 values</a>. Thanks to xet7.</summary>

Accessibility metadata, brute-force login protection and locked-user
administration, people status filters, scheduled jobs, attachment and avatar
paths and board archive, backup and cleanup scheduling now use Buryat.
Whole-locale token and tag invariant coverage leaves 416 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8506731e9">Buryat migrations and storage settings gain 50 values</a>. Thanks to xet7.</summary>

Scheduled-job results, migration errors and warnings, filesystem, S3 and Azure
storage settings, MongoDB/FerretDB database migration and Sandstorm migration
status now use Buryat. MongoDB, FerretDB, SQLite, MinIO, AWS, URLs, environment
variables and `__db__` remain exact, and whole-locale invariant coverage leaves
366 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/629bda3b5">Buryat security and backup settings gain 50 values</a>. Thanks to xet7.</summary>

Sandstorm cleanup, adaptive card loading, plain-text rendering, import/export
and activity/notification controls, identity anonymization and backup settings
now use Buryat. Markdown and HTML examples, environment variables, storage
paths, product names and counter examples remain exact, and whole-locale
invariant coverage leaves 316 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53cdf8095">Buryat backup and cloud-storage guidance gain 50 values</a>. Thanks to xet7.</summary>

Backup frequency, restore modes, Google Cloud Storage credentials and
permissions, AWS S3, Azure and GCS console paths, connection tests and cloud
attachment moves now use Buryat. Time formats, JSON field names, console menu
names, storage products and secret-key terminology remain exact, and
whole-locale invariant coverage leaves 266 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8f5fc627">Buryat storage-migration controls gain 50 values</a>. Thanks to xet7.</summary>

GridFS selection, migration lifecycle and progress, CollectionFS moves, S3
credentials and connection tests, scheduled board operations, writable paths
and attachment and board migration settings now use Buryat. MongoDB, GridFS,
CollectionFS, AWS, MinIO, SSL/TLS and the example region remain exact, and
whole-locale invariant coverage leaves 216 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd2b4c5af">Buryat board-integrity migrations gain 50 values</a>. Thanks to xet7.</summary>

Comprehensive board checks, duplicate-list cleanup, lost-card restoration,
archive recovery, missing-list repair, avatar and file URL repair and migration
progress now use Buryat. `swimlaneId`, `listId`, IDs and URLs remain exact, and
whole-locale invariant coverage leaves 166 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76caec0bb">Buryat migration steps and monitoring gain 50 values</a>. Thanks to xet7.</summary>

The remaining board-conversion steps, cleanup, database migrations, run
intervals, export and attachment monitoring, filesystem and GridFS statistics,
job queues, CPU and memory use now use Buryat. ID, URL, CPU and GridFS remain
exact, and whole-locale invariant coverage leaves 116 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c4e7cea1">Buryat migration tuning and monitoring gain 50 values</a>. Thanks to xet7.</summary>

Attachment storage targets, batch size, CPU thresholds and delays, migration
logs and lifecycle, monitoring refresh and export, schedules, progress,
resource totals and minicard list and checklist settings now use Buryat.
GridFS, S3, CPU, percent and millisecond ranges remain exact, and whole-locale
invariant coverage leaves 66 values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/add0ed2d9">Buryat whole-file translation is complete</a>. Thanks to xet7.</summary>

The final 66 values cover repository login, problem reporting, broken-card
repair, CPU and event diagnostics, scoped import/export and search guidance.
OTP, API, CPU, IP versions, file formats, `__fixed__`, `__unfixable__`,
`__operator_number__` and `<number>` remain exact. Zero-backlog and whole-file
invariant coverage now protect all 2,166 Buryat translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2d07af9f">Cherokee activity and board controls gain 50 values</a>. Thanks to xet7.</summary>

Board, card, list and swimlane deletion and creation, comments, due dates,
attachments, subtasks, labels, checklists, custom fields, archiving and imports
now use Cherokee syllabary. Named and percent placeholders remain exact, and
whole-locale invariant coverage leaves 2,116 values.

</details>

and improves the following translations:

**Cyrillic translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a64f8bd7">Office and API reports use Macedonian and Serbian</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use distinct
Macedonian and Serbian vocabulary in Cyrillic script. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, Cyrillic content, distinct vocabulary and the intentionally universal API
labels. These direct translations have low confidence and welcome review by
Macedonian and Serbian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/293568999">Office and API reports use Mongolian</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Mongolian
vocabulary in Cyrillic script. REST API, IPv4, IPv6 and WITH_API=true remain
recognizable. Regression coverage checks every translated key, Cyrillic content
and the intentionally universal API labels. This direct translation has low
confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56f270fa2">Mongolian archive and board controls no longer use Russian</a>. Thanks to xet7.</summary>

Twenty-eight exact Russian copies in archive, template and board-view controls
now use Mongolian vocabulary. The shared `Архив` loanword remains valid.
Regression coverage compares the repaired values directly with Russian, checks
established Mongolian board terms and rejects common Russian UI words. Another
1,146 exact-match candidates remain for later audited batches. This direct
repair has low confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acc164e40">Mongolian card controls no longer use Russian</a>. Thanks to xet7.</summary>

Forty-three exact Russian copies across card guidance, dates, editing controls,
voting, templates, sorting and popup titles now use Mongolian. Regression
coverage compares every repaired key with Russian, preserves placeholders and
established card vocabulary, and rejects common Russian card terms. Another
1,103 exact-match candidates remain for later audited batches. This direct
repair has low confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27ac02b41">Mongolian attachment controls no longer use Russian</a>. Thanks to xet7.</summary>

Fourteen exact Russian copies across attachment deletion, actions, storage moves
and renaming now use Mongolian. The shared `Файл` loanword remains valid and
GridFS remains recognizable. Regression coverage compares the repaired values
with Russian and rejects common Russian attachment terms. Another 1,089 exact
matches, including shared loanwords, remain for later audit. This direct repair
has low confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aa734872">Mongolian checklists and subtasks no longer use Russian</a>. Thanks to xet7.</summary>

Fifty exact Russian copies across activities, dialogs, settings, automation,
search and export now use consistent Mongolian checklist and subtask vocabulary.
Regression coverage compares every value with Russian, preserves named and
printf placeholders, keeps the search operator space-free and rejects common
Russian terms. Another 1,039 exact matches, including shared loanwords, remain
for later audit. This direct repair has low confidence and welcomes review by
Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5aa7cb978">Mongolian filter labels no longer use Russian</a>. Thanks to xet7.</summary>

Eleven exact Russian copies across date, list-title, label, member, assignee,
custom-field, advanced and card-title filters now use consistent Mongolian
filter vocabulary. Regression coverage compares every repaired value with
Russian and rejects common Russian filter terms. Another 1,028 exact matches,
including shared loanwords, remain for later audit. This direct repair has low
confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e71c827ec">Mongolian label text no longer uses Russian</a>. Thanks to xet7.</summary>

Thirty exact Russian copies across label activities, deletion, multi-selection,
automation, search, display settings and validation now use consistent Mongolian
label vocabulary. Regression coverage compares every value with Russian and
preserves named, printf and Markdown placeholders. Another 998 exact matches,
including shared loanwords, remain for later audit. This direct repair has low
confidence and welcomes review by Mongolian speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24bc8efb0">Mongolian translations restore their exact English placeholders</a>. Thanks to xet7.</summary>

Three email subjects now keep `__siteName__` instead of substituting `__url__`,
and the unknown-operator message keeps `%s` instead of malformed `%1`. Their
surrounding Russian prose now uses Mongolian. Whole-file regression coverage
compares every Mongolian placeholder inventory with `en.i18n.json` and rejects
the repaired Russian wording. This direct repair has low confidence and
welcomes review by Mongolian speakers.

</details>

**Caucasian translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71c6d0be6">Office and API reports use Armenian and Georgian</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Armenian or
Georgian script and each language's own vocabulary. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, rejects the neighbouring script and preserves the intentionally universal
API labels. These direct translations have low confidence and welcome review by
Armenian and Georgian speakers.

</details>

**Indic translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e19994a5">Office and API reports use Telugu and Tamil</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Telugu or Tamil
script and each language's own vocabulary. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, rejects the neighbouring script and preserves the intentionally universal
API labels. These direct translations have low confidence and welcome review by
Telugu and Tamil speakers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fac8a9cc">Office and API reports use Odia and Punjabi</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Odia or Gurmukhi
script and each language's own vocabulary. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, rejects the neighbouring script and preserves the intentionally universal
API labels. These direct translations have low confidence and welcome review by
Odia and Punjabi speakers.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.10 2026-08-23 WeKan ® release

**In short:** a **CRITICAL SECURITY ISSUE**, **ImportBleed**, allowed a
logged-out DDP client to write imported board data directly into the database;
both import methods now reject unauthenticated callers after mandatory argument
validation and before import processing. Below that: bounded legacy E2E login
waits, restored Transifex locale aliases, Office and API report translations,
visible obsolete English placeholders and focused regression coverage.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following CRITICAL SECURITY ISSUE of [ImportBleed](https://wekan.fi/hall-of-fame/importbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2898635df">Board imports reject logged-out DDP callers before import processing</a>. Thanks to Char0n1507 and xet7.</summary>

The importBoard method reached direct collection writers without first requiring
an authenticated user, allowing a network client with no account or token to
create imported board data and placeholder users. importBoard and importScoped
now complete Meteor’s mandatory type checks, then reject logged-out callers
before feature checks, parsers or creators can run. Scoped imports carry the
authenticated method user explicitly. Denied attempts are attributed by
connection address in Admin Panel / Problems. Source-level and logged-out
browser regression tests cover the guard and no-write outcome. See
[GHSA-qp32-wqxw-wq3h](https://github.com/wekan/wekan/security/advisories/GHSA-qp32-wqxw-wq3h)
and [ImportBleed](https://wekan.fi/hall-of-fame/importbleed/).

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ccb71bae">Legacy E2E login and suite waits are bounded</a>. Thanks to xet7.</summary>

The Puppeteer list-regression suite now waits for a connected DDP session before
resume-token login and bounds the token callback, reactive identity settlement
and entire suite. A stalled fresh second session fails with its URL, DDP status,
user id and login state instead of pausing all tests indefinitely. Regression
coverage keeps every wait bounded and diagnostic.

</details>

and improves the following translations:

**Translation tooling** - placeholder safety and same-language vocabulary reuse.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d966f157">Transifex locale aliases remain symlinks to their translation targets</a>. Thanks to xet7.</summary>

The Khmer and Russian hyphenated locale aliases again point to their underscored
Transifex targets. Translation pulls therefore update the files loaded by the
app instead of leaving materialized copies stale. The former copies were
byte-identical to their targets, so no translation was lost; lazy-loading and
new-language wiring tests pin both aliases as symlinks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eec7ea495">IPv4 and IPv6 labels follow each language’s own IP-address vocabulary</a>. Thanks to xet7.</summary>

The placeholder-only local-memory tool now derives versioned protocol labels
from each language’s established IP-address translation, preserving its word
order and changing only the universal protocol token. It filled 282 rendered
labels across 141 language tags (268 stored values plus seven locale aliases).
Two obsolete English sentences were reset to the current source so future fills
can see them, and wrong-script analysis now ignores only
exact IPv4 and IPv6 identifiers while continuing to inspect surrounding prose.
Regression tests pin the ambiguity guard, placeholder protection and narrow
protocol-token exception.

</details>

**East Asian translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df7bb6976">Office and API reports use simplified and traditional Chinese</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now cover eleven Chinese
language tags, using simplified or traditional script to match each existing
locale. Product and protocol terms such as REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, both scripts and the intentionally universal API labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18ce975c7">Office and API reports use Japanese and Korean</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover three Japanese and two
Korean language tags, following each family’s established login and address
vocabulary. REST API, IPv4, IPv6 and WITH_API=true remain recognizable.
Regression coverage checks every translated key, both writing systems and the
intentionally universal API labels.

</details>

**Cyrillic translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58b510e49">Office and API reports use Russian and Ukrainian</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover four Russian and two
Ukrainian language tags, following each family’s established login and address
vocabulary. REST API, IPv4, IPv6 and WITH_API=true remain recognizable.
Regression coverage checks every translated key, both languages and the
intentionally universal API labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aac41827e">Office and API reports use Belarusian and Bulgarian</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now use distinct Belarusian and
Bulgarian vocabulary in Cyrillic script. REST API, IPv4, IPv6 and WITH_API=true
remain recognizable. Regression coverage checks every translated key, both
languages and the intentionally universal API labels.

</details>

**Right-to-left translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2235fbda">Office and API reports use Arabic across four locale tags</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover the Arabic, Algerian,
Egyptian and Moroccan tags in Arabic script. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, all four right-to-left tags, Arabic-script content and the intentionally
universal API labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebfcbd986">Office and API reports use Hebrew and Persian</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover two Hebrew and two Persian
language tags in their respective right-to-left scripts. REST API, IPv4, IPv6
and WITH_API=true remain recognizable. Regression coverage checks every
translated key, both scripts and the intentionally universal API labels.

</details>

**Indic translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31946787b">Office and API reports use Hindi and Gujarati</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover two Hindi tags in
Devanagari and one Gujarati tag in Gujarati script. REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, both scripts and the intentionally universal API labels.

</details>

**Greek translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d0e5b845">Office and API reports use Greek across both locale tags</a>. Thanks to xet7.</summary>

All twelve report labels and descriptions now cover both Greek language tags in
Greek script. REST API, IPv4, IPv6 and WITH_API=true remain recognizable.
Regression coverage checks every translated key, Greek-script content and the
intentionally universal API labels.

</details>

**Khmer translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d233b4fd4">Office and API reports use Khmer</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Khmer vocabulary
across the three Khmer language tags. API, REST API, IPv4, IPv6 and
WITH_API=true remain recognizable. Regression coverage checks every translated
key, Khmer script, variant consistency and the intentionally universal literals.

</details>

**Vietnamese translations** - the Office and REST API usage reports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bd71c07d">Office and API reports use Vietnamese</a>. Thanks to xet7.</summary>

All twelve translatable report labels and descriptions now use Vietnamese
across both language tags, following their established login, report and
endpoint vocabulary. API, REST API, IPv4, IPv6 and WITH_API=true remain
recognizable. Regression coverage checks every translated key, variant
consistency and the intentionally universal literals.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.09 2026-08-23 WeKan ® release

**In short:** **Playwright authentication** now waits for the resumed user after
navigation, and local **WebKit** runs retry once with a fresh worker after rare
renderer failures. Below that: regression coverage for both safeguards.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release improves the following developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47b277932">Playwright waits for resumed users and retries unstable WebKit renderers</a>. Thanks to xet7.</summary>

Token login now waits for the expected Meteor user after the final navigation,
preventing an authorized method call from racing Accounts token resumption. Local
WebKit runs retry once in a fresh worker when its renderer fails internally after
many tests; persistent application and assertion failures still fail. Regression
tests require the identity wait, its bounded timeout, the local retry and the
unchanged two-retry CI policy.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.08 2026-08-23 WeKan ® release

**In short:** six coordinated reports harden **REST authorization**, board
ownership, administrator token auditing and error responses. Build and release
tooling now supports **macOS zsh**, Alpine, Arch, Fedora, RHEL and Oracle
Linux, keeps companion data under the repository's ignored **.tools** directory,
provides **sandbox-local tools**, bounds **build, test and runtime**
**resources** across every platform, reports resource failures in **Admin Panel
Problems**, offers three bounded, cleanly interruptible
complete-test execution modes, and includes four dependency updates.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following HIGH AND MODERATE SECURITY ISSUES:

**REST board mutations** - cards, checklists, checklist items and comments.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">Checklist mutations require board write access</a>. Thanks to Char0n1507 and xet7.</summary>

Checklist and checklist-item create, edit and delete routes accepted read-only
board members because they checked only whether the caller could view the board.
Every mutation now requires the canonical board write capability; read-only
members retain GET access. See
[GHSA-5r4m-5xx6-96jf](https://github.com/wekan/wekan/security/advisories/GHSA-5r4m-5xx6-96jf)
and [ChecklistWriteBleed](https://wekan.fi/hall-of-fame/checklistwritebleed/).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">Every REST mutation follows its canonical board-role capability</a>. Thanks to senti-man and xet7.</summary>

Checklist, checklist-item and comment routes had drifted from the role capability
table: some mutations needed only read access, while comment creation required
full write access and incorrectly rejected Comment Only members. Mutation routes
now require write access and comment creation uses the comment capability. See
[GHSA-cp24-5m9m-wm97](https://github.com/wekan/wekan/security/advisories/GHSA-cp24-5m9m-wm97)
and [RoleBleed](https://wekan.fi/hall-of-fame/rolebleed/).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">Card and checklist creation requires board write access</a>. Thanks to Char0n1507 and xet7.</summary>

Card and checklist creation reused the comment permission, allowing Comment Only
members to create board content. Both single and bulk card creation and checklist
creation now require the canonical write capability. See
[GHSA-qf5c-63jx-mpv4](https://github.com/wekan/wekan/security/advisories/GHSA-qf5c-63jx-mpv4)
and [CommentWriteBleed](https://wekan.fi/hall-of-fame/commentwritebleed/).

</details>

**Boards** - ownership assigned by the board-creation API.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">REST board creation cannot choose another owner</a>. Thanks to Char0n1507 and xet7.</summary>

The board-creation route trusted the owner and role flags in the request body, so
an authenticated caller could create a board attributed to another user. The
authenticated caller is now always the initial active administrator and owner.
See
[GHSA-6jvj-85q3-6q2m](https://github.com/wekan/wekan/security/advisories/GHSA-6jvj-85q3-6q2m)
and [OwnerBleed](https://wekan.fi/hall-of-fame/ownerbleed/).

</details>

**Administrator API** - issuing login tokens for another account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">Administrator-created login tokens require an audited reason</a>. Thanks to Char0n1507 and xet7.</summary>

The administrator token endpoint could create a reusable login token for another
user without producing the impersonation audit record used by the normal UI. It
now requires a reason, verifies the target, records the administrator and target
before inserting the login token, and rejects an unaudited request. See
[GHSA-5r57-9vj7-c64f](https://github.com/wekan/wekan/security/advisories/GHSA-5r57-9vj7-c64f)
and [TokenAuditBleed](https://wekan.fi/hall-of-fame/tokenauditbleed/).

</details>

**REST responses** - safe status codes and public error messages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fa0b158c">REST failures return sanitized errors and correct HTTP statuses</a>. Thanks to Char0n1507 and xet7.</summary>

Board and user routes returned raw Error objects as successful HTTP 200 responses,
which exposed implementation details and made failures look successful. Shared
response handling now preserves expected 4xx statuses while replacing unexpected
5xx details with a generic message. Regression tests cover both paths and ensure
raw errors do not return from the affected handlers. See
[GHSA-h59p-76c3-8345](https://github.com/wekan/wekan/security/advisories/GHSA-h59p-76c3-8345)
and [ErrorBleed](https://wekan.fi/hall-of-fame/errorbleed/).

</details>

and updates the following dependencies:

- **@aws-sdk/client-s3 3.1113.0 → 3.1114.0** — the Amazon S3 client.
- **@aws-sdk/lib-storage 3.1109.0 → 3.1114.0** — managed multipart uploads to S3.
- **@google-cloud/storage 7.22.0 → 8.0.1** — Google Cloud Storage integration.
- **dompurify 3.4.13 → 3.4.14** — HTML sanitization in the browser.

Thanks to dependabot.

and has the following developer-tooling improvements:

**Build and release tooling** - host setup and repository-local working data.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ec619e43">Every platform bounds runtime memory and reports resource failures</a>. Thanks to xet7.</summary>

Source builds, Linux and Windows bundles, Docker, Snap and Sandstorm now derive
Node and FerretDB limits from available host or cgroup memory while preserving
explicit administrator overrides. Test and Go compiler floors no longer exceed
small containers, Playwright installs repository-local browsers and uses a
matching Docker fallback when immutable host libraries are missing, and build
dependency stderr remains visible in both the console and timestamped log.

Runtime self-checks proactively report low disk space and V8 heap pressure in
Admin Panel Problems. The database classifier now gives actionable reports for
memory and file-descriptor exhaustion, read-only volumes, corruption and
oversized documents. The remediation documents record which protections work on
every platform and distinguish implemented FerretDB telemetry from follow-ups.

</details>

- [Browser runs reuse cached binaries and report only their selected project](https://github.com/wekan/wekan/commit/9f459303a). Thanks to xet7.

- [Complete-mode wiring checks cover all three test schedules](https://github.com/wekan/wekan/commit/ba1c1b1e4). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c51e6938d">Complete tests offer two-worker, one-by-one and at-once modes</a>. Thanks to xet7.</summary>

The first three Tests menu choices in both `build.sh` and `build.bat` now run the
whole matrix. The default runs one stage at a time with two Playwright workers
per browser for a safe speed increase; one-by-one minimizes memory use; and
at-once runs WeKan jobs concurrently. Database backends and FerretDB stages stay
sequential in every mode to avoid port conflicts and overlapping compiler load.
The Windows helper forwards the selected mode to the shared shell implementation,
and parity tests pin the menu order, mode mapping and Playwright worker limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09db353b6">Complete runs clean up older tests and databases before starting</a>. Thanks to xet7.</summary>

Every EVERYTHING run now owns a repository-local process lock. Starting another
one first stops the older run and all descendants, frees and verifies ports 3000
and 3001, and removes tagged Playwright and database-conformance containers.
Ctrl-C uses the same cleanup for the interrupted run. Cleanup tries graceful
termination before a bounded forced stop; if a process, port or container still
survives, the replacement exits with an actionable error before creating logs,
building WeKan or starting any new tests. PID start tokens prevent stale lock
files from targeting an unrelated reused PID on Linux, macOS and Windows.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8388314a">Sandbox tasks install version-matched local tools under .tools</a>. Thanks to xet7.</summary>

The agent instructions now treat the repository-local, ignored `.tools` tree as
the installation root when the Flatpak sandbox lacks a required command. Node.js
and npm versions are read from `Dockerfile`, Meteor from `.meteor/release`, and
other tools from their repository-owned version sources instead of stale copied
examples. The instructions link the tested sandbox bootstrap, keep environment
overrides scoped, and document a local RapidOCR virtual environment for reading
timestamped screenshots when bubblewrap prevents the normal image viewer from
creating a user namespace.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69e9a8ba1">The complete test matrix cannot create an unbounded shell or Go compiler load</a>. Thanks to xet7.</summary>

Fedora screenshots showed available memory falling from 28.6 GiB to 371 MiB
while the CPU-exec negative regression created a large group of short-lived
`bash` processes. The test now captures stdout and stderr from one direct helper
invocation instead of launching a duplicate nested shell. The following
FerretDB stages limit Go package compilation to two through four workers with a
separate managed-heap target, and conformance no longer downloads the root,
integration and tools module graphs before building its single binary. Focused
positive and negative regressions pin these resource boundaries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/175328061">Test runtimes cannot consume the build tool's half-of-RAM heap allowance</a>. Thanks to xet7.</summary>

The adaptive 8-16 GiB heap ceiling needed while Meteor compiles WeKan was also
inherited by the long-lived bundle server and every Node, E2E and Playwright
process. A leaking test could therefore consume nearly all workstation RAM and
swap before Linux killed it. Runtime processes now use a separate quarter-RAM
allowance clamped to 2-4 GiB, while Meteor compilation retains the larger heap.
`WEKAN_TEST_NODE_OPTIONS` provides a test-only override. Regression coverage
pins both the bounded processes and the deliberately unbounded compiler.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c34daf2bd">Build and release scripts detect and support Fedora hosts</a>. Thanks to xet7.</summary>

Host-side dependency installers now choose Fedora's `dnf` commands and package
names, including Fedora 44's `7zip`, `gcc-c++`, `glibc-langpack-en` and snapd
socket setup. Debian/Ubuntu continue to use apt and macOS continues to use
Homebrew. Mocked installer-path tests cover both Fedora and Debian selection.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87252792f">Installers support Alpine, Arch, RHEL and Oracle Linux</a>. Thanks to xet7.</summary>

Host-facing shell installers now identify Linux families through `/etc/os-release`
and select `apk`, `pacman`, `dnf`, `yum` or `apt-get` with each distribution's
package names. Shared compiler and archive setup covers bundle conversion, docs,
Sandstorm, release downloads, Snap prerequisites and forge tooling. Alpine and
Arch report the manual Snap prerequisite instead of incorrectly running apt. RHEL
and Oracle Linux configure their respective EPEL repositories before installing
[snapd](https://github.com/wekan/wekan/commit/6d6c574cd).
Mocked detection tests cover Alpine, Arch, Fedora, RHEL, Oracle Linux and Debian,
and every migrated script is syntax-checked.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef8b1043e">Build and release scripts work when launched from macOS zsh</a>. Thanks to xet7.</summary>

Host-facing Bash scripts now hand direct zsh invocation to macOS's system Bash
before parsing Bash-specific syntax. The shared installer detects Darwin without
depending on the caller's shell and maps command names to the correct Homebrew
formulae for Python, GNU awk, GCC, 7-Zip and Node.js. Regression tests cover the
handoff, Darwin detection and every differing formula name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/299f943f2">Scripts keep website and log directories under .tools</a>. Thanks to xet7.</summary>

Shell and Windows batch scripts now use `.tools/wekan.fi` for the website
companion checkout and `.tools/log` for build and test output. This removes the
legacy sibling `../w/wekan.fi` and parent `../log` assumptions while preserving
the CI environment-variable overrides.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7f7fc73e">Test runs use the Node and Meteor installations under .tools</a>. Thanks to xet7.</summary>

A fresh shell did not include `.tools/.meteor` on `PATH`, so EVERYTHING stopped
before building with `meteor: command not found` even though setup had installed
the exact release there. `build.sh` now prefers the repository-local Meteor and
the Node version and architecture named by the release configuration. The
companion [FerretDB test runner](https://github.com/wekan/FerretDB/commit/17bb70eb)
also generates current version metadata before unit packages initialize and
writes standalone logs under `.tools/log`. Its unit, vet and SQLite integration
stages pass together.

</details>

- [The direct FerretDB test entry uses .tools/FerretDB](https://github.com/wekan/wekan/commit/7231c6f69). Thanks to xet7.

- [Repository instructions use the same .tools paths](https://github.com/wekan/wekan/commit/c9b88b32a). Thanks to xet7.

- [The database-conformance regression test expects .tools/log](https://github.com/wekan/wekan/commit/896639ffc). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.07 2026-08-22 WeKan ® release

**In short:** the **TenantBleed**, **AssignedBleed** and **CalendarBleed**
security fixes restrict Organization/Team writes to site admins and make REST
and iCalendar card creation follow canonical board-role capabilities. Below
that: card-history, destination-picker and riscv64 release-build fixes. The
binary table is the v11.06 baseline and will be replaced by this release's
verified provenance when its platform builds run.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following MODERATE SECURITY ISSUES:

**Organizations and Teams** - tenant configuration and its DDP permissions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/216146edc">Organization and Team DDP writes require a site administrator</a>. Thanks to Char0n1507 and xet7.</summary>

Any authenticated user could insert, update or remove an Organization or Team
document over Meteor/DDP when its `_id` equalled their user id. The collection
allow rules treated document identity as authority without requiring site-admin,
tenant-admin or membership privileges, exposing tenant configuration and
deletion. All six operations now share one site-admin-only decision; legitimate
scoped and internal writes continue through their authorization-enforcing server
methods. Refused authenticated attempts are rate-limited, attributed and shown
in Admin Panel / Problems. See
[GHSA-p4cq-83j9-7g73](https://github.com/wekan/wekan/security/advisories/GHSA-p4cq-83j9-7g73)
and [TenantBleed](https://wekan.fi/hall-of-fame/tenantbleed/).

</details>

**REST authorization** - the shared permission gate for board mutations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1c75e995">REST mutations enforce the canonical board write capability</a>. Thanks to Char0n1507 and xet7.</summary>

An authenticated Only Assigned Comment member could modify any card through the
REST API, even when not assigned to it. The shared REST authorization helper
duplicated a list of excluded role flags and omitted `isCommentAssignedOnly`, so
every card mutation route using it accepted a role whose canonical policy says
`write: false`. The helper and both parallel attachment APIs now use the shared
role-capability decision. All non-writing roles are denied, while No Comments
and the other legitimate writing roles retain access. Refused attempts are
rate-limited, attributed and shown in Admin Panel / Problems. See
[GHSA-f396-42fx-vr88](https://github.com/wekan/wekan/security/advisories/GHSA-f396-42fx-vr88)
and [AssignedBleed](https://wekan.fi/hall-of-fame/assignedbleed/).

</details>

**iCalendar import** - creating cards from calendar events through DDP.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e062042c1">ICS imports require the canonical board write capability</a>. Thanks to Char0n1507 and xet7.</summary>

An authenticated Comment Only member could call `importIcsToBoard` over
Meteor/DDP and create arbitrary cards. The method checked board membership and
excluded only read-only roles, so Comment Only, Only Assigned Comment and Worker
members reached card insertion despite the role policy denying them write
access. The DDP path now uses the same canonical write-capability helper as its
REST sibling. Regression coverage denies all five non-writing roles and confirms
that the four legitimate writing roles retain access. Refused attempts are
rate-limited, attributed and shown in Admin Panel / Problems. See
[GHSA-fpm6-r5fg-2mrg](https://github.com/wekan/wekan/security/advisories/GHSA-fpm6-r5fg-2mrg)
and [CalendarBleed](https://wekan.fi/hall-of-fame/calendarbleed/).

</details>

and fixes the following bugs:

**Card details** - activity history and destination selection.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/394a89fbc">Opening Activities shows the complete card history and REST returns every comment</a>. Thanks to rmb82 and xet7.</summary>

The removed Activities eye left its old per-card `showActivities: false` value
in control, so opening the new caret could still request comments only. Opening
the section now always requests its complete history. The comments REST endpoint
also validates the card against the requested board before selecting all records
by their authoritative `cardId`, so older and imported comments with missing or
stale denormalized board metadata are no longer omitted without weakening board
isolation. Positive and negative regression tests cover both retrieval paths.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/394a89fbc">Move and Copy Card offer board-global lists in every swimlane</a>. Thanks to rmb82 and xet7.</summary>

The destination picker treated a list without a `swimlaneId` as shared only by
the default swimlane. It now combines board-global lists with the selected
swimlane's own lists for every swimlane, while continuing to exclude lists owned
by another swimlane. Regression tests cover both cases and the shared picker
used by Move Card and Copy Card.

</details>

and fixes the following developer-tooling bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d11987fad">Queued riscv64 snap builds survive the GitHub job limit</a>. Thanks to xet7.</summary>

The Release All log showed no riscv64 compiler or recipe failure: Launchpad
kept it pending until GitHub cancelled the runner at its six-hour limit. The
workflow now gives its local waiter five hours, then leaves the named Launchpad
build running and ends cleanly. Its flattened source commit has deterministic
dates, so a later job re-run reconnects to that same build instead of adding
another one to the queue. Store and GitHub Release publishing remain gated on a
downloaded, architecture-checked squashfs snap. Regression tests cover the
stable snapshot identity, the pending hand-off and the no-artifact publishing
guard.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.06 2026-08-21 WeKan ® release

**In short:** **card details** once again offer every valid list and label, in
every swimlane and through linked cards, and use compact accessible icons for
person-field actions, while **LDAP profiles** consistently retain the
directory's full display name. Below that: regression coverage for all four
reported bugs, linked-card label writes and the icon controls, plus corrected
Node and browser expectations for those controls and card dates.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bugs:

**Card details** - choosing placement and labels on an opened card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a87e3378">It offers board-wide lists in every swimlane and logs moves through reactive cache gaps</a>. Thanks to mimZD, rmb82 and xet7.</summary>

The list, move and copy selectors treated a legacy board-wide list as shared
only in the default swimlane. They now include it for every swimlane. Activity
logging also records a temporarily unavailable list or swimlane with an empty
name instead of throwing after the valid card update.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a87e3378">Its label picker falls back to the visible card board</a>. Thanks to ClemStrummer and xet7.</summary>

The linked-card label refactor could resolve no source board and render only
the Create label action. It now prefers the source board but falls back through
the placement board to the current visible board, retaining existing labels and
newly created ones.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e633f3c74">Adding a label through a linked card updates its source</a>. Thanks to xet7.</summary>

The label row is a nested popup context, while the routed board contains the
linked representation. The popup now retains the card as its explicit mutation
target and resolves the label catalogue and new-label board from the source, so
selecting or creating labels through a linked card works consistently.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96e598059">Requested By and Assigned By use an icon instead of Add text</a>. Thanks to xet7.</summary>

Empty person fields now use the same compact icon-only language as description
editing: a plus to add and a pencil to edit. Both states keep localized hover
tooltips and accessible names, while the decorative icons stay hidden from
screen readers.

</details>

**LDAP profiles** - directory names shown to signed-in users.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a87e3378">They normalize displayName values to text before saving the full name</a>. Thanks to Nissulya and xet7.</summary>

Active Directory attributes can arrive as a scalar, a one-element array or a
buffer. The full-name sync now converts all three shapes to text, so the user
header and profile do not fall back to `sAMAccountName` while the Admin Panel
still sees directory data.

</details>

and updates the following developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d61772c08">Regression suites follow accessible Add icons and Card-wrapped dates</a>. Thanks to xet7.</summary>

The all-tests run still expected visible Add text after those actions became
icon-only controls, and one date test expected the direct context used before
the v11.05 card-date repair. Node and Playwright coverage now checks the
localized accessible name, tooltip and plus icon, and the date assertion
matches the Card explicitly passed through the Blaze argument context. The
complete plain-Node run passes all 495 suites.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.05 2026-08-19 WeKan ® release

**In short:** **opened cards** with saved dates render normally again, retain
their labels and remain editable instead of stopping Blaze reactivity with a
date-template context error. **Launchpad snap builds** now wait for their
release bundles and preserve valid artifacts when Snapcraft only fails during
post-download cleanup.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e909b475b">Cards with saved dates open and remain editable</a>. Thanks to ClemStrummer and xet7.</summary>

Named Blaze arguments had replaced each opened-card date template's `Card`
context with a plain argument object. Reactive date helpers then called Card
methods on that object, stopping card-detail rendering and leaving the board in
a refresh loop after a date save. Card details now passes the Card explicitly,
while the shared date code accepts both that wrapped context and the direct
context used by minicards and Table view. Browser coverage opens a labeled card
with all four dates, verifies every badge and label, edits its title, and checks
that no date-context exception occurs.

</details>

and fixes the following developer-tooling bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2be7aac2b">Launchpad waits for release bundles and keeps validated snaps</a>. Thanks to xet7.</summary>

Launchpad snap jobs used to start alongside the extra-architecture bundle jobs,
so s390x and ppc64el repeatedly downloaded release assets that did not exist
yet. They now wait for those jobs and verify the exact architecture-specific
asset before starting a remote build. A missing optional bundle is skipped with
its real cause instead of spending hours retrying a permanent 404.

A Snapcraft SSL error during cleanup also used to discard an armhf snap that
had already downloaded successfully. The workflow now keeps an artifact only
after checking its minimum size and squashfs magic, regardless of the later
cleanup status. Release-workflow tests cover the dependency, bundle-name
mapping, missing-asset path, step gates, successful cleanup-failure path and
invalid-artifact rejection.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.04 2026-08-19 WeKan ® release

**In short:** **card date editors** now preserve edited date and time values
through reactive redraws and wait for persistence before closing, fixing an
intermittent Chromium failure when changing an existing start date. **Meteor**
moves to 3.5.2-beta.0 together with its matching Rspack integration and core
package prereleases.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c118812f">Date editors preserve edits through reactive redraws</a>. Thanks to xet7.</summary>

The shared date editor now synchronizes valid native date and time input changes
with its reactive draft and awaits every card, vote and planning-poker date
write before closing. This prevents a redraw from restoring the old value
between editing and submission. The Chromium start-date regression passed ten
consecutive runs, and a node guard covers every asynchronous callback.

</details>

and updates the following dependencies:

- **Meteor 3.5.1 → 3.5.2-beta.0** — the framework WeKan is built on. Its
  matching `accounts-base`, Babel, DDP client, ECMAScript, JavaScript minifier,
  MongoDB driver wrapper, Rspack, tools-core and TypeScript packages move to
  their `beta352.0` builds, while `@meteorjs/rspack` moves from 2.1.0 to
  2.2.0-beta.0. [Update](https://github.com/wekan/wekan/commit/9059b1824e59babf110d5efb07a87d66b77eb434).

Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.03 2026-08-19 WeKan ® release

**In short:** **accessibility** gives shared tabs, dialogs, images, password
controls and card edit targets coherent names and keyboard order throughout
WeKan, with one common keyboard utility keeping those behaviors consistent.
**Card details** restore checkbox custom fields, keep their saved values
separate from field visibility, save currency values, provide independent
opened-card and minicard visibility settings, make every custom-field value
copyable, use compact accessible pencil icons for Edit actions, restore the
grid/one-per-row layout switch, restore cross-board card links, omit deleted
custom fields from exports, and make attachment previews use the available
viewport. JFIF image uploads receive portable JPEG download names. Linked cards
mirror every visible source field across boards and
authorized members can edit that shared content from either board. Card
locations recognize both map URLs and plain coordinate pairs. Positive,
negative and browser regression coverage keeps each interaction working.
Existing boards also receive the new default-on opened-card custom-fields
setting during schema upgrade. Opened cards can be resized wider as well as
narrower on desktop. **All Boards** keeps the complete
invitation message and its actions visible on phone-sized layouts.
**Developer tooling** keeps long-running Rspack development watchers from
retaining cache state until they exhaust the JavaScript heap, and lets Flatpak
terminals run the Firefox/WebKit matrix through host Docker. **Dependencies**
refresh S3 storage, build analysis, keyboard shortcuts, CSV parsing and browser
automation.
**Admin Panel / Problems / Offices** groups login addresses by person and shows
each address family, available location, per-person login count and available
initials instead of empty avatar circles.
**Admin Panel / People / People** summarizes each person's login countries and
opens country-by-country city, IPv4, IPv6 and login-time details. Problems
pagination no longer mixes a specialized pane's state with the shared reports.
The complete browser run restores inline title and date editing, popup focus,
loading-state accessibility and phone board scrolling while bringing its
selectors in step with the current UI.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bugs:

**The Admin Panel** - reports about people and where they log in from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3539f2bbf33a5481f2cc0cf4569d725e19c509c9">Offices groups login addresses by person with locations and counts</a>. Thanks to xet7.</summary>

The Offices report was inverted: each row represented an address and placed all
people using it inside one cell. It now pages people and keeps every address for
one person together. Each row has separate IPv4 and IPv6 columns, the latest
country flag and city supplied by Cloudflare or another supported proxy, and
that person's successful-login count and first/last times for that address.

Location is recorded when a login succeeds; existing address tallies are not
retroactively geolocated. With Cloudflare, the proxied hostname must enable the
`Add visitor location headers` Managed Transform so `CF-IPCountry`, `CF-IPCity`,
`CF-Region`, `CF-IPLatitude` and `CF-IPLongitude` reach WeKan. Caddy passes
these request headers through by default; any `header_up` override belongs
inside its `reverse_proxy` block.

People sharing one address remain separate groups with separate counts. Search
still matches names, addresses and locations, while location metadata for a
page is fetched in one batch. Positive and negative coverage checks both IP
families, shared addresses, supported location headers and absent geography.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/480074969b5aa80cf776a44c5b48196b536884f0">Offices shows available initials instead of empty avatar circles</a>. Thanks to xet7.</summary>

The server already computed initials for every person, but person grouping
dropped that field and the shared table tried to find the user again in the
client cache. When the full user document was not published there, the fallback
had no letters to draw and rendered an empty grey circle.

Initials now travel with the person through the response, grouped rows and
shared table cell. The existing avatar template uses them directly and retains
its reactive user lookup as the fallback everywhere else. Regression coverage
checks both the Offices path and the generic table conversion.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff9d0bab8b63bee6ef70c70decf82a852f5bb2ba">People shows country login counters with city and address details</a>. Thanks to xet7.</summary>

A Location column immediately before Status now shows each person's country
flags and successful-login counts. Selecting a counter opens that person's
location report: countries are the left menu, busiest first, and the selected
country's shared Table.md table lists city, IPv4, IPv6 and the person's first
and last login times for every address.

The detail view has the shared search, pagination and Back controls. Location
data is fetched once per People page and restricted through the same site-admin
or tenant-admin scope as the People list. Unknown locations are not guessed,
stale page responses are discarded, and new logins retain the available proxy
location on the person's own address tally.

Positive and negative coverage checks country totals and ordering, both IP
families, city rows, timestamps, menu and table wiring, authorization limits
and absent geography.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c034643b82785b4197fee7a1a810799280ac912">Problems pagination keeps each pane's state separate</a>. Thanks to xet7.</summary>

Pagination events from specialized Problems panes bubbled into the containing
shared report handler. Their pane ids intentionally have no shared report
configuration, so clicking Next could try to read a count from undefined and
stop the requested action with a browser exception.

Event-stream and Offices controls now keep their events inside their own pane.
The shared Previous, Next and search handlers also safely ignore missing or
transitional report state. Regression coverage exercises both specialized
pagers and the defensive shared-handler path.

</details>

**Card details** - fields, attachments and links on an opened card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/491781c449c1e1e03bc3620472dd04f91ecd741f">Existing boards keep default-on opened-card custom fields</a>. Thanks to xet7.</summary>

The board schema made opened-card custom fields visible by default, but the
schema-upgrade list omitted that new flag. Boards created before the setting
therefore retained no stored default when their other default-on feature flags
were repaired. The upgrade now backfills `allowsCustomFields: true` while still
preserving an administrator's explicit `false` choice.

The complete 490-suite Node run also exposed guards that still described old
custom-field, date-control, card-width, initials and publication layouts, plus a
security scan entering a downloaded Go toolchain under `.tools`. Those guards
now pin the current intended behavior and scan only maintained FerretDB source.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/518a4d2fec487fef91f66224a9be8fc5f94e7527">JFIF uploads use portable JPEG download names</a>. Thanks to xet7.</summary>

Content detection already identified a JFIF upload as JPEG, but the MIME
database did not recognize the `.jfif` filename suffix. The generic correction
therefore appended `.jpeg` and stored names such as `photo.jfif.jpeg`.

Detected JPEG content named with `.jfif` now replaces that suffix with `.jpeg`.
Downloads consequently use a conventional filename that desktop file
associations can open directly, while valid `.jpg` and `.jpeg` names remain
unchanged. Positive and negative tests cover replacement, non-appending and the
Security Report's sanitization reason.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc609f9feb494ebaec326e9c47107af909bbd29a">Edit actions use compact accessible pencil icons</a>. Thanks to xet7.</summary>

Visible Edit controls on cards now use the same Font Awesome pencil-square icon
as Description instead of repeating the word. This covers custom fields,
Requested By, Assigned By and comments; Add remains text where it is a distinct
action. Every icon is decorative to assistive technology, while its control
retains the localized Edit tooltip and accessible name.

Focused coverage rejects textual Edit controls, checks the icon and accessibility
attributes, and keeps the separate Add state intact.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46b276e7582c1bd020ccb2fe4d01a88b8ee177ae">Opened cards can be resized wider as well as narrower</a>. Thanks to xet7.</summary>

The desktop card already had a bottom-right resize handle, but its 520px
opening width was also a hard maximum, so dragging could only make the card
narrower. It still opens at the compact 520px width and can now grow up to the
viewport's eight-pixel margins. Mobile remains full-screen and non-resizable.

Placement and maximized-card regression coverage checks both resize directions,
the initial width, viewport ceiling, mobile behavior and maximized geometry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0ca913d477b8583b19d5ea5c60fd27a9d4ba0ff">The Custom Fields layout toggle changes and remembers the layout</a>. Thanks to xet7.</summary>

The toggle continued saving the user's `customFieldsGrid` preference after the
card-section refactor, but the rendered container no longer read it, so nothing
visibly changed. The off state now produces a compact wrapping grid and the on
state makes each custom field occupy a full row, preserving the toggle's
original behavior.

Focused positive and negative coverage checks both layout classes and the
persisted method wiring. A browser regression switches the layout and reloads
the card to verify that the selected mode remains active.

</details>

- [Wider opened cards fit more compact-grid custom field columns](https://github.com/wekan/wekan/commit/938e373e2b00dca8968a14c2ff23011a0441a922). Thanks to xet7.

- [The Custom Fields layout selector shows Grid and List icons](https://github.com/wekan/wekan/commit/2d9d41ff46ea247773306c54ae3d09c59f13f798). Thanks to xet7.

- [The layout selector sits between the Custom Fields title and menu](https://github.com/wekan/wekan/commit/5c789a6238c5f69d8ea44f488ef5997ac7880cd4). Thanks to xet7.

- [Changing the Custom Fields layout no longer collapses the section](https://github.com/wekan/wekan/commit/2eff68cb09419ed2e139eca98d05ccb3ab2ec4c0). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7879012c92a22e3c73c1ad580b48035a1c3bbba">Checkbox custom fields respond, stay removed, and leave clean exports</a>. Thanks to Heart1010 and xet7.</summary>

Selecting a custom field and changing a checkbox now use acknowledged server
methods with board-write and field-definition checks. A rejected optimistic
client write can therefore no longer make a checkbox appear inert or make a
deselected field spring back. PDF and Excel export also omit an orphan field
whose definition has been deleted instead of exposing its internal ID.

Unit tests cover successful writes, authorization and field-type failures, and
the orphan export case. The browser test checks a checkbox and removes its
field from an opened card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6791ade7fc8fc40b2978055687b3c8a451e155c0">Opened-card custom checkboxes save values without hiding fields</a>. Thanks to xet7.</summary>

The checkbox rendered as a card field borrowed the checklist item's event
class and derived its next state from the template context. It now has a
dedicated control, reads the persisted field value, and saves its boolean
without allowing the click to reach visibility or checklist handlers. The
Custom Fields menu remains the separate place that shows or hides the field.

Static coverage keeps the value and visibility event paths distinct. The
browser regression saves both `true` and `false` from the opened card and
verifies that the field remains visible after each change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/679d50378d0d41dd782b92b8cd610128a7f7f438">Opened cards display their saved custom checkbox checkmark</a>. Thanks to xet7.</summary>

Saving the checkbox already changed the card's boolean and its minicard badge,
but the opened-card square read a nested template path that did not react to
that change. It now reads the custom field's direct persisted value, so the
opened card and minicard show the same checked state immediately.

The regression test requires every opened-card checkbox checkmark to bind to
`value` and rejects the stale `data.value` path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d4ffd4080d95acae6b01a44906fddc67861aede">Cards and minicards control custom-field visibility independently</a>. Thanks to xet7.</summary>

The checkbox editor calculated its second click from the Card object captured
when the template was created, so it could keep saving `true` instead of
unchecking. It now reads the reactive field context and saves either boolean.

Custom-field values also no longer appear automatically on minicards. Card
menu / Show on Card gains a Custom Fields setting that defaults to enabled;
Minicard menu / Show on Minicard gains its independent Custom Fields setting
that defaults to disabled. Enabling the minicard option shows assigned fields
without changing their values or the opened-card setting.

Positive and negative tests cover both defaults, both menu handlers, both
rendering gates and repeated checkbox toggles. Existing browser coverage that
expects minicard custom fields explicitly enables the opt-in setting.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a437ef31d93afbf20dd9555cb3646922088fc21">Currency custom fields save and provide an X beside Save</a>. Thanks to xet7.</summary>

The currency editor issued an unacknowledged direct card update and closed
without knowing whether the value was accepted. It now parses dot or comma
decimals, rejects non-finite input, and awaits a server method that verifies
card-edit permission, the board's currency-field definition and the assigned
field before storing the number. Linked cards use the same source-card route.

Its input reads the direct current value, and the standard X close control now
sits immediately after Save. Static tests cover authorization, field type,
finite-number validation and control order; the browser regression enters a
comma-decimal amount and verifies the stored numeric value.

</details>

- [Custom Field Dropdown places an X close control beside Save](https://github.com/wekan/wekan/commit/a67094b1f96daf7a8cee6e6e3c16332c7394ed42). Thanks to xet7.

- [Custom Field Number places an X close control beside Save](https://github.com/wekan/wekan/commit/82a0f2f78f53c3c9eeed70694832c357c3d9e7b4). Thanks to xet7.

- [Custom Field Text places an X close control beside Save](https://github.com/wekan/wekan/commit/3d0e4805ee21693649ad918caca884db8e279aa8). Thanks to xet7.

- [Custom Field String Template places an X close control beside Save](https://github.com/wekan/wekan/commit/3928242d5fd339aa431dc42ffcfbc47c38ddd11c). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad9300297f69031155762e174e6bb828f5a4dc75">Every custom field editor provides a copy-to-clipboard control</a>. Thanks to xet7.</summary>

Text fields retain the copy button supplied by their rich-text editor. Number,
checkbox, currency, date, dropdown and string-template fields now use a shared
copy control beside their editable value. Date values are copied in ISO format
and multi-part values are separated by newlines.

Focused interaction coverage verifies that every field type exposes a copy
control and that the shared handler normalizes scalar, date and array values.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9eb0c76cbd3c8ffdfbc25e3fdfbc1047f1508927">Custom field titles open editing without taking over field controls</a>. Thanks to xet7.</summary>

Clicking a custom field's title or displayed value now opens its value editor.
Checkbox fields keep their square as an immediate on/off control, while their
title and the empty area beside the square open a staged editor with Save and
Close.

Copy is hidden while a field is only being viewed. Every field editor provides
the action while editing, and it copies the currently edited input rather than
the previously saved value. Focused positive and negative coverage checks the
view/edit boundary; the browser regression checks its editing-only visibility.

</details>

- [Custom field titles and values open editing while checkbox squares toggle](https://github.com/wekan/wekan/commit/3bb07f8b2d07111c92fea315530bd747262380a6). Thanks to xet7.

- [Checkbox custom fields can be checked and unchecked while editing](https://github.com/wekan/wekan/commit/31416ce6dd083f896ea673bee35385767244d907). Thanks to xet7.

- [Non-Date custom field value clicks work across their nested Blaze templates](https://github.com/wekan/wekan/commit/8da9be49b66830a1e9de93e3fd8e7729cd21e5c7). Thanks to xet7.

- [Date custom fields restore their direct datetime popup opener](https://github.com/wekan/wekan/commit/1defd1794467a078fd96754b707eec8d0ed08cff). Thanks to xet7.

- [The Date custom field popup keeps Date, Time and Copy on one row without a second X](https://github.com/wekan/wekan/commit/4f513437beb30d777fd86bdc89131a76b7775ab0). Thanks to xet7.

- [Dropdown custom fields preselect their saved value when editing](https://github.com/wekan/wekan/commit/93c6c5d51be2623f944e841eb2c59f97d188d193). Thanks to xet7.

- [Every custom field editor starts with its saved value](https://github.com/wekan/wekan/commit/9ff711f095e88df8daf65fda7af5486e93f403a2). Thanks to xet7.

- [Text custom fields align Convert to Markdown immediately left of Copy](https://github.com/wekan/wekan/commit/791a3d35a4d1cbb7b685d857282c4dc56379b053). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b17a9f8597a7f5857b051f640c63cd1e3b99a4e">Currency and String Template custom fields no longer break minicards</a>. Thanks to xet7.</summary>

Their Blaze helpers run inside `each customFieldsWD`, where the current context
is already a custom-field row. They tried to call the Card method
`customFieldsWD()` on that row, throwing on every render and interrupting the
surrounding card UI. Both helpers now format the row's resolved `trueValue`
directly, preserve numeric zero, leave empty values empty and use safe fallbacks
for invalid definitions or values.

Focused regression coverage rejects the invalid Card call and checks the value,
empty, numeric and String Template paths.

</details>

- [Custom field Copy controls sit above editors' top-right corners](https://github.com/wekan/wekan/commit/a3e5f4ebd04f99183ead737d630f05718f319c07). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49de60eb04616048803ba988cc97758091da65d2">Linked card content is editable from either board</a>. Thanks to hever and xet7.</summary>

A linked card displayed the source fields but several editors still wrote its
empty placement placeholder, while server methods required write access on the
source board. A member who may edit the current board can now edit the shared
source content through a visible, active link. Revoking source visibility,
archiving the link, or assigning a read-only current-board role removes that
delegation. Moving and archiving still affect only the linked representation.

The same source route covers titles, descriptions, dates, colors, people,
labels, stickers, locations, dependencies, custom fields, checklists, subtasks,
attachments, covers, watchers, minicard settings, votes and estimates. Label
and custom-field definitions come from the source board, while permission to
edit the card comes from the board on which the linked card is visible.

Positive and negative tests inventory the content mutators, method arguments
and active-link authorization boundary. The browser regression edits the
opened linked card, verifies both stored representations, then edits the source
card from its own board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3588f2a0eaad73c1468361e55c7d0cae77e9a33">Attachment previews use the available viewport</a>. Thanks to rmb82 and xet7.</summary>

Desktop PDF and text previews were fixed at 560 pixels wide, while a misplaced
media query changed them to 840 pixels only on narrower screens. The overlay is
now a viewport-filling flex layout: document viewers take the space between the
navigation controls, images retain their aspect ratio, and mobile controls keep
their compact layout. Static positive and negative tests reject another fixed
desktop document width, and a browser test measures the rendered preview.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/798390c6fcc7c905b12c1afda57606ec3328c5ba">Cross-board card links are created and their dialog closes</a>. Thanks to ClemStrummer and xet7.</summary>

The Link dialog directly inserted its pointer card from the client, so a server
rejection could undo the optimistic insert and leave the dialog open without an
explanation. It now awaits one server-authoritative operation and closes only
after success. The server verifies read access to the source, write access to
the destination, the selected list and swimlane, and rejects archived,
same-board, template and link-pointer targets.

Method tests cover the acknowledged path and invalid targets. The browser test
follows the reported board, swimlane, list, card and position selection, then
checks both the closed dialog and the stored linked card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a830cae64742bfcf99ab500a19872413e35de802">Link placement survives asynchronous popup confirmation</a>. Thanks to xet7.</summary>

The linked-board confirmation asked Blaze for the popup's `top` or `bottom`
position after awaiting the next card number. By then its event view was no
longer current, so Blaze threw `There is no current view` before inserting the
link. The popup now captures its position when it is created and its sort
calculation uses only that stored value after asynchronous work. The board
selector is scoped to the same popup as well.

The regression test rejects any later `Template.currentData()` call inside the
sort calculation and covers both placement choices.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5693c1965a09f59e4e76795c9aeccd3653fdb47f">Card locations detect plain latitude and longitude pairs</a>. Thanks to xet7.</summary>

Detect location already recognized provider URLs such as Google Maps
`@latitude,longitude,zoom`, but a coordinate pair copied directly from a map or
GPS application produced no result. The same field now accepts a complete
`latitude, longitude` pair with optional surrounding whitespace and retains its
range checks. The match is anchored to the entire input so prose that happens
to contain two numbers is not mistaken for a location.

Parser tests cover both supplied formats, exact precision and the prose
negative case. The browser regression enters each format through the location
popup and verifies the detected latitude and longitude fields.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fac3ab89127cc0d7d2164664152dffc0fbc32df">Linked cards mirror every visible field from their source</a>. Thanks to xet7.</summary>

A linked card mixed a few source-aware getters with raw fields from its empty
placement placeholder. Titles, dates and comments worked, while labels,
stickers, custom fields, locations, dependencies, subtasks, colors, creator
details and other direct fields could disappear. After reload, the source
board's label and custom-field definitions were also absent because only the
source card document and children were published.

Linked cards now resolve displayed content through one live source-card path.
The current-board publication supplies the authorized source metadata,
definition records, relevant users, subtasks and dependency targets; all remain
behind the existing source-board visibility check, and child-card queries are
constrained to those authorized boards. Placement itself still belongs to the
linked placeholder on the current board.

Parity tests cover every directly rendered collection and the negative
publication boundaries. The browser regression adds a source label, sticker,
custom field and location, then verifies them on both the linked minicard and
its opened details.

</details>

**Accessibility** - keyboard order, control names and dialog focus across pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/692207bf5ec42ba97fc189beb4135975b6d20f31">Tabs and dialogs follow a coherent keyboard and screen-reader model</a>. Thanks to xet7.</summary>

Shared tabs now expose tablist, tab and tabpanel relationships, keep only the
active tab in normal Tab order, and support arrow, Home, End, Enter and Space
keys. Popups and modals move focus inside, contain forward and reverse Tab
navigation, and return focus to their opener when closed. Password visibility
is no longer skipped by Tab, card and minicard edit targets are focusable, and
all template images explicitly provide meaningful or intentionally empty
alternative text.

Application-wide static coverage rejects positive `tabindex` values and images
without `alt`, while focused tests pin names, roles, relationships, keyboard
handlers and focus restoration. The browser regression audits representative
pages for natural order, unnamed controls and missing image alternatives, and
exercises both directions of the popup focus loop.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fce4d79453c7625f10718da23b8fda2cbd65666e">Keyboard navigation uses one shared accessibility utility</a>. Thanks to xet7.</summary>

Popup, modal and board-menu focus previously discovered controls independently,
while shared tabs and Archive tabs separately implemented the same six-key
navigation rule. Focusable-element discovery, initial focus, Tab trapping and
tab-key calculation now live together in `client/lib/accessibility.js`; each
consumer supplies only its own state transition. The board-only menu observer
also disconnects with its template instead of remaining attached after leaving
a board.

Regression coverage requires both tab implementations and every dialog consumer
to delegate to the shared helpers, and rejects copies of the old key and focus
selector branches.

</details>

**All Boards** - the overview, its Archive actions and phone-sized layouts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aad02722">Archived boards can be deleted and selected cards can be archived reliably</a>. Thanks to Nissulya and xet7.</summary>

The archived-board half of [#6608](https://github.com/wekan/wekan/issues/6608)
is handled by the new Global-Admin-only, explicitly enabled and confirmed
multi-selection Delete action. For cards, the sidebar previously fired direct
client updates and closed immediately, so a refused write looked successful
while every card stayed in place. It now sends one ordered selection to an
awaited server method. The server validates the board, write access and every
live card before archiving the first; a failure reports its reason and keeps the
selection open. Unit tests cover positive and negative client/server paths, and
a browser test selects and archives two cards from one list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc12789b43006a6fc1d48c2df07c17275728f95c">Phone board invitations show their message and actions</a>. Thanks to mimZD and xet7.</summary>

The compact phone layout forced every board icon to exactly four rem, including
an invitation that also contains its explanatory message and two touch-size
buttons. The board tile clipped that overflow, leaving only the title visible.
Invitation tiles now carry an explicit state class and retain the ordinary
four-rem floor while growing naturally around the message, Accept and Decline.
Ordinary board icons remain compact and equal-height.

Static coverage keeps the invitation exception attached to its template state.
The phone browser regression creates a real pending invitation and verifies
that its message and both buttons remain visible and inside the tile.

</details>

**Complete browser regression run** - cross-page interactions exercised by all
three browser engines.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c476ee45a9162bb09b2c4937ccc048d20e4f98af">Browser regressions restore editing, focus and phone scrolling</a>. Thanks to xet7.</summary>

The all-browser run exposed interactions that narrower source tests could not:
the minicard wrapper stopped its sibling inline-title handler, shared
opened-card date badges lost the explicit edit-permission argument, popup Tab
handling used Blaze's inconsistent delegated event container, and the stock
logo briefly lost its alternative text while settings loaded. Those paths now
retain editing permission, focus containment and accessible loading states.

The shared table search has an accessible name and a phone's board list grows
inside the single page scroller. Browser coverage now opens the attachment
viewer where that template exists, scopes the linked-card and custom-field
controls to their real DOM owners, waits for reactive options and fields, and
checks the icon-only Edit control by its accessible name. Focused positive and
negative source tests pin the permission, focus, table and scroll contracts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9f9fa4c2d53d1ad6592d142f4cc547649639348">Browser regression corrections now pass against a fresh production bundle</a>. Thanks to xet7.</summary>

Linked-card creation now restarts the board subscription so source labels,
stickers and custom fields are available with the new link. Date writes are
awaited and refresh the same subscription, popup focus trapping uses the real
dialog element, and the phone board grid leaves vertical scrolling to the page.

The browser tests now use stable card identities and the actual interactive
DOM targets after titles change, distinguish visible and compact label markup,
seed existing dates before subscribing, and measure scroll ownership instead
of relying on a browser's normalized overflow keyword. The complete Node suite
and the modified Chromium browser group cover the positive and negative paths.

</details>

and updates the following dependencies:

- **@aws-sdk/client-s3 3.1109.0 → 3.1113.0** — the AWS S3 client used by
  S3-compatible attachment storage.
- **@rsdoctor/rspack-plugin 1.6.1 → 1.6.2** — the Rspack build-analysis plugin.
- **hotkeys-js 4.0.4 → 4.0.5** — keyboard shortcut handling.
- **papaparse 5.5.4 → 5.6.0** — CSV parsing and generation.
- **puppeteer 25.6.0 → 25.8.0** — browser automation for exports and tests.

Thanks to dependabot.

and improves developer tooling:

**Development builds** - local builds and long-running watchers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1f842eb56e20b2033cd999214fec10d187ca929">Long-running Rspack watchers no longer exhaust the JavaScript heap</a>. Thanks to xet7.</summary>

Rspack's experimental persistent cache retained JavaScript-side serialization
state while `meteor run` repeatedly rebuilt WeKan's large Blaze graph. After a
long development session that retained state could consume the full 16 GB V8
heap and abort the bundler.

Development client and server watchers now run without the persistent cache.
Short-lived production builds keep caching, and unrelated Rspack experiments
still merge normally. Focused coverage checks both watchers, the production
negative case and the merge over Meteor's cache defaults.

</details>

**Browser test containers** - running the complete Playwright matrix from the
documented VS Code sandbox.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ae63a53417123c9a1686f94a69178a5bc412203">Flatpak terminals can run Firefox and WebKit through host Docker</a>. Thanks to xet7.</summary>

The ARM64 browser runner correctly selected Playwright's official Docker image,
but a VS Code Flatpak terminal could not see the host `docker` executable and
reported that Docker was not installed. The build script now discovers Docker
through `flatpak-spawn --host` and routes image pulls, browser containers and
conformance cleanup through the same host-aware wrapper.

Regression coverage pins both direct and Flatpak-host discovery. The complete
Firefox and WebKit matrices were run against a fresh production bundle; all 255
runnable tests passed in each engine, with the eight Chromium-only drag harness
tests intentionally skipped.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.02 2026-08-18 WeKan ® release

**In short:** **release metadata** advances WeKan to v11.02 and records the
binary provenance carried by its platform bundles.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release updates release metadata:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b82ecfdd34903c38d92b111e2204da3ea4e8ddbd">Release metadata advances to v11.02</a>. Thanks to xet7.</summary>

The release preparation records v11.02 and carries forward the verified Node.js
and FerretDB binary provenance for every built platform.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.01 2026-08-18 WeKan ® release

**In short:** **Admin Panel / Problems** gains the missing Delete settings pane,
where a Global Admin can enable the existing, default-off permanent-delete gate.
The pane sits above Notifications, has a stable address of its own, and explains
that enabling the gate does not delete content by itself. Its checkbox also stays
checked after saving because the reactive settings publication returns the stored
value. Below that: regression coverage keeps the menu order, pane rendering, URL,
setting handler and publication together, with the corresponding Admin Panel
documentation and English source strings. The newest All Boards and
permanent-delete controls are also translated into 69 languages and regional
variants.
Permanent-delete setting changes and
board-purge attempts, including unauthorized and failed ones, are audited in
**Recovery** with Boolean status, acting user, proxy-aware IP address, board IDs
and titles; coloured icons distinguish success, failure and deleted data, and a
dropdown filters the audit to All, Done, Failed or Deleted events. A second
description below the database-recovery explanation names the permanent-delete
events and fields recorded here.
The Delete settings pane repeats that audit explanation below its existing text,
so an administrator sees what Recovery will record before changing the gate.
**Board Archive** removes permanent delete from individual board icons and
offers it as one confirmed red action on a multi-selection, with the same gate
enforced again on the server without Meteor argument-audit failures. When that
gate is disabled, the sidebar explains
where to enable it instead of showing an inapplicable selection instruction. Its
enabled Delete button and server method both require the site-wide Global Admin
flag. Select All and Select None above the icons make that selection explicit
and quick.
Dragging that archived selection now highlights only Remaining and existing
Workspaces as valid restore targets. Archived tiles no longer show an
action-looking archive glyph at their lower-left corner.
The same themed controls now cover **Remaining, Starred, Home and Templates**,
always following the visible section and search result. While that mode is on,
its action sidebar now stays visible until Multi-Selection is turned off, and
its actions remain available before the first board is checked. Closing that
sidebar with its X also turns Multi-Selection off. Setting a Home board now
requires exactly one checked board, and the Home section offers only the actions
that make sense for its current board. Dragging a selection onto Home follows
the same one-board rule. Remaining can now drag boards onto
Starred or Archive as green targets. Home's empty state also states its
one-board limit before dragging begins. **All Boards and board loading** now
publish only dashboard board fields, keep templates separate, omit empty share
branches, paginate in the database and snapshot lazy card windows on FerretDB.
Workspace boards can also be dragged additively to Starred or, after
confirmation, moved to Archive, and existing Workspace views now show Select
All and Select None while Multi-Selection is active.
Selected cards are now archived by one acknowledged server operation, so a
failure remains visible and leaves the selection available to retry.
The CPU governor also observes FerretDB before acting and never slows its read
path when its configured cap is zero or an idle WeKan sees FerretDB itself busy.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release adds the following features:

**The Admin Panel** - server-wide safety settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ab3161b4">The Delete settings pane appears above Notifications</a>. Thanks to xet7.</summary>

The removed Features page left no place to operate the existing
`enablePermanentDelete` gate. Problems now has a directly linkable Delete pane
whose checkbox exposes that default-off setting to Global Admins. Turning the
gate on does not delete anything by itself; it only permits an explicit purge.
Menu-order, pane-rendering, URL and setting-handler tests cover the addition.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/134bd48de">Recovery audits permanent-delete changes and board purges</a>. Thanks to xet7.</summary>

Enabling or disabling Admin Panel → Problems → Delete now goes through a strict
Global Admin server method and records the actual changed state in Recovery with
the actor's username and user ID. Each successfully and permanently removed
archived board records its ID and JSON-quoted title with the same actor. No-op
setting writes, unauthorized calls and failed removals cannot create misleading
success records. Tests pin the ordering of write before audit, stable event
types and every required detail.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a0b7b7cd">Recovery shows every permanent-delete attempt and its outcome</a>. Thanks to xet7.</summary>

Unauthorized and failed setting changes or board purges are now audited beside
successful ones, without swallowing the original error. Structured fields keep
Boolean Done/deleted-data state, user ID, username, trusted-proxy-resolved IPv4
or IPv6, and bounded requested board IDs and titles. Done is the report's first
column: success is a green check, failure a red warning, and a successful
physical deletion adds a yellow trashcan. Partial batches show both the boards
already deleted and the failed whole-batch attempt. Tests cover storage,
address classification, negative paths, icon rendering and colours.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f1d42211">Recovery can filter events by outcome</a>. Thanks to xet7.</summary>

The shared controls row now offers All, Done, Failed and Deleted filters above
the Recovery table. The server applies the selected outcome together with search
before counting and pagination, so page totals and rows stay consistent. Legacy
events without the newer Boolean field remain under Done. Positive, combined and
negative selector tests cover the filter and its UI wiring.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b418b0df">Recovery explains its permanent-delete audit trail</a>. Thanks to xet7.</summary>

A second description below the existing database-recovery explanation now tells
admins that this report also logs permanent-delete setting changes and successful,
failed or unauthorized purge attempts. It names the recorded Done status, user ID,
username, trusted IPv4 or IPv6 address, and attempted board IDs and titles. A UI
wiring test pins both the content and its position below the original paragraph.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71abf3f48">Delete settings explain their Recovery audit trail</a>. Thanks to xet7.</summary>

The Recovery audit explanation now also appears below the existing text in Admin
Panel → Problems → Delete, so the administrator sees exactly what will be recorded
before enabling or disabling permanent deletion. Delete and Recovery use one
shared sentence to prevent their descriptions from diverging. Tests pin its
placement after the current Delete guidance and its reuse in both panes.

</details>

**Board Archive** - restoring or permanently removing archived boards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3034d81e">Permanent delete acts on selected archived boards</a>. Thanks to xet7.</summary>

Board icons no longer carry a trashcan that can permanently delete one board by
accident. With Multi-Selection active, a Global Admin who enabled Admin Panel →
Problems → Delete sees one red Delete button in the Archive's right sidebar. It
shows the existing irreversible board-and-content warning before sending the
whole selection to one server method.

The server trusts none of those display conditions: it independently requires a
Global Admin, the enabled feature flag, a bounded string-id selection and only
archived boards. It validates every selected board before deleting the first, so
an invalid or live-board id cannot leave a half-applied batch. Positive and
negative tests cover the missing per-board control, both UI gates, confirmation,
successful reset, retained selection on failure and every server-side gate.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76e429493">The disabled Delete gate explains how to enable it</a>. Thanks to xet7.</summary>

When permanent delete is disabled, Archive's Multi-Selection sidebar no longer
shows "Click checkboxes to select boards" without an action beneath it. It
instead explains that enabling Admin Panel → Problems → Delete makes the Delete
button visible. When enabled for a Global Admin, the normal selection
instruction and red Delete action return together. Positive and negative tests
pin both branches, and the new ordered translation key is available in every
language file without replacing human translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2eb3e0d4b">Only a Global Admin sees and can use Delete</a>. Thanks to xet7.</summary>

The Archive Delete action now requires the site-wide `Users.isAdmin` flag to be
exactly `true` in both its sidebar helper and server method. A board-admin role,
a missing flag or a truthy non-Boolean value can neither expose the button nor
authorize a forged method call. The permanent-delete setting and archived-only
validation remain additional required gates, with regression coverage for the
strict client and server checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c0f3b941">Select All and Select None control the visible archived boards</a>. Thanks to xet7.</summary>

When Multi-Selection is active in Board Archive, two buttons now sit in the
right page between its heading and board icons. Select All checks every icon in
the exact Archive list currently rendered after searching; it does not silently
select boards outside that visible result. Select None clears the shared board
selection. Tests pin their Archive-only visibility, placement, translated names,
compact layout and both selection operations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9db74d849">Select None uses the same theme colour as Select All</a>. Thanks to xet7.</summary>

Both Archive multi-selection controls now use the primary themed button style.
The regression test requires the same class on both buttons, so one cannot fall
back to the browser's unthemed grey while the other follows the site theme.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9be167742">Archived selections target only Remaining and existing Workspaces</a>. Thanks to xet7.</summary>

While Multi-Selection is active in Archive, only Remaining and existing
Workspace rows receive the green valid-target highlight. Home, Archive, sharing
targets and the other board sections refuse the drag before accepting an HTML5
drop. A Workspace drop restores every archived board and assigns it there;
regression tests cover the allowed targets, rejected targets and green styling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb13d01bc">Archived tiles have no lower-left archive glyph</a>. Thanks to xet7.</summary>

The archive glyph inside the "Archived at" metadata inherited broad board-tile
hover styling, which moved it to the lower-left corner and made it look like a
per-board action. Both tile variants now keep the useful archived date as plain
text without that icon. Permanent deletion remains exclusively in the right
sidebar, with regression coverage for the absent glyph and retained date.

</details>

**All Boards** - its named sections and their shared multi-selection controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2547c5216">Every named section can select all or none of its visible boards</a>. Thanks to xet7.</summary>

Remaining, Starred, Home, Templates and Archive now show the same themed Select
All and Select None buttons above their board icons while Multi-Selection is on.
Select All reads the exact section/search result used to render those icons, so
it cannot silently include a hidden board; Select None clears the shared board
selection. Home deliberately keeps Multi-Selection too: Select All simply checks
its one visible Home board when present. Tests cover all five sections, both
entry points, both operations, placement and matching theme classes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7974c3e66">Existing Workspaces show Select All and Select None</a>. Thanks to xet7.</summary>

An existing Workspace now shows the same themed Select All and Select None
buttons as Remaining, Starred, Home, Templates and Archive whenever
Multi-Selection is active. Select All uses the exact Workspace/search result
currently rendered by `boardsForView`, so hidden boards are not selected;
Select None clears the shared selection. Positive tests cover visibility,
rendered-board scope and clearing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1934fb3f">The Multi-Selection sidebar stays visible while selection is on</a>. Thanks to xet7.</summary>

Close, toggle, Escape, Search and Home actions can no longer hide or replace
the pane that operates selected boards. Every sidebar state change resolves
back to the visible Multi-Selection view until the mode is turned off; its off
controls then unlock and close the pane in that order. Positive and negative
tests cover both sides of the transition.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/782200a0d">The sidebar X turns Multi-Selection off and closes it</a>. Thanks to xet7.</summary>

The right-sidebar X previously called the guarded close operation while
Multi-Selection was active, so the guard immediately kept the sidebar open.
The X now disables selection mode first and then closes the unlocked sidebar,
matching the explicit Multi-Selection Off action in one click. Other sidebar
views retain their ordinary close behavior, and regression coverage pins the
required operation order.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c704b65cc">Selection actions remain visible before a board is checked</a>. Thanks to xet7.</summary>

The instruction, every action applicable to the current section and the way to
turn Multi-Selection off are now always present in the right sidebar. An action
clicked with no checked boards reports "You did not select any boards" and
stops before opening a confirmation or calling the server. One shared guard and
regression tests cover star, Home, archive, duplicate and permanent delete.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddb0ab4a2">Set as Home board accepts exactly one selected board</a>. Thanks to xet7.</summary>

The action no longer silently chooses the first board from a larger selection.
Only one selected id reaches `toggleDefaultBoard`, matching the fact that login
can open only one Home board. Regression tests cover the accepted single-board
selection and both rejected selection counts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cb5ef5e0">An empty Home action asks for exactly one board</a>. Thanks to xet7.</summary>

Set and Unset as Home board now use the same "Please select only one board"
message for both invalid counts: zero and several selected boards. The other
bulk actions retain their separate empty-selection warning. The Home action
still stops before calling the server unless exactly one board is checked.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aebc7d9de">Home rejects a drag containing multiple boards</a>. Thanks to xet7.</summary>

Dropping several selected boards onto Home now reports "Please select only one
board" instead of silently making the first one Home. The rejected drop changes
nothing and keeps Multi-Selection intact so the user can narrow it. A one-board
drag continues to set Home normally, with regression coverage for both paths.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3edc723f2">Remaining boards can be dragged to Starred and Archive</a>. Thanks to xet7.</summary>

Dragging one or several boards from Remaining now highlights Starred and
Archive in green alongside its existing valid targets. A Starred drop adds only
missing stars, so every board stays in Remaining and an already-starred board is
not accidentally unstarred. An Archive drop keeps the existing confirmation
and moves the whole drag into Archive. Tests cover the source marker, target
hints, additive starring and confirmed archive path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9a0b3e9a">Workspace boards can be dragged to Starred and Archive</a>. Thanks to xet7.</summary>

Dragging one or several boards from an existing Workspace now highlights
Starred and Archive as green valid targets. A Starred drop adds only missing
stars, leaves every board assigned to its current Workspace and makes it appear
in Starred too. An Archive drop asks for confirmation and then archives every
dragged board, removing it from the Workspace. Regression tests cover the
source marker, both hints, additive stars, retained assignments, confirmation
and batch archive calls.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74c387356">The empty Home asks for only one dragged board</a>. Thanks to xet7.</summary>

The empty-state instruction now reads "Drag only one board here to open it
after login", making Home's one-board limit visible before a drag starts. The
existing translation key remains in place, and the Home regression suite pins
the exact English wording.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c6febe1d">The Home section offers Unset without Archive or Duplicate</a>. Thanks to xet7.</summary>

The Home section's Multi-Selection sidebar now calls its toggle "Unset as Home
board", matching what clicking its current Home board does. Move Board to
Archive and Duplicate Board are hidden in that section while remaining
available for the other live-board sections. A regression test pins both the
Home-specific label and the absent actions.

</details>

and fixes the following bugs:

**The Admin Panel** - server-wide safety and performance settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43d592590">The permanent-delete checkbox stays checked after saving</a>. Thanks to xet7.</summary>

The server accepted and stored `enablePermanentDelete`, but the settings
publication omitted the field. The next reactive render therefore read
`undefined` and immediately replaced the optimistic checkmark with an unchecked
box. The publication now returns the stored value, with a negative regression
test that ties the checkbox helper, update handler and published field together.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1522ad2a">The CPU governor observes FerretDB before slowing it</a>. Thanks to xet7.</summary>

A high host-CPU event used to apply the first FerretDB delay before its status
response could say which process was busy, and a maximum delay of zero still
applied that first delay. The first request is now status-only. A zero cap is a
clean monitoring-only setting, and an idle WeKan does not escalate delays while
FerretDB's own process CPU is above its threshold. The existing backoff,
recovery logging and labelled WeKan-operation mitigation remain in place.

</details>

**All Boards** - loading and filtering the overview.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b52a6313">The global publication sends board summaries without cards or lists</a>. Thanks to xet7.</summary>

The overview previously opened composite child cursors for every board, making
its first paint wait for lists and cards it does not render. It now publishes a
projected set of board documents only. Template-container boards have their own
projected subscription, active in Templates and cross-category search, so the
dashboard retains the appearance, access, ordering and sharing data it uses
without turning into a second board view.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd0369b89">Empty share lists no longer add non-selective visibility branches</a>. Thanks to xet7.</summary>

The shared board-visibility selector used to emit organization, team and domain
branches even when the caller had no ids for them. Those empty branches could
not match, but still complicated every dashboard query. They are now omitted;
non-empty branches retain the same-element `$elemMatch` and `isActive: true`
requirements, with negative coverage against revoked-share access.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65aec4501">Pagination runs in the database</a>. Thanks to xet7.</summary>

The page method no longer fetches every visible board, filters and sorts the
array in Node.js, and slices only at the end. Section, workspace and search
conditions are encoded before a database count and a title/id-sorted query with
`skip` and `limit`. Cross-category search subscribes to template summaries too,
so moving the work into the database does not hide template results.

</details>

**Archive actions** - permanently deleting boards and archiving selected cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a5832846">Permanent deletion checks its argument before asynchronous work</a>. Thanks to xet7.</summary>

The bulk-delete method looked up its caller before handing `boardIds` to
Meteor's `check()`. With `audit-argument-checks` enabled, that asynchronous
boundary made Meteor report “Did not check() all arguments” and reject the
operation even though validation appeared later in the method. Validation now
runs before the first `await`; malformed attempts still resolve their actor in
the failure path and are written to Recovery without masking the original
error. Positive ordering and audit-path tests cover the regression.

</details>

**Board views** - lazy loading of a board's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35825c540">FerretDB card windows use bounded snapshots</a>. Thanks to xet7.</summary>

The lazy window publication previously returned a limited live card cursor.
FerretDB's polling observer could repeatedly scan and diff that moving window,
including while a board was otherwise idle. On FerretDB the bounded card batch
is now fetched once and published as a snapshot; MongoDB keeps its live cursor,
and the other child publications remain reactive on both databases.

</details>

and improves translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34f8b000f">Recent board controls are translated into ten major languages</a>. Thanks to xet7.</summary>

Seven new All Boards and permanent-delete strings are translated directly into
Arabic, Chinese, Finnish, French, German, Italian, Japanese, Brazilian
Portuguese, Russian and Spanish. They cover the permanent-delete setting and
disabled hint, empty and one-board selection errors, unsetting Home, and Select
None. The guarded fill writes only English placeholders, so it preserved each
language's existing human translation of the Home-board drag instruction.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cab5c7a4">Recent board translations expand to 69 locales</a>. Thanks to xet7.</summary>

The same seven All Boards and permanent-delete strings now cover 69 locale
files. The expansion adds Czech, Danish, Dutch, Greek, Hebrew, Hindi,
Indonesian, Korean, Norwegian, Polish, Swedish, Turkish, Ukrainian and
Vietnamese, plus the appropriate Arabic, Chinese, European, Japanese,
Portuguese, Russian and other regional variants of the completed
languages. Existing non-English values remain untouched. A regression test
checks every string in every covered locale and distinguishes permanent deletion
from ordinary archiving.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.00 2026-08-17 WeKan ® release

**In short:** **RouteBleed**, found by GitHub CodeQL, removes an incompletely
escaped dynamic regular expression from board-export route coverage. **All
Boards on phones** uses one native page scroller in mobile and desktop UI modes,
so ordinary boards, invitation controls and table rows remain reachable with
the same vertical swipe; the shared layout extends that behavior to every page.
**Snap database recovery** can read retained MongoDB 4.x, 5.0,
6 and 7 data and merge it into the live FerretDB without opening SQLite twice.
**Helm containers** size the Node.js heap from their memory limit, and the
official chart supplies enough memory for startup plus native allocations.
**Minicard titles** save again from their inline editor, and **card dates** can
be reopened, changed or deleted again after they have been saved. **Full-suite repairs**
keep the shared date form registered before its events, preserve the one mobile
page scroller in mobile-view mode, and make the standalone E2E browser selection
architecture-safe. **Translations** reuse 3,838 unambiguous same-language
values, and the new reports are complete in Finnish. **Regression coverage**
now exercises inline minicard title editing in the browser and guards the
Finnish Office and API report vocabulary directly. **Requested By and Assigned
By** say Edit when their free-text value already exists and Add when it is empty.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code
scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed4b8cd64">RouteBleed: route coverage compares exact text instead of an incompletely escaped pattern</a>. Thanks to GitHub CodeQL code scanning and xet7.</summary>

[RouteBleed](https://wekan.fi/hall-of-fame/routebleed/) - code scanning alert
\#434, rule `js/incomplete-sanitization` (CWE-20, CWE-80 and CWE-116), in
`tests/boardExportScope.test.cjs`: an export path was interpolated into a
dynamic regular expression after escaping only forward slashes. Backslashes
and every actual regular-expression metacharacter remained active, so the test
could match a different route, fail to match the intended one or fail to
compile.

The code was test-only, read a hardcoded route table and is never shipped in a
WeKan bundle, so there was no runtime or user-input exposure. There is no
denied operation to attribute in Admin Panel → Problems. The fix removes the
pattern rather than adding another sanitizer: the test wants an exact route
literal and now checks that exact string with `includes()`.

Positive and negative cases cover backslashes and the full metacharacter set,
and a repository-wide guard rejects the reported slash-only escape shape in
tracked JavaScript. The same sweep removed a second partial dynamic pattern
from release-bundle coverage.

</details>

and fixes the following bugs:

**All Boards** - scrolling the overview on a phone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae2cfd8aa">One vertical swipe reaches every board and invitation control</a>. Thanks to mimZD and xet7.</summary>

The page had nested vertical overflow panes on `#content`, its wrapper, the left
menu, the icon grid and the table view. A swipe could be captured by the wrong
pane, and an invited-board tile's Accept and Decline controls made its grid row
taller than the percentage-height chain expected, leaving boards below it
unreachable.

`#content` is now the one native vertical scroller. The wrapper, both columns,
the board grid and the table page contribute their natural height to it, so a
gesture has one owner and invitation controls are not clipped. Regression tests
cover ordinary tiles, invitations, table view, viewport sizing and reject a
second nested vertical scroller.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b69b63fe">Desktop mode on a phone can scroll every page to its end</a>. Thanks to xet7.</summary>

The narrow-device rule made the body a viewport-sized, non-scrolling box, but
made `#content` non-scrollable too. Mobile UI mode happened to restore its
overflow through a more specific selector; explicitly selecting desktop UI
mode did not, so the bottom of All Boards and other pages was clipped behind the
browser controls.

The phone viewport and content-scroller contract now lives in the shared page
layout rather than the All Boards stylesheet. The top header stays separate
while `#content` scrolls in both UI modes on every route. All Boards continues
to use that one scroll owner for Starred, Remaining, Public, Archived,
Workspaces and every other left-menu section. Source and negative tests reject
a hidden content pane, and the phone browser test toggles to desktop mode before
checking that its final board remains visible.

</details>

**Snap database recovery** - comparing and merging the retained database copy.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cea2f796">Recovery uses the compatible MongoDB reader and the live FerretDB</a>. Thanks to waltermhl and xet7.</summary>

`database-compare` and `database-merge` tried only the current MongoDB 7
executable, although the migration carries MongoDB 5.0 and 4.2 readers for
older WiredTiger formats. A retained MongoDB 4.x or 5.0 database was therefore
reported as `unreadable`, and merge had no source from which to recover the
missing work.

Both recovery phases now use the same 7, 5.0 and 4.2 compatibility ladder as
migration, safely skipping readers absent on an architecture and naming the
startup log when all of them fail. Merge also reuses a running FerretDB target;
it no longer starts a second FerretDB against the already-open SQLite database.
Only temporary processes are stopped afterwards, so a live database borrowed
for the operation remains running.

</details>

**Helm containers** - the memory available while the server starts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/794771ed8">The Node.js heap fits its container and the official pod fits the heap</a>. Thanks to titver968 and xet7.</summary>

The official chart limited WeKan to 1 GiB while its own comments claimed the
Docker image supplied a 4 GiB heap setting. It did not: Node.js 24 derived a
roughly 640 MiB V8 ceiling from the cgroup, and the v10.96+ server bundle could
exhaust it while linking and creating startup indexes, before ordinary
application logging began.

The container now gives V8 three quarters of its cgroup memory, from 768 MiB up
to the documented 4 GiB ceiling, leaving one quarter for native allocations.
An administrator's explicit `NODE_OPTIONS` always wins. The
[official chart](https://github.com/wekan/charts/commit/a776e70) now requests
512 MiB and limits the WeKan pod to 2 GiB, providing a 1536 MiB heap plus 512
MiB of native headroom by default.

</details>

**Minicards** - editing a card directly on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9934ebde">Saving an inline title edit renames its minicard again</a>. Thanks to Heart1010 and xet7.</summary>

The title editor is a nested `inlinedForm`, whose submit event receives the
form arguments as `this`, not the Card document. Saving therefore called
`getTitle()` on `{ classNames: "js-minicard-title-form" }`, threw a `TypeError`
and restored the old title.

The handler now takes the Card from its enclosing minicard template instance,
compares and saves through that document, and never treats the nested event
context as a Card. Empty and unchanged titles remain no-ops.

</details>

**Opened cards** - editing dates that are already stored on a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd41970ed">Saved card dates can be changed and deleted again</a>. Thanks to Alishara and xet7.</summary>

The common date form became a child Blaze template, but its Save, Delete and
validation event map remained on each parent popup. Blaze does not dispatch a
child template's events to its parent's event map, so the form rendered its
existing value while every control inside it was inert.

The common form now owns its common event handlers and receives the parent
popup's state and field-specific callbacks explicitly. Received, start, due,
end, vote, planning-poker and custom-field dates retain one shared form, and a
browser regression test changes a previously stored due date.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14b04575b">Clicking any saved card date reopens its editor with the Card context</a>. Thanks to xet7.</summary>

The first date could be added because its plus button lives directly in the
opened card's data context. Once saved, however, the date became a shared badge
whose child-template data contains only display arguments. Clicking that badge
passed those arguments to the popup as though they were a Card, so calls such
as `getStart()` and `getReceived()` threw and no editor appeared.

Every received, start, due, end, vote and planning-poker date badge now opens
its popup explicitly with the surrounding date template's Card and stops the
click before the opened-card handler can create a second popup. Source-level
positive and negative tests cover all four ordinary card dates, and the browser
suite adds a saved start date, reopens it, changes it and verifies the new date.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf4c00459">Populated Requested By and Assigned By text fields say Edit instead of Add</a>. Thanks to xet7.</summary>

The free-text control previously said Add regardless of whether the field was
empty or already displayed a value. Both opened-card fields now use the existing
translated Edit label when text exists and retain Add only for an empty value;
their separate plus button continues to open the board-member selector.

The source guard checks both branches for both fields, including the empty-value
negative case. Browser coverage seeds populated Requested By text beside an
empty Assigned By field and verifies that the two controls render Edit and Add
respectively.

</details>

**The full test run** - client startup, mobile scrolling and portable test
execution.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2ba64c0f">The newest full-suite regressions are repaired and diagnosed at their source</a>. Thanks to xet7.</summary>

The shared date form registered its Blaze event map before its Jade template
existed, throwing on client startup and leaving Node E2E and every browser test
on a blank page. The forms feature now creates `editDateForm` before the
datepicker library attaches its events, with an import-order regression guard.

On phone-sized All Boards pages, the more-specific `.board-list.mobile-view`
rule overrode the new natural-height list and restored a nested vertical
scroller. The phone rule now covers both selectors, so `#content` remains the
one swipe owner in either view.

The standalone E2E runner now discovers current Playwright cache revisions and
rejects a Chromium binary for the wrong CPU architecture. Failed page renders
also report browser exceptions and failed requests instead of only an empty
body. The remaining completed failures were stale guards updated for the shared
export document, server-supplied download names, reorganized LDAP documentation,
the translation-memory helper and explicit bundle-smoke Node binary.

</details>

and adds the following developer-facing test coverage:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb9680f00">Upcoming minicard and Finnish translation changes have direct regression tests</a>. Thanks to xet7.</summary>

The browser suite now edits a minicard title from the board and verifies that
the card is renamed without opening its details. Its negative case submits only
whitespace and verifies that the original title remains visible.

A plain Node.js suite inventories every Office and API report translation in
Finnish, rejects missing, empty and unintended English placeholders, and keeps
the universal `API`, `REST API` and `WITH_API=true` terms recognizable. The
existing Upcoming tests continue to cover RouteBleed, phone scrolling, Snap
recovery, container heap limits, card dates and same-language translation
memory, including their negative cases.

</details>

and improves translations:

**Translation completeness** - filling only English placeholders, without an
external translation service.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f94d5cbda">Repeated source text reuses unambiguous translation memory from the same language</a>. Thanks to xet7.</summary>

WeKan has many keys with identical English text. When a language already has
exactly one non-English translation for that source, the same value can safely
fill its still-English copies without guessing or crossing a language boundary.
This filled 3,838 placeholders across 227 language files.

The reusable pass is dry-run by default, writes only when explicitly asked,
never replaces an existing target translation, and leaves a source untouched
when its translations disagree. Tests pin all four constraints; the
human-preference and wrong-script checks remain clean.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73c6bc059">The Office and API reports are translated into Finnish</a>. Thanks to xet7.</summary>

All fourteen translatable strings added by the two Admin Panel → Problems
reports now have Finnish labels, descriptions and empty-state messages.
Product names, protocol acronyms, numbers and symbols remain unchanged because
those values are already the same in Finnish.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.99 2026-08-17 WeKan ® release

**In short:** the **unified export dialog** can finally be changed, visibly
shows its selection with the Admin Panel's own checkbox, and passes that
selection to every export format. **PDF and Excel exports** now share one card
document, use the saved user language or browser fallback, keep the opened
card's date format, preserve multilingual text, and name downloads for the
localized board, swimlane, list or card exported. Their shared card layout now
includes locations, stickers, dependencies and sort position; PDF also embeds
JPEG and PNG attachment previews plus Unicode-plane fonts. **Admin Panel /
Problems** keeps avatars at avatar size, and **All Boards** keeps its Add Board
and Home placeholder tiles as tall as the boards beside them. **Requested By
and Assigned By** can select board members while retaining their free-text
fields. Below that: fourteen export fixes, one export-layout consolidation, one
people-picker fix, two shared-checkbox fixes, two UI sizing fixes, restored
subtask creation, and the documentation move into its feature and platform
hierarchy with every local link checked.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release adds the following new feature:

**Opened cards** - the people responsible for requesting and assigning work.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb5275e97">Requested By and Assigned By can select board members</a>. Thanks to xet7.</summary>

Their round `+` now opens a searchable board-member picker like Members and
Assignee. Selected people appear as avatars, while the `Add` link stays below
the `+` and continues to open the existing free-text editor. The two forms are
independent, so a card can retain an external name or note beside its selected
members.

Cards store selected people in `requesters` and `assigners` user-ID arrays,
with assign, unassign and toggle operations matching assignees. WeKan JSON and
scoped imports preserve them, whole-board imports remap their user IDs, and
user removal cleans them up. PDF, detailed and table Excel, and CSV resolve the
selected people beside the original text fields. The implementation completes
the existing Requested By / Assigned By design document.

</details>

and fixes the following bugs:

**Opened cards** - the people responsible for requesting and assigning work.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c183b5bf8">The new people pickers have titles and stay below their buttons</a>. Thanks to xet7.</summary>

Requested By and Assigned By opened headerless popups because their generated
title keys did not exist. They now reuse the fields' existing translated names,
so every language gets a title without adding a second English placeholder to
all translation files.

The general popup geometry also chose whichever side of an opener had more
space. That made Assigned By jump above the card while Members and Assignee
happened to open below. All four card-people pickers now anchor directly below
their `+` button, use the remaining space there, and retain the same member-list
body and styling.

</details>

**Subtasks** - creating their hidden helper-board records.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3ca168e2">A new subtask is created even before its helper-board cache refreshes</a>. Thanks to xet7.</summary>

Creating the first subtask also creates its hidden helper board and default
swimlane. The server immediately looked for that swimlane through a reactive
cache which could still hold the earlier empty result, so it returned without
inserting the subtask and the form appeared to do nothing.

The async server lookup now reads the authoritative collection, and its
default-swimlane self-heal falls back to that collection after inserting. The
form retains the entered title and reports the actual error when creation
really fails instead of silently clearing it.

</details>

**Exporting** - choosing what goes in the file.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec9f9e76d">Board Excel exports now use the detailed card layout they request</a>. Thanks to xet7.</summary>

The export popup sent the `card-details` layout choice, but the server's shared
field allowlist omitted that key and silently removed it. Every board, swimlane
and list Excel request therefore selected the old one-row-per-card streaming
table even though Card details was checked.

The layout key now survives validation, so the detailed exporter draws each
card with the same renderer as Export card to Excel. Attachment metadata and
embedded image galleries are included along with the other selected card
fields, while the existing Board → Swimlane → List → Card order remains. The
streaming table is still available by deliberately unticking Card details for
very large boards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b0f2075e">Every PDF and detailed Excel scope carries the complete card fields</a>. Thanks to xet7.</summary>

The shared card layout omitted locations, stickers, dependencies and numeric
sort position. Locations now include place name, address, latitude and
longitude for every current location entry, and retain the legacy single-
location fields used by older and Trello-imported cards. The other missing
fields have their own selectable sections or metadata row.

Because card, list, swimlane and board exports all draw this one document, the
fix applies to both PDF and detailed Excel at every scope. The hierarchy is
pinned as Board → Swimlane → List → Card, Swimlane → List → Card, and List →
Card, without repeating an ancestor above a smaller export. The Excel and PDF
format documentation now lists the complete shared card data.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57c806705">Detailed PDF and Excel exports follow the board hierarchy</a>. Thanks to xet7.</summary>

A board export now reads in the same order as the board: board name, members,
creation and modification times, then each swimlane, each list within it, and
each card within that list. Even the only visible swimlane is named instead of
being silently flattened away.

Smaller exports start at the level selected rather than repeating unrelated
ancestors. A swimlane export begins with its swimlane and continues through its
lists and cards; a list export begins with that list and its cards; a card
export remains the card. PDF and detailed Excel use the same ordering, and the
format documentation records it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b27f4fc4">PDF and Excel downloads are named for the object exported</a>. Thanks to xet7.</summary>

A swimlane export no longer arrives with the board title in PDF or Excel's
generic default filename. Download names now use the localized object type and
its number: for example, the first English swimlane is `Swimlane-1.pdf` or
`Swimlane-1.xlsx`. Lists and cards follow the same convention, while a whole
board pairs the localized board label with its title.

The saved profile language wins; when it is absent, the browser language sent
with the export request supplies the label. The response includes the UTF-8
content-disposition filename, so scripts outside ASCII remain intact, and the
browser no longer overrides it with a title-derived `download` attribute. The
low-memory Excel table exporter also keeps list and swimlane scope while naming
its result.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea8bd12a9">The export popup's checkboxes can be changed, and they say what they are</a>. Thanks to Heart1010 and xet7.</summary>

Reported as [#6586](https://github.com/wekan/wekan/issues/6586): *"with v10.98
we have that unified export dialog 👍 But I can't select/deselect those arrows
here"*, and confirmed as *"clicking a checked option, like labels, does not
uncheck it"*. Two faults, and either one alone makes the list useless.

**It could not be changed**, and the first fix was not enough. The handlers were
a template event map, and a click on a row did nothing; moving them onto
`exportScopeSelect` — the template that actually draws the rows — did not help
either, and that was built and shipped in both bundles before the answer came
back that the list still could not be changed. What the built bundle shows is
that the templates are registered, their helpers run and both event maps are
attached; the click simply never arrives. This list is drawn inside FIVE popups,
each rendered into its own Blaze view tree, so [the toggle is now bound where
nothing in that chain can drop it](https://github.com/wekan/wekan/commit/6053d3227): **one native listener on the
document, in the capture phase** — capture so a `stopPropagation()` between the
row and the document cannot eat it, native so an absent `window.jQuery` cannot
fail silently, and exactly one so it cannot toggle twice and cancel out.

**And no row said whether it was ticked.** Each drew an unconditional
`i.fa.fa-check` on a `li.active`, which is the OTHER convention in `popup.css`:
that tick is hidden and shown only for an active row by a selector needing a
nested list carrying `checkable`, and this list was neither. So the tick was
never hidden and `active` was never styled — every row looked ticked whatever it
was. Each row now carries `.materialCheckBox`, the checkbox Admin Panel /
Settings / Announcement uses, which needs no ancestor to be right, and the box
aligns with the first line of a label that wraps.

**What is ticked is what the file contains** — checked rather than assumed.
Every format builds its URL through one function that appends the selection, and
every route parses it: the JSON, .zip and Kanboard exports, Excel, PDF, the CSV
(where the selection lands on columns), and the ten external-tool exports, which
share one handler. A test reads the format table, so a format added later is
covered without editing it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58bf9774a">A card sent to PDF came back as an HTML file</a>. Thanks to Heart1010 and xet7.</summary>

Not a broken PDF — WeKan's own page, saved as `<card>.pdf`. Every export in the
interface is a download from an `/api/…` address, and the server refuses every
`/api` request unless `WITH_API` is exactly `true`. It refused by answering
**`301 Location: /`**, so the browser followed it to the front page and the
download link's `download="<card>.pdf"` wrote the HTML it got there to that
name. Reproduced against a running instance: `GET /api/boards/x/exportPDF`
answered 301.

Two faults, either one enough on its own. **The bundle launchers did not set
`WITH_API`** — the snap has defaulted it to true for years and every
`docker-compose*.yml` here sets it, so the bundle was the one platform where
exporting was off by default, and therefore the one platform where an export
came back as HTML. Both launchers now default it to true, overridable, and say
why: the name reads like a developer feature, and somebody switching it off to
harden an instance should know they are turning off every export in the
interface.

**And the refusal was a redirect.** Whatever the setting, "the API is off" must
not arrive as a page. It is now a **403 in plain text**, saying that exports use
the API too and naming the variable to set — an answer that cannot be mistaken
for the file that was asked for.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74888f1ed">PDF exports carry their JPEG and PNG attachment previews</a>. Thanks to xet7.</summary>

PDF listed image attachments by name while Excel embedded their previews. Card
and detailed board PDFs now read JPEG and PNG attachments from the configured
file store and put real image XObjects into the document. JPEG keeps its
original DCT-compressed bytes; PNG scanlines are decoded, their filters removed
and their transparency composited onto white before the RGB pixels are deflated
into the PDF. Images keep their aspect ratio and are only scaled down.

A missing object, unsupported format or corrupt image is still listed by name
and cannot fail the rest of the export. Tests inspect both filters and the page's
XObject references, exercise transparent PNG pixels, and pin that failure-safe
path. The format design and current progress moved from TODO Later to reciprocal
[Excel](docs/Features/ImportExport/Excel/Excel.md) and
[PDF](docs/Features/ImportExport/PDF/PDF.md) documentation pages. The shared
Excel renderer described there is completed by the multilingual export entry
below.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c796fc6c6">PDF and Excel exports preserve every language and share one card layout</a>. Thanks to xet7.</summary>

PDF exports now subset and embed the OFL-licensed GNU Unifont BMP and
supplementary-plane fonts. Finnish, Greek, Cyrillic, Hebrew, Arabic, Indic and
CJK text, plus supplementary characters such as emoji, therefore remain
visible, searchable and portable without fonts installed on the reader's
device. The former WinAnsi writer remains as a failure-safe fallback.

Printable Excel cards now render every block from the same medium-independent
card document as PDF while retaining their six-column metadata, colored labels,
checklist progress, attachment table and image placement. Excel cells already
store real Unicode text; `.xlsx` cannot portably embed an OpenType font, so the
spreadsheet application chooses an installed font or fallback rather than
turning editable cells into pictures.

Both formats now resolve locale in one explicit order: a logged-in user's saved
language first, the current browser language when none is saved, then English.
Public card Excel no longer hard-codes English. Their export links continue to
carry the date format displayed by the opened card and the browser's timezone,
and the routes validate that format before rendering it.

Tests parse and subset both shipped font files with multilingual text, pin the
locale precedence and opened-card date-format handoff, and exercise the shared
Excel renderer with ordinary metadata and enough colored labels to wrap onto a
second row. The reciprocal [Excel](docs/Features/ImportExport/Excel/Excel.md)
and [PDF](docs/Features/ImportExport/PDF/PDF.md) pages record the implementation
and the `.xlsx` portability boundary.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b47e10ee">Loading the export routes no longer stops a production bundle at startup</a>. Thanks to xet7.</summary>

The production bundle resolved `markdown-it` as an ES-module namespace, while
bare Node resolved the same package as its constructor. The shared PDF and
Excel Markdown parser constructed the value directly, so unit tests passed but
the bundled server stopped during module initialization with `is not a
constructor`, restarted, and repeated the same failure.

The parser now normalizes both module shapes before constructing MarkdownIt. A
regression test supplies the CommonJS and Meteor production-bundle shapes and
requires both to resolve to the same constructor.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ff542b9b">PDF dates remain complete, and attachment previews share rows</a>. Thanks to xet7.</summary>

Three metadata cells fit across the printable PDF width, but long translated
labels and full date/time values were shortened with an ellipsis. Each cell now
grows onto additional lines, keeping the complete value visible.

Attachment previews formerly occupied one full-width row each and carried a
synthetic `[image: filename]` line. Up to three previews now share a row, with
the real filename and human-readable file size above each image and no `image:`
prefix. The row is one pagination unit: when its caption and previews do not
fit, all of them move together to the next page.

Tests pin the complete translated dates, three-column captions, absence of the
old prefix, multiple images in one row, image XObjects and atomic page break.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4deff691e">The production bundle uses its embedded Unicode PDF font</a>. Thanks to xet7.</summary>

PDFKit initialized its built-in Helvetica before WeKan selected the bundled
Unicode fonts. That reads `data/Helvetica.afm` relative to PDFKit's own module,
but Meteor's production bundle rewrote the lookup to
`/_build/main-prod/data/Helvetica.afm`, where no such application asset exists.
Every Unicode export therefore logged the missing file and fell back to the
WinAnsi writer.

PDFKit now starts with the already-loaded GNU Unifont buffer as its default
font, so initialization performs no Helvetica AFM filesystem lookup. A
regression PDF begins from that buffer, embeds its Unicode map and contains no
Helvetica reference; the normal named BMP and supplementary-plane fonts remain
available for all subsequent text runs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7eb0d5ac5">An image attachment is named once in PDF and Excel exports</a>. Thanks to xet7.</summary>

An attachment image with a displayed preview was named in the bullet list and
again in the caption above its image. Successfully loaded previews are now
removed from that list and keep their filename and human-readable size in the
caption.

The decision follows the preview that was actually loaded, not only the file's
declared type. Non-image files and images whose stored object is missing,
unreadable or corrupt therefore remain listed with filename and size instead of
disappearing from the export. A regression card contains one previewed image
and one ordinary file and pins that each is named in exactly its proper place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb52149e9">PDF and Excel cards share their visual attachment layout</a>. Thanks to xet7.</summary>

Excel stacked every preview vertically despite having six worksheet columns.
It now uses three two-column preview cells per row and starts the fourth image
on the next row. PDF uses the same three-column arrangement. In both formats,
only the filename appears below each image.

The attachment details above those previews include EVERY file, images
included, in the same six fields: row number, filename, human-readable size,
media type, upload date/time and uploader. PDF now resolves attachment uploaders
alongside card members and comment authors, and the Excel headings use their
real translated attachment keys instead of displaying `uploaded-at` and
`uploaded-by` when those generic keys do not exist.

PDF also consumes the presentation data the shared card document already gives
Excel: labels use their actual background and contrasting text colors, metadata
keeps the same positions, and checklist completion is a six-part blue progress
bar with its completed/total count. Tests exercise a real ExcelJS worksheet
with four images and pin the corresponding PDF label, progress, detail-table,
preview-caption and pagination objects.

This intentionally follows the preceding duplicate-name fix with the complete
details requested here: an image is present in the all-attachments details
table, while its filename-only preview caption identifies the image below.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef66347f0">Six attachment previews fit across an Excel row</a>. Thanks to xet7.</summary>

The first shared attachment layout put three Excel previews in two-column
cells, but the worksheet has six usable columns and the screenshots showed the
images still consuming far more vertical space than necessary. Each preview
now occupies one column: images one through six share an image row, their
filenames sit in cells A through F directly below, and image seven begins the
next image row followed by its filename row.

An actual ExcelJS worksheet test places seven PNGs, checks that the first six
have the same row coordinate, the seventh has the next image-row coordinate,
and verifies the filename cells below both rows. PDF keeps three previews on an
A4 row because six would make them too small to read; the shared details,
colors, field positions and progress styling remain the same.

</details>

**Checkboxes** - the one square WeKan draws everywhere.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58bf9774a">A checkbox keeps its shape, wherever it is put and whatever is beside it</a>. Thanks to xet7.</summary>

In the export popup an unchecked box drew a thin vertical sliver beside a long
label and a proper square beside a short one: the row is a flex container, the
box is a flex item, and a flex item shrinks.

That is the **third** time this shape has broken — `settingBody.css` already
carries a fix for a 41px min-height that *"turns a 13px box into a tall
rectangle"*, and another for a `height: 100%` that stretched it — so the fix
goes in the rule that DEFINES the checkbox: `flex: none`, for all 90 of them
across 19 templates, rather than one more local patch. The local patch went with
it: it had set `box-sizing: border-box`, which would have made that one popup's
boxes 13px including their border while every other checkbox in WeKan is 13px
plus 2px.

The rest was audited rather than assumed: every rule in the client that sizes a
checkbox gives it equal width and height, including the two "clean" board themes
that deliberately draw theirs at 24px and 18px. A test now pins that for every
rule, so the fourth one fails a suite instead of a screenshot.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5723b5692">The custom-field picker uses WeKan's shared animated checkbox</a>. Thanks to xet7.</summary>

The checkbox beside each custom-field name was two Font Awesome square icons,
switched according to state. It looked like the browser's tiny native checkbox
and had none of the behavior used by Admin Panel / Settings / Announcement.

The picker now uses the same `.materialCheckBox` element and `is-checked` state
as those settings: a 13px grey square whose shared 0.2-second CSS transition
morphs it into the rotated green tick. No local copy of its dimensions, colors
or animation was added, so future changes to the common checkbox reach this
picker too. Tests pin the shared markup and its transition, rotation and green
checked-state borders, and reject the old icon imitation.

</details>

**Admin Panel / Problems** - how a person is shown.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/580b03e17">A user's avatar is avatar-sized, in every pane that names one</a>. Thanks to xet7.</summary>

Offices and the Impersonation Report drew a user's photograph at its NATURAL
size — a 300px portrait in a table row, a screen tall, with the login counts
scattered around it — and it was every pane that names a user, because they all
draw one the same way.

Every avatar rule in `userAvatar.css` is scoped to `.member`, which is what
makes an avatar 24px and round and crops the image to fill it. The shared table
page's cells had no such box: the image and the initials had been copied, and
the thing they belong in had not. The cells use `.member` now rather than a
fourth private copy of "how big is an avatar" — there were already three, which
is how the three came to disagree — with the two board-specific declarations it
carries turned off for a table.

</details>

**All Boards** - the size of a tile.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/580b03e17">Two tiles that were shorter than the boards beside them</a>. Thanks to xet7.</summary>

On **Starred**, the grey "+ Add Board" tile hung short. `min-height: 114px` is a
FLOOR, and a board whose title wraps to three lines grows past it; the grid
stretches every other tile in that row to match, but the grey comes from the
label INSIDE the list item rather than from the item itself, so it kept its
114px while its row grew. The item is a flex box now and the label grows into
it.

On **Home**, "Drag a board here to open it after login" was padding around a
line of text, about 85px, on a page whose entire content is that box. It stands
where a board tile will be, so it is a board tile's height.

**Templates and the workspaces were checked and were already right.** Every view
— Starred, Remaining, Home, Templates, Archive and each workspace — is the same
list with a different set of boards in it, so they share one rule, and every
tile variant computes to the same 114px border-box floor. A test pins that there
is one list and that no variant sets a height of its own, so that question keeps
having one answer instead of six.

</details>

and has the following developer-tooling improvement:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0885b9a10">Every PDF and Excel scope maps cards through one shared adapter</a>. Thanks to xet7.</summary>

Board, swimlane, list and card hamburger menus already use one export popup,
selection and URL builder, and the detailed board exporters reuse their card
renderers. One duplicate layer remained: PDF and Excel separately converted
database records into the shared card document, including separate people,
date, checklist, comment, attachment and file-size mappings.

Both formats now call one pure adapter for every card at every scope. Scope only
selects the surrounding Board → Swimlane → List → Card hierarchy; PDF-specific
code draws pages and Excel-specific code draws worksheet cells. The Excel and
PDF feature documents describe this design and its format-specific boundary.

</details>

and reorganizes the following documentation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4cb87345">Documentation follows its feature and platform hierarchy, and its links resolve</a>. Thanks to xet7.</summary>

Feature documentation that had grown into separate top-level Date, DragDrop,
Email, ImportExport, Login, Theme, Translations and Webhooks trees now lives
under `docs/Features`; webserver documentation lives under `docs/Platforms`.
The move also puts related pages and images beside their subject instead of in
the broad Features directory.

All references were recalculated from their source page's old and new location,
including links from pages that moved themselves. The documentation link test
now walks every Markdown page recursively instead of checking only the flat
DeveloperDocs directory, so a future move cannot silently leave links or images
pointing at paths that no longer exist.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.98 2026-08-16 WeKan ® release

**In short:** one **CRITICAL** fix, and the whole of **logging in** reworked
around it. WeKan's brute-force lockout counted an attacker's failed logins
against the **victim's account** rather than against the address they came from,
so anyone who knew a username could lock its owner out from every address,
repeatably — and a **correct password was refused** while the lock held, and
counted as another failure. Usernames are public, so any account was a target
and an administrator was as easy to lock out as anyone else. Reported by daniais
as **JamBleed**. Two GitHub CodeQL alerts on one line of release tooling go with
it. Around that fix: **increasing delays** after a wrong password, per source
address rather than per account; a record of **who logs in from where**, both
directions, which is what the new **Problems / Offices** pane groups into the
offices an admin recognises — "London", with the flag, rather than
`100.100.100.100`; and the reason it exists, which is that blocking an ADDRESS
would take a whole office off WeKan at once, so WeKan blocks the account.
**Admin Panel / Problems** now keeps ONE summary row per problem — a count, a
window, and who tried it how often — instead of a document per event that grew
with the attack it was recording, and gains an **API** pane answering the
opposite question: not what went wrong, but who called which REST endpoint and
how often. Then: v10.97 shipped a bundle that could not
start, the third release in a row stopped by the same habit. Trimming what a
bundle carries is measured by a graph of what the server can reach, and that
graph read `require()` only. Meteor compiles an ESM import to `module.link()`,
so **every ESM import in every Meteor package was invisible to it**: it called
live code dead, and the bundle shipped without `nodemailer-openpgp`, which
`packages/email.js` links on its first tick. The reachable count goes from 211
to 450 with the fix — the measurement was wrong rather than merely optimistic —
and the category it justified is withdrawn: **61.3 MiB becomes 40.0 MiB**. What
changes beyond that one fault is the check: a release now has to **start the
bundle it built** and see it reach its database before it may carry it.
That fix had a cost nobody saw for a day: its package loaded on the CLIENT
too, so `require('crypto')` reached the browser bundle and **every page died
on load** with `Cannot find module 'stream'` — fixed here, and the whole class
is now guarded. **CHANGELOG.md** is 2.5 MB lighter of history, keeping the
current MONTH while older months and years move to `old-CHANGELOG/`. And
**Build WeKan release bundle** is a menu entry now, building what a release
would publish rather than
a plain `meteor build` — so "does it start at all" no longer takes a release to
answer. Below that: the Sandstorm pack that was throwing its own trim away,
Admin Panel / People showing who is locked again, a location in an admin table
opening a map through the card's own chooser, the Problems route and template
finally called what the menu calls them, and the documentation refiled to match
the menu — including `Directory-Structure.md`, which had been describing the
tree as it was in 2017.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following CRITICAL SECURITY ISSUE of [JamBleed](https://wekan.fi/hall-of-fame/jambleed/):

**Logging in** - who the brute-force lockout is protecting, and from whom.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78478c39d">JamBleed: the account lockout counted an attacker's failures against the victim</a>. Thanks to daniais and xet7.</summary>

`wekan-accounts-lockout` kept ONE counter per user —
`services.accounts-lockout.failedAttempts` — with no notion of where the
attempts came from. Any unauthenticated attacker who knew a username could spend
three wrong passwords and lock that account out **from every address**,
repeatably, for as long as they cared to keep going. Usernames are public in
normal WeKan use — board and card members are listed — so choosing a target was
trivial, and an administrator was as easy to lock out as anyone else. Reproduced
on v10.91:

```
  attacker, address A : Incorrect / Incorrect / Too many attempts
  victim,   address B : (correct password) Too many attempts
```

Affected from **v10.59**, and not before, for a reason worth keeping in view.
The flat counter is much older, but until the LockoutBleed fix
([GHSA-2g94-9x3m-hv37](https://github.com/wekan/wekan/security/advisories/GHSA-2g94-9x3m-hv37))
the hooks gated on English error strings that Meteor's `ambiguousErrorMessages`
had already rewritten, so the counter never moved and no account ever locked.
Making the lockout WORK is what made this reachable — a fix that turns on a
mechanism inherits whatever that mechanism gets wrong.

**Two faults, and the second is the one that hurts:**

- the counter was global, so an attacker's failures were charged to the victim's
  account rather than to the attacker's address;
- a **correct password was refused** while the lock held, and counted as a
further failure on the way. The old code allowed an attempt only when there was
  no error AND no lock, so the owner typing the right password fell through to
  the same throw as the attacker.

Both are fixed in the decision itself, now a pure module. The counter is per
(user, source address): the address comes from `X-Forwarded-For` under
`HTTP_FORWARDED_COUNT`, the same rule `server/lib/loginAttemptThrottle.js` uses
so a lockout and a throttle cannot disagree about who somebody is, and only the
position `hops` from the right is read, so a forged header cannot pick its own
bucket. The key is a SHA-256 prefix — an IPv4 address is all dots and cannot be
a Mongo field name, and a locked account should not carry a list of the
addresses that attacked it.

A correct password is allowed FIRST, before anything reads the lock, and clears
the state behind it — including the pre-fix flat fields, so an account left
locked by the old counter is freed by its owner's next correct login rather than
by a wait with no visible end. Hammering during a lock no longer extends it
either, or the denial of service returns inside the mechanism meant to stop it.

The three methods that wrote the flat counter are removed rather than left
unreachable. A lockout firing is now recorded and shows in **Admin Panel →
Problems** — on the lock only, not on every refused attempt during one, or an
attacker could fill that page by holding down a key.
`tests/lockoutPerSourceAddress.test.cjs` is 19 tests, driving the decision as
arithmetic rather than through a server: the reported attack, the correct
password during a lock, that the lock still fires and still expires, the
forwarded-header rules, that malformed state reads as *nothing yet* rather than
throwing — a lockout that threw on an unexpected document would lock everybody
out of a database that had one — and that **every** construction of
`AccountsLockout` passes the reporter, since there are two and a reload that
dropped it would stop recording attempts while the guard kept working.

</details>

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78478c39d">The release version is no longer built into a regular expression</a>. Thanks to xet7.</summary>

Two alerts on one line of `releases/changelog-open-next.mjs`, and both were
right:

- **#433, `js/incomplete-sanitization`** — `version.replace(/\./g, '\\.')`
  escapes dots and not backslashes, which is the classic half-escape: a version
  containing a backslash would have escaped the backslash and left the next
  character bare.
- **#432, `js/regex-injection`** — the version is an argv value, so it reached
  `new RegExp` as a pattern.

Neither is exploitable with a version `release-all.sh` computed from the
CHANGELOG, and the script is release tooling rather than anything a user
reaches. But the fix worth making is the one that removes the question instead
of answering it, which is CodeQL's own first recommendation: design so that
sanitization is not needed. The heading is found with `startsWith` on the exact
text now, so there is no pattern to escape and nothing to inject into, and a
guard fails if a `RegExp` is built there again.

Shipped in the same commit as the JamBleed fix above.

</details>

and adds the following new features:

**Logging in** - what happens between a wrong password and the next attempt.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9476cdc0f">Increasing delays after a wrong password, per source address</a>. Thanks to xet7.</summary>

Checked before any of it was written, because a second mechanism beside an
existing one is worse than no mechanism: the DDP login already has
`wekan-accounts-lockout`, the REST login has
`server/lib/loginAttemptThrottle.js` per address, and
`server/lib/loginTimingDefense.js` equalises timing so a missing user cannot be
told from a wrong password. Nothing anywhere did increasing delays. So this
extends the lockout decision rather than adding a rival to it.

The lockout on its own is a STEP FUNCTION: two failures cost nothing, the third
costs sixty seconds. A guesser spends the free attempts of every window and
waits, and somebody who mistyped their password gets no sign they are one
attempt from being locked out. A delay that GROWS - 1s, 2s, 4s, 8s, capped -
costs a guesser far more than it costs a person, and it degrades instead of
slamming shut: the account is never unavailable, only slower to try again.

It is per (user, source address), like the counter it sits beside and for the
same reason - an attacker must not be able to slow down the account's owner -
and a **correct password is still allowed immediately**, delay or no delay.
Somebody who did not have to guess has proved they are not who this is for. An
attempt refused as too early is not counted, either: letting it count would let
an attacker lock an address out FASTER by trying faster.

</details>

**Admin Panel / Problems** - what the page records, and what it shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d08c65bb">One summary row per problem, with who tried it and how often</a>. Thanks to xet7.</summary>

A guard on a path an attacker controls fires as fast as they can send. One
document per event meant the database grew WITH the attack, the Problems page
became a scroll of near-identical lines, and the one event that mattered was
buried under ten thousand that did not. The admin's question is never "list
every attempt" - it is what is happening, how much, since when, and who.

So each problem is ONE row that accumulates: a `count`, the `firstAt … at`
window it covers, and the actors, each with a count of their own — `username1
25, 100.100.100.100 30`. The actor list is capped with an overflow count, so an
attacker rotating addresses cannot turn the summary back into the log it
replaced.

Existing per-event rows are folded into their summary on read, so an instance
upgrading does not lose what it recorded, and does not keep paying for it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8d1863db">Who logs in from where, with each account as its initials or avatar</a>. Thanks to xet7.</summary>

Checked first, and reused rather than rewritten: the REST throttle and the
lockout each already resolve a client address, `models/users.js` has
`getInitials()` and `profile.avatarUrl`, the board sidebar and cards show
members through `+userAvatar` / `+userAvatarInitials`, `cardDetails.js` builds
"open in map" links for a dozen providers, and the Admin Panel tables already
had an edit-user handler and a `userId` column. Only reading a location from CDN
headers is new.

One successful login writes a tally in BOTH directions - which addresses this
account uses, and which accounts use this address - because the second is what
says an address is an office, a VPN or a carrier's NAT rather than one person.
Both are capped with an overflow count.

The location comes from a header something in front of WeKan already set
(Cloudflare, Fastly, CloudFront, Vercel, Google Cloud, or a hand-configured
proxy). WeKan geolocates nothing itself: no database to ship, no lookup of a
user's address against a third party. And because anything a client can send it
can forge, a location is **display only** - a name beside an address and a map
link, never a decision. Nothing blocks, allows or rate-limits on the strength of
one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/961ff6cb4">Problems / Offices groups those logins into the places they come from</a>. Thanks to xet7.</summary>

A pane at `/admin/problems/office`, through the shared table page every other
report here uses ([Table.md](docs/Features/Page/Table.md)) - same layout, same
search, same paginator - so it needed no design of its own.

The columns are what an admin actually asks. **Location**: the country flag and
the city, "London" rather than `100.100.100.100`, so somebody recognises their
own offices at a glance and the flag says WHICH London; empty when nothing
resolved it. **Address**: the IPv4 or IPv6 it really is. **People**: each
account as its initials, or its avatar where it has one, with its own login
count beside it - the same way the board sidebar shows members, and clicking one
opens the same edit-user popup as everywhere else. **Logins** and the window
they fall in.

WHY IT EXISTS AT ALL: an address that many accounts log in from is an office,
and anything that reacted to a security event by blocking the ADDRESS would take
all of them off WeKan at once - the admin would see "one address blocked" rather
than "eighty people locked out". WeKan blocks the ACCOUNT that caused the event.
This pane is what lets an admin see the shape of their own users, and what would
make an address-level action visibly reckless if one were ever proposed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dc2651b4">Problems / API: who called which endpoint, and how often</a>. Thanks to xet7.</summary>

Every other pane under Problems answers what went WRONG. This one answers what
is being DONE: `POST /api/boards` called 34 times by alice last month, 812 times
yesterday by nobody with an account. Without it the only record of REST API use
is whatever the reverse proxy happens to keep, and most instances keep none. The
table is username, endpoint, calls, the window they fall in and the addresses,
sorted by calls - a usage report's question is *what is used most*, where a
problem report's is *what happened last*.

**The name is the route pattern, not the path.** `/api/boards/:boardId/lists` is
one endpoint; `/api/boards/abc123/lists` and ten thousand of its siblings are
that one endpoint being used. Naming rows after paths would put a row per board
in the collection - the one-row-per-event cost this page exists to remove - and
a request that matched NO route is counted under a single `(no route)` name
rather than under the path it invented, because a 404 sweep is an attacker
walking a wordlist and a row per guess would let them fill the database.

**One row per account and endpoint**, which makes the account part of a row's
identity - the one deliberate exception to the rule every other stream follows.
There the question is "what is happening" and the caller would multiply the
rows; here "who called what" IS the report, and the cardinality is bounded by
real accounts times real endpoints. The account is stored by ID, so a rename
does not split its history in two.

**Nothing per request.** Ordinary API traffic is not rare the way a guard firing
is rare, so calls are counted in memory and folded on a timer - a thousand
requests become one write. Counting hooks the middleware chain rather than the
routes, so a route cannot be added without being counted. The pane is the shared
event-stream report with a different column list, not a second table page, and
the api stream is deliberately not one of the "problem" streams: an instance
serving its API would otherwise report thousands of new problems.

Also fixed while there: the summary rows have had `ipv4` and `ipv6` fields since
the summaries were written, and **not one of the four loggers ever filled
them**, so the two columns the design asked for could not have
worked. The fold splits
the address now, once, for every stream, and both reports use one shared pair of
columns that falls back to classifying the stored `ip` - so rows written before
today display correctly instead of showing two empty columns for all of history.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebe985d45">A location in an Admin Panel table opens a map, through the card's own chooser</a>. Thanks to xet7.</summary>

Offices names the places accounts log in from - "London", with the country's
flag - and a name is only useful if it leads somewhere. Clicking one now asks
which map to open it at, from the same eleven providers a card's location
offers.

**The same chooser, not a second one.** The provider list was eleven options
inside `cardDetails.jade`; it is one template both callers include now, with its
helper and its styles, because two lists would be eleven places to add a
provider to instead of one and they would disagree the first time only one was
edited. What the two do NOT share is the rest: a card's popup EDITS a location,
and an office's arrived in a CDN header - WeKan did not ask for it and cannot
correct it.

A cell is a link only when the row HAS coordinates: a city name is not a
position, and a map URL built from one would either search for the word or
invent a place. The link follows the selection before it is saved, because
choosing a provider and finding the link still pointing at the old one reads as
broken.

The handler lives on the shared table page rather than on the report - which is
also where "clicking a user opens the Edit user popup" went, from the three
identical copies each report had written for itself.

</details>

and fixes the following bugs:

**Logging in** - and what the lockout was costing everybody else.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ce9f181c">The lockout package is server-only: it was breaking every page in the browser</a>. Thanks to xet7.</summary>

The JamBleed fix above hashes the source address of a login attempt with
`require('crypto')`, and its package declared
`api.mainModule('accounts-lockout.js')` with **no architecture** — which loads
it into the CLIENT as well as the server.
So the browser bundle pulled in crypto-browserify, which pulls in cipher-base,
which does `require('stream')`, and the page died on load:

```
  Uncaught Error: Cannot find module 'stream'
```

before WeKan drew anything at all. The server started perfectly and answered
HTTP 200 with a page that could not run.

It is server-only now, which it always should have been: nothing in `client/`
imports it, and shipping a brute-force lockout's decision to the browser would
hand an attacker the rules even if it cost nothing. A rebuilt client bundle is
**758 KB smaller** and contains neither crypto-browserify nor cipher-base.

**Why nothing caught it.** `bundle-smoke-boot.sh` starts the bundle and waits
for it to reach its database, which proves the SERVER image loads — every
package linked, every map read. This was the client, and no check looked there.
Both crashes that check was written for were server-side, so it answered the
question it was asked and the question next door went unasked.

`tests/packagesLoadOnTheRightArch.test.cjs` pins the class rather than the one
package: it reads each `package.js` for the entry files NOT restricted to the
server, follows their imports, and fails when any requires a Node builtin — and
does the same for every file under `client/`. Verified to fail on the real
fault. Meteor's default being *both* architectures is what makes this silent:
the code works, the tests pass, and the cost lands in a browser bundle nobody
reads.

</details>

**Bundles and images** - what a build carries, and what it can start without.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71ff74c6d">The reachability graph must read Meteor's module.link, not only require()</a>. Thanks to Heart1010 and xet7.</summary>

Reported as [#6602](https://github.com/wekan/wekan/issues/6602): a Docker
instance upgraded from v10.91 to v10.97 would not come up at all. The entry
above shipped in a bundle that crash-looped:

```
  Error: Cannot find module ".../nodemailer-openpgp/lib/nodemailer-openpgp.js"
    at packages/email.js:347
```

`packages/email.js` does not `require()` that package. Meteor compiles an ESM
import to its own linker call:

```
  module.link('nodemailer-openpgp',{openpgpEncrypt(v){openpgpEncrypt=v}},6);
```

and the scanner only ever looked for `require()`. So it missed every ESM import
in every Meteor package — which is most of them — and reported live code as
dead. The reachable count goes from 211 to 450 with the fix: the measurement was
badly wrong, not marginally. Four forms count now: `require()`, `module.link()`,
`module.watch(require())` and `module.dynamicImport()`.

**The safety worked, which is the one good part.** With the corrected graph the
policy still named `openpgp`, the graph VETOED it, and the tool refused and said
so rather than deleting it. That entry is removed outright now rather than left
to be vetoed every run — the reason is what grants the permission, and this
reason was never true.

**And the check that was missing both times.** v10.96 died on a source map
deleted but not un-named; this died on a linked module. Both were reasoned about
by reading the code, and reading the code is how both mistakes were made. So
`releases/bundle-smoke-boot.sh` starts the bundle with a database address that
cannot answer and requires it to get as far as trying to reach it — which proves
the whole server image loaded, because the database is the first thing WeKan
needs that the check does not provide. The amd64 build runs it after the trim
and the prunes, and every other architecture's bundle derives from that one.

It is verified against both real failures — a bundle with `nodemailer-openpgp`
removed, and a manifest naming maps that are not there — and each fails with its
own diagnosis, because the fix for each is a different one. A bundle that exits
quietly or hangs is not a pass either: a smoke test whose failure mode is
passing when it learned nothing is worth less than none.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efa25f78d">Sandstorm packs the trimmed trees, instead of rebuilding them first</a>. Thanks to xet7.</summary>

v10.98's log shows the trim doing exactly what it was meant to, and then being
thrown away:

```
  --- .meteor-spk/bundle: 856M total        (first pack, fails)
  bundle-trim: removed 5236 files, 355 MiB
  prune-unreachable-npm: removed 28 package(s), 49.9 MiB
  --- .meteor-spk/bundle: 424M total        (424M + 336M deps = 760M, under 1 GiB)
  Building Meteor app...                    <- pack rebuilds it
  App exceeds uncompressed size limit of 1 GiB
```

`meteor-spk pack` runs the Meteor build first, so the retry regenerated the
bundle and packed the untrimmed one - 405 MiB of trimming discarded between the
measurement and the pack. Sandstorm's own `spk pack` only packs what is there,
so the retry prefers it and falls back to `meteor-spk` when it is not installed.

A comment in the retry claimed pack REUSED the bundle. It did not, and the log
above is what disproved it.

</details>

**The CHANGELOG and its tooling** - a file that grew faster than it was read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43341fc75">Releases are frequent, so the CHANGELOG tooling stops assuming they are rare</a>. Thanks to xet7.</summary>

The maintenance loop here is `build.sh` option 1 (git pull + git push) and
`releases/release-all.sh` with no arguments, several times a day when a fault is
being chased. A release landing in the middle of a piece of work is the normal
case, not a special one — and `release-all.sh` renamed
`# Upcoming WeKan ® release` to `# v<NEW> …` and left nothing behind, so the
next entry written had nowhere correct to go. It landed above the closing
`Thanks to above GitHub users …` line, which is now INSIDE the release just
published.

v10.96 and v10.97 both ended up that way. The second was worse than misplaced:
an entry already published was EDITED afterwards, so the notes described a
smaller, tidier change than the one that shipped — and the one that shipped was
the one that stopped the bundle starting.

`releases/changelog-open-next.mjs` opens the next section as soon as a release
is named, carrying the `**In short:**` placeholder and the binaries table the
format guard requires, so the file is valid the moment `release-all.sh`
finishes. Re-running it is a no-op, since `release-all.sh` can be run again
after a failure. The format guard now allows an Upcoming that is empty AND still
carries the placeholder — and fails one that has entries and still carries it,
because that is a summary nobody replaced.

`tests/changelogEntriesBelongToTheirRelease.test.cjs` is the check that the home
was used: git knows which commits a release contains, so an entry linking a
commit that is not an ancestor of its release is in the wrong section. Scoped to
the newest three releases on purpose — over the whole file it flags 83 entries
back to v2.99, from old release practices and history rewrites, and a guard
reporting 83 things nobody will act on is a guard people learn to skip.

`CLAUDE.md` says all of this where the release instructions are, including the
rule the second mistake broke: a released section is a record, not a draft.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fa8ba12e">CHANGELOG.md keeps the current year, and older years move to old-CHANGELOG/</a>. Thanks to mimZD and xet7.</summary>

Reported as [#6580](https://github.com/wekan/wekan/issues/6580): the file had
reached **2.6 MB and 51,365 lines across 1,070 releases** going back to 2015,
which is slow to open and slower to read on the web.

The current year stays in `CHANGELOG.md`; every older year moves out whole to
`old-CHANGELOG/<year>.md`, with a bullet in `# Platforms` linking each one.
**798 releases move, 272 stay**, and the file goes from 2.6 MB to 1.9 MB —
2026 is a big year on its own, because releases here are frequent.

Nothing is deleted and no entry is rewritten. An archived section reads exactly
as it did before, for the same reason a released section is never edited in
place: it is a record. That `git blame` is less useful on the split file is
accepted rather than worked around — the history is still in git for anyone who
wants it, through `gitk`, `git-gui` or `git log --follow`, and being small
enough to open is worth more.

Each archive opens with a **count of releases per month**: a
`| 2025 | Releases |` table over rows of `01`, `02` and so on. *How busy was
2019* is the first thing a year file is asked and the last thing 159 collapsed
sections answer.
Only months that had releases get a row: a fixed twelve rows would put ten
zeroes in 2015's table. The table is regenerated from each file's own headings
on every run, so it cannot drift from the sections beneath it, and
`tests/changelogArchive.test.cjs` checks the two against each other.

`releases/changelog-archive-years.mjs` does it, and it is a **January job**: run
it once when a year turns over. It is idempotent, so a stray run does nothing.
Cutting by YEAR rather than by a count of releases is what makes a link into the
archive stable — once a year is over, nothing in it moves again.

One thing the script had to learn: eleven years of headings do not agree on
their own wording. Of 1,070, 539 say *Wekan release*, 524 say *WeKan ® release*,
and the rest are one-offs — *Sandstorm-only Wekan release*, *Wekan relase*, and
one that explains it was NOT released. Matching the strict modern form found
only half of them and silently absorbed the others into the section above, so
the version and the DATE are what is matched and whatever follows is left alone.
Verified by counting headings before and after: 1,070 both times, none lost and
none duplicated.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc3201292">And then the current MONTH, because a year of these releases is still 1.9 MB</a>. Thanks to mimZD and xet7.</summary>

Moving whole years out left 1.9 MB, which was still too large, because releases
here are FREQUENT: 2026 alone is 272 releases over eight months, and July was 80
on its own. A year is not a small enough unit when a year is that busy.

So the cut is by month. `CHANGELOG.md` holds the current month plus the
Platforms, TODO Later and Upcoming sections; earlier months of the current year
go to `old-CHANGELOG/<year>/<MM>.md`; years that are over stay one file each,
because at 30 to 107 KB they are already small and splitting them further would
trade a size problem for a "which of thirty files is it in" problem.

**2.5 MB becomes 822 KB.** Each archive opens with a table of how many releases
it holds, per month, so the file says what is in it before a reader scrolls.

</details>

**Admin Panel / People** - who is locked out, and who can undo it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e208c615">People shows who is locked again, and why</a>. Thanks to xet7.</summary>

Moving the lockout counter to one per (user, source address) - the JamBleed fix
above - broke three readers still looking at the flat field it replaced: the
People table's lock icon, its unlock click handler, and the `lockedUsers`
methods behind them. Every account would have shown as unlocked, and no admin
could have unlocked one.

That is the "and nowhere else" half of the rule this release adds to CLAUDE.md,
missed on the very next fix. `models/lib/accountLockout.js` is now the one place
that knows the shape - locked or not, since when, how many addresses and how
many failures between them - so the client helper, the click handler and the
server methods cannot drift apart again, and the negative test fails if anything
reads the flat field.

The People row says which ADDRESSES are locked and until when, rather than a
bare padlock, because "locked" now means something narrower than it used to and
an admin should not have to guess how much narrower.

</details>

and has the following developer-facing changes:

**Admin Panel / Problems** - how a pane knows it is the open one.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/760bd0904">One active pane, instead of eleven booleans saying the same thing</a>. Thanks to xet7.</summary>

Every pane on the Problems page had a `ReactiveVar` of its own -
`showSummary`, `showSecurity`, `showIntegrity` and eight more - on top of
`activeReport`, which already held the id of the open pane. Each one could only
ever mean "activeReport equals my id", so they were forty-four lines restating
one value, kept in step by hand: opening a pane reset all eleven and set one.

That made a pane four wiring points instead of one, and missing any of them
failed SILENTLY. Filesystem integrity got three of the four - menu entry, setter
and template branch - and no helper, and in Blaze an undefined helper is not an
error but a falsy value, so [the pane drew a blank
page](https://github.com/wekan/wekan/commit/01c36852d) while Summary went on
counting the problems it could not show. The Offices pane added in this release
had the same hole somewhere else: it set no `loading.set(false)`, so opening it
would have spun for ever.

The template asks `else if isPane 'report-integrity'` now, against one helper.
Panes that fetch through a method rather than a subscription are a list, and
that list is also what fixes Offices. Adding a pane is a menu entry, a branch,
and one line saying how it loads.

The guards moved with it. `tests/adminPaneHelpers.test.cjs`, written when the
integrity pane was blank, pins both halves of the new mechanism: the helper must
exist, and every id the template branches on must be an id the menu sets - a
typo either way is dead template or a blank pane, and neither says anything at
runtime. `tests/problemsMenuOrder.test.cjs` now checks EVERY pane rather than
three named ones: each menu entry must be rendered, and must either load itself
or have a report config, so a pane that spins for ever cannot ship again. A
negative test fails if a per-pane `ReactiveVar` comes back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa289e4a4">The route and the template say what the menu says</a>. Thanks to xet7.</summary>

The pane is called Problems in the menu, its address is `/admin/problems`, and
`docs/Features/Admin-Panel/Problems` is where it is documented. Two things still
called it Reports, from before it was renamed: the route NAME was
`admin-reports`, where its three siblings are the bare page key `setting`,
`people` and `attachments` - so the one route whose name did not match its own
address - and the template and its three files were `adminReports`. Both are
`problems` / `adminProblems` now, across 41 files.

What did NOT change is `legacyBase: '/admin-reports'`. That is an address people
have in bookmarks, and it still redirects.

</details>

**Security fixes** - what one is required to come with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3299c490">A test, a negative test, and the attempt visible in Problems</a>. Thanks to xet7.</summary>

Two rules added to [CLAUDE.md](CLAUDE.md), both learned from fixes in this
repository rather than proposed in the abstract.

**A test AND a negative test**, written so the fault cannot exist ANYWHERE in
the codebase rather than only where it was reported. A test that pins one call
site leaves the same mistake free to live in the other five, and that is how
most of these arrive: SignupBleed's guard read an option nothing sets and the
same shape sat in a second endpoint; the source-map trim was safe on the client
and fatal on the server. So the test proves the fix does what it claims -
driving the decision itself, as arithmetic, where it can - and the negative test
proves the fault is GONE rather than moved, by searching the tree for the shape
of it.

**And the attempt is visible in Admin Panel / Problems**, whenever the fix is
one that DENIES an operation. A vulnerability that is fixed silently tells an
admin nothing about being attacked through it, and "nobody is trying" and
"somebody tries every four seconds" are not the same instance to run. Recorded
as a summary, never per event.

</details>

**The local build** - what `build.sh` produces, and what a release produces.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccb2d818a">build.sh and build.bat option 2 build the RELEASE bundle, minus the .zip</a>. Thanks to xet7.</summary>

"Build WeKan" ran `meteor build .build --directory` and stopped there, and that
bundle is not the one a release publishes. A release adds the server's npm
modules, three prunes, the sockjs / legacy-client / source-map trim, a verified
Node.js, FerretDB, the eight MongoDB Database Tools and a launcher — and three
releases running broke in exactly that difference: v10.96 on a source map the
trim deleted and left named, v10.97 on a package the prune's graph could not
see, v10.98 on a Sandstorm pack that rebuilt the bundle and threw the trim away.
None of it was reproducible locally, because locally there was only `meteor
build`, so "does the bundle a release would publish start at all" took a
release, a workflow run and a download.

`releases/build-release-bundle.sh` runs the workflow's OWN steps, in its order,
with its arguments, for whichever platform it is run on. Not a second
implementation of the release — the same scripts, so a fix to one is a fix to
both. It makes no zip, no checksum and no provenance row, because those describe
a published artifact and this one is a directory to start:

```
  cd .build/bundle && ./start-wekan.sh
```

Verified by running it on Linux arm64: an 850M bundle, trim −349 MiB, prune
−40.0 MiB, the boot check passed, Node.js v24.19.0 verified against nodejs.org's
`SHASUMS256.txt`, FerretDB and the eight tools fetched per-arch, 686M with all
of it embedded — then started, with FerretDB on SQLite and WeKan answering
HTTP 200 fifteen seconds later.

The Setup menu offers it as **Build WeKan release bundle**, beside **Build WeKan
development bundle** — the plain `meteor build` that entry used to be, kept
because the two answer different questions at very different cost, and the
development one now says what it is NOT when it finishes.

Downloads are cached under `.tools/bundle-binaries/`, and a cache HIT re-checks
the published SHA256 rather than trusting a file for having been there before.
The test path is deliberately unchanged: it runs the bundle under its own node
and mongod, so a hundred megabytes of binaries it will not use is the wrong
trade. `tests/releaseBundleMatchesWorkflow.test.cjs` FINDS the release scripts
the workflow runs rather than listing them, so a step added there and not here
fails the suite instead of quietly putting the difference back.

</details>

and improves the documentation:

**docs/** - where a page lives, and how a reader finds it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/daaf56391">Implemented designs move to docs/Features, filed the way the menu is</a>. Thanks to xet7.</summary>

A design that describes what WeKan already DOES belongs with the feature it
describes, not in the folder for things being proposed. Fifteen docs move -
`Accessibility`, `Original-Positions`, the thirteen `Page/*` designs that exist,
and the Admin Panel Problems design.

What stays in `docs/Design` is what the folder is for: the principles
(Design-Principles, Monkey-Proof-Software), the comparisons, the roadmap, and
the proposals not yet built.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9963e8b8">Directory-Structure.md describes the tree WeKan has now</a>. Thanks to TNick and xet7.</summary>

It described the tree at commit `e2f768c` and had gone on describing it for
years. **Fourteen links pointed at nothing** - five files that had moved, seven
that no longer exist anywhere - and every one of the fourteen was written as a
full `https://github.com/wekan/wekan/tree/main/…` URL rather than a relative
path, which is exactly why none was noticed: a broken relative link is visibly
broken in an editor and on GitHub, while an absolute one looks like a link and
404s only for the reader who follows it. All 144 relative links were fine.

**And two thirds of the repository was not mentioned at all** — `imports/`,
`packages/`, `releases/`, `tests/`, `docs/`, `migrations/`, `server/lib`,
`server/methods`, `server/routes`, `models/lib`, `client/features`. The page
walked through four directories out of twenty and did not say so, which left a
reader unable to tell "not here" from "does not exist". It opens with a table of
the whole tree now, and gains the sections those directories should have had.

`tests/docsLinksResolve.test.cjs` checks both link forms against the tree, and
fails when the page stops mentioning a top-level source directory - the silence
being the failure that lasted longest.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fbfb26d2">Admin Panel docs are filed the way the Admin Panel menu is</a>. Thanks to xet7.</summary>

The menu is the structure a reader already has in their head, so the docs match
it: one directory per tab, one page per pane, and a README in each listing the
panes IN MENU ORDER with the URL slug beside them - so somebody with
`/admin/problems/integrity` in the address bar can search for `integrity` and
find the page.

Settings (7 panes) and People (9) already had a page each and were already in
order; they gain the slug column. Problems (17) and Attachments (10) listed
almost none of theirs, so their READMEs now index every pane.

WHAT IS NOT DONE is now visible instead of invisible: 15 of the 17 Problems
panes and all 10 Attachments panes have no page of their own. They are dashes in
the table, and `tests/adminPanelDocsMatchMenu.test.cjs` counts the dashes
against the sentence that states how many there are - so the gap cannot grow
quietly, and a pane added to the menu and not to the docs fails the suite.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.97 2026-08-16 WeKan ® release

**In short:** v10.96 shipped a bundle that could not start. Trimming what a
bundle carries went one file too far: `boot.js` reads every source map NAMED in
`programs/server/program.json`, unconditionally, so removing the maps left 63
dangling names and the server died before opening its port. The names go with
the files now, and the fix was checked by BOOTING a trimmed bundle rather than
by reading the code again. Then the **snap**, which had been taking itself
offline at every restart: the startup comparison of the two database copies ran
unbounded with nothing on the web port, on an ambiguity that its own reading of
MongoDB kept recreating. Below that: **61 MiB** off every bundle
from packages nothing can reach, and a guard that keeps all 246 translations
loading one at a time.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following bugs:

**Bundles and images** - what a build carries, and what it no longer does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc19f0661">Dropping a source map must un-name it too, or the server will not boot</a>. Thanks to xet7.</summary>

The entry above removed the source maps from every platform. A released image
then crash-looped:

```
  Error: ENOENT: no such file or directory,
    open '/build/programs/server/packages/ecmascript.js.map'
    at /build/programs/server/boot.js:101:29
```

*"Nothing on any loading path reads a `.map`"* was true of the client and false
of the server. `boot.js` reads every map NAMED in
`programs/server/program.json`, at boot, unconditionally:

```
  serverJson.load.forEach(function (fileInfo) {
    if (fileInfo.sourceMap) {
      var rawSourceMap = fs.readFileSync(
        path.resolve(serverDir, fileInfo.sourceMap), 'utf8');
```

63 of the 102 load entries name one — 60 MiB — so deleting the files left 63
dangling names and the server died before it opened its port.

The names now go with the files: the same pass deletes `sourceMap` and
`sourceMapRoot` from every load entry. The client was never affected and still
is not — its `program.json` names no maps at all (678 manifest entries, zero
`sourceMap` fields) and `webapp` reads only `program.json` itself at startup.

Verified by BOOTING a trimmed bundle rather than by reading the code again: with
uWebSockets.js, the legacy client and all 4766 maps removed, `node main.js`
loads the whole server and reaches `AccountsServer.init`, failing only on the
deliberately unreachable `MONGO_URL` it was given. That is the check that was
missing the first time, and `tests/bundleTrim.test.cjs` now pins the invariant
`boot.js` actually requires — every map the manifest names exists on disk — for
both settings of `--keep-maps`.

</details>

**The snap's two copies of the database** - after a migration both stay on disk,
and starting is where that gets decided.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da221c549">Reading MongoDB to compare the copies must not look like writing to it</a>. Thanks to xet7.</summary>

An instance serving FerretDB printed this at every restart:

```
  WeKan: BOTH databases have been written to since the migration.
    MongoDB  last written 2026-08-16 01:41 (WiredTiger.wt)
    FerretDB last written 2026-08-16 01:38
```

Nothing had opened that MongoDB in a month. The giveaway is in the report
itself: the MongoDB timestamp is the minute the snap started, three minutes
AFTER the FerretDB it is being compared against.

`bin/ferretdb-migration-stale` decides *MongoDB has been written to* from the
mtimes of the WiredTiger data files, and its own header admits an mtime cannot
tell "somebody used this database" from "this database was started".
`bin/database-autopick` is the answer to that — it reads both copies and
compares their contents. But to read MongoDB it STARTS mongod, and starting
mongod does recovery and a checkpoint, which stamps exactly the files the
staleness check reads. So the diagnostic manufactured its own evidence: after
one run, MongoDB looked freshly written forever and the ambiguity could never
resolve, however long nobody touched it.

The read now notes the newest data-file mtime before mongod starts and puts
anything newer back afterwards — files mongod CREATED during the read included,
since a new journal file is the newest thing in the directory and reports as a
write on its own. mongod does not use mtimes, and what it checkpointed is not
user data, so the metadata is made to say what is true. Every way out of the
read restores, including the failures, because a failing read is exactly when
the ambiguity gets reported. A write that happened BEFORE the read still
survives it: the point is to hide WeKan's own read, never somebody's work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/062d4fede">The database comparison at startup cannot take the site down any more</a>. Thanks to xet7.</summary>

The same instance went OFFLINE at every restart. `wekan-control` ran the
comparison synchronously and unbounded before anything opened the web port — and
it starts each database on a temporary port to read it, which on a real instance
is minutes. Until it returned a browser got a connection timeout, and the reason
was in `snap logs`, the last place somebody whose site is down thinks to look.

That is [#6592](https://github.com/wekan/wekan/issues/6592) one step earlier than
where it was fixed. The database WAIT already serves a *waiting for its
database* page; the helpers for it were defined 200 lines BELOW the comparison
that needed them. They move up, and the comparison uses them — after the same
grace period, so a comparison that finishes in seconds does not flash a page up
and teach proxies to cache a 503 for a healthy site.

And a bound. `WEKAN_AUTOPICK_TIMEOUT` is 900 seconds by default; when it runs
out WeKan says so, changes nothing, and starts on the database already selected.
Stopping the comparison is safe — it never deletes anything on either side, and
the merge it may be in the middle of only INSERTS what is missing, so a partial
one is fewer documents copied and the next start finishes the job. Serving the
site beats finishing the comparison.

`WEKAN_AUTOPICK` was an env var and nothing else, so an admin whose site was
down had no supported way to skip the comparison. It is a snap config key now,
with the bound beside it, and the timeout message names both — somebody reading
it is somebody whose site just came up late:

```
  snap set wekan autopick=false
  snap set wekan autopick-timeout=1800
```

This is the other half of the entry above. Before that fix the comparison ran at
EVERY start, so every restart took the site down for a comparison that could
never conclude. One stops it recurring; this one makes it survivable.

</details>

and changes what every platform ships:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6e21202f">Prune what no require() in the server bundle can reach</a>. Thanks to xet7.</summary>

`programs/server/npm/node_modules` is 347 MB of an ~850 MB bundle, and measuring
its require graph says 206 MB of that is unreachable from any server entry
point. Two things cause it, neither a bug in Meteor:

- **The tree is outside the bundler's graph.** Meteor 3.5 compiles through
  rspack — the server output is minified, and `programs/server/app/app.js`
  requires only 76 bare specifiers because rspack inlined the app's real
  dependencies into it. But this tree is what Atmosphere packages declare with
  `Npm.depends()` and load through `Npm.require()`, which rspack cannot follow.
  It is largely the INPUT to a build whose OUTPUT ships beside it.
- **It is a full `npm install`, devDependencies included.**

Duplication is the smaller half: 586 distinct packages exist as 815 copies, but
the redundant copies are only ~28 MB, because Meteor keeps per-package
`node_modules` on purpose so packages can pin conflicting versions.

`releases/prune-unreachable-npm.mjs` removes 61.3 MiB, in four categories whose
reason is PROVABLE rather than merely plausible — the standard the
uWebSockets.js removal met: `typescript` (23.2 MiB, a devDependency of 196
packages here and a runtime dependency of none), `openpgp` with
`nodemailer-openpgp` (21.3 MiB, reachable only through an optional nodemailer
plugin nothing requires), `@types/*` (9.6 MiB across 24 copies, verified to
contain no `.js` at all) and `sinon` (7.2 MiB, a test framework).

**One of those four was wrong, and this release cannot start because of it.**
`packages/email.js` links `nodemailer-openpgp` on its first tick through
`module.link()`, which the graph did not read as a reference — so the bundle
ships without a package it needs and dies with *Cannot find module*. Withdrawn
and fixed in the release above, where the whole story is.

The remaining 145 MB of unreachable packages STAYS. `jquery`, `hotkeys-js` and
the `@azure` storage adapters are almost certainly dead too, but *almost
certainly* is not the standard, and the tail of 590 packages is where a static
scan is most likely to be wrong.

Two independent safeties, because this is riskier than the uws removal was. The
reachable set is recomputed from the bundle every run and deliberately
OVER-approximated — once a package is reached, every file in it is scanned and
every `require()` string literal counts. The policy then only proposes; the
graph has a VETO, so an entry whose package is actually required is refused and
said out loud rather than applied. And after deleting, every path in the
reachable set must still exist or the run fails. Verified on a real bundle:
473M to 410M, with the reachable count 211 before and after.

</details>

and adds the following guard:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1619a6c37">Every language stays lazily loaded, and a guard keeps it that way</a>. Thanks to xet7.</summary>

WeKan ships 246 languages, 37 MB of JSON. What makes that affordable is one
character in each of 246 near-identical blocks in `imports/i18n/languages.js`:

```
  load: () => import('./data/ace.i18n.json'),
```

A dynamic `import()` is a SPLIT POINT. rspack emits each language as its own
chunk — measured on a built bundle, 238 chunks and 34 MiB of JS — and a browser
fetches exactly one, about 145 KB for the language in use. Written instead as
`import data from './data/ace.i18n.json'`, or with `require()`, the same line
stops splitting and 34 MiB joins the main bundle for every user, in every
language. That edit is made by hand each time a language is added, which is why
it wants a guard rather than a convention.

Seven checks: every entry has a `load:`, every `load:` is the dynamic form, none
uses `require()`, no static import of a data file, nothing outside
`languages.js` imports one, every file is claimed and every claim has a file,
and a Transifex pull writes the file the app actually loads.

The last two are symlink-aware, and that is the point of them. `.tx/config`'s
`lang_map` renames most of Transifex's underscored locales to WeKan's hyphenated
files; for the two it does not — `km_KH` and `ru_RU` — the hyphenated name is a
SYMLINK to the file Transifex writes. Two names for one file, not two copies.
Reading it the other way costs a language its real translations, so both checks
compare through `realpath` and say so.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.96 2026-08-16 WeKan ® release

**In short:** one **CRITICAL** fix. With registration turned OFF in the Admin
Panel, `POST /users/register` created accounts anyway — for anybody who asked,
on an instance whose administrator had decided nobody else may join. The guard
that was supposed to stop it read a Meteor option WeKan never sets, so it was
always false and the endpoint had never refused anyone. It was found while
reviewing a pull request about the opposite symptom. Then the **release
workflow**: pressing **Cancel** did not stop a run, so `docker` went on building
an image for a release being abandoned, and the **Sandstorm** `.spk` gets under
its 1 GiB limit at last, now that its size report says what filled the gigabyte.
What that measurement found ended up changing every platform, not just
Sandstorm: **uws is not reliable enough yet**, so every default is now
**sockjs**, and no bundle carries uWebSockets.js (121M), the legacy client
(81M) or source maps (152M) — around **354M** a bundle. Below that: two AWS SDK
updates for the S3 attachment path.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following CRITICAL SECURITY ISSUE of [SignupBleed](https://wekan.fi/hall-of-fame/signupbleed/):

**Account creation** - who may make an account, and who decides.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3f1b626292cc8cb16d3cfd71ba30009cfc5f935">SignupBleed: registration disabled, and the REST API created accounts anyway</a>. Thanks to AhmedLukman and xet7.</summary>

Turning **Registration** off in the Admin Panel closes the sign-up form. It did
not close `POST /users/register`, which went on creating accounts and handing
back login tokens to anyone who asked. A closed instance was open.

The endpoint did have a guard. It asked
`Accounts._options.forbidClientAccountCreation` — and **nothing in WeKan ever
sets that**:

- the only `Accounts.config()` call, in `server/accounts-common.js`, sets
  `loginExpirationInDays` and nothing else;
- `forbidClientAccountCreation: disableRegistration` in `config/accounts.js` is
  passed to `AccountsTemplates.configure()`, which is the useraccounts package's
  own options object, not Meteor's `Accounts`;
- and that `disableRegistration` is only assigned inside an async
  `Meteor.call('isDisableRegistration', …)` callback that fires AFTER
  `configure()` has already run — something the file's own comment records, for
  a different reason, a few lines above.

Three near-misses, and the condition was always falsy. The guard read as though
it worked, which is why it lasted: the name says exactly what it ought to do.

It reads the setting from where the setting lives now - the same
`getCurrentSetting().disableRegistration === true` that the
`isDisableRegistration` Meteor method behind the sign-up form uses, so the form
and the API can no longer disagree about whether the door is open. An instance
with no Settings document yet still allows registration rather than locking
itself out.

Every call that reaches the refusal is recorded and shows in **Admin Panel /
Problems** under `authz.register`. That is safe to log without drowning the page
precisely because there is no legitimate caller: the administrator has turned
registration off.

**How it was found.** [#6598](https://github.com/wekan/wekan/pull/6598) by
AhmedLukman changed this guard to read WeKan's setting, filed against
[#4774](https://github.com/wekan/wekan/issues/4774) — a *403 Forbidden* from
this endpoint that nobody had been able to reproduce, and which this line cannot
produce, since it never returned 403 at all. The pull request was closed and the
fix written here with a security log entry and the tests the route had never
had; the finding is the reporter's.

Nine tests, four of them negative, on an endpoint that had none: that the
setting is read where the Meteor method reads it, that the dead option is not
consulted again AND is still set nowhere — so a later change cannot quietly
reintroduce two sources of truth that disagree — that an enabled instance still
creates the user and answers with its token, and that a missing Settings
document does not refuse everybody.

</details>

and updates the following dependencies:

- **@aws-sdk/client-s3 3.1108.0 → 3.1109.0** — the S3 client WeKan stores
  attachments through when S3 storage is configured.
- **@aws-sdk/lib-storage 3.1104.0 → 3.1109.0** — the multipart upload helper
  beside it, which is what actually streams a large attachment to S3.

Thanks to dependabot.

and fixes the following build failures:

**The release workflow** - what a release builds, and who can stop it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f374a0d4">Cancelling a release run stops it, and a stuck job no longer needs a human</a>. Thanks to xet7.</summary>

Pressing Cancel on a release-all run did not stop the `docker` job. It kept
going for another twenty minutes and would have pushed a multi-arch image for a
release that was being abandoned.

The cause is `always()`. It is true while a run is CANCELLING, which is exactly
why it was chosen in v10.80: a `build-mac-x64` queued on a runner label GitHub
had retired sat for two hours, was cancelled by hand, and that cancellation
SKIPPED `charts`, `ucs` and `nextcloud` — so the Helm chart for an already
published WeKan was never pushed, and no error anywhere said why. `always()`
fixed that by ignoring cancellation entirely, and ignoring cancellation is also
what disabled the Cancel button on a job that takes hours.

`!cancelled()` keeps the half that matters — *do not skip me because a SIBLING
failed* — and drops the half that overrides a person. Nine job-level conditions
change, across `release-all.yml`, `release-all-missing.yml`, `Flatpak.yml` and
`AppImage.yml`. The 22 step-level `if: always()` reporting steps do not: those
correctly print CANCELLED.

That alone would reopen v10.80, so the other half of the fix is that no job
needs a hand cancellation any more. The eight jobs that had no `timeout-minutes`
now have one, and every job in the release workflow is bounded. A stuck job
FAILS on its own, and a failure satisfies `!cancelled()` the same way `always()`
let it through — Cancel is left meaning only what a person meant by it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14e8ca4a1">The Sandstorm .spk gets under 1 GiB, by dropping what a grain cannot run</a>. Thanks to xet7.</summary>

v10.93, v10.94 and v10.95 all failed to pack with *App exceeds uncompressed size
limit of 1 GiB*. v10.95 was the first run whose size report worked, and it named
the gigabyte: `.meteor-spk/bundle` 852M plus `.meteor-spk/deps` 336M, so 1188M
against a 1024M ceiling. It also answered the question that report was written
to ask — a second `meteor-spk pack` REUSES the bundle rather than rebuilding it,
since the pruned tree stayed pruned across the retry (852M to 833M). So trimming
between the two attempts works. 19M was simply never going to close a 165M gap.

Measuring the bundle rather than guessing at it turned up two passengers that
are large, unreachable at runtime, and safe to drop:

- **uWebSockets.js ships twenty prebuilt binaries** — Linux/macOS/Windows times
  x64/arm64 times four Node ABIs, 121M — and its loader is one line:
  `require('./uws_' + process.platform + '_' + process.arch + '_' +
  process.versions.modules + '.node')`. A machine is one platform running one
  Node, so the other sixteen files can never be opened by it. Keeping every ABI
  of the target platform and CPU, so a Node major bump still finds its binary,
  frees ~93M. The entry below drops the remaining 28M as well.
- **Source maps** — 4766 files, 188M, over a fifth of the bundle. They exist for
  a debugger attached to the process. A packed app has none, and a missing
  `.map` degrades a stack trace at worst.

`releases/bundle-trim.mjs` does both, measured at 281 MiB on a real bundle, and
the Sandstorm leg runs it beside the existing prune before the retry pack.

An architecture with NO uWebSockets.js prebuild at all — ppc64le, s390x,
riscv64, where ddp-server falls back to sockjs — is left completely alone, since
deleting the other platforms' files there would free nothing that matters and
could only break the fallback. `tests/bundleTrim.test.cjs` pins that, the kept
ABIs, that a directory merely ending in `.map` is not a source map, and that the
trim runs before the retry pack rather than after it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdbd33b59">The Sandstorm .spk ships no uWebSockets.js at all, because a grain talks sockjs</a>. Thanks to xet7.</summary>

Trimming uWebSockets.js down to the prebuilds a grain's own platform can open
freed 93M of its 121M. All of it can go, because a grain loads NONE of it.

The uws transport is OPTIONAL in Meteor 3. `ddp-server`'s `transports/index.js`
resolves the transport from `Meteor.settings.packages['ddp-server'].transport`,
then `DDP_TRANSPORT`, then `DISABLE_SOCKJS`, and DEFAULTS to sockjs — and
`Npm.require('uWebSockets.js')` sits inside the uws transport's `setup()`, which
runs only for the transport that was actually chosen. `sandstorm-pkgdef.capnp`
sets none of those, and its `environ` is, by its own comment, the app's ENTIRE
environment. So a grain has been running sockjs all along while carrying 121M of
a module it never required.

The pkgdef now PINS `DDP_TRANSPORT=sockjs`, because the removal should rest on a
stated fact rather than on an upstream default staying put, and
`bundle-trim.mjs` takes `--transport sockjs`, which removes the module whole
instead of thinning its prebuilds. 120 MiB measured, 27 MiB more than the
platform trim: 1188M becomes ~860M, with over 160M of headroom against the
1 GiB limit.

It is a flag rather than the default because WeKan asks for uws nearly
everywhere else — `docker-compose`, `start-wekan.sh`, `build.sh` — and those
bundles keep the module, trimmed to the prebuilds their own platform can open.

`tests/bundleTrim.test.cjs` ties the grain's pinned transport to the flag the
`.spk` is trimmed with. If those two ever disagreed, the grain would require a
module that was left out and fail to boot, which is the one way this can go
wrong.

</details>

and changes what every platform ships:

**Bundles and images** - what a build carries, and what it no longer does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33c867f4d">Every platform talks sockjs, and no bundle carries uws or the legacy client</a>. Thanks to xet7.</summary>

uws is not reliable enough yet to be what a default points at, so nothing WeKan
ships selects it any more, and nothing carries the module. Three halves, and
each is useless or harmful without the others.

**The defaults.** Every `docker-compose*.yml`, `start-wekan.sh`,
`start-wekan.bat`, `build.sh`, `build.bat`, the image's own `ENV` block, the
snap config and the Sandstorm grain now say `sockjs`. The commented-out
`#- DDP_TRANSPORT=uws` alternatives beside them are replaced by a note saying
why there is no alternative, rather than advertising a value that no longer
works.

**The bundles.** Every place a built bundle is post-processed — the amd64
build, each per-arch rebuild, the repack container,
`releases/install-node-for-arch.sh` and the `Dockerfile` — now runs
`bundle-trim.mjs` beside the prune it already ran, dropping two things:

- **uWebSockets.js**, 121 MiB, for the reason in the entry above: a sockjs
  server never requires the module at all.
- **`programs/web.browser.legacy`**, a whole second copy of the client built
  for browsers without modern JS. 81 MiB measured. Meteor supports running with
  architectures excluded and says so in webapp's `categorizeRequest()`: *"If our
  preferred arch is not available, it's better to use another client arch that
  is available than to guarantee the site won't work"*. An old browser is served
  `web.browser`; the 404 branch below that is reached only when NO arch matches,
  which cannot happen while `web.browser` is there, and autoupdate iterates the
  programs that actually loaded rather than a fixed list.

  The files are only half of it. The arch is NAMED in
  `programs/server/config.json` and `star.json`, and `boot.js` builds a
  dynamic-import root for every name in the first — so the name is removed with
  the files. Those manifests are mode 444 as Meteor writes them, so they are
  made writable, rewritten, and set back: failing there would leave the one
  state that actually breaks a server, files gone and manifests still naming the
  arch.

**The upgrade.** An existing `docker-compose.yml` that says
`DDP_TRANSPORT=uws` would ask the new image for a module it does not have and
crash-loop on the require. So the Docker entrypoint and the bundle's own
`start-wekan.sh` coerce `uws` back to `sockjs` before starting anything, and
print why — a setting silently ignored is worse than one that fails.

`tests/sockjsEverywhere.test.cjs` pins the three halves together: a default
without the coercion is an upgrade trap, a coercion without the trim is dead
weight, and a trim without both is a crash.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1e0f0297">Source maps go from every platform, not only the Sandstorm .spk</a>. Thanks to xet7.</summary>

The `.zip` bundles and the Docker image were trimmed with `--keep-maps`, so only
Sandstorm — which had a 1 GiB ceiling to get under — dropped them. Every
platform drops them now: **152 MiB** per bundle, measured. That is 188 MiB
across 4766 files, less the 36 MiB inside `web.browser.legacy` that the entry
above already takes with it.

A source map translates a position in built code back to the source that
produced it — this bundle's server side is one 117 MiB
`programs/server/app/app.js`, and its 58 MiB `app.js.map` is what turns
`app.js:1284531` into a file and a line. It is read by browser devtools, which
fetch the `.map` only while they are open, and by Node stack traces through
`source-map-support`. A released bundle has neither attached to it.

**A map the server manifest NAMES is not optional, and this release did not
know it.** `boot.js` reads every map listed in `programs/server/program.json`
at boot, unconditionally, so removing the files without removing the names left
the server unable to start — fixed in the release above, where the whole story
is. The client is unaffected: its manifest names no maps at all, and
a client `.map` is found through the `//# sourceMappingURL` comment, which is a
comment — a missing target means devtools show compiled positions and a server
stack trace prints bundle offsets. Debugging a production crash goes back to
reproducing it against a development build, which is where the maps still are.
The guard pins that no call site keeps them, so one platform cannot quietly
drift back to carrying them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.95 2026-08-16 WeKan ® release

**In short:** the Sandstorm `.spk` still will not pack - Sandstorm refuses an
app over 1 GiB uncompressed - and v10.94 was supposed to say what filled it.
It said nothing, because the size report ran BEFORE `meteor-spk pack`, and pack
is what builds the trees it was trying to measure. The sizes are taken after
pack now, on failure and on success, dereferencing the symlink that hid most of
them; and the bundle is pruned of its build-only toolchain and packed once more
before the job gives up, which is the same pruning every other bundle already
gets and the one reduction available without guessing.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following build failures:

**The release workflow** - the bundles a release is supposed to carry.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/671da7c1666c2a0dd1e1089333dcc3f8bc949487">The Sandstorm .spk fails on a size limit, and now says what filled it</a>. Thanks to xet7.</summary>

`build-sandstorm` fails with *App exceeds uncompressed size limit of 1 GiB* and
nothing else. Because Sandstorm refuses to pack, no `.spk` is written, so there
is no artifact to open and no list of what filled it.

The first attempt at that added a size report **before** `meteor-spk pack`, and
the next run showed it printing nothing at all:

```
  --- packing (Sandstorm refuses over 1 GiB uncompressed)
  Building Meteor app...
```

`meteor-spk pack` is what BUILDS the Meteor app - *Building Meteor app...* comes
after it starts - so `.meteor-spk/deps` and `.meteor-spk/bundle` do not exist
until it has run. The report was measuring two directories that were not there,
found neither, and skipped both silently. A diagnostic that runs before the
thing it diagnoses says nothing at all.

The sizes are taken AFTER pack now: on failure, where they are the whole point,
and on success, where the headroom against 1 GiB is worth knowing before the
next thing is added. `du -shL` DEREFERENCES, because `deps` is a symlink to the
tree `sandstorm-src/build-deps.sh` assembles and a plain `du -sh` on a symlink
reports the link rather than the gigabyte behind it. The bundle's server
packages are listed separately, because they are the part every other bundle
prunes.

And one bounded RETRY, which is an attempt at the fix rather than more looking.
`meteor-spk pack` runs `npm install` inside the bundle's `programs/server` -
that is where `tar@6.2.1` and node-gyp's tree come from in the log - and the
Sandstorm leg is the only one that never removes them afterwards.
`prune-build-only-modules.mjs` drops 83 of 120 packages everywhere else, and
nothing in a packed app runs any of them. Whether it is enough turns on
something no log has answered yet: does a second pack REUSE
`.meteor-spk/bundle`, or rebuild it and undo the prune? Both answers are useful
and neither is worse than the hard failure that is there now - if it rebuilds,
the second failure is identical and the log says the prune was undone; if it
reuses, the `.spk` packs. It runs once, only after a failure, and only if the
bundle is actually there.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.94 2026-08-16 WeKan ® release

**In short:** **the Windows bundles are back.** v10.93 built them, compiled
their native modules, and then threw both away on one line: npm on Windows is
`npm.cmd`, a batch script, and Node applies no PATHEXT when it spawns, so
`execFileSync('npm', …)` in the bundle's security-bump step resolved to nothing
and `build-win64` and `build-win-arm64` died with *spawnSync npm ENOENT* after
all the work was done. npm's own CLI is run with the Node already running now,
which needs no PATH lookup and no shell. The Sandstorm `.spk` also failed, on
Sandstorm's 1 GiB uncompressed limit, and it failed silently - no list, no
sizes, no .spk to inspect - so the pack step now says where the gigabyte is
before it packs.

The table below carries only the four platforms this run recorded a complete,
verified provenance for; the release job regenerates it from every build job's
`provenance.tsv`.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-arm64) | v1.53.0 | `cb14ffe93e285903e5a8a9c1821687ddb5b8a979a11c584bf4af534b272c6d3e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-mac-x64) | v1.53.0 | `d97dfa9afa60aa05f25384327de82efe7b71d958ed24c1f66618284294a65cd3` |

This release fixes the following build failures:

**The release workflow** - the bundles a release is supposed to carry.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21363baf6d4e80760073388a29763d03b3025480">Windows builds died on spawnSync npm ENOENT, after all the work was done</a>. Thanks to xet7.</summary>

`build-win64` and `build-win-arm64` both failed in v10.93, and both had already
built the bundle and compiled its native modules. What killed them was one line
of `releases/bump-bundle-npm-deps.mjs`:

```
  Error: spawnSync npm ENOENT
```

npm on Windows is `npm.cmd`, a batch script, and Node applies no PATHEXT when it
spawns - so `execFileSync('npm', …)` resolves to nothing. `build-win32` was
skipped that run for want of a published Node.js build, so it never reached this
and looked fine; the fault was never architecture-specific.

npm's own CLI is run with the Node already running instead:
`execFileSync(process.execPath, [npm-cli.js, …])`. No PATH lookup, no PATHEXT,
no shell - and the same npm either way. `shell: true` would have found the
`.cmd` and broken differently, because with a shell Node joins the arguments and
quotes NOTHING, so the first Windows temp path containing a space would corrupt
the install. A bare `npm` on PATH remains as the last resort, for a Node with no
npm beside it, and on Windows it now says which case that is rather than letting
`ENOENT` speak for itself.

Verified end to end: a bundle-shaped tree holding `qs` 6.0.0 is bumped to 6.15.3
through the new path, with the dependencies the new version needs copied in
beside it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.93 2026-08-15 WeKan ® release

**In short:** **Docker did not work in v10.92**, and this is that fixed. The
"waiting for database" page added in that release stood in front of a database
that was answering everyone else: the probe behind it looked for the MongoDB
driver where a production bundle does not keep one, so it never asked the
database anything, and the login page did not load for the ten minutes the page
was allowed to hold the web port. The snap was never affected - it serves its
own page and never runs that probe. Two further faults found while proving it
are fixed with it: the probe forced a connection option a replica-set URL
refuses, and it said nothing at all about why it had failed, which is now
printed and put on the page itself.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bugs:

**Starting up** - what a browser sees while WeKan cannot yet serve.
<details>
<summary><a href="https://github.com/wekan/wekan/commit/df41f61c2600bcbe52dca3b260f7219992946228">The waiting page hid a healthy WeKan: the probe never found a driver to ask with</a>. Thanks to Alishara and xet7.</summary>

Reported against this release, with a screenshot: the login page never loads,
the container logs *The database is not answering yet* and serves the waiting
page, while `mongosh` on the host talks to the same MongoDB without complaint -
a Meteor 3 production setup from
[docs/Platforms/FOSS/Container/Docker/Meteor3](https://github.com/wekan/wekan/tree/main/docs/Platforms/FOSS/Container/Docker/Meteor3),
MongoDB 7.0.40, replica set `rs0`, `network_mode: host`, `MONGO_URL` a single
host with `authSource`. **10.91 worked and this did not**, which is the whole
story: the page is new here, and it is what broke.

The database was never the problem. `db-ready.mjs` asked for the driver at
`programs/server/node_modules` only - and `mongodb` is a **devDependency, not a
dependency**, so a production bundle has NOTHING there. Meteor's own driver
lives under `programs/server/npm/node_modules/meteor/npm-mongo`. `require` threw
`MODULE_NOT_FOUND` on every ask, in every container, whatever the database was
doing; the `catch` turned that into "not ready", the entrypoint sent the reason
to `/dev/null`, and WeKan sat behind the page for the whole ten-minute window
before starting.

The snap already carries this scar. Its `db-eval.mjs` says so in a comment -
*"made WeKan loop 'MongoDB not ready' forever"* - and resolves the driver from a
list of bundle paths; `db-ready.mjs` now uses the same list. That is also why
the snap was unaffected by any of this: it serves its own page from
`wekan-control` and never runs `db-ready.mjs` at all.

**No driver no longer means a page.** It exits 2, distinct from 1, and the
entrypoint starts WeKan without the page: "I could not ask" is not evidence that
anything is wrong, and a page shown on that basis hides a WeKan that would have
served fine. Docker with an external MongoDB needs no waiting screen, and it no
longer gets one it has not earned.

Two more faults were found while proving it, both of which could hold the page
in front of a working database on their own:

- The probe forced `directConnection: true`. For one host that is harmless; a
  replica set is normally a SEED LIST, and the driver refuses that outright -
  *MongoParseError: directConnection option requires exactly one host*. The
  throw happened while the client was being CONSTRUCTED, outside the `try`, so
  the probe died with an unhandled error. The options come from the URL now,
  which is also the more correct question: WeKan connects with the URL as
  written, so a probe that quietly connects DIFFERENTLY can report ready for a
  database WeKan cannot reach - dropping the page and leaving the port closed,
  which is the exact fault the page exists to prevent.
- Nothing said why. The first probe's reason is printed now, the three-second
  poll stays quiet, the last one reports again if the window expires - and the
  reason is put **on the page**, because whoever is waiting is looking at a
  browser, not at `docker logs`. *MongoServerSelectionError: connect
  ECONNREFUSED wekan-db:27017* names the host that could not be reached.

`WEKAN_DB_WAIT_PAGE=false` still turns the whole thing off.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
