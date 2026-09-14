# WeKansec21 remediation progress

Reviewed: 2026-09-14. Work is incomplete; no security release is claimed.

The ten saved reports in `.tools/wekansec21` are the review inputs.
Reporter credit in the advisories: Wenhao Wu, Southeast University.

| Report | Current progress |
| --- | --- |
| Private-only board creation bypass | Confirmed in current method and sibling card-to-board conversion. Both now force private visibility under the setting. Catalog key `authz.board-visibility` records blocked overrides. Two targeted suites and Hall of Fame catalog coverage pass, including logging-failure conversion and existing server board-insert inventory coverage. Local source commit `962debc12`; browser test added and syntax-checked, live execution pending. Hall of Fame pages and critical upcoming changelog added. |
| Arbitrary private boards in sendInvitation | Pending full source and reproduction review. |
| Linked-card source writes by comment-only members | Pending full source and reproduction review. |
| Removed-member acceptInvite reentry | Pending full source and reproduction review. |
| REST board title writes by normal members | Pending full source and reproduction review. |
| moveList clone/archive by comment-only members | Pending full source and reproduction review. |
| Button-rule cross-board writes | Pending full source and reproduction review. |
| Cross-board comment creation | Pending full source and reproduction review. |
| Unvalidated subtask deposit-board disclosure | Pending full source and reproduction review. |
| Code scanning alert 540, HTML-filter regexp | Pending exact source-location and parser review. |

Targeted test log: `.tools/tmp/sec21-private-only-tests.log`.
No live browser/server security reproduction has been run yet.
Translation review remains open at `docs/Features/Translations/Audit.md`.
No remote writes or publishing were performed.
