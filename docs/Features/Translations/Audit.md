# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 6,086 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 99 |
| Pending review or repair | 9,837 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, missing warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **6,148 values**, including fixes outside the audit. Flagged Bosnian, Croatian, Macedonian, Slovenian (both locales), Latvian, Romanian, Slovak and both Galician queues are complete.

Latest fix: [de737d28f](https://github.com/wekan/wekan/commit/de737d28f323666e1972c0d7a28c1a282f60f7ed), **2026-09-13** — eight Asturian checklist-visibility, minicard-label, CSV/TSV and status-search corrections; hiding all versus checked items remains distinct from deletion. **120 Asturian findings remain.** Meaning, exact-value, placeholder, key-order and idempotency checks pass; Asturian wording needs native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and checks. Keep detailed findings in the evidence file. No remote uploads have been performed; the force-upload script was tested offline only.
