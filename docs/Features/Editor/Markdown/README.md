# Markdown

## What it is

Markdown is a light way to format text with ordinary characters: `**bold**`,
`# heading`, `- list`, `[link](https://example.com)`. WeKan renders Markdown in card titles and
descriptions, comments, checklists, list and swimlane titles and many other
places, so the text you type shows formatted.

UPDATE: Wekan now uses markdown-it and markdown-it-emoji plugin, see
[Emoji page](../Emoji.md).

## Read more

- [Markdown](https://en.wikipedia.org/wiki/Markdown) on Wikipedia,
  [CommonMark](https://commonmark.org/), and GitHub Flavored Markdown:
  * [Guide](https://guides.github.com/features/mastering-markdown/).
  * [List of features](https://github.github.com/gfm/).
- [markdown-it](https://github.com/markdown-it/markdown-it), the renderer WeKan
  uses now.
- [Adding markdown to more places at Wekan progress](https://github.com/wekan/wekan/issues/2334)
- [Related formatting tips for numbered lists](https://github.com/wekan/wekan/issues/2425)
- [Checklist on markdown](https://github.com/wekan/wekan/issues/2419) - fixed,
  see below.
- WeKan pages: [Markdown editor](../Markdown-Editor.md),
  [Numbered text](../Numbered-text.md), [Emoji](../Emoji.md),
  [LaTeX](../LaTeX.md).

## How to use it

**Where can I use the markdown?**

* Card name.
* Board name - Works on board view only.
* Card description, list and task list.
* Comments, checklist items, list and swimlane titles.

**Numbered text.** If in List titles you like to create numbered text like this:

```
3. Something
```

Write it this way (to escape dot), so it shows correctly:

```
3\. Something
```

See [Numbered text](../Numbered-text.md).

**Task lists.** `- [ ] Task` and `- [x] Done` show a checkbox. The checkbox is
not clickable: it shows the state written in the text
([#2419](https://github.com/wekan/wekan/issues/2419); the old note "Checklist on
markdown does not work yet" no longer applies).

## How the numbers are calculated

Markdown has no numbers of its own here; ordered lists are numbered as
described in [Numbered text](../Numbered-text.md).

## How it works in WeKan

History: Wekan used GFM (Github Flavored Markdown) through the project that
ported GFM to Meteor, https://github.com/wekan/markdown, a fork of
https://github.com/perak/markdown. **Note**: In order to use gfm checklist and
other v0.28+ features, you need Wekan v2.61+. That port is no longer used.

Now:

- The `markdown` package in this repository,
  [packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js),
  sets up markdown-it with `html`, `linkify` and `breaks` on, the emoji and math
  plugins, a task-list rule, and highlight.js for fenced code blocks.
  markdown-it's own `~~strikethrough~~` works because the sanitizer keeps the
  `s`, `del` and `strike` tags.
- Every result is cleaned by
  [packages/markdown/src/secureDOMPurify.js](../../../../packages/markdown/src/secureDOMPurify.js);
  only the URL schemes an administrator lists are linked.
- Tests: [tests/markdownTaskListCheckbox.test.cjs](../../../../tests/markdownTaskListCheckbox.test.cjs),
  [tests/markdownSanitizerHooks.test.cjs](../../../../tests/markdownSanitizerHooks.test.cjs),
  [tests/markdownCustomUrlSchemes.test.cjs](../../../../tests/markdownCustomUrlSchemes.test.cjs).

## Commits

 - [One copy of the autolinks, shared by the app and the markdown package](https://github.com/wekan/wekan/commit/eb0df61e7f9681379491dc45431b7373271e7614)
 - [Card links never launch a dangerous OS handler](https://github.com/wekan/wekan/commit/b4e5f90afb87442e2152d79d7f0cadf4dacd4e16)
 - [Autolink references to other tools](https://github.com/wekan/wekan/commit/ed993fef844923b37648d710a9fcc593ca61583a)
 - [Every hidden HTML comment is made visible](https://github.com/wekan/wekan/commit/1076c08381c89758c2fdb19f4bc58633728c9142)
 - [Link custom URL schemes only when an administrator lists them](https://github.com/wekan/wekan/commit/b7a3b29a2bb1ff45e5abeda4bbb82b662c9667ab)
 - [Highlight fenced code blocks with highlight.js](https://github.com/wekan/wekan/commit/9486ea3d49799137974cfa7517b535a1efb3d63b)
 - [Task-list checkboxes in the card viewer again](https://github.com/wekan/wekan/commit/911e689d238b2c9535af51b773e9824490ad35b0)
 - [Render "- [ ] Task" as a real checkbox](https://github.com/wekan/wekan/commit/0aa1702c0b4ac855b70b74c0d6f73a3fd48d20cf)
 - [A file:// link no longer makes the card impossible to open](https://github.com/wekan/wekan/commit/75a23b76ae64a179e72e61c04daba9e54b9f8908)
 - [Always show all code as plain text option](https://github.com/wekan/wekan/commit/38ce4978870a5a3057eaa19acf42eb7bd69574e7)
 - [Fix GFM strikethrough in card descriptions](https://github.com/wekan/wekan/commit/92b0f96387c831839eb299a8feb00fe614419783)
