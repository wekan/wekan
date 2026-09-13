# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,378 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,468 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Restored and unflagged values still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,925** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `582aaa88245938fa4e8b56a595bb781829d33d14` — five Volapük invitation, member-search, favorite and WIP strings repaired. Source tokens/newlines and action scopes preserved; assembled wording remains low confidence.

**Verification:** correction and progress tests pass. Native-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables; correction records retain repairs and sources.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` and update the latest fix commit and verification. No remote uploads performed.
