# Due date from the title

Type the date at the end of a new card's title and the card gets it as its
**due date**:

| You type | The card |
| --- | --- |
| `Call the printer company tomorrow` | *Call the printer company*, due tomorrow 17:00 |
| `Send invoices friday 9:30` | *Send invoices*, due next Friday 09:30 |
| `Budget draft in 3 days` | *Budget draft*, due in three days 17:00 |
| `Release notes 2026-11-02 14:00` | *Release notes*, due 2 November 2026 14:00 |
| `Soita tulostinyhtiölle huomenna klo 14` | *Soita tulostinyhtiölle*, due tomorrow 14:00 (Finnish) |

While you type, the line under the field shows what will be set: **Due: Fri
23 Oct 09:30**. Its **×** keeps the words in the title and sets no date, for
this card only. Press Enter as usual to add the card.

## What is recognised

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

Without a time the due date gets the due date picker's default time, 17:00.

## Where it works

| Board Settings / Card row **Due date from title** | Where |
| --- | --- |
| Show on Minicard | the add-card form at the top or bottom of a list |
| Show on Card | renaming the title in the opened card |

Both are on by default. A site admin hides it everywhere from Admin Panel /
Settings / Visibility / Features / Card fields. See
[Helpers that need no AI](../../General/Assistants/Assistants.md).

## Implementation

`models/lib/titleDueDate.js` (pure, no Meteor: `parseTitleDueDate(title,
{ locale, now })` returns `{ title, dueAt, matched }` or `null`), used by
`client/components/lists/listBody.js` (add card) and
`client/components/cards/cardDetails.js` (title edit). Tests:
`tests/titleDueDate.test.cjs`.
