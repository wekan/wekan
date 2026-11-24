# HTML

## What it is

WeKan exports a board as an HTML archive: a `.zip` with a web page of the
board as it is shown on the screen, the files the page needs to open without
the WeKan server, and the board's WeKan JSON export. The page can be opened
in any web browser, offline, to read the board. HTML is export only.

## Read more

- [Wikipedia: HTML, the markup language](https://en.wikipedia.org/wiki/HTML)
- [HTML Living Standard](https://html.spec.whatwg.org/): the page format
- [File System Access API, `showSaveFilePicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker):
  how the browser asks where to save the archive

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

There is no HTML import. The web page is a picture of the board made of the
screen's HTML, not a data format, so WeKan does not read it back. The archive
also holds the board's WeKan JSON export, under `data/`; that file can be
imported with **All Boards → Add Board → Import → Import board → WeKan** (see
[WeKan JSON](../WeKan/From-Previous-Export.md)).

### How to import many boards at once

There is nothing to import: HTML has no import.

### How to export

1. In WeKan, open the board, and show it the way you want it in the page:
   the view, filters and collapsed lists are taken as they are on the
   screen.
2. Open **Board Settings → Export**. The HTML entry is offered only for a
   whole board, not for a swimlane, list or card.
3. Choose **HTML**. WeKan first draws every card of every list (the board
   normally draws only the cards near the screen), then builds the archive in
   the browser. In a browser that supports it, you are asked where to save
   the `.zip`; otherwise it downloads.
4. Unzip the archive and open `index.html` in a web browser.

### How to export all boards at once

This is not available for HTML. The archive is a document of one board, made
from the board on the screen, so **Export all boards** does not offer it.
Export each board from its own menu, or use **Export all boards** with WeKan
JSON instead.

### REST API

There is no REST route for the HTML archive: it is built in the browser from
the board on the screen. The JSON inside it is the board's WeKan JSON export,
`GET /api/boards/BOARDID/export?authToken=TOKEN`.

## How the numbers are calculated

This format has no numbers of its own: it has no limits, counts or defaults
beyond those of the export it belongs to.

## How it works in WeKan

This format's own code:
[client/lib/exportHTML.js](../../../../../../client/lib/exportHTML.js).

The tests that pin it:
[tests/clientLazyLoading.test.cjs](../../../../../../tests/clientLazyLoading.test.cjs),
[tests/exportBoardPopupOrder.test.cjs](../../../../../../tests/exportBoardPopupOrder.test.cjs),
[tests/exportHTMLXss.test.cjs](../../../../../../tests/exportHTMLXss.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit, for PDF, HTML and SVG:

- **Authoritative shape:** export-only rendered views.
- **Required coverage:** every selected visible section, Unicode, safe links
  and images, pagination and deterministic filenames; these are
  presentations, not lossless re-import formats.

What the current code does (`client/lib/exportHTML.js`):

- The archive is named after the board's title, with every character other
  than letters a-z, digits, spaces, hyphens and underscores removed, spaces
  turned into hyphens, and at most 100 characters. Without a usable title the
  board's id is used. Everything is inside one folder of the same name.
- `index.html` is a copy of the page as shown, with the board sidebar, the
  header's buttons, open popups, the add-list and add-card forms, and the
  edit, delete and open buttons removed. Every link becomes plain text, and
  nothing on the page can be edited.
- Clicking a card in the page opens a box with the card's title and the text
  shown on its minicard. The text is inserted as text, so a card title that
  contains markup cannot run as code in the page.
- `data/BOARDID.json` is the board's WeKan JSON export.
- `style/` holds the page's stylesheets. Web fonts other than Font Awesome are
  removed and replaced by the system's sans-serif font; Font Awesome's fonts
  are in `webfonts/`, so icons show.
- Images used by the page are saved in folders named after their tag (for
  example `img/`), and card covers in `covers/`. The page points to these
  copies.

The step that adds `data/BOARDID.json` fetches the board's JSON export
(`/api/boards/BOARDID/export`) with your login token. It used to read the URL
off a JSON link in the export popup that the shared export popup no longer
has, which stopped the export at that step; it builds the URL itself now.

### What is kept

| WeKan | HTML archive |
| --- | --- |
| The board as shown: swimlanes, lists, minicards, labels, badges | `index.html` |
| Card covers and other images on the page | `covers/` and image folders |
| The board's styles and icons | `style/`, `webfonts/` |
| The whole board as data | `data/BOARDID.json` (WeKan JSON) |

### What is not kept

- Anything not on the screen when the export starts: a filtered-out card, a
  view that is not open, and the opened-card details beyond what the minicard
  shows.
- Links, which become plain text, and every editing control.
- Web fonts other than Font Awesome.
- The page cannot be imported back; use the JSON file in `data/` for that.

### How it is built and tested

- `client/lib/exportHTML.js` builds the archive; it is loaded only when
  **HTML** is clicked (`client/components/sidebar/sidebar.js`,
  `click .html-export-board`). The `.zip` is written with `fflate`, a file at
  a time.
- The menu entry is `html` in `client/components/boards/exportScope.js`.
- Unit tests: `tests/exportHTMLXss.test.cjs` (card text reaches the page only
  as text), `tests/clientLazyLoading.test.cjs` (the exporter is loaded only on
  click), `tests/exportBoardPopupOrder.test.cjs` (the menu entry).
- There is no Playwright case for the HTML archive.

## Commits

 - [Website: import and export WordPress, Ghost, Blogger, static and HTML sites, and the board as a website at a public ](https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261)
 - [Asana: html_notes, approval states and comment likes come across](https://github.com/wekan/wekan/commit/57a657445ef63cc979530f04585227d778c01845)
 - [Fix GitHub code scanning code-quality findings](https://github.com/wekan/wekan/commit/582a22c2914e5eaaeea84f29a3c75970195bf5e5)
 - [Text exports such as OPML are made from checked values, not stripped as HTML](https://github.com/wekan/wekan/commit/62eb9c5c297b71265c849726022194f9b68dfa69)
 - [Stream a Trello .zip import from a temporary file, its attachments into storage](https://github.com/wekan/wekan/commit/cd75f8c47630cf5ed714f8f223d23e1cf87c06de)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Fix board JSON exports containing HTML card text](https://github.com/wekan/wekan/commit/49eaade957243ec6f83c3d138c044efda5de8747)
 - [Revert Legacy HTML4 browser interface and parity changes](https://github.com/wekan/wekan/commit/828fc2d7186f485ce3df056849442f9cdcf5828d)
 - [Add shared HTML4 import source picker](https://github.com/wekan/wekan/commit/ca008534fae653d57617bd1513609401ec93fbd5)
 - [Share the server ZIP reader with Trello imports](https://github.com/wekan/wekan/commit/cda021ba21b5db9ceda0ce6472adec6d83dde361)
 - [Lazy-load browser export code](https://github.com/wekan/wekan/commit/d1b262d29af1185475427ba294ed4f5d9b304272)
 - [Security tests: say which vulnerability you guard, and check the list](https://github.com/wekan/wekan/commit/a4a9c03b1fc75d61760a35c87decbaf7a3081973)
 - [Board bar: a long board title moves ALL the buttons to the second row](https://github.com/wekan/wekan/commit/9df568c0c2ed5137444c318308be90dfdad76e7e)
 - [Fix ExportBleed: stored XSS in HTML board exports via a card-title second parse](https://github.com/wekan/wekan/commit/2d32e34621d340b00be4f66a6a2106ab4575cc70)
 - [Export board to HTML .zip: stream to disk and include every card](https://github.com/wekan/wekan/commit/ae9be62ef31014f5f452d32808c55b96d4e97f54)
 - [Fix Impersonate User. Show/Edit Avatar at Admin Panel/People/People](https://github.com/wekan/wekan/commit/ce3e51b14755b9c0a7c655d7a96c4f01386b4efc)
 - [Fix client runtime regressions after Meteor 3 migration](https://github.com/wekan/wekan/commit/ddd873c7a07d530b03fdb1cde9a335ef9d1f006c)
 - [Feat: download webfonts as well](https://github.com/wekan/wekan/commit/4d6e6a85e083b44774ca5e400763b6c9713bcd14)
 - [Fix: export HTML currently exports JS popups](https://github.com/wekan/wekan/commit/fe887b7b5e8105df5c806f51fcf5ce089911db68)
 - [Card Details Popup, every "Sub-Popup" must use .back() instead of .close()](https://github.com/wekan/wekan/commit/a59dfa8fc0d1280c35375c33f6d10a736acbf4b8)
 - [Fix(scrollbar): remove custom scrollbar](https://github.com/wekan/wekan/commit/d887e553ce79830aa4830d2e1b4669a9e1d3f100)
 - [Exports now work at #3173 at least for small boards. TODO: Fix EdgeHTML to work, before I can release this](https://github.com/wekan/wekan/commit/1624fc82f7c319e84a78f29445c7867f7da15c32)
 - [Added an API to get the cards for a specific custom field value](https://github.com/wekan/wekan/commit/c9a28db3ab5650178c933fc3d2284958dd0fd84d)
 - [Prettifier fixes](https://github.com/wekan/wekan/commit/05349a5deb3f85bb2ecc40457ff12413e0a830d1)
 - [Export Board to Zip file](https://github.com/wekan/wekan/commit/5ef83ab236c633528ffe992b3b73aa86fe86090f)
