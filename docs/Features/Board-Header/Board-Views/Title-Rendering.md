# Board-view titles

## What it is

Every board view shows titles - of lists, cards, swimlanes, groups and chart
rows - and all of them are drawn by one shared viewer. That viewer renders
Markdown, emoji and sanitized HTML the same way everywhere, and it follows the
same Admin Panel security settings everywhere, so a title cannot look or behave
differently, or slip past a security setting, just because it is shown in
another view.

## Read more

- [Markdown](https://en.wikipedia.org/wiki/Markdown),
  [Emoji](https://en.wikipedia.org/wiki/Emoji) and
  [HTML sanitization](https://en.wikipedia.org/wiki/HTML_sanitization) at
  Wikipedia.
- [Cross-site scripting](https://en.wikipedia.org/wiki/Cross-site_scripting)
  at Wikipedia - what sanitizing and escaping the titles protects against.
- [Scalable Vector Graphics](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics)
  at Wikipedia - why chart bar labels can hold text but not HTML.
- WeKan: [Security Report](../../Admin-Panel/Problems/Security-Report.md),
  [Admin Panel / Settings / Security](../../Admin-Panel/Settings/Security.md),
  [Gantt](Gantt.md), [Roadmap](Roadmap.md), [Timeline](Timeline-View.md),
  [Group by Assignee](Group-By-Assignee.md), [Table](Table-View.md),
  [Bigboard](Bigboard.md),
  [Board report charts](Charts/Board-Report-Charts.md).

## How to use it

There is nothing to switch on: write Markdown or emoji in a title, and every
board view shows it formatted.

**Where the viewer is used.** List headers, minicards, table rows and group
headings, timeline list/card names, assignee cards, Bigboard names, original
titles and Roadmap headings use the shared viewer for Markdown, emoji and
sanitized HTML. Cumulative flow, Control chart and other report charts also
render headings and table headers/cells through this viewer. Canvas labels
retain rendered text and emoji, with HTML formatting available in the adjacent
table.

DHTMLX Gantt task names and tooltips use the same viewer. Frappe Gantt and
Roadmap SVG labels display the viewer's text and emoji, with markup escaped
for SVG insertion; their popups display the formatted viewer HTML. SVG text
labels do not support HTML heading styles. Chart refreshes observe security
settings. No Internet connection or new dependency is required.

**The security settings.** Admin Panel / Problems / Security settings apply
consistently:

1. Open **Admin Panel → Problems** and its security settings.
2. **Render links as plain text** removes clickable links while preserving
   text.
3. **Always show all code as plain text** (the source-as-plain-text setting)
   displays literal Markdown and emoji codes.
4. Open any board view: its titles follow the setting at once, charts
   included.

## How the numbers are calculated

The titles have no numbers of their own. The viewer has no limits or defaults
of its own either: it shows the title as stored, and both security settings
are off by default.

## How it works in WeKan

- **The shared viewer**: the `+viewer` template, used directly in the board
  views' Jade templates (for example
  [roadmapView.jade](../../../../client/components/boards/roadmapView.jade),
  [timelineView.jade](../../../../client/components/boards/timelineView.jade),
  [groupByAssigneeView.jade](../../../../client/components/boards/groupByAssigneeView.jade)).
- **Third-party charts** do not mount Blaze templates, so
  [client/lib/titleViewer.js](../../../../client/lib/titleViewer.js) renders
  the same viewer to HTML (`titleViewerHtml`, through
  [client/lib/titleViewer.jade](../../../../client/lib/titleViewer.jade)
  `chartTitleViewer`). For SVG labels, `titleViewerText` keeps only the
  rendered text and emoji, and `titleViewerSvgText` escapes `& < > " '`,
  because Frappe Gantt inserts the label as HTML. Reading the current settings
  inside the chart's own computation is what makes a chart redraw when a
  security setting changes.
- **Settings**: `render-links-as-plain-text` and `always-show-code-as-text`
  in [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade).
- **Tests**:
  [tests/boardViewTitleViewer.test.cjs](../../../../tests/boardViewTitleViewer.test.cjs),
  [tests/activityViewer.test.cjs](../../../../tests/activityViewer.test.cjs),
  [tests/boardChartsAfterFlushContext.test.cjs](../../../../tests/boardChartsAfterFlushContext.test.cjs),
  [tests/playwright/specs/board-view-titles.e2e.js](../../../../tests/playwright/specs/board-view-titles.e2e.js).

## Verification

Verification on 2026-09-14: focused Node tests, assignee helper execution and
all Jade template compilation passed. Browser tests cover timeline, assignee
DHTMLX, cumulative-flow and Control chart titles with formatted, plain-link and
literal-source policies;
they were syntax-checked but have not been run against a live application.
The combined focused run passed all 33 Node test entries, including avatar
routing, HTTP authentication and safe attachment responses.

## Commits

 - [The title heading colour guard reads the heading block itself](https://github.com/wekan/wekan/commit/21b2da9ad2207af17049274ae8f2dcdca3d44b92)
 - [Original positions titles through the shared viewer](https://github.com/wekan/wekan/commit/b9e28a8fbbd0f20ea3cc4d86f4e665fa00bc95be)
 - [Board view titles exercised through visible controls](https://github.com/wekan/wekan/commit/929326ba2258015881bf0ca227e17a19eadb1314)
 - [Opened card List dropdown titles with the secure viewer](https://github.com/wekan/wekan/commit/95f02688900622bcca4b0776691cf41ffbc3317d)
 - [Markdown heading sizes restored in card titles](https://github.com/wekan/wekan/commit/4a01cc9beb75474a0392230fc84ec4f6e0a693e6)
 - [Card numbers kept outside the Markdown title source](https://github.com/wekan/wekan/commit/bf207d4d27f873e33e96c9186356c919fc358cb4)
 - [Minicard and opened card titles covered under the security settings](https://github.com/wekan/wekan/commit/6c729e60e6b371357c4996d17d8c54bee2929f2a)
 - [Report viewer policies recorded](https://github.com/wekan/wekan/commit/3589309a39ba029f6e165479daf53058b97274e2)
 - [Control chart titles covered under all viewer policies](https://github.com/wekan/wekan/commit/ca8d599787708b6484a81773ea05bc2eeb876467)
 - [The shared title viewer in cumulative flow and the report charts](https://github.com/wekan/wekan/commit/5ca16f32ed9924f2a4388cf7a5eb4a239d7e9692)
 - [Board title policies and their regression coverage documented](https://github.com/wekan/wekan/commit/02609d1c388fbda7f773e6a707eb2e749ef13dd3)
 - [Time view card titles with the security-aware viewer](https://github.com/wekan/wekan/commit/dc08557113ad9fbd18c08e2e2a805f0473fa952e)
 - [Security-aware title viewers in the timeline and Gantt views](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
