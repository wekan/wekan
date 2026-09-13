# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,698 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 177 |
| Pending review or repair | 3,147 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Restored and unflagged values still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **13,321** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `494ed5d0f690769d1c8b65f2f6dcda23706be8e7` — eight German comment activities/controls (three flagged findings) replaced with Klingon, preserving comment-text placeholders and addition/edit/deletion distinctions. Full software wording is low confidence and needs fluent-speaker validation.

**Verification:** correction and progress tests pass. Native-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables; correction records retain repairs and sources.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` and update the latest fix commit and verification. No remote uploads performed.
