# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,249 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,597 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Restored and unflagged values still need validation.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,726** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `bbec32d4749cde298ce2e65e8a827ad08c58dbbb` — six French board/member and custom-HTML descriptions replaced with Volapük. Preserved permissions, membership scope/direction and exact body tags/placement; assembled wording remains low confidence.

**Verification:** correction and progress tests pass, covering exact values, placeholders, JSON examples and key order. Native-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** errors were not all introduced by the Transifex pull: 4,061 pulled changes and 16,020 additional local findings were audited. Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`); other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables; correction records preserve individual repairs and their sources.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` and update the latest fix commit and verification. No remote uploads performed.
