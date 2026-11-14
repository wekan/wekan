# Board Settings / Swimlane

A board administrator can enable **Lock swimlane height resize** here. When
unlocked, a swimlane's resize handle changes its height.

**One shared list header row** shows the Swimlanes view as swimlanes were
before each one had lists of its own: every swimlane shows the same lists, all
of the board's lists in their order, under one row of list headers that stays
at the top, and the swimlanes scroll sideways together. Each list still holds
the cards of the swimlane it is shown in. Nothing is changed in the lists, so
on a board whose swimlanes have different lists, turning it off shows each
swimlane's own lists again
([#2805](https://github.com/wekan/wekan/issues/2805),
[#6902](https://github.com/wekan/wekan/issues/6902)).

**WIP Limit Groups** opens the shared work-in-progress limits. Choose the lists
that should count together and a limit, then add the group. The swimlane
quick-select checks that swimlane's own lists for you; review the selection
before saving. An existing group can be edited, enabled, disabled or removed.

See [WIP Limit Groups](../../Lists/WipLimit/WIP-Limit-Groups.md) and
[Swimlanes](../../Swimlanes/Swimlanes.md).
