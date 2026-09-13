# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 14,463 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 179 |
| Pending review or repair | 1,381 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. The broader check of **829** German-identical values is reviewed: **829** repaired, including the mistaken German `cron` retention corrected to the actual tool name **Cron**. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **15,973** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, correction commit `1c53f96ad` fixed Klingon Cron. Latest review commit `ad209a3cb` retained the Corsican reactivity label after confirming native use of **reattività**; shared Italian spelling alone is not an error. Original Venetian and main Venda findings are repaired. Restored/unflagged values and low-confidence wording still require validation; Veps, Tamazight and wider repairs continue.

**Verification (2026-09-13):** **1,002 Node suites, zero failures**; the original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. #6691 partial-profile/impersonation regression passes in all three browsers without retries. Fresh EVERYTHING verification is running; an added Fossil script required menu registration, now fixed and checked. Fluent-speaker checks remain outstanding; translation repairs have resumed.

**Unresolved reviews:** Apostrophe support for Klingon search operators is implemented in local commit `0026390bb`; actual Query runtime and card-number regressions pass. All 37 remaining search keywords are replaced and actual-locale parser regressions pass; localized browser verification remains pending. Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
