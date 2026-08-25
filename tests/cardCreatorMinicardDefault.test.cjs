'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const boards = fs.readFileSync(path.join(root, 'models', 'boards.js'), 'utf8');
const minicard = fs.readFileSync(
  path.join(root, 'client', 'components', 'cards', 'minicard.js'),
  'utf8',
);
const sidebar = fs.readFileSync(
  path.join(root, 'client', 'components', 'sidebar', 'sidebar.js'),
  'utf8',
);
const browser = fs.readFileSync(
  path.join(root, 'tests', 'playwright', 'specs', '46-card-creator-default.e2e.js'),
  'utf8',
);

test('#3823 new boards default minicard creator visibility to false', () => {
  assert.match(
    boards,
    /allowsCreatorOnMinicard:\s*\{[\s\S]*?defaultValue:\s*false/,
  );
});

test('#3823 old boards with a missing field render no minicard creator', () => {
  assert.match(
    minicard,
    /board\.allowsCreatorOnMinicard\s*\?\?\s*false/,
  );
});

test('negative: the settings checkbox does not inherit card-detail visibility', () => {
  assert.match(
    sidebar,
    /getMinicardSetting\(currentBoard, 'allowsCreatorOnMinicard', null, false\)/,
  );
  assert.doesNotMatch(
    sidebar,
    /getMinicardSetting\(currentBoard, 'allowsCreatorOnMinicard', 'allowsCreator'/,
  );
});

test('explicit toggle still persists the dedicated minicard field', () => {
  assert.match(
    sidebar,
    /'click \.js-field-has-creator-on-minicard'[\s\S]*?\$set: \{ allowsCreatorOnMinicard: newValue \}/,
  );
});

test('browser regression covers legacy default and explicit opt-in', () => {
  assert.match(browser, /\$unset: \{ allowsCreatorOnMinicard: '' \}/);
  assert.match(browser, /\.minicard-creator/);
  assert.match(browser, /\.js-field-has-creator-on-minicard/);
  assert.match(browser, /toBe\(true\)/);
});

console.log(`\ncardCreatorMinicardDefault: all ${passed} tests passed`);
