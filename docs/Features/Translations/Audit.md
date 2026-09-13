# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,866 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 177 |
| Pending review or repair | 2,979 |
| Total tracked | 20,081 |

**Paused at the maintainer’s request on 2026-09-13.** Stop repairs now; resume only when requested. Klingon has **361** pending flagged findings. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **13,544** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `f6e2f742c298621c3cb11de6a4dce6cae64a9425` — four German account/administrator messages replaced with Klingon. Activation states, opposite click actions and administrator requirements preserved; wording needs fluent-speaker validation.

**Verification:** correction/review and progress suites pass. Full Node audit: 986 suites, 19 failures; changelog formatting subsequently fixed, 18 other observed failures tracked in [TODO Later](../../../CHANGELOG.md). Fluent-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
