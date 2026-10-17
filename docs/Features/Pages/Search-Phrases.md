# Search phrases

The global search (the header bar's search, or `/globalsearch`) understands a
few plain phrases in your WeKan language and turns them into its operators:

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
language; the English phrase works in every language too.

## Hiding it

Admin Panel / Settings / Visibility / Features: **Search phrases**. The
operators keep working.

## Implementation

`models/lib/searchPhrases.js` (pure: phrases to operators, longest match first),
used by `client/components/main/globalSearch.js`. Tests:
`tests/searchPhrases.test.cjs`.
