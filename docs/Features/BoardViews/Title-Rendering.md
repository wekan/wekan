# Board-view titles

List headers, minicards, table rows and group headings, timeline list/card
names, assignee cards, Bigboard names, original titles and Roadmap headings
use the shared viewer for Markdown, emoji and sanitized HTML. Cumulative
flow, Control chart and other report charts also render headings and table headers/cells
through this viewer. Canvas labels retain rendered text and emoji, with
HTML formatting available in the adjacent table.

Admin Panel / Problems / Security settings apply consistently:

- Render links as plain text removes clickable links while preserving text.
- The source-as-plain-text setting displays literal Markdown and emoji codes.

DHTMLX Gantt task names and tooltips use the same viewer. Frappe Gantt and
Roadmap SVG labels display the viewer's text and emoji, with markup escaped
for SVG insertion; their popups display the formatted viewer HTML. SVG text
labels do not support HTML heading styles. Chart refreshes observe security
settings. No Internet connection or new dependency is required.

Verification on 2026-09-14: focused Node tests, assignee helper execution and
all Jade template compilation passed. Browser tests cover timeline, assignee
DHTMLX, cumulative-flow and Control chart titles with formatted, plain-link and
literal-source policies;
they were syntax-checked but have not been run against a live application.
The combined focused run passed all 33 Node test entries, including avatar
routing, HTTP authentication and safe attachment responses.
