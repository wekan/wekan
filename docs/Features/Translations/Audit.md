# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 12,291 |
| Restored pre-pull; awaiting validation | 4,059 |
| Reviewed; retained unchanged | 176 |
| Pending review or repair | 3,555 |
| Total tracked | 20,081 |

**Repairs remain unfinished.** Restored and unflagged values still need validation.

Fixes address wrong-language text, terminology, warnings, placeholders, JSON examples and calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **12,791** exact before/after values, including repairs outside the audit.

Latest translation fix: **2026-09-13**, local commit `3f06b5f96f252e4aeb162c6e1866aec1b8e294c4` — eight Volapük import/member-mapping strings repaired, including French instructions and Esperanto All Boards text. Preserved existing-user matching, map-later/current-user fallback and possible success despite import errors; assembled wording remains low confidence.

**Verification:** correction and progress tests pass, covering exact values, placeholders, JSON examples and key order. Native-speaker and browser checks remain outstanding.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** errors were not all introduced by the Transifex pull: 4,061 pulled changes and 16,020 additional local findings were audited. Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`); other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) preserves the original categorized tables; correction records preserve individual repairs and their sources.

After each repair batch, run `node releases/translations/audit-progress.mjs --update-summary` and update the latest fix commit and verification. No remote uploads performed.
