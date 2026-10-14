'use strict';

// Titles, names and labels are Markdown in WeKan - links, emphasis, emoji -
// rendered by the viewer with the Admin Panel's security settings, and the
// board views that showed them as text (the email list, Version Control,
// Chat, the activity feed: "# Demo card :thumbsup:", "[issues](https://...)")
// render them now, inline (inlineViewer, client/components/main/editor.jade).
// Run: node tests/renderedTitles.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// inlineViewer is the viewer itself, inline: nothing of it bypasses the viewer.
const editor = read('client/components/main/editor.jade');
assert.match(editor, /template\(name="inlineViewer"\)\n  span\.inline-viewer\n    \+viewer\n      \{\{> UI\.contentBlock \}\}/);
assert.match(read('client/components/main/editor.css'), /\.inline-viewer,\n\.inline-viewer > \.viewer \{\n  display: inline;/);
console.log('  ok - inlineViewer is the viewer, laid out inline');

// Negative: in these views no title-like value is interpolated as text.
// Attributes (data-title="{{title}}") and <option>s, which cannot hold
// rendered HTML, are not text on the page and are allowed.
const FIELDS = ['title', 'name', 'boardTitle', 'cardTitle', 'issueTitle', 'description', 'snippet', 'selectedCard.title'];
const VIEWS = ['client/components/boards/emailView.jade', 'client/components/boards/versionControlView.jade',
  'client/components/boards/chatView.jade', 'client/components/main/activityFeed.jade'];
for (const view of VIEWS) {
  const offenders = read(view).split('\n').map((line, i) => [line, i + 1]).filter(([line]) => {
    if (/^\s*option\b/.test(line)) return false;
    // An attachment's file name in its download link is a file name, not
    // Markdown: "my_file_v2.txt" must not turn into italics.
    if (/^\s*a\(href="\{\{link\}\}" target="_blank" rel="noopener noreferrer"\) \{\{name\}\}$/.test(line)) return false;
    // The import sources' own product names (GitHub, GitLab ...), fixed in
    // models/lib/importSources.js - not something a member wrote.
    if (/^\s*a\.vcs-import-link\(/.test(line)) return false;
    const text = line.replace(/\([^()]*(\([^()]*\)[^()]*)*\)/g, '');
    return FIELDS.some(field => {
      const name = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`).test(text) || (new RegExp(`^\\s*[\\w.#-]*=\\s*${name}\\s*$`).test(text) && !/^\s*=/.test(text));
    });
  });
  assert.deepEqual(offenders.map(([line, n]) => `${view}:${n}: ${line.trim()}`), [], `${view}: render it with +inlineViewer`);
}
console.log('  ok - the email list, Version Control, Chat and the activity feed render every title');

// A rendered title can hold a link, and a link inside a link is not one: in
// these views a clickable title is a span with role=link, which Enter opens.
const vcs = read('client/components/boards/versionControlView.jade');
assert.doesNotMatch(vcs, /a\.vcs-issue-title|a\.js-vcs-wiki-page|a\.card-label\.vcs-label/);
assert.match(read('client/components/boards/versionControlView.js'), /'keydown \[role="link"\]'\(event\) \{/);
assert.match(read('client/components/main/activityFeed.jade'), /span\.activity-feed-card\.js-activity-feed-card\(role="link" tabindex="0"/);
assert.match(read('client/components/main/activityFeed.js'), /'keydown \.js-activity-feed-card'\(event\)/);
console.log('  ok - clickable titles are spans with role=link, opened by the keyboard too');

console.log('\nrenderedTitles: all tests passed');
