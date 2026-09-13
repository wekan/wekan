# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 9,520 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 175 |
| Pending review or repair | 6,327 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **9,596** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `8e0c7f90c8f84de88280742762af7c964c5f2c19` — twelve Breton notification, role and operator-error findings repaired; **106 Breton findings remain**. Operator placeholders, OIDC naming and positive-integer requirements are preserved. Specialized terminology and grammar need language review. Exact-value, placeholder, JSON example, key-order and idempotency checks pass; live browser verification is unavailable.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, refresh this summary’s date, counts, latest fix commit and verification status; replace previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
