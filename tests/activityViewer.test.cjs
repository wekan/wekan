const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const sanitizeHTML = require('sanitize-html');
const source = fs.readFileSync('client/components/activities/activities.js', 'utf8');
const jade = fs.readFileSync('client/components/activities/activities.jade', 'utf8');

test('both activity feeds render values through the shared HTML/Markdown/emoji viewer', () => {
  assert.match(jade, /\+activity\(activity=activityData card=card mode=mode\)/);
  assert.doesNotMatch(jade, /\(sanitize |\{\{\{_ /);
  assert.match(jade, /activityMessage 'activity-changedTitle' \(activityValue activity.value\)/);
  assert.match(source, /activityValue\(value\)[\s\S]*?return titleViewerHtml/);
  assert.match(source, /stripLinks: !!\(setting && setting.renderLinksAsPlainText\)/);
  assert.match(source, /\^https\?:/);
  assert.match(jade, /div\.activity-desc/);
});

test('rich activity links preserve allowed HTML and avoid nested anchors', () => {
  const html = {
    Raw: value => value,
    A: (attrs, text) => `<a href="${attrs.href}">${text}</a>`,
    SPAN: (...values) => `<span>${values.join('')}</span>`,
  };
  const context = { HTML: html, Blaze: { toHTML: value => value },
    titleViewerHtml: value => value,
    sanitizeHTML,
  };
  const start = source.indexOf('function linkedActivityValue(');
  const end = source.indexOf('\nfunction createBoardLink', start);
  vm.runInNewContext(source.slice(start, end), context);
  assert.equal(context.linkedActivityValue('<strong>👍</strong>', '', 'card'), '<strong>👍</strong>');
  assert.equal(context.linkedActivityValue('<strong>👍</strong><script>bad()</script>', '/card', 'card'),
    '<a href="/card"><strong>👍</strong></a>');
  const linked = context.linkedActivityValue('<a href="https://example.com">Title</a>', '/card', 'card');
  assert.equal(linked, '<span><a href="https://example.com">Title</a> <a href="/card">↗</a></span>');
});

// Browsers accept malformed closing tags; exercise the real parser rather
// than a regex substitute that could hide a sanitizer regression.
test('activity sanitizer handles malformed script end tags', () => {
  for (const input of ['<script>bad()</script foo="bar">', '<SCRIPT>bad()</SCRIPT >']) {
    assert.equal(sanitizeHTML('<strong>Title</strong>' + input), '<strong>Title</strong>');
  }
  assert.doesNotMatch(fs.readFileSync(__filename, 'utf8'), /sanitizeHTML:\s*value\s*=>\s*value\.replace/);
});
