# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 5,263 |
| Original pull values restored to pre-pull local values | 4,061 |
| Reviewed and retained unchanged | 78 |
| Pending review or repair | 10,679 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Repairs cover wrong-language text, kanban terminology, omitted restrictions and warnings, JSON examples, placeholders, calendar names and search/date formatting. The correction history records **5,325 values**, including fixes outside the audit. Flagged Bosnian, Croatian, Macedonian, Slovenian (both locales), Latvian, Romanian and Slovak queues are complete.

Latest fix: [d98e80bb3](https://github.com/wekan/wekan/commit/d98e80bb3055435858c111bddd2fb5197a1a71db), **2026-09-13** — six Galician regional credential, invitation, member-fallback and label corrections. **427 regional findings remain.** Meaning, exact-value, placeholder, key-order and idempotency checks pass; live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and verification results. Keep detailed findings in the evidence file. No remote uploads have been performed; the force-upload script was tested offline only.
