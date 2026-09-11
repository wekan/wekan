'use strict';

// Regression guard: reported directly - the Dashboard view showed nothing
// above its table, with "Exception from Tracker afterFlush function: Error:
// There is no current view" from client/components/boards/charts/
// boardCharts.js. The chart is built inside Tracker.afterFlush (so the
// <canvas> exists by then), but that callback runs OUTSIDE any Blaze view,
// where Template.currentData() throws. One such call (for the dataset's
// title) sat inside the callback; the throw aborted the whole chart build
// and nothing retried it.
//
// The data context must be read in the autorun, before afterFlush, and
// only the captured values used inside it. Source-read test, no Blaze.
//
// Run: node tests/boardChartsAfterFlushContext.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..',
  'client', 'components', 'boards', 'charts', 'boardCharts.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardChartsAfterFlushContext:');

// Every Tracker.afterFlush(() => { ... }) body, by brace matching.
function afterFlushBodies(source) {
  const bodies = [];
  let from = 0;
  for (;;) {
    const at = source.indexOf('Tracker.afterFlush(', from);
    if (at === -1) break;
    const open = source.indexOf('{', at);
    let depth = 0;
    let i = open;
    for (; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') { depth -= 1; if (depth === 0) break; }
    }
    bodies.push(source.slice(open, i + 1));
    from = i;
  }
  return bodies;
}

test('the chart build still defers to Tracker.afterFlush (so the canvas exists)', () => {
  assert.ok(afterFlushBodies(src).length >= 1);
});

test('no Template.currentData()/Template.instance() call inside any afterFlush body (negative)', () => {
  for (const body of afterFlushBodies(src)) {
    assert.ok(!/Template\.(currentData|instance)\(\)/.test(body),
      'afterFlush runs outside every Blaze view; Template.currentData() throws there');
  }
});

test('the dataset title is read from the autorun-captured data context', () => {
  assert.ok(/const data = Template\.currentData\(\);\s*\n\s*const chartKey = data\.chartKey;\s*\n\s*const titleKey = data\.titleKey;/.test(src));
  assert.ok(/label: TAPi18n\.__\(titleKey\)/.test(src));
});

console.log(`\nboardChartsAfterFlushContext: ${passed} tests passed`);
