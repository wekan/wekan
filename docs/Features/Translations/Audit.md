# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 11,919 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,927 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,309** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `3756665b6da17de7050cefb4a2d481572a94b5d8` — Cherokee Indian national calendar label repaired using [CLDR calendar name and terminology](https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/chr.xml). Adapted full label remains low confidence. Exact-value, token, JSON-example, key-order and idempotency checks pass; native-speaker and browser verification remain unavailable.

**Review follow-up:** Silesian `sandstorm-raw-mongodb` remains pending because available evidence does not distinguish its wording sufficiently from Polish.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` to refresh dates and counts, then replace the latest fix commit and verification details above. Use `--locale <tag>` to list remaining findings. Keep batch details in the correction records. No remote uploads have been performed.
