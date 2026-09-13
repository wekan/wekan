# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,860 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 177 |
| Pending review or repair | 2,985 |
| Total tracked | 20,081 |

**In progress.** Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **13,537** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `d9d99266b2b00131cff11f8c80debd6061757c00` — two German checklist text-conversion instructions replaced with Klingon. Each-line conversion and original ordering preserved; text-line terminology needs fluent-speaker validation.

**Verification:** correction and progress tests pass; fluent-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
