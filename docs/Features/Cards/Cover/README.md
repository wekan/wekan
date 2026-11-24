# Cover image

## What it is

A card's cover image is the picture you see first, before you open the card -
like the cover of a book or a magazine. In WeKan it is one of the card's image
attachments, shown on the minicard under the title and at the top of the
opened card. The minicard can also show the count of the card's attachments.

## Read more

- Wikipedia: [Cover art](https://en.wikipedia.org/wiki/Cover_art) and
  [Thumbnail](https://en.wikipedia.org/wiki/Thumbnail).
- In WeKan: [Attachments](../Attachments/README.md), [Drawing](../Drawing.md),
  [Linked cards](../Linked-Cards.md) and
  [Board Settings / Card](../../Board-Sidebar/Board-Settings/Card.md).

## How to use it

**Make an image the cover:**

1. Open the card and add an image attachment (upload, paste or drag and
   drop). A newly uploaded image becomes the cover by itself, and so does a
   newly saved [drawing](../Drawing.md).
2. To choose another image, open that attachment's menu (☰, **Attachment
   Actions**) and click **Add cover image to minicard**.

**Remove the cover:** open the cover attachment's menu and click **Remove
cover image from minicard**. The attachment stays on the card.

**Show or hide it, and the attachment count:**

1. Board sidebar (hamburger menu) → **Board Settings** → **Card**.
2. Row **Cover image**: *Show on Minicard* and *Show on Card* (both on by
   default).
3. Row **Count of attachments**: *Show on Minicard* draws the paperclip badge
   with the count (off by default), *Show on Card* the count on the
   Attachments heading.

## How the numbers are calculated

- **Count of attachments:** the number of the card's attachments
  (`attachments.length` in
  [client/components/cards/minicard.jade](../../../../client/components/cards/minicard.jade)),
  drawn only when it is more than 0.
- **Cover:** one per card, the attachment whose id is the card's `coverId`.
  It is drawn from the attachment's thumbnail (`attachmentPreviewUrl`), at
  512 × 120 on the minicard and 512 × 180 on the opened card; clicking it
  shows the original.

## How it works in WeKan

- The card's `coverId` field; `setCover(id)` and `unsetCover()` in
  [models/cards.js](../../../../models/cards.js) write the real card of a
  linked card.
- [client/components/cards/attachments.js](../../../../client/components/cards/attachments.js) -
  an uploaded or pasted image calls `card.setCover`; the
  `attachmentActionsPopup` in
  [attachments.jade](../../../../client/components/cards/attachments.jade)
  offers Add / Remove cover for image attachments only.
- [models/lib/linkedCardCover.js](../../../../models/lib/linkedCardCover.js) -
  `resolveCoverId`: a linked card shows the cover of the card it links to
  ([#5666](https://github.com/wekan/wekan/issues/5666)).
- The board flags `allowsCoverAttachmentOnMinicard`,
  `allowsCoverAttachmentOnCard` and `allowsBadgeAttachmentOnMinicard` in
  [models/boards.js](../../../../models/boards.js); the rows `cover` and
  `attachmentCount` in
  [models/lib/cardSettingsRows.js](../../../../models/lib/cardSettingsRows.js).
- Tests: [tests/linkedCardCover.test.cjs](../../../../tests/linkedCardCover.test.cjs).

## Description

- Cover image = Image that you see first at not yet opened minicard, book, or magazine.
- Minicard = At board, small card, that you have not yet clicked to open card.
- Thumbnail Image = Small Picture of Attachment Image, like at Minicard and Card.
- At opened card, when you click thumbnail, it opens big picture slideshow.

## Minicard Cover Image and Count of attachments

<img src="https://wekan.fi/cover/cover-and-attachment.png" width="100%" alt="Minicard Cover Image and Count of attachments" />

## Commits

 - [Cover on by default, and a new drawing is the cover](https://github.com/wekan/wekan/commit/c4f528159bdece7824e1876fda1a30522ab821de)
 - [An SVG is shown as an image, a cover too](https://github.com/wekan/wekan/commit/0afb1336db10843ff3704a735274ceb3ef073b42)
 - [A real cover picture on cards again, and a neutral attachment tile](https://github.com/wekan/wekan/commit/e4ae7c282903c0d647350265f2d88967a388c495)
 - [Image attachments are served as thumbnails](https://github.com/wekan/wekan/commit/2be3ded5bfc884c41151bae397c142ed544fb844)
 - [A linked card shows the cover of the card it links to](https://github.com/wekan/wekan/commit/9ef7f4a07a6b40a2582af24b27fe133119adcd18)
 - [Copying a card copies its cover](https://github.com/wekan/wekan/commit/a0e70170889037afb9997c22ccb04b6b71b072aa)
 - [No spurious minicard cover element](https://github.com/wekan/wekan/commit/997931e462e736b87ee6b6866dcc3e997cefa39d)
 - [Cover image margin under the hamburger menu and due date](https://github.com/wekan/wekan/commit/747bc4c08837ad9781d63b9f16b97a64b0bfe7b8)
 - [Fix the Remove Cover button's error](https://github.com/wekan/wekan/commit/28850e5510f2aaefcae404efac1973c12f1cca65)
 - [Fix the minicard cover](https://github.com/wekan/wekan/commit/66d35a15280795b76a81c3e59cebbd2a29e4dff8)
 - [Cover image works again](https://github.com/wekan/wekan/commit/c7500661b8c0ebde7a3332336f94a44885cf0f5d)
 - [An image uploaded by drag and drop becomes the cover](https://github.com/wekan/wekan/commit/ba2d9b89dc4460a2f6d6abb530b9ba74b107d4e1)
 - [The latest uploaded image becomes the cover](https://github.com/wekan/wekan/commit/fd7a140429425fbc6c5cffc8d12f2da03e950e13)
 - [Fix scaling of cover images](https://github.com/wekan/wekan/commit/29e7aeff5db50889b92bf8430246f9e7df4b8534)
