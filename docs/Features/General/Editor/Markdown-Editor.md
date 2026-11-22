# Markdown editor

## What it is

WeKan uses a plain-text textarea to edit Markdown in card descriptions and
comments, with mention suggestions and rendered previews. It does not use a
WYSIWYG editor: no existing editor supports the complete combination of WeKan's
Markdown, emoji, security requirements and other editing features.

## Read more

- [Markdown](https://en.wikipedia.org/wiki/Markdown) and
  [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG) on Wikipedia.
- [markdown-it](https://github.com/markdown-it/markdown-it), the renderer,
  [DOMPurify](https://github.com/cure53/DOMPurify), the sanitizer, and
  [html-to-markdown](https://github.com/wekan/html-to-markdown), which turns
  pasted HTML into Markdown.
- WeKan pages: [Markdown](Markdown/Markdown.md), [Emoji](Emoji.md),
  [LaTeX](LaTeX.md), [Numbered text](Numbered-text.md), [RTL](RTL/RTL.md).

## How to use it

1. Open a card and click its description, or the comment field.
2. Write Markdown. Type `@` and the start of a name to get member suggestions;
   pick one with the mouse or Enter.
3. Save. The text is shown rendered.

Editing and rendering are separate. Markdown rendering, emoji, mentions,
HTML-to-Markdown conversion and attachment links remain available. Uploaded
files stay in the card's Attachments section and can be referenced from text.
There is no environment variable or Snap option to enable a visual editor.

## How the numbers are calculated

The editor has no numbers of its own. A mention suggestion starts after `@`
followed by letters, digits, `.` or `-` (`/\B@([\w.-]*)$/`).

## How it works in WeKan

- The `editor`, `viewer` and `inlineViewer` templates are
  [client/components/main/editor.jade](../../../../client/components/main/editor.jade)
  and [editor.js](../../../../client/components/main/editor.js); the
  description and comment forms include `+editor`.
- Rendering is the `markdown` package,
  [packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js)
  (markdown-it with `html`, `linkify` and `breaks` on, emoji, math, task lists),
  and its output is cleaned by
  [packages/markdown/src/secureDOMPurify.js](../../../../packages/markdown/src/secureDOMPurify.js).
- Notification email formatting is independent of the text editor. Default
  notification bodies use the shared HTML-escaping formatter;
  administrator-defined email body templates retain their existing behavior.

## Commits

 - [Version Control, the activity feed and the email list render titles as Markdown](https://github.com/wekan/wekan/commit/2cc6b93ed9e9b9bae03927acb627ac2f2e2b7d5d)
 - [Copying a code block no longer opens a new tab](https://github.com/wekan/wekan/commit/0495b8729d6bfd0b6fdc0dfd0891f0598b0f402a)
 - [Link custom URL schemes only when an administrator lists them](https://github.com/wekan/wekan/commit/b7a3b29a2bb1ff45e5abeda4bbb82b662c9667ab)
 - [Remove the obsolete Summernote integration](https://github.com/wekan/wekan/commit/5ed9fc944a70a668c757f385b90429293d246ef8)
 - [Visible, selectable comment mention suggestions](https://github.com/wekan/wekan/commit/193c799539002d347e182b5545b126db0ff869f7)
 - [A pasted link to another WeKan card shows that card's title](https://github.com/wekan/wekan/commit/1d4a47db25f503c99c85acd1c2fd100f708ef7d8)
