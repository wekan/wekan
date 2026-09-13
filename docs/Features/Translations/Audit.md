# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 10,234 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 5,612 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **10,315** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `c34390fdcfac816ab598cbc15f576461b727addb` — Chichewa Saudi Hijri label translated with explicit moon sighting, using [Malawi publisher wording](https://alhaqq-malawi.org/wp-content/uploads/2023/03/Al-Haqq-March-2023.pdf); **1 Chichewa civil-epoch finding remains**. Specialized grammar still needs native review. Exact-value, placeholder, JSON example, HTML-tag/entity, key-order and idempotency checks pass; live browser verification is unavailable.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables. Run `node releases/translations/audit-progress.mjs` for current totals; add `--locale <tag>` for remaining language findings.

After each repair batch, refresh this summary’s date, counts, latest fix commit and verification status; replace previous batch details. Keep detailed findings and corrections in the linked records. No remote uploads have been performed.
