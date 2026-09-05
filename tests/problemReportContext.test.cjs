'use strict';

// Every Admin Panel Problems stream shares one HTTP attribution boundary.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('problemReportContext:');

test('request context wraps every HTTP route before API middleware', () => {
  const imports = read('server/imports.js');
  assert.ok(imports.indexOf("import '/server/lib/requestReportContext'")
    < imports.indexOf("import '/server/apiMiddleware'"));
  assert.match(read('server/lib/requestReportContext.js'), /AsyncLocalStorage/);
});

test('the common fold enriches all reports without trusting geo for decisions', () => {
  const fold = read('server/lib/eventLogFold.js');
  assert.match(fold, /currentReportRequest\(\)/);
  assert.match(fold, /resolveClientKey\(/);
  assert.match(fold, /locationFromHeaders\(req\.headers\)/);
  assert.match(fold, /usernameFor\(evt\.userId\)/);
  assert.match(fold, /findOneAsync\(userId/);
});

test('schema, summary and UI retain separate addresses plus location', () => {
  assert.match(read('models/eventLog.js'), /location:\s*\{ type: Object/);
  assert.match(read('models/lib/eventLogSummary.js'), /'location'/);
  const ui = read('client/components/settings/adminProblems.js');
  assert.match(ui, /countryFlag/);
  assert.match(ui, /locationLabel/);
  assert.match(ui, /locationColumn\(\)/);
});

console.log(`\nproblemReportContext: ${passed} tests passed`);
