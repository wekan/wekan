# Markdown editor

WeKan uses a plain-text textarea to edit Markdown in card descriptions and
comments, with mention suggestions and rendered previews. It does not use a
WYSIWYG editor: no existing editor supports the complete combination of WeKan's
Markdown, emoji, security requirements and other editing features.

Editing and rendering are separate. Markdown rendering, emoji, mentions,
HTML-to-Markdown conversion and attachment links remain available. Uploaded
files stay in the card's Attachments section and can be referenced from text.
There is no environment variable or Snap option to enable a visual editor.

Notification email formatting is independent of the text editor. Default
notification bodies use the shared HTML-escaping formatter; administrator-defined
email body templates retain their existing behavior.
