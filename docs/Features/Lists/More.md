# List menu / More

## What it is

List menu (☰ in the list header) → **More**, the last entry, opens a small
popup (`listMorePopup` in `client/components/lists/listHeader.jade`) with the
list's own link and the date it was created. Nothing in it changes the board.

## Read more

- [Permalink](https://en.wikipedia.org/wiki/Permalink) on Wikipedia - a
  lasting address of one item.
- [Board item links](../General/Board-Item-Links.md) - the addresses of
  boards, swimlanes, lists and cards in WeKan.

## How to use it

Who sees it: a board member who is not **Comment only**, **Read only** or
**Read assigned only**.

1. Click ☰ (**List Actions**) in the list header.
2. Click **More** at the bottom of the menu.
3. The popup shows:
   - **Link to this list**, with the board's visibility icon, and a read-only
     box holding the list's own absolute address
     ([#6459](https://github.com/wekan/wekan/issues/6459)); select it to copy
     it. **Copy link to clipboard** at the top of the list menu copies the
     same address in one click.
   - **Added**, the date the list was created.

A Delete link exists in the template but is commented out, so it is not
shown; to remove a list, use **Move List to Archive** and delete it from the
[Archive](../Board-Sidebar/Archive/Archive-and-Delete.md).

## How the numbers are calculated

The only number is the **Added** date: the list's `createdAt`, shown in the
long `LLL` date format of your chosen calendar (`displayDate`); its tooltip is
the raw `createdAt` value.

## How it works in WeKan

- The popup is `listMorePopup` in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade),
  opened by `'click .js-more'` in
  [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js).
- The address comes from `list.absoluteUrl()`, built by
  [models/lib/boardItemUrl.js](../../../models/lib/boardItemUrl.js). Before
  #6459 the box used a helper that did not exist (always empty), and then a
  card's address (nothing for an empty list).
- Tests: [tests/boardItemLinks.test.cjs](../../../tests/boardItemLinks.test.cjs),
  [tests/listSwimlaneLinkRootUrlIssue1089.test.cjs](../../../tests/listSwimlaneLinkRootUrlIssue1089.test.cjs).

## Commits

 - [the list menu is grouped under headings, More stays last](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [a regression test pinning the list link fix](https://github.com/wekan/wekan/commit/c8ad1b61d694db93740d65781bb0686988632ffd)
 - [a swimlane or a list gets its own link, like a card](https://github.com/wekan/wekan/commit/e755b60b37009783effe5515d208b142003128e7)
 - [the More link box reads absoluteUrl instead of a missing helper (#6459)](https://github.com/wekan/wekan/commit/ed19445d307344216565caa6eb597f2d36a88b92)
 - [removing a list works the way removing a card does](https://github.com/wekan/wekan/commit/5b0da6cb3adf6366afb3264cdab1f45a5b506029)
