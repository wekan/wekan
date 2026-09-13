# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 9,627 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 175 |
| Pending review or repair | 6,220 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **9,704** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `16011256022a3fb871f27ce6fe578068e8afd9da` — Silesian calendar selector repaired and calendar label aligned; **233 Silesian findings remain**. [Published Silesian usage](https://sbc.org.pl/Content/212056/PDF/Gornoslazak_2016_R000_001_%2812%29.pdf) supports Kalyndŏrz. Breton flagged queue is empty; specialized wording and grammar still need review. Exact-value, placeholder, JSON example, key-order and idempotency checks pass; live browser verification is unavailable.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, refresh this summary’s date, counts, latest fix commit and verification status; replace previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
