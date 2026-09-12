# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 6,223 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 100 |
| Pending review or repair | 9,699 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, missing warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **6,285 values**, including fixes outside the audit. Flagged Bosnian, Croatian, Macedonian, Slovenian (both locales), Latvian, Romanian, Slovak both Galician and Asturian queues are complete.

Latest fix: [6881aac92](https://github.com/wekan/wekan/commit/6881aac926f96860e10ec1c4df8696663128233d), **2026-09-13** — six Aragonese scheduled-job, template-container, anonymization and attachment-setting corrections; import/export directions and container meaning preserved. **331 Aragonese findings remain.** Meaning, exact-value, placeholder, key-order and idempotency checks pass; Aragonese and Asturian wording need native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and checks. Keep detailed findings in the evidence file. No remote uploads have been performed; the force-upload script was tested offline only.
