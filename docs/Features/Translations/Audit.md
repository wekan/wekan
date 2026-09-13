# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 11,852 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,994 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,238** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `43a19564b2b078c2d79245232a2f4796ad2667d3` — 3 Buryat labels repaired: Chinese/Japanese calendar names and Gregorian ISO week detail. Published Buryat supports country genitives, calendar and week wording; retained Gregorian rendering and adapted grammar remain low confidence. Setting, other religious/country and Hijri variants still need review. Exact-value, placeholder, JSON-example, key-order and idempotency checks pass; live browser verification is unavailable.

**Review follow-up:** Silesian `sandstorm-raw-mongodb` remains pending: its wording overlaps Polish and existing Silesian technical strings, but dictionary searches did not establish the full phrase as correct Silesian. Keep the current value until stronger language evidence supports retaining or replacing it.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` to refresh the date and counts from current local values. Update the latest fix commit and verification status separately, replacing previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
