# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 8,667 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 175 |
| Pending review or repair | 7,180 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **8,740** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `da3b0fbf6fd6a2baa868fb5590c3a80532bb561d` — twelve Occitan migration and custom-field findings repaired; **229 Occitan findings remain**. Paused/failed states, irreversible-history warning, format placeholder and HTML entities are preserved. Regional terminology and earlier low-confidence batches need language review. Exact-value, placeholder, key-order and idempotency checks pass; live browser verification is unavailable.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, refresh this summary’s date, counts, latest fix commit and verification status; replace previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
