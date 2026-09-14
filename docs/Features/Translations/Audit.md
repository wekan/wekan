# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,218 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 179 |
| Pending review or repair | 626 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. The broader check of **829** German-identical values is reviewed: **829** repaired, including the mistaken German `cron` retention corrected to the actual tool name **Cron**. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **17,476** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-14**, local commit `88ba30aec` — replaced two French custom HTML insertion actions. Preserve opening `<body>` versus closing `</body>`, HTML identifier and opposite before/after directions. Native MediaWiki components support the vocabulary; specified/custom qualifier adaptation and full phrase composition remain **low confidence** pending fluent review. All **17,466** correction/rendering checks pass. **627** originals remain pending across **17** locales, including **484** Tamazight. Restored/unflagged values and earlier low-confidence wording still need validation. Live browser verification was not run; no translations were pushed.

**Build interruption follow-up (2026-09-14):** `.tools/wekan22` contains the old v11.75 missing-Moment failure, already repaired in `43adfe1a7`. A fresh Meteor 3.6-beta.0 bundle build passes on Linux arm64, and six assignee/calendar/release-preflight Node test entries pass. Log: `.tools/log/build-dev-bundle/2026-09-14/04-25-58/dev.txt`. Native amd64 and live browser checks were not run. Translation counts and the remaining validation scope above are unchanged.

