# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 9,200 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 175 |
| Pending review or repair | 6,647 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **9,275** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `b5fd95d61791a79c4928d22c7ab209d14ede3768` — eight Breton migration-confirmation, search and setting findings repaired; **426 Breton findings remain**. Board/member storage scopes, integrity checks and searchable field types are preserved. Specialized terminology and grammatical wording need language review. Exact-value, placeholder, key-order and idempotency checks pass; live browser verification is unavailable.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, refresh this summary’s date, counts, latest fix commit and verification status; replace previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
