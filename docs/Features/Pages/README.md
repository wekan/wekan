# Pages

## What it is

The personal pages opened from the top header and the member menu: lists that
gather cards, attachments, stars and search results from every board you can
see, instead of one board at a time.

## How to use it

Click your avatar and name in the first header bar to open the member menu,
then choose the page. Each page has its own guide:

| Page | Guide | Implementation |
| --- | --- | --- |
| My Cards | [My Cards, Due Cards and My Attachments](My-Cards-Due-Attachments.md) | `client/components/main/myCards.jade` |
| Due Cards | [My Cards, Due Cards and My Attachments](My-Cards-Due-Attachments.md) | `client/components/main/dueCards.jade` |
| My Attachments | [My Cards, Due Cards and My Attachments](My-Cards-Due-Attachments.md) | `client/components/main/myAttachments.jade` |
| Starred | [Starred](Starred.md) | `client/components/main/starredItems.jade` |
| Global search | [Search](../Board-Header/Search.md) | `client/components/main/globalSearch.jade` |
| Global search phrases | [Search phrases](Search-Phrases.md) | `models/lib/searchPhrases.js` |

See the pages above.

## Commits

 - [Open the selected card from My Cards and My Attachments](https://github.com/wekan/wekan/commit/d01b3a3d920431e6db1cbe561d80ec2676069e5c)
 - [Search phrases in plain language for the global search](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
 - [A Starred page for starred swimlanes, lists and cards](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
 - [Add a My Attachments page to the member menu](https://github.com/wekan/wekan/commit/a9dd6b05b0e583d81deac5544df3a7f7012fea26)
 - [Starred: bookmarks to any page, not only boards](https://github.com/wekan/wekan/commit/1f2044219a0625a4d8d2de752dd4da2b4c5e5078)
 - [A page's controls move into a right sidebar](https://github.com/wekan/wekan/commit/705bed741368874e111a6441cca1ccf5ad137b38)
