# Linked cards

A linked card is a mirror of an existing card. You can place it in another
list on the same board, or on another board you can edit. Labels and other
shared content come from the source; changing a label through either card
updates that shared content. The mirror keeps its own board/list position.

To add a mirror, open the add-card form in the destination list and choose
**Link**. Select the source board, optionally narrow by swimlane/list, select
the source card, and confirm. The source board can be the current board.
The picker omits sources already mirrored on the destination board.

The source must be a real card. Linking to another linked card, a linked
board or a template card is rejected to prevent broken link chains. Creating
a mirror requires write access to the source and destination boards. A
whole-board link cannot point back to its own board.

This also supports dashboards: link cards from several boards into one
board to see their current shared content together.

The feature originated in [#1592](https://github.com/wekan/wekan/pull/1592).
Same-board selection and label mirroring are covered by
[#5683](https://github.com/wekan/wekan/issues/5683).
See also [#5550](https://github.com/wekan/wekan/issues/5550).
