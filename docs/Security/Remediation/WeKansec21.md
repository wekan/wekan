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
| REST board title writes by normal members | Confirmed and repaired in `c33e9c3bf`: board title, card settings and three rule mutation endpoints now use the board-admin guard, retaining site-admin access. Actual guard and endpoint inventory tests, card-settings and rule suites pass. Problems key `authz.manage-board`; browser regression syntax-checked, live execution pending. Critical changelog and Hall of Fame added. |
| moveList clone/archive by comment-only members | Confirmed and repaired in `9b1fb5214`, including moveSwimlane, moveChecklist, importScoped, renameAttachment and changeHistory write siblings. Canonical role decisions, reported method attack and sibling guard inventory pass; browser regression syntax-check passes, live execution pending. Bounded Problems key `authz.mutation`; Hall of Fame and critical changelog updated. |
| Button-rule cross-board writes | Confirmed and repaired in `64123a603`: manual method and shared action dispatcher both enforce write capability and card-to-rule board binding. Board buttons without cards remain supported. Role/boundary decisions, dispatcher inventory and existing rule suites pass; browser syntax-check passes, live execution pending. Problems key `authz.rule-button`, critical changelog and Hall of Fame added. |
| Cross-board comment creation | Confirmed REST and DDP insert boundary bypass; repaired in `d7ac619d6`, including DDP identity rebinding. Actual REST-prefix and DDP-deny decisions, foreign-card tests and server insert inventory pass; live browser execution pending. Problems key `authz.comment-card`, Hall of Fame and critical changelog added. |
| Unvalidated subtask deposit-board disclosure | Pending full source and reproduction review. |
| Code scanning alert 540, HTML-filter regexp | Pending exact source-location and parser review. |

Targeted test log: `.tools/tmp/sec21-private-only-tests.log`.
No live browser/server security reproduction has been run yet.
Translation review remains open at `docs/Features/Translations/Audit.md`.
No remote writes or publishing were performed.
