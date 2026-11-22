# Mermaid diagrams (removed)

## What it is

Mermaid draws diagrams (flowcharts, pie charts, sequence diagrams and more)
from text. WeKan used to render a ` ~~~mermaid ` block in a card description as
a diagram. **It does not work anymore and was removed in WeKan v6.76**; this
page keeps how it worked, for the record and in case it comes back.

## Read more

- [Mermaid (software)](https://en.wikipedia.org/wiki/Mermaid_(software)) on
  Wikipedia, [Mermaid](https://mermaid.js.org/), and the issues
  [#4841](https://github.com/wekan/wekan/issues/4841) (why it was removed) and
  [#3794](https://github.com/wekan/wekan/issues/3794) (comment there if Mermaid
  is useful).
- WeKan pages: [Markdown](Markdown/Markdown.md).

## How to use it

It cannot be used in current WeKan: a ` ~~~mermaid ` block is shown as a code
block. The old steps are under "Howto" below.

## How the numbers are calculated

There are no numbers; the feature is removed.

## How it works in WeKan

The plugin import and `Markdown.use(markdownItMermaid, ...)` are commented out
in [packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js),
so nothing renders Mermaid.

### DOES NOT WORK ANYMORE

https://github.com/wekan/wekan/issues/4841

As of newest Mermaid 10.0.0, Mermaid does not work in WeKan anymore, so Mermaid was removed in WeKan v6.76. xet7 did maintain https://www.npmjs.com/package/@wekanteam/markdown-it-mermaid but after updating to Mermaid 10.0.0 using Mermaid on WeKan card description etc did not work anymore.

### Source

- [Original issue, please comment there if Mermaid is useful](https://github.com/wekan/wekan/issues/3794).
- [Original commit](https://github.com/wekan/wekan/commit/5ab20a925763a3af941c42d1943da9c8bb8852bd)

### Npm package

- NPM package at https://www.npmjs.com/package/@liradb2000/markdown-it-mermaid

### About examples

- Below examples and more at https://mermaid-js.github.io/mermaid/#/examples
- https://jessems.com/posts/2023-07-22-the-unreasonable-effectiveness-of-sequence-diagrams-in-mermaidjs
- https://news.ycombinator.com/item?id=36845714

### Howto

- Add mermaid code to Wekan card or any other input field. After some time, if chart is not visible, reload browser webpage.
- Mermaid code starts with `~~~mermaid`
- Mermaid code ends with `~~~`

### Example 1: Flowchart

```
~~~mermaid
    graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server01]
    B --> D[Server02]
~~~
```

### Example 2: Pie Chart

```
~~~mermaid
pie title NETFLIX
         "Time spent looking for movie" : 90
         "Time spent watching it" : 10
~~~
```

### Example 3: Gantt Chart

```
~~~mermaid
gantt
    dateFormat  YYYY-MM-DD
    title       Adding GANTT diagram functionality to mermaid
    excludes    weekends
    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2              :         des4, after des3, 5d

    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :1d

    section Documentation
    Describe gantt syntax               :active, a1, after des1, 3d
    Add gantt diagram to demo page      :after a1  , 20h
    Add another diagram to demo page    :doc1, after a1  , 48h

    section Last section
    Describe gantt syntax               :after doc1, 3d
    Add gantt diagram to demo page      :20h
    Add another diagram to demo page    :48h
~~~
```

## Commits

 - [Removed Mermaid, because newest Mermaid does not work anymore](https://github.com/wekan/wekan/commit/67500abcd4d034ebed2d13f5156123d5f70bd014)
 - [Updated dependencies like mermaid](https://github.com/wekan/wekan/commit/abc5601942cddc8024941d3e94c2468610e32f8d)
 - [Updated markdown-it-mermaid](https://github.com/wekan/wekan/commit/fe1e1983adfb29c0522c2f81d1ffe1432e496348)
 - [Try to fix a Mermaid error in Chrome](https://github.com/wekan/wekan/commit/2573d325e62675771e2faf5ee2c26758d1dda86d)
 - [Original Mermaid commit](https://github.com/wekan/wekan/commit/5ab20a925763a3af941c42d1943da9c8bb8852bd)
