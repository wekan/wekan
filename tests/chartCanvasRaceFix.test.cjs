'use strict';

// The 10 board report chart views (client/components/boards/charts/
// boardCharts.js) draw into a `<canvas>` that only exists in the DOM once
// isLoading/hasNoData flip Blaze's jade conditional to the "else" branch - a
// sibling reactive change driven by the SAME chartData ReactiveVar this
// autorun also depends on, with no guaranteed ordering between the two
// Tracker computations. Without deferring past that DOM patch, the very
// first successful data load could run the chart-building body before the
// canvas existed: templateInstance.find() silently returned null, no chart
// was ever built, and nothing triggered a retry - a chart view (reported:
// Burndown) rendered its export buttons and empty table but no visible
// chart at all.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const source = read('client/components/boards/charts/boardCharts.js');

// The canvas lookup and chart construction must be deferred with
// Tracker.afterFlush, INSIDE the autorun, so it runs after Blaze has
// patched the DOM for whatever reactive change just fired.
const autorunIndex = source.indexOf('templateInstance.autorun(() => {');
assert.ok(autorunIndex !== -1, 'the chart-building autorun exists');
const afterFlushIndex = source.indexOf('Tracker.afterFlush(() => {', autorunIndex);
assert.ok(afterFlushIndex !== -1, 'the canvas lookup is deferred with Tracker.afterFlush');
const canvasLookupIndex = source.indexOf("templateInstance.find('.js-chart-canvas')", autorunIndex);
assert.ok(canvasLookupIndex > afterFlushIndex,
  'the canvas lookup happens INSIDE the afterFlush callback, not before it (negative: would still race)');

// A destroyed template must not build a chart into a canvas that is about to
// be torn down (the afterFlush callback can fire after the template is gone).
const afterFlushBody = source.slice(afterFlushIndex, source.indexOf("if (!canvas) return;", afterFlushIndex));
assert.match(afterFlushBody, /if \(templateInstance\.destroyed\) return;/);

console.log('chartCanvasRaceFix: the chart canvas is looked up after Blaze finishes patching the DOM, not before');
