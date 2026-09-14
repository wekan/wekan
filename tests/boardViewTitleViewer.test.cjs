const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('new board fields use the shared policy-aware viewer', () => {
  for (const [file, fields] of [
    ['boards/timelineView.jade', ['this.title', 'this.descriptionSnippet', 'this']],
    ['boards/groupByAssigneeView.jade', ['title']],
    ['boards/roadmapView.jade', ['label']],
    ['boards/bigboardView.jade', ['title']],
    ['boards/originalPositionsView.jade', ['originalTitle']],
    ['boards/tableView.jade', ['row.title', 'row.listTitle', 'row.swimlaneTitle']],
    ['boards/charts/boardCharts.jade', ['header', 'cell']],
    ['lists/listHeader.jade', ['title']],
  ]) {
    const source = read(`client/components/${file}`);
    for (const field of fields) {
      assert.ok(new RegExp(`\\+viewer\\n\\s+= ${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\n|$)`).test(source),
      `${file}: ${field} must use viewer`);
    }
  }
  assert.match(read('client/components/cards/minicard.jade'), /span\.minicard-title-text\n\s+\+viewer[\s\S]*?= getTitle/);
  assert.doesNotMatch(read('client/components/boards/timelineView.jade'), /timeline-(?:list|card)-title \{\{/);
  const editor = read('client/components/main/editor.js');
  assert.match(editor, /setting\.renderLinksAsPlainText/);
  assert.match(editor, /sanitizeHTML\(content, \{ stripLinks \}\)/);
});

test('chart title adapter delegates HTML, escapes SVG markup and observes settings', () => {
  const calls = [];
  const context = {
    Blaze: { toHTMLWithData(template, data) { calls.push([template, data.value]); return '<div>Demo &amp; 👍</div>'; } },
    Template: { chartTitleViewer: 'shared viewer' },
    ReactiveCache: { getCurrentSetting() { calls.push('settings'); } },
    document: { createElement() { return { textContent: 'Demo & 👍 <script>', innerHTML: '' }; } },
  };
  vm.runInNewContext(read('client/lib/titleViewer.js').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  assert.equal(context.titleViewerHtml('# Demo :thumbsup:'), '<div>Demo &amp; 👍</div>');
  assert.equal(calls[0], 'settings');
  assert.equal(calls[1][1], '# Demo :thumbsup:');
  assert.equal(context.titleViewerText('title'), 'Demo & 👍 <script>');
  assert.equal(context.titleViewerSvgText('title'), 'Demo &amp; 👍 &lt;script&gt;');
  assert.equal(context.escapeTitleText('"\'&<>'), '&quot;&#39;&amp;&lt;&gt;');
  for (const chart of ['cumulativeFlow', 'controlChart']) {
    assert.match(read('client/components/boards/chartPlaceholderViews.jade'),
      new RegExp(`\\+boardChartView\\(chartKey="${chart}"`));
  }
  assert.match(read('client/components/boards/charts/boardCharts.jade'), /\+viewer\n\s+\| \{\{ chartTitle \}\}/);
  assert.match(read('client/lib/titleViewer.jade'), /\+viewer\n\s+= value/);
  assert.match(read('client/components/gantt/dhtmlxGantt.js'), /text: titleViewerHtml\(card.title \|\| card._id\)/);
  assert.match(read('client/components/gantt/frappeGantt.js'), /name: titleViewerSvgText\(card.title \|\| card._id\)/);
  for (const file of ['client/components/gantt/frappeGantt.js', 'client/components/boards/roadmapView.js']) {
    assert.match(read(file), /set_title\(task\._titleHtml\)/);
  }
});

test('assignee helpers use native dates without undeclared Moment dependency', () => {
  const source = read('client/components/boards/groupByAssigneeView.js');
  assert.match(source, /import \{ FlowRouter \} from 'meteor\/ostrio:flow-router-extra'/);
  assert.match(source, /import \{ format \} from '\/imports\/lib\/dateUtils'/);
  assert.doesNotMatch(source, /(?:from|require\()\s*['"]moment['"]/);
  let helpers;
  const context = {
    Template: { groupByAssigneeView: { onCreated() {}, events() {}, helpers(value) { helpers = value; } } },
    Session: { get() { return 'board'; } },
    ReactiveCache: { getBoard() { return { _id: 'board', slug: 'demo' }; } },
    FlowRouter: { path(route, params) { return `/${route}/${params.boardId}/${params.cardId}`; } },
    format: (date, pattern) => `${date}:${pattern}`,
    formatDateForDisplay: (date, includeTime, fallback) => fallback(date),
    require: () => ({ translateGroupLabel() {} }),
  };
  vm.runInNewContext(source.replace(/^import .*;\n/gm, ''), context);
  assert.equal(helpers.cardUrl('card'), '/card/board/card');
  assert.equal(helpers.formatDueAt('today'), 'today:llll');
  assert.equal(helpers.formatDueAt(null), '');
  context.ReactiveCache.getBoard = () => null;
  assert.equal(helpers.cardUrl('card'), '#');
});
