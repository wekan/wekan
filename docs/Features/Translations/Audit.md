# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,866 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 178 |
| Pending review or repair | 2,979 |
| Total tracked | 20,081 |

**Paused at the maintainer’s request on 2026-09-13.** Stop repairs now; resume only when requested. Klingon has **361** pending flagged findings. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **13,544** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `8ae15efffb1101970ff2bc04f5f628c1c072c307` — restored native Aragonese numbered examples after a mistaken English replacement and localized the Galician storage label. Reviewed shared terms are protected during filling; broader repairs remain paused.

**Verification (2026-09-13):** **999 Node suites, zero failures**; the original 19 failures are resolved. Meteor server tests (**527**), import checks (**10**) and Node E2E (**10**) pass. Fresh compiled Firefox/WebKit filter, template and calendar checks pass, as do URL-prefix checks in all three browsers and repeated user-switching checks. The final EVERYTHING browser matrix is running. The earlier diagnostic run passed **103** conformance cases on each of SQLite, PostgreSQL, MySQL and MariaDB, plus FerretDB unit, vet and integration. Fluent-speaker checks remain outstanding; translation repairs remain paused.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
