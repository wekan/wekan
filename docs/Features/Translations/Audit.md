# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 14,590 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 179 |
| Pending review or repair | 1,254 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. The broader check of **829** German-identical values is reviewed: **829** repaired, including the mistaken German `cron` retention corrected to the actual tool name **Cron**. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **16,277** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `de2919013` — repaired **15** Finnish Veps migration controls/status values, resolving **seven** original findings. Preserve all-migration scope and distinguish pause, stop, start, resume, completion and failure outcomes; use the existing Veps migration term instead of physical file transfer. Dictionary and native MediaWiki evidence is recorded per key. All **16,277** correction records, placeholders, key order and actual i18next rendering checks pass. **Low confidence:** technical loan inflection and composed UI grammar need fluent review, alongside earlier authentication/network/list/storage/calendar/account wording. Veps has **513** pending original findings. Translation repairs continue; broader wrong-language/script and restored-value validation remain outstanding.

**Mirror interruption completed (2026-09-13):** local commit `02383540a` adds organization management, destination namespaces, host/organization/repository archives, linked comment attachments/webpage HTML, static HTML/CSV indexes and rate limits for all forges with tokenless public GitHub reads. Full Node verification: **1,014 suites, zero failures**; final targeted checks and Chromium/Firefox static checks pass. WebKit is unavailable locally (ICU 74/Docker). Translation repairs subsequently resumed; current counts and latest fix are above.

**Language workflow (2026-09-13):** all 245 popup locales are wired and country-then-language flags are checked (`8549b6c4c`). Browser preference ordering, legacy/script aliases, delayed saved profiles and no automatic profile writes pass runtime checks (`1666a2012`, `37ae64fa8`); actual browser execution remains pending. Uzbek Arabic (`uz-AR`) still contains Latin core labels and needs repair.

**Upload workflow (2026-09-13):** Colombian/French/Khmer/Guarani/Portuguese/Russian mappings are repaired, with 241 distinct targets and reported local aliases. All nine Colombian differences were reviewed (`6db460891`), retaining seven valid alternatives. Timestamped terminal/error logs and failure exit codes pass offline checks (`196c0addc`). Chinese script mapping now uses supported `zh-Hans` (`c2a9168c4`). Manx, Ladin, Aromanian, Tigre and Wolaytta remain unsupported catalogue failures; no substitution by different languages or remote uploads was performed.

**Maintainer-run upload (2026-09-13):** inspected local report `translations-push-2026-09-13T16-05-10-615Z/report.json`: **237 successful uploads**, including English source, and **five failures** (`gv`, `lld`, `rup`, `tig`, `wal`). All eight formerly failing mappings succeeded. Catalogue discovery completed: zero supported-but-failed targets, five unsupported local codes and 500 supported catalogue codes without local upload targets. Those 500 codes need suitable local translations/mappings before upload. This verifies the saved report, not current remote contents; no uploads were run here. The outcome/support summary (`637dbebd6`) passes offline regressions. Retry regression (`ad294f707`) verifies all five missing codes are added and fully uploaded on a later run once supported; prior reports never suppress retries.

**Verification (2026-09-13):** **1,014 Node suites, zero failures** after the latest Veps list/storage and mirror changes; final targeted mirror regressions pass; the final mirror retry adjustment also passes its targeted regression. Correction and audit-progress regressions pass. The original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. #6691 partial-profile/impersonation regression passes in all three browsers without retries. The second EVERYTHING run finished with failures in the now-fixed Fossil menu registration check and Chromium board-export popup readiness; database conformance, FerretDB and the other two browsers passed. Board-export verification remains outstanding. Static mirror browser checks pass in Chromium and Firefox; WebKit cannot launch locally because ICU 74 is missing and Docker is unavailable. Fluent-speaker checks remain outstanding; translation repairs resume next.

**Unresolved reviews:** Apostrophe support for Klingon search operators is implemented in local commit `0026390bb`; actual Query runtime and card-number regressions pass. All 37 remaining search keywords are replaced and actual-locale parser regressions pass; localized browser verification remains pending. Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
