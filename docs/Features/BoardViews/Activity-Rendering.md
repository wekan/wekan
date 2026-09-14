# Activity rendering

Opened-card activities and the right sidebar share the same activity template.
Activity titles, checklist text, labels, custom-field values, comment excerpts,
source names and attachment names use the existing Markdown/emoji viewer.
HTML allowed by the existing sanitizer is rendered with the same restrictions
as other viewer fields. No new HTML tags or URL schemes are permitted.

Admin Panel → Problems → Security controls apply:

- Plain-source mode displays literal source, including Markdown and HTML.
- Render links as plain text removes clickable links from activity sentences.
- Normal mode renders Markdown, emoji and permitted HTML after sanitization.

Imported source URLs retain their HTTP/HTTPS check. When a rich title contains
its own link, activity navigation is shown beside it to avoid nested anchors.

Focused activity-link, viewer, source-URL and Jade compilation checks pass.
Browser regressions cover both feeds, permitted HTML, unsafe event attributes
and all three display modes. They are syntax-checked; live execution is pending.
