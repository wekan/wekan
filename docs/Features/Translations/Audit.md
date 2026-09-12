# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 6,691 |
| Restored pre-pull values awaiting further validation | 4,059 |
| Reviewed and retained unchanged | 174 |
| Pending review or repair | 9,157 |
| Total tracked | 20,081 |

**Translation repairs remain unfinished.** These counts cover flagged findings; unflagged strings and restored values are not certified as correct.

Fixes cover wrong-language text, terminology, warnings, JSON examples, placeholders and calendar/search formatting. The correction history records **6,763 values**, including fixes outside the audit. Per-language remaining work is available through the command below.

Latest fix: [5b7dd246a](https://github.com/wekan/wekan/commit/5b7dd246a4ecb987b0230bb3874c468b610d3263), **2026-09-13** — eight Zulu calendar values repaired, including adjacent mixed-English wording and duplicate parentheses; both flagged queues are complete. Exact-value, placeholder, key-order and idempotency checks pass. Epoch wording is low confidence and needs native-speaker review; live browser verification remains unavailable.

**Provenance:** not all errors came from Transifex. The captured pull changed 4,061 values; the local audit added 16,020 findings. Bosnian errors predated that pull in a [local completion commit](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983). Other ultimate origins remain unverified.

- [Detailed evidence](Audit-Evidence.md): original categorized tables and values.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons.
- Current totals: `node releases/translations/audit-progress.mjs`; remaining findings: add `--locale <tag>`.

After each repair batch, refresh counts, date, latest correction commit and checks; replace previous batch details. Keep categorized findings in the evidence file and before/after values in the correction history. No remote uploads have been performed.
