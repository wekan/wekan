# Forecast done date

## What it is

An opened card that is not complete shows, beside its dates, when it is likely
to be done: **Forecast: 50 % by 28 Oct, 85 % by 4 Nov**. The forecast comes
from how long this board's finished cards took, so it needs no estimate to be
typed: half of the similar cards were done by the first date, and 85 % by the
second.

## Read more

- [Percentile](https://en.wikipedia.org/wiki/Percentile) and
  [Quantile](https://en.wikipedia.org/wiki/Quantile) on Wikipedia - the 50th
  and 85th percentile the forecast gives.
- [Lead time](https://en.wikipedia.org/wiki/Lead_time) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) -
  the cycle time of finished cards it is computed from.
- [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method) - the
  board-wide forecasts of [Flow analytics](../../Board-Header/Board-Views/Charts/Flow-Analytics.md).
- In WeKan: [Due date and the other card dates](Due-Date.md),
  [At risk](../At-Risk.md) and
  [Helpers that need no AI](../../Assistants/README.md).

## How to use it

1. Open a card that is not complete (not archived, not marked complete, no
   end date). The **Forecast** line is beside its dates.
2. To also see the 85 % date on the minicards, open **Board Settings → Card**
   and tick **Show on Minicard** for the **Forecast** row.
3. To hide the line in the opened card, untick **Show on Card** for the same
   row.

## How the numbers are calculated

From [models/lib/cardForecast.js](../../../../models/lib/cardForecast.js) and
[server/methods/cardForecast.js](../../../../server/methods/cardForecast.js):

From the cards of this board that were completed in the last 180 days: for each,
how long it took from its start (the start date, or when it was created) to
its end (the end date, or when it was archived, or - for a card only marked
complete - when it was last changed). Those are the board's cycle times. A
card whose end is before its start is left out, and at most the 5,000 most
recently changed finished cards are read.

For this card, only the finished cards that took at least as long as this one
has already been open are used - a card open for ten days cannot be done in
three. The forecast is this card's start plus the 50th and the 85th percentile
of those cycle times. Fewer than five such cards give **Not enough finished
cards to forecast**.

The percentile is the nearest-rank one (`quantile` in
[models/lib/flowAnalytics.js](../../../../models/lib/flowAnalytics.js)): the
cycle times are sorted and the one at position ⌈p × n⌉ is taken, so with ten
cards the 50 % date uses the 5th and the 85 % date the 9th.

The minicard can show the 85 % date in its dates line, off by default.

## How it works in WeKan

The board's cycle times are fetched once per board by the method
`boards.cycleTimes` ([server/methods/cardForecast.js](../../../../server/methods/cardForecast.js),
through [client/lib/boardCycleTimes.js](../../../../client/lib/boardCycleTimes.js)):
it answers only numbers - no title, no id, nothing else of any card - and the
opened card and every minicard compute their own forecast from them, so a
board of 500 cards asks once, not 500 times. An assigned-only member gets the
times of their own cards only. The method answers only when the board has
Forecast on (on the card or the minicard), and is rate limited to 20 calls in
10 seconds per connection.

*Corrected:* this page used to name the method `cards.forecast`; it is
`boards.cycleTimes`, and the forecast itself is computed in the browser by
`forecastCard`.

### Hiding it

Board Settings / Card row **Forecast**: *Show on Card* is the line in the opened
card (on by default, `allowsForecastOnCard`), *Show on Minicard* the date in the
minicard (off by default, `allowsForecastOnMinicard`). A site admin hides both
on every board from Admin Panel / Settings / Features / Card fields.

### Implementation

[models/lib/cardForecast.js](../../../../models/lib/cardForecast.js) (pure:
cycle times, conditional percentiles), the method `boards.cycleTimes` in
[server/methods/cardForecast.js](../../../../server/methods/cardForecast.js).
The board-wide forecasts are the Monte Carlo view,
[Flow analytics](../../Board-Header/Board-Views/Charts/Flow-Analytics.md).
Tests: `tests/cardForecast.test.cjs` and
`tests/playwright/specs/assist-suggested-members-forecast.e2e.js`.

## Commits

 - [Summary, Since your last visit, At risk, Suggested members and Forecast](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
