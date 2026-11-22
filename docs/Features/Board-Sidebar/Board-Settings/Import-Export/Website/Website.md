# Website

## What it is

A website - its pages, posts, comments and images - as a WeKan board, and a
board as a website again. In the Import page and the Export menu these formats
are under **Website**:

| Software | Import | Export |
| --- | --- | --- |
| [WordPress](https://wordpress.org/documentation/article/tools-export-screen/) - and Squarespace, Wix, WordPress.com and others that export WordPress's file | WordPress (.xml): Tools → Export, *All content* (WXR) | WordPress (.xml) |
| WordPress REST API | WordPress REST API (.json): `/wp-json/wp/v2/posts` and `/pages`, as one array or `{ posts, pages }` | WordPress REST API (.json) |
| [Ghost](https://ghost.org/help/the-importer/) | Ghost: Settings → Labs → Export your content (`.json`) | Ghost (`.json`, which Ghost's importer reads) |
| [Blogger](https://support.google.com/blogger/answer/41387) | Blogger (.xml): Settings → Back up content, or Google Takeout | Blogger (.xml) |
| Hugo, Jekyll, Eleventy, Astro, Gatsby, Docusaurus, MkDocs - static site generators | Hugo, Jekyll, Eleventy, Astro (.zip): the site's sources zipped, Markdown files with YAML (`---`) or TOML (`+++`) front matter | Hugo, Jekyll, Eleventy, Astro (.zip): `content/pages/` and `content/posts/` |
| Any website, Medium | HTML website, Medium (.zip): the site's files (saved with wget or HTTrack, or Medium's export) | HTML website (.zip): the published pages, ready to put on any web server |
| [Substack](https://support.substack.com/hc/en-us/articles/360037466012) | Substack (.zip): Settings → Exports | — |
| Sandstorm WordPress, Sandstorm Hacker CMS | under Sandstorm: a grain backup ([Sandstorm](../Sandstorm/Sandstorm.md)) | — |

A board made from a website shows it again with **Board View → Website**, and
a public board can open in it, so that visitors see the site at the board's
address instead of the kanban ([Board View](../../Board-View.md)).

## Read more

- [Wikipedia: websites](https://en.wikipedia.org/wiki/Website)
- WordPress eXtended RSS (WXR) 1.2, as WordPress's Tools → Export writes it.
- The WordPress REST API reference, posts and pages.
- Ghost's import and export format.
- Blogger's Atom export.
- Hugo, Jekyll and Eleventy front matter.
- Substack's export.

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Export the site from its software, as in the table above.
2. All Boards → **Add Board** → **Import**, and choose the format under
   **Website**.
3. Choose the file (or paste the `.xml` or `.json`), and import.

### How to import many boards at once

Choose several files of the same format in **Import many boards**: each file
is a board. A `.zip` of a Markdown or HTML site is one site, one board.

### How to export

Board menu → **Export** → under **Website**, the format.

### How to export all boards at once

**Export all boards** offers the same formats: a file per board, in one `.zip`.

### REST API

- Import: `POST /api/boards/import/<source>` with the file's text, the JSON, or
  a `.zip` as `{ "zipBase64": "..." }` - `wordpress`, `wordpressjson`, `ghost`,
  `blogger`, `markdownsite`, `htmlsite`, `substack`.
- Export: `GET /api/boards/:boardId/export/<format>` - `wordpress`,
  `wordpressjson`, `ghost`, `blogger`, `markdownsite`, `htmlsite`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 50,000 items. Anything past it is left out. (`MAX_SITE_ITEMS` in
  [models/lib/websiteFormat.js](../../../../../../models/lib/websiteFormat.js#L26))
- The text: at most 1,048,576 characters (1 MB of text). Anything past it is
  left out. (`MAX_TEXT` in
  [models/lib/websiteFormat.js](../../../../../../models/lib/websiteFormat.js#L27))
- The text: at most 268,435,456 characters (256 MB of text). More stops the
  import with an error. (`MAX_TEXT` in
  [server/lib/websiteImport.js](../../../../../../server/lib/websiteImport.js#L11))
- At most 50,000 items. Anything past it is left out. (`MAX_ITEMS` in
  [server/lib/websiteImport.js](../../../../../../server/lib/websiteImport.js#L12))
- A file in a site .zip larger than 64 MB is skipped. (`MAX_FILE` in
  [server/lib/websiteImport.js](../../../../../../server/lib/websiteImport.js#L13))

The numbers every import has, this one included:

- **How long an import may take**: `WEKAN_IMPORT_TIMEOUT_MS` (default 120,000
  ms, two minutes; 0 turns the deadline off) plus 500 ms for each record of the
  file. A record is an item of a top-level array, a line of a text file, or the
  items of all top-level arrays of an object added together
  ([models/lib/importDeadline.js](../../../../../../models/lib/importDeadline.js),
  [models/import.js](../../../../../../models/import.js)).
- **Many boards at once**: at most 500 files and 200 MB together
  (`MAX_MANY_FILES`, `MAX_MANY_BYTES` in
  [models/lib/importManyFiles.js](../../../../../../models/lib/importManyFiles.js)).
- **One board per project**: at most 200 boards from one file
  (`MAX_SPLIT_BOARDS` in
  [models/lib/importSplit.js](../../../../../../models/lib/importSplit.js)).
- **The loss report** counts what was not imported and the warnings, and lists
  the first 20 of them, each cut to 200 characters, then "and N more"
  ([models/lib/importLossReport.js](../../../../../../models/lib/importLossReport.js)).
- **Every document** passes the one import and export boundary: at most 40
  levels deep, 4,000,000 values, 100,000 items in one array and 4 MB in one
  string
  ([models/lib/importExportBoundary.js](../../../../../../models/lib/importExportBoundary.js)).

## How it works in WeKan

An import is sent to the `importBoard` Meteor method in
[models/import.js](../../../../../../models/import.js). It checks the types of
every argument first, refuses a caller who is not logged in (and records that
attempt in Admin Panel → Problems), stops when Admin Panel has turned import off
([models/lib/importExportSecurity.js](../../../../../../models/lib/importExportSecurity.js)),
and asks
[server/lib/boardCreationGuard.js](../../../../../../server/lib/boardCreationGuard.js)
whether this user may create a board; an import into the current board replaces
it only for a board admin. The import sources and their file types are described
once, in
[models/lib/importSources.js](../../../../../../models/lib/importSources.js).

The file is read by this format's parser into one Kanboard-shaped board
(`EXTERNAL_PARSERS` in
[models/lib/externalParsers.js](../../../../../../models/lib/externalParsers.js)),
which [models/kanboardCreator.js](../../../../../../models/kanboardCreator.js)
writes as a WeKan board: the Boards, Swimlanes, Lists, Cards, Checklists,
ChecklistItems, CardComments and Attachments collections.

An export is a GET route of the REST API, the ones listed under REST API above:
a board's export is served by
[models/export.js](../../../../../../models/export.js)
(`/api/boards/:boardId/export/<format>` for the formats of other tools) or by
this format's own code below, and all boards at once by
`/api/export-all-boards/<format>`
([server/routes/exportAllBoards.js](../../../../../../server/routes/exportAllBoards.js)).
They stop first when Admin Panel has turned export off, need a logged-in user,
and export only a board that user may see; a member who sees only the cards
assigned to them gets no board-wide export
([models/lib/exportAccess.js](../../../../../../models/lib/exportAccess.js)).

This format's own code:
[models/lib/websiteFormat.js](../../../../../../models/lib/websiteFormat.js),
[models/lib/websiteView.js](../../../../../../models/lib/websiteView.js),
[server/lib/websiteImport.js](../../../../../../server/lib/websiteImport.js).

The tests that pin it:
[tests/websiteFormat.test.cjs](../../../../../../tests/websiteFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

Every format is read into the same pages and posts
(`models/lib/websiteFormat.js`), and a board is made of them:

| Site | Board |
| --- | --- |
| a page | a card in the swimlane **Pages** |
| a post | a card in the swimlane **Posts** |
| published, draft, pending review, scheduled, private | the lists **Published**, **Draft**, **Pending review**, **Scheduled**, **Private** |
| the content (HTML) | the description, as Markdown: headings, lists, links, emphasis |
| a page under another page | a subtask of its parent card |
| categories and tags | labels |
| the author | requested by |
| the date | the creation date |
| approved comments | comments |
| images and files in a `.zip` the page uses | the card's attachments |

Exporting does the opposite: Pages are pages, other swimlanes posts, the list
decides the status (Published, Draft, ... - also *Julkaistu*, *Veröffentlicht*,
*Publié* and others), labels are tags, comments are comments. The HTML and
Markdown site `.zip` files carry the cards' attachments beside their pages.

### What is kept

Titles, content, status, pages and posts, the page tree, dates, authors,
categories and tags, approved comments, and the images and files of a `.zip`.

### What is not kept

- Media that a WordPress, Ghost or Blogger export only links to stay where they
  are: the content links to them, and the import says how many there were.
- Themes, menus, widgets, plugins, shortcodes' output and custom fields.
- A page's own HTML: it is read as text and made Markdown, so nothing in it -
  scripts, styles, forms, embedded frames - runs in WeKan. A card's text is
  written into an exported site the same way, escaped, never as markup.
- Unapproved, spam and trashed items.

### How it is built and tested

`server/lib/websiteImport.js` reads each format (htmlparser2 for the XML and
the HTML, the import page's `.zip` reader with its size limits);
`models/lib/websiteFormat.js` makes the board and writes every export;
`models/lib/websiteView.js` is Board View / Website. `tests/websiteFormat.test.cjs`
writes each format, reads it back, reads real-shaped exports of every
software, and checks that no script of a site reaches a card, and no script of
a card reaches an exported site.

## Commits

 - [Website: the comment-stripping loop in the shape the fixed-point guard reads, and the script checks without case](https://github.com/wekan/wekan/commit/fcc8f19fe41a3b73e6d6ce8290e3450338bf7d14)
 - [Website: import and export WordPress, Ghost, Blogger, static and HTML sites, and the board as a website at a public ](https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261)
 - [Get rid of old implementation for substacks](https://github.com/wekan/wekan/commit/4ac6a507cdd3e7a4610c8961e0a9f76f945a5e6d)
