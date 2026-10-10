'use strict';
// A Blaze helper is found only on the template it is registered on. The Scrum
// view's import-into-board panel (transferPreview, nothingToDo, canApply) and
// its import report (lossText) are drawn by Template.scrumView, but their
// helpers were registered on Template.scrumReportTable: the preview never
// appeared after Preview, and the import report showed "Import" with every
// loss line empty. Browser: tests/playwright/specs/scrum-import-into-board.e2e.js
// and scrum-native-import.e2e.js.
//
// The negative test is the shape, not the one place: in every Scrum client
// file, each helper a template registers must be used by THAT template's own
// markup, so a helper registered on the wrong template fails here wherever it
// is.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, '..', 'client', 'components', 'boards', 'scrum');

// template(name="x") sections of a .jade file: name -> its markup.
function templates(jade) {
  const out = {};
  let name = null;
  for (const line of jade.split('\n')) {
    const match = /^template\(name="([^"]+)"\)/.exec(line);
    if (match) { name = match[1]; out[name] = ''; continue; }
    if (name) out[name] += `${line}\n`;
  }
  return out;
}
// Template.x.helpers({ ... }) blocks of a .js file: [template, helper names].
function helperBlocks(js) {
  const out = [];
  const re = /^Template\.(\w+)\.helpers\(\{\n([\s\S]*?)^\}\);/gm;
  let match;
  while ((match = re.exec(js))) {
    const names = [...match[2].matchAll(/^ {2}(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:\(|:)/gm)].map(m => m[1]);
    out.push([match[1], names]);
  }
  return out;
}
// The helper's name is matched as text: every character with a meaning in a
// regular expression is escaped, backslash included (CodeQL #560 was the
// `$`-only escape this replaced).
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const used = (markup, helper) => new RegExp(`(^|[^\\w$.-])${escapeRegExp(helper)}(?![\\w$-])`, 'm').test(markup);

function misplaced(js, jade) {
  const sections = templates(jade);
  const wrong = [];
  for (const [template, names] of helperBlocks(js)) {
    const own = sections[template];
    if (own === undefined) continue;
    for (const helper of names) if (!used(own, helper)) wrong.push(`${template}.${helper}`);
  }
  return wrong;
}

test('the import panel and import report helpers are registered on the template that draws them', () => {
  const js = fs.readFileSync(path.join(dir, 'scrumView.js'), 'utf8');
  const jade = fs.readFileSync(path.join(dir, 'scrumView.jade'), 'utf8');
  const blocks = Object.fromEntries(helperBlocks(js).map(([template, names]) => [template, names]));
  for (const helper of ['transferPreview', 'nothingToDo', 'canApply', 'lossText']) {
    assert.ok(blocks.scrumView.includes(helper), `scrumView registers ${helper}`);
    assert.ok(!blocks.scrumReportTable.includes(helper), `scrumReportTable does not register ${helper}`);
    assert.ok(used(templates(jade).scrumView, helper), `scrumView.jade uses ${helper}`);
  }
});

test('no Scrum template registers a helper its own markup does not use', () => {
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.js') && fs.existsSync(path.join(dir, file.replace(/\.js$/, '.jade'))));
  assert.ok(files.length >= 3);
  const wrong = files.flatMap(file => misplaced(fs.readFileSync(path.join(dir, file), 'utf8'),
    fs.readFileSync(path.join(dir, file.replace(/\.js$/, '.jade')), 'utf8')).map(name => `${file}: ${name}`));
  assert.deepEqual(wrong, []);
});

test('the check finds a helper registered on the wrong template', () => {
  const jade = 'template(name="a")\n  with transferPreview\n    p {{lossText}}\ntemplate(name="b")\n  p {{formatTotal x}}\n';
  const js = 'Template.a.helpers({\n  transferPreview: () => 1,\n});\nTemplate.b.helpers({\n  formatTotal() {},\n  lossText() { return 1; },\n});\n';
  assert.deepEqual(misplaced(js, jade), ['b.lossText']);
  const fixed = 'Template.a.helpers({\n  transferPreview: () => 1,\n  lossText() { return 1; },\n});\nTemplate.b.helpers({\n  formatTotal() {},\n});\n';
  assert.deepEqual(misplaced(fixed, jade), []);
});

// Inside `with transferPreview` a bare `releases` or `cards` found the
// scrumView helpers of those names (a helper wins over the data context), so
// the preview read "Releases:  new" and "Cards:  to update". Every field of
// the import result (server/lib/scrumTransferMerge.js) that shares its name
// with a scrumView helper must be read through `this.`.
function withBlock(markup, name) {
  const lines = markup.split('\n');
  const start = lines.findIndex(line => new RegExp(`^\\s*with ${name}\\s*$`).test(line));
  if (start < 0) return null;
  const indent = lines[start].search(/\S/);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.search(/\S/) <= indent) break;
    body.push(line);
  }
  return body.join('\n');
}
const PREVIEW_FIELDS = ['dryRun', 'sourceBoardId', 'sprints', 'releases', 'events', 'cards', 'dailyObservations', 'losses', 'truncated', 'changed'];
function shadowedPreviewFields(js, jade) {
  const helpers = new Set(helperBlocks(js).find(([template]) => template === 'scrumView')[1]);
  const body = withBlock(templates(jade).scrumView, 'transferPreview');
  return PREVIEW_FIELDS.filter(field => helpers.has(field) && new RegExp(`(^|[^\\w$.'-])${field}(?![\\w$'-])`, 'm').test(body));
}

test('the import preview reads its own counts, not the scrumView helpers of the same name', () => {
  const js = fs.readFileSync(path.join(dir, 'scrumView.js'), 'utf8');
  const jade = fs.readFileSync(path.join(dir, 'scrumView.jade'), 'utf8');
  const body = withBlock(templates(jade).scrumView, 'transferPreview');
  assert.ok(body && body.includes('this.releases.created.length') && body.includes('this.cards.updated'));
  assert.deepEqual(shadowedPreviewFields(js, jade), []);
  // Negative: the bare form is caught.
  const bare = jade.replace('created=this.releases.created.length', 'created=releases.created.length');
  assert.deepEqual(shadowedPreviewFields(js, bare), ['releases']);
});

// After Import the view refreshed loudly: "Loading" replaced the whole view,
// the import panel was drawn again closed, and its "imported" line and losses
// were never visible. The import refreshes quietly; the loud form is not used
// for it.
test('an import into the board refreshes the view quietly, keeping its result on screen', () => {
  const js = fs.readFileSync(path.join(dir, 'scrumView.js'), 'utf8');
  const body = /async function importTransfer\(tpl, dryRun\) \{\n([\s\S]*?)\n\}\n/.exec(js)[1];
  assert.match(body, /if \(!dryRun\) \{ invalidateScrumNames\(\); await refresh\(tpl, \{ quiet: true \}\); \}/);
  assert.doesNotMatch(body, /await refresh\(tpl\)/);
  // The quiet form does not raise the loading flag that redraws the view.
  const refresh = /async function refresh\(tpl, \{ quiet = false \} = \{\}\) \{\n([\s\S]*?)\n\}\n/.exec(js)[1];
  assert.match(refresh, /if \(!quiet\) tpl\.loading\.set\(true\);/);
});
