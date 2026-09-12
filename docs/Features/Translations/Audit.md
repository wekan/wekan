# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 6,476 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 128 |
| Pending review or repair | 9,418 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, missing warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **6,538 values**, including fixes outside the audit. Flagged queues are complete for Bosnian, Croatian, Macedonian, both Slovenian locales, Latvian, Romanian, Slovak, both Galician locales and Asturian.

Latest fix: [87bab5a55](https://github.com/wekan/wekan/commit/87bab5a55cf42a35de5435549dc560601146d03b), **2026-09-13** — four Aragonese S3 storage/credential values repaired; two valid region/path-style labels retained, preserving providers and AWS navigation. **50 Aragonese findings remain.** Meaning, exact-value, placeholder, key-order, review and idempotency checks pass; Aragonese and Asturian wording need native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and checks. Replace the latest-fix paragraph rather than appending batch reports; keep detailed findings in the evidence file and before/after records in the correction history. No remote uploads have been performed; the force-upload script was tested offline only.
