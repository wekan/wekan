const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const read = file => fs.readFileSync(file, 'utf8');

test('shared board content fills its available width without padding overflow', () => {
  const css = read('client/components/boards/statsView.css');
  const content = css.match(/\.stats-view-content\s*\{([^}]+)\}/)[1];
  assert.match(content, /width:\s*100%/);
  assert.match(content, /box-sizing:\s*border-box/);
  assert.match(content, /max-width:\s*none/);
  assert.match(content, /margin:\s*0\s*;/);
  for (const view of ['timeline', 'time', 'stats', 'groupByAssignee']) {
    assert.match(read(`client/components/boards/${view}View.jade`), /\.stats-view-content/);
  }
});

test('chart shells cannot restore a fixed-width centered board layout', () => {
  const css = read('client/components/boards/charts/boardCharts.css');
  const content = css.match(/\.chart-view-content\s*\{([^}]+)\}/)[1];
  assert.match(content, /max-width:\s*none/);
  assert.doesNotMatch(content, /max-width:\s*\d+(?:px|rem)|margin:\s*0\s+auto/);
});
