# Activity rendering

## What it is

The activity feed lists what happened on a board or a card: a card created, a
title changed, a label added, a comment written. This page is about how the
values inside those sentences - titles, labels, comments, file names - are
drawn. They are rendered as Markdown with emoji, like every other text field in
WeKan, and pass through the same HTML sanitizer, so an activity can never show
markup that the card itself could not.

## Read more

- [Activity stream](https://en.wikipedia.org/wiki/Activity_stream) on Wikipedia -
  a list of recent actions, which is what the feed is.
- [Markdown](https://en.wikipedia.org/wiki/Markdown),
  [HTML sanitization](https://en.wikipedia.org/wiki/HTML_sanitization) and
  [cross-site scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) on
  Wikipedia - the formatting used, the cleaning done, and the attack it
  prevents.
- [sanitize-html](https://github.com/apostrophecms/sanitize-html) - the HTML
  sanitizer library the tests run the real output through.
- [Admin Panel / Settings / Security](../../Admin-Panel/Settings/Security.md) and
  [Member Settings / Activity feed](../../Member-Settings/Activity-Feed.md).

## How to use it

**See the activities.**

1. Open a card: its activities are under its details. Or open a board's right
   sidebar: its activities are the board's feed.
2. Titles, checklist text, labels, custom-field values, comment excerpts,
   source names and attachment names are shown formatted - bold, links, emoji -
   as they are on the card.
3. Click a linked title to go to that card, list or board. When the title holds
   a link of its own, an arrow (`↗`) beside it is the way to the card instead.

**Change how they are shown** (site admin):

1. Open **Admin Panel → Settings → Security**.
2. Tick **Always show all code as plain text** to show the literal source of
   every rich text field, activities included - Markdown and HTML as typed.
3. Tick **Render links as plain text** to remove clickable links from activity
   sentences and every other rich text field.
4. With both off (the default), Markdown, emoji and permitted HTML are rendered
   after sanitization.

## How the numbers are calculated

Activity rendering has no numbers of its own. It has three display modes, set
by two switches that are off by default: normal, links as plain text, and all
code as plain text.

## How it works in WeKan

Opened-card activities and the right sidebar share the same activity template
(`activities` and `activity` in
[client/components/activities/activities.jade](../../../../client/components/activities/activities.jade),
included with `mode="card"`, `mode="board"` and the linked-card and
linked-board modes). Activity titles, checklist text, labels, custom-field
values, comment excerpts, source names and attachment names use the existing
Markdown/emoji viewer: `activityValue()` in
[client/components/activities/activities.js](../../../../client/components/activities/activities.js)
returns `titleViewerHtml()` from
[client/lib/titleViewer.js](../../../../client/lib/titleViewer.js). HTML allowed
by the existing sanitizer is rendered with the same restrictions as other viewer
fields. No new HTML tags or URL schemes are permitted.

The Security controls apply (they were in Admin Panel → Problems until
2026-11-19, and are in Admin Panel → Settings → Security now):

- Plain-source mode (**Always show all code as plain text**,
  `alwaysShowCodeAsText`) displays literal source, including Markdown and HTML.
- **Render links as plain text** (`renderLinksAsPlainText`) removes clickable
  links from activity sentences: the messages are sanitized with
  `stripLinks`.
- Normal mode renders Markdown, emoji and permitted HTML after sanitization.

Imported source URLs retain their HTTP/HTTPS check (`/^https?:\/\//`). When a
rich title contains its own link, activity navigation is shown beside it to
avoid nested anchors (`linkedActivityValue()`).

**Tests.** Focused activity-link, viewer, source-URL and Jade compilation checks
pass: [tests/activityViewer.test.cjs](../../../../tests/activityViewer.test.cjs)
(both feeds use the shared viewer, rich links keep allowed HTML without nested
anchors, malformed script end tags are removed by the real sanitizer, message
values are substituted with the real formatter) and
[tests/activityCardLink.test.cjs](../../../../tests/activityCardLink.test.cjs).
Browser regressions in
[tests/playwright/specs/activity-viewer.e2e.js](../../../../tests/playwright/specs/activity-viewer.e2e.js)
cover both feeds, permitted HTML, unsafe event attributes and all three display
modes. They were syntax-checked when this page was written; live execution was
pending.

## Commits

 - [Version Control, the activity feed and the email list render titles as Markdown](https://github.com/wekan/wekan/commit/2cc6b93ed9e9b9bae03927acb627ac2f2e2b7d5d)
 - [Repair the browser test flows and the Markdown package exports](https://github.com/wekan/wekan/commit/fb66fa95cfd2c206456b7b129230dd376240045b)
 - [Browser palette coverage for activity label badges](https://github.com/wekan/wekan/commit/ccbcabd91ee005f7ea8ca5b476a1d5b143f26dda)
 - [Activity labels are drawn as the card's label badges](https://github.com/wekan/wekan/commit/1896660a9a93e313a679fc43d7d73796bbc38fa8)
 - [Activity message values are substituted through the current translation API](https://github.com/wekan/wekan/commit/888e0e6bcd7074a573f1a433b6c7748dba1bb2c2)
 - [The tests use the real HTML sanitizer](https://github.com/wekan/wekan/commit/11d2fe037c445c3b5256fbf9a6d19b0437e448d1)
 - [Activity values are rendered with the shared security-aware viewer](https://github.com/wekan/wekan/commit/e5937d53145477f3ff649f3556d554f6b6567d41)
