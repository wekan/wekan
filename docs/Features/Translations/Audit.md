# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 5,860 |
| Original pull values restored to pre-pull local values | 4,061 |
| Reviewed and retained unchanged | 94 |
| Pending review or repair | 10,068 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Repairs cover wrong-language text, kanban terminology, omitted restrictions and warnings, JSON examples, placeholders, calendar names and search/date formatting. The correction history records **5,922 values**, including fixes outside the audit. Flagged Bosnian, Croatian, Macedonian, Slovenian (both locales), Latvian, Romanian, Slovak and both Galician queues are complete.

Latest fix: [1b7d2be79](https://github.com/wekan/wekan/commit/1b7d2be79002155ec26173ed42265bcf9ddb6bb3), **2026-09-13** — eight Asturian import, invitation and keyboard-message corrections. Repairs preserve attachment ZIP structure, unmapped-member fallback, existing-user selection and shortcut enable/disable states. **351 Asturian findings remain.** Meaning, exact-value, placeholder, key-order and idempotency checks pass; Asturian wording needs native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and verification results. Keep detailed findings in the evidence file. No remote uploads have been performed; the force-upload script was tested offline only.
