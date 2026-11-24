# Searching inside attachments, and checking that they are unchanged

## What it is

WeKan reads the words inside a card's attachments, so **Filter**, the
board's **Search** and **Search All Boards** also find a card by what its
files say. It also keeps a checksum of every attachment and checks it each
time the file is read whole, so a file that was changed behind WeKan's back -
on disk, in a bucket - is noticed and reported to the administrator.

## Read more

- [Full-text search](https://en.wikipedia.org/wiki/Full-text_search) on
  Wikipedia - searching inside documents rather than only their titles.
- [SHA-2](https://en.wikipedia.org/wiki/SHA-2) (SHA-256 is one of them),
  [Cryptographic hash function](https://en.wikipedia.org/wiki/Cryptographic_hash_function),
  [File verification](https://en.wikipedia.org/wiki/File_verification) and
  [Data integrity](https://en.wikipedia.org/wiki/Data_integrity).
- [PDF.js](https://mozilla.github.io/pdf.js/) and
  [fflate](https://github.com/101arrowz/fflate) - the libraries that read the
  text of PDF and Office files.
- In WeKan: [Attachments](README.md) and the daily
  [storage integrity scan](../../../Security/Remediation/WeKan.md).

## How to use it

**Finding a card by the text in its attachments:**

1. Add an attachment to a card as usual (**+** in the card's Attachments
   section). Its search text is made in the background.
2. Open the board's **Filter** and type a word from the file into its text
   field, or use the board's **Search**, or **Search All Boards**.
3. The card whose attachment contains the word is found.

**Seeing a changed file:** nothing to do. When a read finds an attachment
whose content changed and nothing explains it, **Admin Panel / Problems**
shows a warning in the Integrity category.

## How the numbers are calculated

From [models/lib/attachmentContent.js](../../../../models/lib/attachmentContent.js)
and [server/lib/attachmentContentIndex.js](../../../../server/lib/attachmentContentIndex.js):

- The **hash** is the SHA-256 of the file's bytes, stored with the file's size
  in bytes and the time it was made. A hash is compared only when it is 64
  hexadecimal characters.
- A **whole read** is one that sent as many bytes as the attachment's size (or
  the attachment has no size); a read that stopped early, or an HTTP range,
  checks nothing.
- The **search text** is cut at 2 MB (`MAX_SEARCH_TEXT`); a text file is read
  for its first 4 MB (`MAX_TEXT_READ`). PDF and Office text is bounded as in
  [Attachments](README.md) (32 MiB source, 200 pages, 2 MiB text).
- Two attachments are indexed at a time (`MAX_CONCURRENT`).
- The **known versions** are the hashes in the attachment's card history rows
  (their previous and new content).

## How it works in WeKan

Every attachment gets two things, each with the time it was made:

| | What it is | Where |
| --- | --- | --- |
| **Hash** | the SHA-256 of the file's content, and its size | `contentHash` on the attachment |
| **Search text** | the file's words as plain text - no markup, styles or images, at most 2 MB | the attachment text index (`documentPreviews`, `searchText` and `generatedAt`) |

They are made when the attachment is added, in the background, so adding a
file is not slower. An attachment added before this has neither: it gets
them the first time it is read whole.

### What is searchable

| File | Its search text |
| --- | --- |
| text, Markdown, CSV, JSON, code, logs, e-mail (`.eml`), HTML and XML - also SVG, RTF, TeX and subtitles (`.srt`, `.vtt`) | the text itself (markup removed); the first 4 MB are read |
| PDF, Word `.docx`, Excel `.xlsx`, PowerPoint `.pptx` | the document's text |
| Outlook `.msg`, OpenDocument `.odt` `.ods` `.odp` | the text of the rows the slideshow's conversion writes |
| images, video, audio, archives (tar too) | nothing |

**Filter** (its text field), the board's **Search** and **Search All Boards**
find a card by the text in its attachments. Only live attachments count: a
deleted one is found by nothing, and a match is checked against the
attachment itself, so it must still be on that card. The search is done on
the server (`attachmentTextCardIds`, used by
[server/lib/boardTextSearch.js](../../../../server/lib/boardTextSearch.js));
the search text is never sent to the browser.

### The check on every read

Each time an attachment is read whole - opened, downloaded, shown in the
slideshow - the bytes sent are hashed on the way out, so the file is not read
twice, and compared with the stored hash (`decideHash`):

| What the read finds | What happens |
| --- | --- |
| the same hash | nothing |
| no hash stored yet | it is stored, and the search text is made |
| a different hash that the card history knows - an earlier version that an undo or a restore brought back | it is accepted: a new hash and new search text are made |
| a different hash nothing explains | a warning in **Admin Panel / Problems** (Integrity, key `integrity.file`, action `detected`), and the stored hash is kept, so the next read warns again until someone looks |

A part of a file (an HTTP range, as video players and the slideshow read) is
not a whole read and checks nothing. Every attachment added now has an
"Added" row in its card history carrying its hash, and a deleted or restored
attachment's row carries it too - those are the earlier versions the check
knows.

This complements the daily [storage integrity scan](../../../Security/Remediation/WeKan.md),
which walks the filesystem storage: this check works in every storage
(filesystem, GridFS, S3 and the rest) at the moment a file is used.

### For developers

[models/lib/attachmentContent.js](../../../../models/lib/attachmentContent.js)
decides (pure, `tests/attachmentContent.test.cjs`);
[server/lib/attachmentContentIndex.js](../../../../server/lib/attachmentContentIndex.js)
reads, writes and warns (`hashingTap`, `indexAttachmentContent`,
`afterWholeRead`); PDF and Office text comes from `indexDocumentText` in
[server/lib/documentGif.js](../../../../server/lib/documentGif.js);
`tests/playwright/specs/attachment-content-search.e2e.js` adds a file, finds it
with Filter, Search and Search All Boards, changes it on disk and reads it.

## Commits

 - [a SHA-256 and plain search text for each attachment, checked on every read, and searched by Filter, Search and Search All Boards](https://github.com/wekan/wekan/commit/b335c5df0718e10f064706de293237926de196d1)
 - [searchable document text generated on the server](https://github.com/wekan/wekan/commit/818b57421f60532f12f366fbf8f9d9cec33c00a1)
