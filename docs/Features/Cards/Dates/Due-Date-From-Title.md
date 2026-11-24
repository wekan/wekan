# Due date from the title

## What it is

Type the date at the end of a new card's title and the card gets it as its
**due date**, and the date words are taken off the title. It works in every
language WeKan offers, with that language's own words for "tomorrow",
"Friday" or "in 3 days". It is a parser that follows fixed rules - what other
tools sell as AI - and needs no AI service.

| You type | The card |
| --- | --- |
| `Call the printer company tomorrow` | *Call the printer company*, due tomorrow 17:00 |
| `Send invoices friday 9:30` | *Send invoices*, due next Friday 09:30 |
| `Budget draft in 3 days` | *Budget draft*, due in three days 17:00 |
| `Release notes 2026-11-02 14:00` | *Release notes*, due 2 November 2026 14:00 |
| `Soita tulostinyhtiölle huomenna klo 14` | *Soita tulostinyhtiölle*, due tomorrow 14:00 (Finnish) |

## Read more

- [Due date](https://en.wikipedia.org/wiki/Due_date) on Wikipedia, and
  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601), the `YYYY-MM-DD` date
  form.
- The browser's language tables the words come from:
  [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)
  and [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
- In WeKan: [Due date and the other card dates](Due-Date.md) and
  [Helpers that need no AI](../../Assistants/README.md).

## How to use it

1. In a list, open the add-card form (at the top or bottom of the list).
2. Type the title with the date at its end, e.g. `Send invoices friday 9:30`.
3. While you type, the line under the field shows what will be set: **Due: Fri
   23 Oct 09:30**. Its **×** keeps the words in the title and sets no date, for
   this card only.
4. Press Enter as usual to add the card.

The same works when renaming the title in the opened card.

## How the numbers are calculated

From [models/lib/titleDueDate.js](../../../../models/lib/titleDueDate.js):

- Without a time the due date gets the due date picker's default time,
  **17:00** (`DEFAULT_HOUR`).
- **today**, **tomorrow** and **the day after tomorrow** are today plus 0, 1
  and 2 days; **in N days** and **in N weeks** are today plus N or 7 × N days.
- **next week** is the next Monday (on a Monday, the Monday a week later).
- A **weekday** is the next such day after today, so on a Friday "friday"
  is the Friday a week later.
- A **time alone** is today, or tomorrow when that time has already passed.
- A date without a year is written with its closing dot (`23.10.`) in the
  languages that use one, and is this year's, or next year's when this year's
  has already passed.
- A typed date that does not exist (`31.02.`) is not a date.

## How it works in WeKan

### What is recognised

Only the end of the title is read, so a title that merely mentions a day
("Friday party planning") is left alone, and a title that is nothing but a
date ("tomorrow") stays a title. A date without a year is written with its
closing dot (`23.10.`) in languages that use one, so "Release 1.2" is never a
date. The words are your WeKan language's
own, taken from the browser's language tables (`Intl.RelativeTimeFormat` and
`Intl.DateTimeFormat`), so every language WeKan offers works without a word
list of its own:

- today, tomorrow, and the day after tomorrow where the language has a word
  for it;
- in N days, in N weeks;
- next week (its Monday);
- a weekday's full name, also inflected ("perjantaina"): the next such day
  after today. Short names are not read, because "sun" or "mar" at the end of
  a title is more often an ordinary word;
- a date as `YYYY-MM-DD`, or in your language's day/month order (`23.10.`,
  `23.10.2026`, `10/23/2026`);
- then optionally a time, `14:00`, `14.00`, with the word the language writes
  before a time (`at`, `klo`, `um`, `kl.`, `à`) also before a bare hour
  (`klo 14`), or `2pm` / `2:30 pm` in languages with a 12-hour clock;
- or a time alone, `Standup 9:00`: today, or tomorrow when that time has
  passed. A time alone needs a colon, the language's word or am/pm, so
  "Version 1.10" stays a title.

The language's own digits are read too ("٣ أيام" is "3 أيام"), and English
works in every language.

### Where it works

| Board Settings / Card row **Due date from title** | Where |
| --- | --- |
| Show on Minicard | the add-card form at the top or bottom of a list |
| Show on Card | renaming the title in the opened card |

Both are on by default (`allowsDueFromTitleOnMinicard`,
`allowsDueFromTitleOnCard` on the board,
[models/lib/cardSettingsRows.js](../../../../models/lib/cardSettingsRows.js)).
A site admin hides it everywhere from Admin Panel / Settings / Features / Card
fields. See [Helpers that need no AI](../../Assistants/README.md).

### Implementation

[models/lib/titleDueDate.js](../../../../models/lib/titleDueDate.js) (pure, no
Meteor: `parseTitleDueDate(title, { locale, now })` returns `{ title, dueAt,
matched }` or `null`), used through
[client/components/forms/titleDueHint.js](../../../../client/components/forms/titleDueHint.js)
(`dueFromTitle`: the board flag, the hint and its ×) by
[client/components/lists/listBody.js](../../../../client/components/lists/listBody.js)
(add card) and
[client/components/cards/cardDetails.js](../../../../client/components/cards/cardDetails.js)
(title edit). Tests: `tests/titleDueDate.test.cjs` and
`tests/playwright/specs/assist-due-from-title.e2e.js`.

## Commits

 - [the due date hint follows the board's switch while the add-card form is open](https://github.com/wekan/wekan/commit/f852cb7032ec94907ec72b75e84d97ec05dde377)
 - [due date from the card title](https://github.com/wekan/wekan/commit/f8267d704edb96f1ec0da78ae8d44d5e8e0d88bd)
