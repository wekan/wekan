# HTML

WeKan exports a board as an HTML archive: a `.zip` with a web page of the
board as it is shown on the screen, the files the page needs to open without
the WeKan server, and the board's WeKan JSON export. The page can be opened
in any web browser, offline, to read the board. HTML is export only.

## How to import

There is no HTML import. The web page is a picture of the board made of the
screen's HTML, not a data format, so WeKan does not read it back. The archive
also holds the board's WeKan JSON export, under `data/`; that file can be
imported with **All Boards → New → Import → WeKan** (see
[WeKan JSON](../WeKan/From-Previous-Export.md)).

## How to import many boards at once

There is nothing to import: HTML has no import.

## How to export

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

## How to export all boards at once

This is not available for HTML. The archive is a document of one board, made
from the board on the screen, so **Export all boards** does not offer it.
Export each board from its own menu, or use **Export all boards** with WeKan
JSON instead.

## Format details

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

## What is kept

| WeKan | HTML archive |
| --- | --- |
| The board as shown: swimlanes, lists, minicards, labels, badges | `index.html` |
| Card covers and other images on the page | `covers/` and image folders |
| The board's styles and icons | `style/`, `webfonts/` |
| The whole board as data | `data/BOARDID.json` (WeKan JSON) |

## What is not kept

- Anything not on the screen when the export starts: a filtered-out card, a
  view that is not open, and the opened-card details beyond what the minicard
  shows.
- Links, which become plain text, and every editing control.
- Web fonts other than Font Awesome.
- The page cannot be imported back; use the JSON file in `data/` for that.

## REST API

There is no REST route for the HTML archive: it is built in the browser from
the board on the screen. The JSON inside it is the board's WeKan JSON export,
`GET /api/boards/BOARDID/export?authToken=TOKEN`.

## How it is built and tested

- `client/lib/exportHTML.js` builds the archive; it is loaded only when
  **HTML** is clicked (`client/components/sidebar/sidebar.js`,
  `click .html-export-board`). The `.zip` is written with `fflate`, a file at
  a time.
- The menu entry is `html` in `client/components/boards/exportScope.js`.
- Unit tests: `tests/exportHTMLXss.test.cjs` (card text reaches the page only
  as text), `tests/clientLazyLoading.test.cjs` (the exporter is loaded only on
  click), `tests/exportBoardPopupOrder.test.cjs` (the menu entry).
- There is no Playwright case for the HTML archive.

## Sources

- [HTML Living Standard](https://html.spec.whatwg.org/): the page format
- [File System Access API, `showSaveFilePicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker):
  how the browser asks where to save the archive

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
