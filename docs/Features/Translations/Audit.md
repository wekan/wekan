# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 6,569 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 149 |
| Pending review or repair | 9,304 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, missing warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **6,631 values**, including fixes outside the audit. Flagged queues are complete for Bosnian, Croatian, Macedonian, both Slovenian locales, Latvian, Romanian, Slovak, both Galician locales, Asturian, Aragonese, Friulian, Tok Pisin, Bulgarian and both Korean and both Afrikaans locales.

Latest fix: [0b334f2b2](https://github.com/wekan/wekan/commit/0b334f2b21fbe4e31787d7fb3b08c8b336e79a0e), **2026-09-13** — four Afrikaans Hijri variant labels repaired across both locales, preserving lunar observation and astronomical epoch. **Both flagged Afrikaans queues are complete.** Exact-value, placeholder, key-order and idempotency checks pass; earlier Tok Pisin, Friulian, Aragonese and Asturian wording need native-speaker review. Live Meteor browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings. Bosnian errors came from the September 5 [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983), with no Bosnian changes in the captured pull. Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

Update this summary after each repair batch with verified counts, date, correction commit and checks. Replace the latest-fix paragraph rather than appending batch reports; keep detailed findings in the evidence file and before/after records in the correction history. No remote uploads have been performed; the force-upload script was tested offline only.
