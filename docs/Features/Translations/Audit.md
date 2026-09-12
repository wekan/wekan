# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 5,963 |
| Original pull values restored to pre-pull local values | 4,061 |
| Reviewed and retained unchanged | 98 |
| Pending review or repair | 9,961 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Repairs cover wrong-language text, kanban terminology, omitted restrictions and warnings, JSON examples, placeholders, calendar names and search/date formatting. The correction history records **6,025 values**, including fixes outside the audit. Flagged Bosnian, Croatian, Macedonian, Slovenian (both locales), Latvian, Romanian, Slovak and both Galician queues are complete.

Latest fix: [e98621941](https://github.com/wekan/wekan/commit/e986219416643ce20d9a5e44db39f97c22bdfc4d), **2026-09-13** — ten Asturian checklist, custom-field and due-activity corrections. Repairs distinguish marking a checklist incomplete from failing to complete it, preserving argument order and card context. **244 Asturian findings remain.** Meaning, exact-value, placeholder, key-order and idempotency checks pass; Asturian wording needs native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and verification results. Keep detailed findings in the evidence file. No remote uploads have been performed; the force-upload script was tested offline only.
