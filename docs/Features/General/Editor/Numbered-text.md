# Numbered text

## What it is

Markdown turns a line that starts with a number and a dot into a numbered list
item, and numbers the items itself. That is handy in descriptions, but a list
title such as `3. Something` would become a list item. This page shows how to
keep the number as text, and how the automatic numbering works.

## Read more

- [Markdown](https://en.wikipedia.org/wiki/Markdown) on Wikipedia, and
  [ordered lists in the CommonMark specification](https://spec.commonmark.org/0.31.2/#ordered-list).
- [Related formatting tips for numbered lists](https://github.com/wekan/wekan/issues/2425).
- WeKan pages: [Markdown](Markdown/Markdown.md),
  [Markdown editor](Markdown-Editor.md).

## How to use it

**Keep a number as text.** If in List titles you like to create numbered text
like this:

```
3. Something
```

Write it this way (to escape dot), so it shows correctly:

```
3\. Something
```

This happens because of markdown support for autonumbering in input fields.

**Let Markdown number a list.** For example, if you write numbered list like:

```
1. Something nice
1. Something cool
1. Something great
```

It will be autonumbered like this, so you can cut/paste reorder list freely,
without manually reordering numbers:

```
1. Something nice
2. Something cool
3. Something great
```

For example, when you reorder numbered list like this:

```
1. Something great
1. Something nice
1. Something cool
```

It will show automatically numbered like this:

```
1. Something great
2. Something nice
3. Something cool
```

## How the numbers are calculated

An ordered list starts at the number of its first item and counts up by one
for each following item, whatever numbers those items were written with
(markdown-it follows CommonMark here). `3\.` escapes the dot, so the line is not
a list item and the `3` stays as written.

## How it works in WeKan

List, swimlane and card titles and descriptions are rendered with the
`viewer` template through markdown-it
([packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js)).
WeKan has no numbering code of its own.

## Commits

 - [Meteor 3.4 migration, with the markdown-it package](https://github.com/wekan/wekan/commit/e8fee653c3c752717fe97cf413f02399cfc1d231)
