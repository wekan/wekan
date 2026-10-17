# Forecast done date

An opened card that is not complete shows, beside its dates, when it is likely
to be done: **Forecast: 50 % by 28 Oct, 85 % by 4 Nov**.

## How it is worked out

From the cards of this board that were completed in the last 180 days: for each,
how long it took from its start (the start date, or when it was created) to
its end (the end date, or when it was marked complete or archived). Those are
the board's cycle times.

For this card, only the finished cards that took at least as long as this one
has already been open are used - a card open for ten days cannot be done in
three. The forecast is this card's start plus the 50th and the 85th percentile
of those cycle times. Fewer than five such cards give **Not enough finished
cards to forecast**.

The minicard can show the 85 % date in its dates line, off by default.

## Hiding it

Board Settings / Card row **Forecast**: *Show on Card* is the line in the opened
card (on by default), *Show on Minicard* the date in the minicard (off by
default). A site admin hides both on every board from Admin Panel / Settings /
Visibility / Features / Card fields.

## Implementation

`models/lib/cardForecast.js` (pure: cycle times, conditional percentiles), the
method `cards.forecast` in `server/methods/cardForecast.js`. The board-wide
forecasts are the Monte Carlo view,
[Flow analytics](../../Board-Header/Board-Views/Charts/Flow-Analytics.md).
Tests: `tests/cardForecast.test.cjs`.
