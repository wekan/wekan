# Issues closed on 2026-10-08 as already implemented

Open issues checked against the code on 2026-10-08 and found to be done
already. Each entry names where the feature is in the code, so the closing
commit says where it was fixed. The issues that are still open, and why, are in
[All-Open-Issues-Audit-2026-09-27.md](All-Open-Issues-Audit-2026-09-27.md).

## [#793](https://github.com/wekan/wekan/issues/793) Auto add user name to a
moved card

A rule does it: trigger "card moved to" a list
(client/components/rules/triggers/boardTriggers.jade) with the action "add
acting user as member" (client/components/rules/actions/cardActions.jade,
models/lib/ruleActingUser.js, server/rulesHelper.js). The mover is added to the
card's members, shown on the minicard, and can be removed.
