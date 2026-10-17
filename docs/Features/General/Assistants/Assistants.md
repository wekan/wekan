# Helpers that need no AI

Trello, Jira and ClickUp sell some features as AI: a due date read from what
you type, similar cards, suggested rules, a standup summary and so on. Each of
these can be worked out from the board's own data by ordinary code: dates and
words from the browser's own language tables, text similarity from letter
triples, suggestions from counting what people did. WeKan does them that way.
No model is downloaded, no text leaves the server, and every result can be
explained by the rule that produced it.

| # | Helper | Where | Guide | Hide it |
| --- | --- | --- | --- | --- |
| 1 | A due date from the card title | Add card, card title | [Due date from the title](../../Cards/Dates/Due-Date-From-Title.md) | Board Settings / Card: **Due date from title** |
| 2 | Similar cards and possible duplicates | Add card, opened card | [Similar cards](../../Cards/Similar-Cards.md) | Board Settings / Card: **Similar cards** |
| 3 | Rule suggestions | Board menu → Rules | [Rule suggestions](../../Rules/Rule-Suggestions.md) | Admin Panel / Settings / Visibility / Features: **Rule suggestions** |
| 4 | Summary (standup) | Board menu → Summary | [Summary](../Summary/Summary.md) | Admin Panel / Settings / Visibility / Features: **Summary** |
| 5 | Since your last visit | Board menu → Since your last visit | [Since your last visit](../Since-Last-Visit/Since-Last-Visit.md) | Admin Panel / Settings / Visibility / Features: **Since your last visit** |
| 6 | At risk | Minicard, opened card | [At risk](../../Cards/At-Risk.md) | Board Settings / Card: **At risk** |
| 7 | Suggested members | Members and Assignees popups | [Suggested members](../../Cards/Suggested-Members.md) | Board Settings / Card: **Suggested members** |
| 8 | Forecast done date | Opened card's dates, minicard | [Forecast](../../Cards/Dates/Forecast.md) | Board Settings / Card: **Forecast** |
| 9 | Checklist or subtasks from the description | Opened card, Checklists | [Checklist from description](../../Cards/Checklist-From-Description.md) | Board Settings / Card: **Checklist from description** |
| 10 | Action items from a comment or description | Opened card, comment menu | [Action items](../../Cards/Action-Items.md) | Board Settings / Card: **Action items** |
| 11 | Search phrases in plain language | Global search | [Search phrases](../../Pages/Search-Phrases.md) | Admin Panel / Settings / Visibility / Features: **Search phrases** |

## Hiding them

They are hidden the way every other optional part of WeKan is:

- **The card helpers (1, 2, 6, 7, 8, 9, 10)** are rows of
  [Board Settings / Card](../../Board-Sidebar/Board-Settings/Card.md), so a
  board admin turns each one off for the opened card, the minicard, or both.
  The same rows are ticks in
  [Admin Panel / Settings / Visibility / Features / Card fields](../../Admin-Panel/Settings/Visibility.md#card-fields),
  where a site admin hides them on every board at once.
- **The board and search helpers (3, 4, 5, 11)** are features of
  [Admin Panel / Settings / Visibility / Features](../../Admin-Panel/Settings/Visibility.md#features):
  untick one and its menu entry, its panel and its server answers are gone for
  everyone except the previewers named there.

Hiding is visibility only. Nothing is deleted: a due date already read from a
title stays on the card, a rule made from a suggestion stays a rule.

## What they never do

- They never change a card on their own. A helper proposes; a person clicks.
  The one exception is the due date from a title, which is shown under the
  field before the card is saved and can be dismissed there.
- They never show a card the reader may not see. Every server answer goes
  through the same board and role checks as opening the card.
- They never send text anywhere. All of it runs inside WeKan.
