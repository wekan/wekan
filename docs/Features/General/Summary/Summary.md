# Summary

Board hamburger menu → **Summary** opens a right-sidebar view of what happened on
this board, person by person - a standup report that writes itself.

Choose **Last day** (the last 24 hours) or **Last week** (the last seven
days). For each member who did something, or has cards overdue, in order of how
much they did:

| Group | What counts |
| --- | --- |
| Done | cards they marked complete, gave an end date, archived, or moved into the board's last list (of each swimlane, where lists belong to one) |
| Moved | cards they moved to another list or swimlane, unless that move finished the card |
| Added | cards they created |
| Commented | cards they commented on |
| Overdue | cards they are a member or assignee of whose due date has passed and that are not done - now, whatever the period |

Each card is a link that opens it. **Copy as text** copies the whole summary
as Markdown, ready to paste into a chat or an email.

The summary is built from the board's activities, the same records the
activity feed shows, so it shows nothing a member of the board could not see
there. Cards the reader may not see are left out.

## Hiding it

Admin Panel / Settings / Visibility / Features: **Summary**.

## Implementation

`models/lib/boardSummary.js` (pure: activities and cards to the groups above),
the method `boards.summary` in `server/methods/boardSummary.js`, drawn by
`boardSummarySidebar` in `client/components/sidebar/sidebarSummary.jade`.
Tests: `tests/boardSummary.test.cjs`.
