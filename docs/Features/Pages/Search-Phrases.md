# Search phrases

## What it is

The global search (the header bar's search, or `/globalsearch`) understands a
few plain phrases in your WeKan language and turns them into its operators, so
you can type *my overdue cards* instead of learning `user:` and `due:`. It is
a fixed phrase table, not artificial intelligence: the same words always give
the same query, and the page shows the query it ran.

## Read more

- [Natural-language user interface](https://en.wikipedia.org/wiki/Natural-language_user_interface)
  and [Controlled natural language](https://en.wikipedia.org/wiki/Controlled_natural_language)
  on Wikipedia - plain words standing for a formal query.
- [Web search query](https://en.wikipedia.org/wiki/Web_search_query) and
  [Query language](https://en.wikipedia.org/wiki/Query_language).
- [Jira (software)](https://en.wikipedia.org/wiki/Jira_(software)) - Jira
  turns plain language into JQL with AI; WeKan uses a phrase table instead.
- In WeKan: [Search](../Board-Header/Search.md) (the operators themselves),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md).

## How to use it

1. Open **Search All Boards** from the member menu (or go to
   `/globalsearch`).
2. Type a phrase from the table below, optionally with other words, e.g.
   *my overdue cards printer*, and search.
3. Read the line above the results, **Searching for: user:alice due:overdue
   printer**, to see what the phrase meant. Type operators yourself next time
   if you want to change them.

| Phrase (English) | Becomes |
| --- | --- |
| my cards | `user:<you>` |
| my overdue cards | `user:<you> due:overdue` |
| overdue cards | `due:overdue` |
| due this week | `due:7` |
| unassigned cards | `has:-assignee` |
| cards without due date | `has:-due` |
| created today | `created:1` |
| changed this week | `modified:7` |
| archived cards | `status:archived` |
| cards with attachments | `has:attachment` |

Phrases combine, and any other words stay as text to search for: *my overdue
cards printer* becomes `user:<you> due:overdue printer`. The page shows the
query it ran - **Searching for: user:alice due:overdue printer** - so you can
see what a phrase means and learn the operators from it. A query that already
has an operator in it is never rewritten.

Each phrase is a translation key (`search-phrase-*`), so it reads in your own
language; the English phrase works in every language too. The operator names
and values in the rewritten query are translated too (`operator-*`,
`predicate-*`).

### Hiding it

Admin Panel / Settings / Features: **Search phrases**. The
operators keep working.

## How the numbers are calculated

The numbers are the fixed values in the phrase table of
[models/lib/searchPhrases.js](../../../models/lib/searchPhrases.js): **due
this week** is `due:7`, **changed this week** is `modified:7` and **created
today** is `created:1`. The search turns them into dates in
[config/query-classes.js](../../../config/query-classes.js):

- `due:N` finds cards whose due date is before the date of today + 1 +
  (N + 1) days, so `due:7` also includes overdue cards;
- `created:N` and `modified:N` find cards created or changed on or after the
  date N days ago;
- `due:overdue` finds cards whose due date is before this moment, including
  deadlines earlier today.

Matching is longest phrase first, counted in words, so *my overdue cards*
(3 words) wins over *my cards* and *overdue cards* (2 words). Words are
compared after Unicode NFC normalization and lower-casing. An
operator that two phrases produce is written once.

## How it works in WeKan

- [models/lib/searchPhrases.js](../../../models/lib/searchPhrases.js) is pure
  (no Meteor): `PHRASES` is the table, `hasOperator()` detects a query that
  already contains `name:value`, and `rewriteSearchPhrases(text, { translate,
  username })` returns `{ query, matched }`.
- [client/components/main/globalSearch.js](../../../client/components/main/globalSearch.js)
  calls it only while `allowFeature('search-phrases')` is true, runs the
  rewritten query and keeps it in `phrasedQuery` for the **Searching for:**
  line (`search-phrases-searching`).
- The feature is the `search-phrases` entry of
  [models/lib/instanceFeatures.js](../../../models/lib/instanceFeatures.js).
- Tests: [tests/searchPhrases.test.cjs](../../../tests/searchPhrases.test.cjs).

## Commits

 - [Search phrases in plain language, with checklist from description and action items](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
