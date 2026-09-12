# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-12**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 5,001 |
| Original pull values restored to pre-pull local values | 4,061 |
| Reviewed and retained unchanged | 78 |
| Pending review or repair | 10,941 |
| Total tracked | 20,081 |

The full translation repair goal remains unfinished. Counts describe the tracked audit findings; unflagged strings are not individually certified. Restored pre-pull values are not automatically certified as correct translations.

## Fixes completed

Repairs address wrong-language text, incorrect kanban terminology, missing restrictions and warnings, malformed JSON examples, translated placeholders, calendar names, search syntax and date/message argument order. The reviewed correction list contains **5,063 values**, including corrections outside the flagged audit rows.

The flagged Bosnian, Croatian and Macedonian queues are complete. Other completed queues include Latvian, Romanian, Slovak and several smaller regional queues. **Bosnian has no remaining flagged findings**.

Latest translation correction: [90b55bac6](https://github.com/wekan/wekan/commit/90b55bac66490094872d7f69872fdbc6f1930e34), **2026-09-12**, fixes 24 Slovenian support, swimlane validation, visibility, subtask and scan-step values. Repairs preserve logged-in-only support, enabled-page status, positive-integer height requirements and private-board-only scope. Each Slovenian queue has 13 findings remaining. Meaning, token, exact-value, key-order and idempotent repair checks pass.

## Provenance

Not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings, including uncertain candidates. Bosnian errors were introduced by the September 5 local completion commit [bdb3b1588](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983). There were no Bosnian changes in the captured pull. Differing from English does not prove correct language or meaning. Ultimate provenance of other local findings remains unverified.

## Evidence and verification

- [Detailed audit tables](Audit-Evidence.md): original local/pulled values, categories and problem descriptions.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons. Git history records dated correction commits.
- Run `node releases/translations/audit-progress.mjs` for current totals; use `--locale <tag>` for remaining findings.
- Regression checks cover exact corrections, source placeholders, JSON fields, key order, newer-translation preservation and idempotency. Bosnian rendering and meaning checks pass. Live Meteor browser verification remains unavailable.

No subagents or remote pushes were used. The force-upload script has only been tested offline and has not uploaded to Transifex.
