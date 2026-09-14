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

// Use the actual formatter so literal placeholders cannot pass a mocked API.
test('activity messages substitute all values and discard Spacebars options', async () => {
  const i18next = require('i18next');
  const sprintf = require('i18next-sprintf-postprocessor');
  const i18n = i18next.createInstance().use(sprintf);
  await i18n.init({ lng: 'en', resources: { en: { translation: {
    added: "added label '%s' to %s", moved: 'moved %s from %s to %s',
    comment: 'on %s', deleted: 'deleted an attachment from %s',
  } } }, postProcess: ['sprintf'], interpolation: { escapeValue: false } });
  let plainLinks = false;
  const body = source.split('  activityMessage(key, ...values) {')[1].split('\n  },')[0];
  const helper = new Function('ReactiveCache', 'TAPi18n', 'sanitizeHTML', `return function(key, ...values) {${body}}`)(
    { getCurrentSetting: () => ({ renderLinksAsPlainText: plainLinks }) },
    { __: (key, options) => i18n.t(key, options) },
    (value, options) => sanitizeHTML(value, { allowedTags: options.stripLinks ? ['strong', 'em'] : ['a', 'strong', 'em'], allowedAttributes: { a: ['href'] } }),
  );
  const link = '<a href="/card">Demo 👍</a>';
  assert.equal(helper('added', '<em>Feature</em>', link, { hash: {} }), "added label '<em>Feature</em>' to " + link);
  assert.equal(helper('moved', 'CARD', 'OLD', 'NEW', { hash: {} }), 'moved CARD from OLD to NEW');
  assert.equal(helper('comment', link, { hash: {} }), 'on ' + link);
  assert.equal(helper('deleted', 'CARD', { hash: {} }), 'deleted an attachment from CARD');
  assert.equal(helper('comment', '100% safe %s', { hash: {} }), 'on 100% safe %s');
  assert.doesNotMatch(helper('comment', '<script>bad()</script><strong>Good</strong>', { hash: {} }), /script|bad/);
  plainLinks = true;
  assert.equal(helper('comment', link, { hash: {} }), 'on Demo 👍');
});
