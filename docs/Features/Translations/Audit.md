# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 7,671 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 175 |
| Pending review or repair | 8,176 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **7,744 values**, including fixes outside the audit. Per-language remaining work is available through the command below.

Latest fix: [84041e6f1](https://github.com/wekan/wekan/commit/84041e6f1db34c5d530c12551e29aa0321127056), **2026-09-13** — nine Aromanian tracking and subtask messages repaired with low confidence; **206 Aromanian findings remain**. Exact-value, placeholder, key-order and idempotency checks pass. Wording needs native-speaker review; live browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors predated that pull in a [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983). Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

After each repair batch, refresh counts, date, latest correction commit and checks; replace previous batch details. Keep categorized findings in the evidence file and before/after values in the correction history. No remote uploads have been performed.