**Color-name reference review (2026-09-14):** Sardinian and Aromanian `color-magenta` remain pending. Searches did not establish native usage; Italian publications and English WordPress changelogs are insufficient. The [Vrabie English–Aromanian dictionary](https://s3.wasabisys.com/fars-media/wp-content/uploads/2020/07/An-English-Aromanian-Macedo-Romanian-Dictionary-%C2%A9Society-Farsharotu-1.pdf) has poor OCR and no searchable magenta/fuchsia entry, which does not prove absence. Further review needs a legible dictionary entry or native usage; neither color value was changed or accepted as verified.

**Checklist reference review (2026-09-14):** the candidate [computing lexicon](https://www.fichier-pdf.fr/2014/08/31/lexique-informatique/) labels `asenqed` (check/control) **KBL**. Its indexed entry does not establish Standard Moroccan checklist usage; the original hosting could not be fetched. A [readable CNAM-hosted edition](https://cedric.cnam.fr/~bouzefra/books/amawal.pdf) was subsequently found; it distinguishes mixed source dialects and proposed neologisms, so it does not justify blanket Standard Moroccan acceptance. Existing schwa-heavy checklist strings and full confirmation wording remain pending terminology and dialect review. No blanket retention or replacement is justified by this reference.

**Language validation (2026-09-14), local commit `e4e3aa590`:** Wiktionary’s Veps transitive inflection tables confirm `surenda` (make larger) and `penenda` (make smaller) as second-person singular commands. Their imperative morphology is now reference-supported; screen-zoom usage remains open. The original keyboard findings remain unresolved: searches and the cached dictionary did not establish reliable keyboard-shortcut terminology. Counts are unchanged. References and the remaining scope are recorded per key in the correction ledger.

**Kashmiri reference review (2026-09-14), local commit `0db69cf6c`:** CLDR marks Islamic/civil names provisional and has no Saudi-sighting or astronomical-tabular names. Existing civil wording also lacks explicit tabular/civil-epoch qualifiers. Keep these technical terms pending further research; no values changed and counts are unchanged. All 17,236 correction checks pass.

**Tamazight calendar reference review (2026-09-14), local commit `dd2aaa19a`:** Current CLDR marks the Islamic name provisional and supplies no Buddhist or Hijri variant display names. Calendar terms and full variant qualifiers require additional research. No values changed; counts remain unchanged and all 17,273 correction checks pass.

**Manx calendar reference review (2026-09-14), local commit `669be8895`:** Current CLDR supplies no calendar display names. Coptic terminology was not established by dictionary searches; full tabular/civil/astronomical-epoch qualifiers and the composed sighting phrase remain open. No values changed; three Manx originals remain pending. All 17,276 correction checks pass.

**Silesian reference review (2026-09-14):** [Native MediaWiki messages](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/szl.json) use `bazy danych` in database errors and locking instructions, and both `pliki` and `zbiory` for files. These shared technical terms alone do not establish wrong-language text. No reference for the full raw-database-file label was established; `sandstorm-raw-mongodb` remains pending, with no value or count changes. Further review should focus on the raw-file qualifier and the complete phrase, preserving accepted terminology.

**Language popup follow-up, 2026-09-14:** local commit `c8d17877e` places
language flags beside language names and country flags inside regional
parentheses, reversing visual placement for RTL. All 245 registry/helper
checks and Jade compilation pass; LTR/RTL browser regressions are added and
syntax-checked but not run live. Translation repair counts are unchanged.

**Board View Settings follow-up, 2026-09-14:** local commit `3b74d2c3c`
keeps the wide popup visible and enables title dragging and bottom-right
resizing. Geometry, pointer and Jade checks pass; browser coverage is added
and syntax-checked, with live execution pending. Translation counts are
unchanged; the translation audit remains active.

**Activity viewer follow-up (2026-09-14):** local commit `02f233649`
renders activity values in card and sidebar feeds through the shared
Markdown/emoji/permitted-HTML viewer, respecting security display modes.
Focused viewer, navigation, source-URL and Jade checks pass; browser coverage
is syntax-checked, not run live. Translation counts are unchanged; repairs
and wording validation remain active.

**Remaining validation:** all restored/unflagged values and low-confidence replacements remain open. Detailed per-key caveats are retained in the correction ledger and source commits. These include Veps composed UI, card, notification, calendar, timing, file/archive, metric and legal terminology/inflection; Neapolitan technical checklist usage; Fulah/Bambara calendar composition; and CLDR-provisional Ewe civil-calendar and Tongan tabular-calendar/astronomical-epoch phrase composition, and Sakha civil/astronomical-calendar/era-to-epoch and sighting-phrase composition. Field sums, parent-card terminology, keyboard shortcuts, remaining migration/search messages and other calendar variants need further language research. Wrong-language/script and fluent-speaker checks remain unfinished.

**Security interruption (2026-09-14):** `c1246d720` reviews both saved `.tools/wekansec20` alerts and hardens exact archive-host checks and shell-free mirror dispatch, including direct Windows Node execution. All 25 focused mirror test entries pass; native Windows and remote CodeQL rescanning remain unverified. Translation counts and remaining validation are unchanged.

**Time view interruption (2026-09-14):** local commit `dc0855711` renders card titles through the shared Markdown/emoji viewer, respecting Admin Panel plain-text security mode. The report regression passes; both browser modes are added and syntax-checked, not run live. The shared viewer also obeys Admin Panel plain-link mode; `a7b333dad` adds both clickable/non-clickable browser regressions, syntax-checked but not run live. Timeline, DHTMLX Gantt and shared report viewers are also repaired (`457614a2a`, `5ca16f32e`); Control chart coverage is explicit (`ca8d59978`). Combined focused verification passes 33 Node entries; browser tests remain syntax-checked only. Authenticated legacy avatar prefix fallback is repaired (`c2a390928`); the production attachment 404 remains undiagnosed. Translation counts remain unchanged.

**Calendar interruption (2026-09-14):** local commit `ef12548a9` replaces the rejected FullCalendar 5 `isRTL` option with `direction` in both board calendars. Four focused calendar test entries pass, including RTL/LTR and negative legacy-option checks. Browser regressions are added and syntax-checked, not run live. Translation counts and remaining language validation are unchanged.

**Build logging update (2026-09-14):** `5f8f22f8c` unifies build.sh/build.bat logger directories; `3fedee2b9` prints completion log paths and fixes read-only server manifests in local release preparation. Linux arm64 development and release builds and release startup smoke check pass; 13 targeted test entries pass. Native Windows execution was unavailable. Translation counts and remaining review work are unchanged; translation repairs remain unfinished.

**Build interruption (2026-09-13):** local commit `6cd193879` repairs the Meteor 3.6/Rspack 2 build's undeclared body-parser import using Meteor's existing Express parsers. Seven HTTP/build regressions pass. Meteor 3.6-beta.0/Rspack 2.2 and matching Docker metadata are committed locally (`35082f7d7`), and both previously failing version checks pass. All **1,015** Node suites pass. The actual Meteor bundle build remains under verification: the local beta tool is still starting before compilation. Translation counts and the latest translation commit remain unchanged.

**Mirror interruption completed (2026-09-13):** local commit `02383540a` adds organization management, destination namespaces, host/organization/repository archives, linked comment attachments/webpage HTML, static HTML/CSV indexes and rate limits for all forges with tokenless public GitHub reads. Full Node verification: **1,014 suites, zero failures**; final targeted checks and Chromium/Firefox static checks pass. WebKit is unavailable locally (ICU 74/Docker). Translation repairs subsequently resumed; current counts and latest fix are above.

**Language workflow (2026-09-13):** all 245 popup locales are wired and country-then-language flags are checked (`8549b6c4c`). Browser preference ordering, legacy/script aliases, delayed saved profiles and no automatic profile writes pass runtime checks (`1666a2012`, `37ae64fa8`); actual browser execution remains pending. Uzbek Arabic (`uz-AR`) still contains Latin core labels and needs repair.

**Upload workflow (2026-09-13):** Colombian/French/Khmer/Guarani/Portuguese/Russian mappings are repaired, with 241 distinct targets and reported local aliases. All nine Colombian differences were reviewed (`6db460891`), retaining seven valid alternatives. Timestamped terminal/error logs and failure exit codes pass offline checks (`196c0addc`). Chinese script mapping now uses supported `zh-Hans` (`c2a9168c4`). Manx, Ladin, Aromanian, Tigre and Wolaytta remain unsupported catalogue failures; no substitution by different languages or remote uploads was performed.

**Maintainer-run upload (2026-09-13):** inspected local report `translations-push-2026-09-13T19-02-29-845Z/report.json`: **237 successful uploads**, including English source, and **five failures** (`gv`, `lld`, `rup`, `tig`, `wal`). All eight formerly failing mappings succeeded; the latest saved run confirms the same outcome. The trailing catalogue list, including `wuu-Hant`, `xcl`, `yue`, `zh_MO`, `zh_TW.Big5` and `zza`, lists supported codes without local upload targets, not failed uploads. Catalogue discovery completed: zero supported-but-failed targets, five unsupported local codes and 500 supported catalogue codes without local upload targets. Those 500 codes need suitable local translations/mappings before upload. This verifies the saved report, not current remote contents; no uploads were run here. The outcome/support summary (`637dbebd6`) passes offline regressions. Retry regression (`ad294f707`) verifies all five missing codes are added and fully uploaded on a later run once supported; prior reports never suppress retries.

**Verification (2026-09-13):** **1,014 Node suites, zero failures** after the latest Veps list/storage and mirror changes; final targeted mirror regressions pass; the final mirror retry adjustment also passes its targeted regression. Correction and audit-progress regressions pass. The original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. #6691 partial-profile/impersonation regression passes in all three browsers without retries. The second EVERYTHING run finished with failures in the now-fixed Fossil menu registration check and Chromium board-export popup readiness; database conformance, FerretDB and the other two browsers passed. Board-export verification remains outstanding. Static mirror browser checks pass in Chromium and Firefox; WebKit cannot launch locally because ICU 74 is missing and Docker is unavailable. Fluent-speaker checks remain outstanding; translation repairs resume next.

**Unresolved reviews:** Member popup click handlers in sidebarFilters.js appear to invoke opposite assignment operations; this requires separate runtime review. Apostrophe support for Klingon search operators is implemented in local commit `0026390bb`; actual Query runtime and card-number regressions pass. All 37 remaining search keywords are replaced and actual-locale parser regressions pass; localized browser verification remains pending. Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
