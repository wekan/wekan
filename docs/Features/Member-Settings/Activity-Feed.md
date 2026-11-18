# Member Settings / Activity on all my boards

Open the top-right username menu, then **Activity on all my boards**
([#2026](https://github.com/wekan/wekan/issues/2026),
[#1377](https://github.com/wekan/wekan/issues/1377)). It is a link, not a
popup: it opens the page `/activity`. Every signed-in member sees the entry.

## The page

What happened on your boards, newest first, 50 entries at a time:

- the time, the user who did it, and the same sentence notifications use for
  that kind of activity;
- the card's title, when the activity is about a card - click it, or press
  Enter or Space on it, to open the card;
- the board's title.

Card, list and board titles render their Markdown. **Show older** loads the
next 50. With nothing to show, the page says *Nothing has happened on your
boards yet.*

## Which boards and activities

The boards are the ones you see in All Boards: as a member, or through a team,
an organization or your e-mail domain. Archived boards, public boards you are
not a member of and boards in [Hidden boards](Hidden-Boards.md) are left out.
On a board where you see only the cards assigned to you, only those cards'
activities are listed.

The page stays empty when a site administrator has

- turned on **Disable all activities** in
  [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md),
  or
- hidden **Board activities** in
  [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md).

For developers: the page is `activityFeed`
(`client/components/main/activityFeed.*`), the method `allBoardsActivityFeed`
(`server/activityFeed.js`), the sentence and visibility rules
`models/lib/activityFeed.js`.
