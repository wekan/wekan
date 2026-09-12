# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-12**.

| Status | Audit keys |
| --- | ---: |
| Explicitly corrected | 5,069 |
| Original pull values restored to pre-pull local values | 4,061 |
| Reviewed and retained unchanged | 78 |
| Pending review or repair | 10,873 |
| Total tracked | 20,081 |

The full translation repair goal remains unfinished. Counts describe the tracked audit findings; unflagged strings are not individually certified. Restored pre-pull values are not automatically certified as correct translations.

## Fixes completed

Repairs address wrong-language text, incorrect kanban terminology, missing restrictions and warnings, malformed JSON examples, translated placeholders, calendar names, search syntax and date/message argument order. The reviewed correction list contains **5,131 values**, including corrections outside the flagged audit rows.

The flagged Bosnian, Croatian, Macedonian and both Slovenian queues are complete. Other completed queues include Latvian, Romanian, Slovak and several smaller regional queues. **Bosnian has no remaining flagged findings**.

Latest translation correction: [82355a360](https://github.com/wekan/wekan/commit/82355a36028a5f46049149a4692aca8cbecf7035), **2026-09-12**, fixes 10 Galician regional move, removal, restoration and custom-field activity values containing Portuguese. Reuses individually reviewed Galician wording, preserving old/new board and lane arguments, label aliases and exact checklist-placeholder casing. The Galician regional queue has 621 findings remaining. Actual cross-board move and checklist-item removal rendering, exact-value, token, key-order and idempotent repair checks pass.

## Provenance

Not all errors came from Transifex. The captured pull changed 4,061 values; the full-local audit added 16,020 findings, including uncertain candidates. Bosnian errors were introduced by the September 5 local completion commit [bdb3b1588](https://github.com/wekan/wekan/commit/bdb3b15886a749b725b5290ba0109fcba955f983). There were no Bosnian changes in the captured pull. Differing from English does not prove correct language or meaning. Ultimate provenance of other local findings remains unverified.

## Evidence and verification

- [Detailed audit tables](Audit-Evidence.md): original local/pulled values, categories and problem descriptions.
- [Correction history](../../../releases/translations/audited-corrections.json): exact before/after values and reasons. Git history records dated correction commits.
- Run `node releases/translations/audit-progress.mjs` for current totals; use `--locale <tag>` for remaining findings.
- Regression checks cover exact corrections, source placeholders, JSON fields, key order, newer-translation preservation and idempotency. Bosnian rendering and meaning checks pass. Live Meteor browser verification remains unavailable.

No subagents or remote pushes were used. The force-upload script has only been tested offline and has not uploaded to Transifex.
