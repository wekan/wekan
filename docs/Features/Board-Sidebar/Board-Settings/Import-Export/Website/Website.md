# Website

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

## How to import

1. Export the site from its software, as in the table above.
2. All Boards → **Add Board** → **Import**, and choose the format under
   **Website**.
3. Choose the file (or paste the `.xml` or `.json`), and import.

## How to import many boards at once

Choose several files of the same format in **Import many boards**: each file
is a board. A `.zip` of a Markdown or HTML site is one site, one board.

## How to export

Board menu → **Export** → under **Website**, the format.

## How to export all boards at once

**Export all boards** offers the same formats: a file per board, in one `.zip`.

## Format details

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

## What is kept

Titles, content, status, pages and posts, the page tree, dates, authors,
categories and tags, approved comments, and the images and files of a `.zip`.

## What is not kept

- Media that a WordPress, Ghost or Blogger export only links to stay where they
  are: the content links to them, and the import says how many there were.
- Themes, menus, widgets, plugins, shortcodes' output and custom fields.
- A page's own HTML: it is read as text and made Markdown, so nothing in it -
  scripts, styles, forms, embedded frames - runs in WeKan. A card's text is
  written into an exported site the same way, escaped, never as markup.
- Unapproved, spam and trashed items.

## REST API

- Import: `POST /api/boards/import/<source>` with the file's text, the JSON, or
  a `.zip` as `{ "zipBase64": "..." }` - `wordpress`, `wordpressjson`, `ghost`,
  `blogger`, `markdownsite`, `htmlsite`, `substack`.
- Export: `GET /api/boards/:boardId/export/<format>` - `wordpress`,
  `wordpressjson`, `ghost`, `blogger`, `markdownsite`, `htmlsite`.

## How it is built and tested

`server/lib/websiteImport.js` reads each format (htmlparser2 for the XML and
the HTML, the import page's `.zip` reader with its size limits);
`models/lib/websiteFormat.js` makes the board and writes every export;
`models/lib/websiteView.js` is Board View / Website. `tests/websiteFormat.test.cjs`
writes each format, reads it back, reads real-shaped exports of every
software, and checks that no script of a site reaches a card, and no script of
a card reaches an exported site.

## Sources

- WordPress eXtended RSS (WXR) 1.2, as WordPress's Tools → Export writes it.
- The WordPress REST API reference, posts and pages.
- Ghost's import and export format.
- Blogger's Atom export.
- Hugo, Jekyll and Eleventy front matter.
- Substack's export.
