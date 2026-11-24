# Helpers that need no AI

## What it is

Trello, Jira and ClickUp sell some features as AI: a due date read from what
you type, similar cards, suggested rules, a standup summary and so on. Each of
these can be worked out from the board's own data by ordinary code: dates and
words from the browser's own language tables, text similarity from letter
triples, suggestions from counting what people did. WeKan does them that way.
No model is downloaded, no text leaves the server, and every result can be
explained by the rule that produced it.

## Read more

- [Trigram](https://en.wikipedia.org/wiki/Trigram) (letter triples) and the
  [Dice-Sørensen coefficient](https://en.wikipedia.org/wiki/Dice-S%C3%B8rensen_coefficient)
  that similar cards use, the
  [Jaccard index](https://en.wikipedia.org/wiki/Jaccard_index) it is related to,
  and [Rule-based system](https://en.wikipedia.org/wiki/Rule-based_system) on
  Wikipedia.
- Each helper's own page, linked in the table below.

## How to use it

Each helper is used where the table says; its guide has the steps.

| # | Helper | Where | Guide | Hide it |
| --- | --- | --- | --- | --- |
| 1 | A due date from the card title | Add card, card title | [Due date from the title](../Cards/Dates/Due-Date-From-Title.md) | Board Settings / Card: **Due date from title** |
| 2 | Similar cards and possible duplicates | Add card, opened card | [Similar cards](../Cards/Similar-Cards.md) | Board Settings / Card: **Similar cards** |
| 3 | Rule suggestions | Board menu → Rules | [Rule suggestions](../Rules/Rule-Suggestions.md) | Admin Panel / Settings / Features: **Rule suggestions** |
| 4 | Summary (standup) | Board menu → Summary | [Summary](../Summary/README.md) | Admin Panel / Settings / Features: **Summary** |
| 5 | Since your last visit | Board menu → Since your last visit | [Since your last visit](../Since-Last-Visit/README.md) | Admin Panel / Settings / Features: **Since your last visit** |
| 6 | At risk | Minicard, opened card | [At risk](../Cards/At-Risk.md) | Board Settings / Card: **At risk** |
| 7 | Suggested members | Members and Assignees popups | [Suggested members](../Cards/Suggested-Members.md) | Board Settings / Card: **Suggested members** |
| 8 | Forecast done date | Opened card's dates, minicard | [Forecast](../Cards/Dates/Forecast.md) | Board Settings / Card: **Forecast** |
| 9 | Checklist or subtasks from the description | Opened card, Checklists | [Checklist from description](../Cards/Checklist-From-Description.md) | Board Settings / Card: **Checklist from description** |
| 10 | Action items from a comment or description | Opened card, comment menu | [Action items](../Cards/Action-Items.md) | Board Settings / Card: **Action items** |
| 11 | Search phrases in plain language | Global search | [Search phrases](../Pages/Search-Phrases.md) | Admin Panel / Settings / Features: **Search phrases** |

**Hiding them.**

They are hidden the way every other optional part of WeKan is:

- **The card helpers (1, 2, 6, 7, 8, 9, 10)** are rows of
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md), so a
  board admin turns each one off for the opened card, the minicard, or both.
  The same rows are ticks in
  [Admin Panel / Settings / Features / Card fields](../Admin-Panel/Settings/Features.md#card-fields),
  where a site admin hides them on every board at once.
- **The board and search helpers (3, 4, 5, 11)** are features of
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md#features):
  untick one and its menu entry, its panel and its server answers are gone for
  everyone except the previewers named there.

Hiding is visibility only. Nothing is deleted: a due date already read from a
title stays on the card, a rule made from a suggestion stays a rule.

## How the numbers are calculated

Each helper computes its own numbers (thresholds, scores, periods), and each is
explained on that helper's page. For example, similar cards count as similar
from a Dice score of `0.5` and as possible duplicates from `0.8`, with the
title weighted twice ([models/lib/similarCards.js](../../../models/lib/similarCards.js)).
This overview page has no numbers of its own.

## How it works in WeKan

- Every helper is a pure module in `models/lib/` with its own test in `tests/`:
  [titleDueDate.js](../../../models/lib/titleDueDate.js),
  [similarCards.js](../../../models/lib/similarCards.js),
  [ruleSuggestions.js](../../../models/lib/ruleSuggestions.js),
  [boardSummary.js](../../../models/lib/boardSummary.js),
  [sinceLastVisit.js](../../../models/lib/sinceLastVisit.js),
  [cardRisk.js](../../../models/lib/cardRisk.js),
  [memberSuggestions.js](../../../models/lib/memberSuggestions.js),
  [cardForecast.js](../../../models/lib/cardForecast.js),
  [actionItems.js](../../../models/lib/actionItems.js) and
  [searchPhrases.js](../../../models/lib/searchPhrases.js).
- [server/lib/assistGate.js](../../../server/lib/assistGate.js) is the server
  half of hiding them: `boardForCardHelper()` answers only for a board the user
  may read whose Board Settings / Card flag is not `false` and whose Admin Panel
  card field tick is on; `featureOnFor()` checks an Admin Panel feature for the
  user (or their preview). A hidden helper answers nothing, whoever calls it.
- UI tests: `tests/playwright/specs/assist-*.e2e.js`, one per helper.

## What they never do

- They never change a card on their own. A helper proposes; a person clicks.
  The one exception is the due date from a title, which is shown under the
  field before the card is saved and can be dismissed there.
- They never show a card the reader may not see. Every server answer goes
  through the same board and role checks as opening the card.
- They never send text anywhere. All of it runs inside WeKan.

## Commits

 - [Checklist from description, action items, and search phrases](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
 - [Summary, Since your last visit, At risk, Suggested members and Forecast](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
 - [Rule suggestions from what people on a board keep doing by hand](https://github.com/wekan/wekan/commit/2211b2411931b84ef0ec71c197e5630f71bff3c6)
 - [Due date from the card title, and similar cards and possible duplicates](https://github.com/wekan/wekan/commit/f8267d704edb96f1ec0da78ae8d44d5e8e0d88bd)
