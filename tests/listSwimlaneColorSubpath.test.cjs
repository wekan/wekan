'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = (relative) =>
  fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const lists = read('client/components/lists/listHeader.js');
const swimlanes = read('client/components/swimlanes/swimlaneHeader.js');
const listMarkup = read('client/components/lists/listHeader.jade');
const swimlaneMarkup = read('client/components/swimlanes/swimlaneHeader.jade');
const browser = read('tests/playwright/specs/36-subpath-colors.e2e.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function popupEvents(source, templateName) {
  const start = source.indexOf(`Template.${templateName}.events({`);
  assert.ok(start >= 0, `${templateName} events exist`);
  return source.slice(start, source.indexOf('\n});', start) + 4);
}

test('#4652 list color submit and click paths both prevent navigation', () => {
  const events = popupEvents(lists, 'setListColorPopup');
  assert.match(
    events,
    /'submit form'\(event, tpl\) \{\s*event\.preventDefault\(\)/,
  );
  assert.match(
    events,
    /'click \.js-submit'\(event, tpl\) \{\s*event\.preventDefault\(\)/,
  );
  assert.match(
    events,
    /await tpl\.currentList\.setColor\(tpl\.currentColor\.get\(\)\)/,
  );
  assert.match(listMarkup, /button\.primary\.confirm\.js-submit/);
});

test('#4652 swimlane color submit and click paths both prevent navigation', () => {
  const events = popupEvents(swimlanes, 'setSwimlaneColorPopup');
  assert.match(
    events,
    /'submit form'\(event, tpl\) \{\s*event\.preventDefault\(\)/,
  );
  assert.match(
    events,
    /'click \.js-submit'\(event, tpl\) \{\s*event\.preventDefault\(\)/,
  );
  assert.match(
    events,
    /await tpl\.currentSwimlane\.setColor\(tpl\.currentColor\.get\(\)\)/,
  );
  assert.match(swimlaneMarkup, /button\.primary\.confirm\.js-submit/);
});

test('negative: card-independent fixes do not use absolute or root URLs', () => {
  for (const events of [
    popupEvents(lists, 'setListColorPopup'),
    popupEvents(swimlanes, 'setSwimlaneColorPopup'),
  ]) {
    assert.doesNotMatch(events, /ROOT_URL|rootUrl|location\.|window\.|href/);
  }
});

test('Firefox browser regression covers both mutations and retains the prefix', () => {
  assert.match(browser, /PATH_PREFIX/);
  assert.match(browser, /js-set-color-list/);
  assert.match(browser, /js-set-swimlane-color/);
  assert.match(browser, /findOne\('lists'/);
  assert.match(browser, /findOne\('swimlanes'/);
  assert.match(browser, /toHaveURL/);
});

console.log(`\nlistSwimlaneColorSubpath: all ${passed} tests passed`);
