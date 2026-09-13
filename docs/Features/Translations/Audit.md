# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,176 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,670 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Counts cover flagged findings; restored and unflagged translations are not certified as correct.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,632** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `15ae8dfd9b6c274da8cc4466ca242b49d6b4a766` — seven French positioning/member/navigation strings repaired in Volapük using existing terminology and [Midgley vocabulary](https://www.markfoster.net/dcf/Volapuk_Dictionary.pdf). Preserved selected objects, directions, self addition, member avatars and own boards destination; assembled wording remains low confidence.

**Verification:** exact values, placeholders, JSON examples, key order and progress-update checks pass. Native-speaker and browser verification remain unavailable.

**Unresolved reviews:** Silesian `sandstorm-raw-mongodb` needs vocabulary validation; 17 Tigre calendar findings need Tigre-specific terminology validation. The existing Tigre calendar term is attested in Tigrinya, which does not establish whether it is valid in Tigre.

**Origin:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors already existed in local commit `bdb3b15886a749b725b5290ba0109fcba955f983`. Other ultimate origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary`, then update the latest fix commit and verification above. Keep detailed findings in the evidence file and batch changes in the correction records. No remote uploads performed.
