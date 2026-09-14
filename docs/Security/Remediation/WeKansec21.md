# WeKansec21 remediation progress

Reviewed: 2026-09-14. All ten inputs have source repairs or a test-only
resolution recorded below. Broader build and live security validation remain
incomplete; no security release is claimed.

The ten saved reports in `.tools/wekansec21` are the review inputs.
Reporter credit in the advisories: Wenhao Wu, Southeast University.

| Report | Current progress |
| --- | --- |
| Private-only board creation bypass | Confirmed in current method and sibling card-to-board conversion. Both now force private visibility under the setting. Catalog key `authz.board-visibility` records blocked overrides. Two targeted suites and Hall of Fame catalog coverage pass, including logging-failure conversion and existing server board-insert inventory coverage. Local source commit `962debc12`; browser test added and syntax-checked, live execution pending. Hall of Fame pages and critical upcoming changelog added. |
| Arbitrary private boards in sendInvitation | Confirmed configuration-gated grant bypass; repaired in `af9362126`. Every requested board must exist and grant the configured inviter role, or caller must be site admin. All grants validated before code mutation or mail. Role/grant inventory and email suites pass; browser syntax-check passes, live mail/redemption not executed. Problems key `authz.invitation-boards`, critical changelog and Hall of Fame added. |
| Linked-card source writes by comment-only members | Confirmed and repaired in `26e9e7030`: method and DDP link creation/pointer changes require source write access. Explicit non-writing source roles block delegated writes even through legacy links. UI follows the ceiling and no longer offers linking to non-writers. Actual permission/role decisions and link inventories pass; browser syntax-check passes, live execution pending. Problems key `authz.linked-write`, critical changelog and Hall of Fame added. |
| Removed-member acceptInvite reentry | Confirmed and repaired in `055cf42d4`: client updates cannot plant invitedBoards through operators, parent replacement or rename destinations. Actual modifier paths preserve ordinary preferences despite top-level field reporting. Profile guard and existing invitation suites pass; browser syntax-check passes, live execution pending. Problems key `authz.invitation-profile`, critical changelog and Hall of Fame added. |
| REST board title writes by normal members | Confirmed and repaired in `c33e9c3bf`: board title, card settings and three rule mutation endpoints now use the board-admin guard, retaining site-admin access. Actual guard and endpoint inventory tests, card-settings and rule suites pass. Problems key `authz.manage-board`; browser regression syntax-checked, live execution pending. Critical changelog and Hall of Fame added. |
| moveList clone/archive by comment-only members | Confirmed and repaired in `9b1fb5214`, including moveSwimlane, moveChecklist, importScoped, renameAttachment and changeHistory write siblings. Canonical role decisions, reported method attack and sibling guard inventory pass; browser regression syntax-check passes, live execution pending. Bounded Problems key `authz.mutation`; Hall of Fame and critical changelog updated. |
| Button-rule cross-board writes | Confirmed and repaired in `64123a603`: manual method and shared action dispatcher both enforce write capability and card-to-rule board binding. Board buttons without cards remain supported. Role/boundary decisions, dispatcher inventory and existing rule suites pass; browser syntax-check passes, live execution pending. Problems key `authz.rule-button`, critical changelog and Hall of Fame added. |
| Cross-board comment creation | Confirmed REST and DDP insert boundary bypass; repaired in `d7ac619d6`, including DDP identity rebinding. Actual REST-prefix and DDP-deny decisions, foreign-card tests and server insert inventory pass; live browser execution pending. Problems key `authz.comment-card`, Hall of Fame and critical changelog added. |
| Unvalidated subtask deposit-board disclosure | Confirmed and repaired in `c50d7b4ea`: source scope excludes unvalidated deposits and null IDs. Deposit content sits below its reactive visible-board cursor, with destination assignment policy and reactive per-card children for assigned-only roles. Status counts filter visible assigned scopes. Destination writes checked before landing structures; pointer insert/update/rename gates added. Targeted and existing subtask/status suites pass; browser syntax-check passes, live revocation/DDP pending. Problems key `authz.subtask-deposit`, critical changelog and Hall of Fame added. |
| Code scanning alert 540, HTML-filter regexp | Exact location is `tests/activityViewer.test.cjs:26`, a test-only regex substitute. Replaced with the existing sanitize-html parser in `11d2fe037`; malformed closing-tag cases and negative stub-shape check pass. No application exploit is claimed; no runtime attempt exists to log or new vulnerability Hall of Fame row to publish. |

Targeted test log: `.tools/tmp/sec21-private-only-tests.log`.
No live browser/server security reproduction has been run yet.
Translation review remains open at `docs/Features/Translations/Audit.md`.
No remote writes or publishing were performed.

Broader guard-inventory review continues, including trusted board-copy/helper
inserts and compatibility of the new reactive deposit publication.


Private-only insertion follow-up — 2026-09-14: local commit `749467c80`
enforces the policy in Boards.before.insert for trusted copies, imports and
lazy helpers. Hook regression covers enabled/disabled policy and failing
security logging. The policy and visibility-settings suites pass. Live
browser/server validation remains pending.
