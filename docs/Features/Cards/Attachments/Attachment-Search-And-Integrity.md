# Searching inside attachments, and checking that they are unchanged

Every attachment gets two things, each with the time it was made:

| | What it is | Where |
| --- | --- | --- |
| **Hash** | the SHA-256 of the file's content, and its size | `contentHash` on the attachment |
| **Search text** | the file's words as plain text - no markup, styles or images, at most 2 MB | the attachment text index (`documentPreviews`, `searchText` and `generatedAt`) |

They are made when the attachment is added, in the background, so adding a
file is not slower. An attachment added before this has neither: it gets
them the first time it is read whole.

## What is searchable

| File | Its search text |
| --- | --- |
| text, Markdown, CSV, JSON, code, logs, e-mail (`.eml`), HTML and XML | the text itself (markup removed); the first 4 MB are read |
| PDF, Word `.docx`, Excel `.xlsx`, PowerPoint `.pptx` | the document's text |
| Outlook `.msg`, OpenDocument `.odt` `.ods` `.odp` | the text of the rows the slideshow's conversion writes |
| images, video, audio, archives | nothing |

**Filter** (its text field), the board's **Search** and **Search All Boards**
find a card by the text in its attachments. Only live attachments count: a
deleted one is found by nothing, and a match is checked against the
attachment itself, so it must still be on that card. The search is done on
the server; the search text is never sent to the browser.

## The check on every read

Each time an attachment is read whole - opened, downloaded, shown in the
slideshow - the bytes sent are hashed on the way out, so the file is not read
twice, and compared with the stored hash:

| What the read finds | What happens |
| --- | --- |
| the same hash | nothing |
| no hash stored yet | it is stored, and the search text is made |
| a different hash that the card history knows - an earlier version that an undo or a restore brought back | it is accepted: a new hash and new search text are made |
| a different hash nothing explains | a warning in **Admin Panel / Problems** (Integrity), and the stored hash is kept, so the next read warns again until someone looks |

A part of a file (an HTTP range, as video players and the slideshow read) is
not a whole read and checks nothing. Every attachment added now has an
"Added" row in its card history carrying its hash, and a deleted or restored
attachment's row carries it too - those are the earlier versions the check
knows.

This complements the daily [storage integrity scan](../../../Security/Remediation/WeKan.md),
which walks the filesystem storage: this check works in every storage
(filesystem, GridFS, S3 and the rest) at the moment a file is used.

For developers: `models/lib/attachmentContent.js` decides
(`tests/attachmentContent.test.cjs`); `server/lib/attachmentContentIndex.js`
reads, writes and warns; `tests/playwright/specs/attachment-content-search.e2e.js`
adds a file, finds it with Filter, Search and Search All Boards, changes it on
disk and reads it.
